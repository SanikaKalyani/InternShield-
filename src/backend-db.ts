import fs from 'fs';
import path from 'path';
import { 
  InternshipAnalysis, 
  CommunityReview, 
  ReviewVerification, 
  ReviewFlag, 
  ReviewConsensus, 
  AuditScore, 
  CommunityScore 
} from './types.js';

const dbPath = path.join(process.cwd(), 'src', 'db.json');

interface DatabaseSchema {
  analyses: InternshipAnalysis[];
  reviews: CommunityReview[];
  review_verifications: ReviewVerification[];
  review_flags: ReviewFlag[];
  review_consensus: ReviewConsensus[];
  audit_scores: AuditScore[];
  community_scores: CommunityScore[];
}

export function normalizeId(company: string, position: string): string {
  const c = (company || '').toLowerCase().replace(/[^a-z0-9]/g, '');
  const p = (position || '').toLowerCase().replace(/[^a-z0-9]/g, '');
  return `${c}_${p}`;
}

export function getDatabase(): DatabaseSchema {
  try {
    if (fs.existsSync(dbPath)) {
      const raw = fs.readFileSync(dbPath, 'utf8');
      const data = JSON.parse(raw);
      return {
        analyses: data.analyses || [],
        reviews: data.reviews || [],
        review_verifications: data.review_verifications || [],
        review_flags: data.review_flags || [],
        review_consensus: data.review_consensus || [],
        audit_scores: data.audit_scores || [],
        community_scores: data.community_scores || []
      } as DatabaseSchema;
    }
  } catch (error) {
    console.error('Error reading Database JSON, using fallback data:', error);
  }

  // Fallback initial schema if the file somehow goes missing
  return {
    analyses: [],
    reviews: [],
    review_verifications: [],
    review_flags: [],
    review_consensus: [],
    audit_scores: [],
    community_scores: []
  };
}

export function saveDatabase(data: DatabaseSchema): boolean {
  try {
    const parentDir = path.dirname(dbPath);
    if (!fs.existsSync(parentDir)) {
      fs.mkdirSync(parentDir, { recursive: true });
    }
    fs.writeFileSync(dbPath, JSON.stringify(data, null, 2), 'utf8');
    return true;
  } catch (error) {
    console.error('Error writing Database JSON:', error);
    return false;
  }
}

export function addAnalysis(analysis: InternshipAnalysis): void {
  const db = getDatabase();
  
  // Clean score bounds
  analysis.companyTrustScore = Math.min(100, Math.max(0, analysis.companyTrustScore));
  analysis.mentorVerificationScore = Math.min(100, Math.max(0, analysis.mentorVerificationScore));
  analysis.projectQualityScore = Math.min(150, Math.max(0, analysis.projectQualityScore));
  analysis.feeTransparencyScore = Math.min(100, Math.max(0, analysis.feeTransparencyScore));
  analysis.experienceQualityScore = Math.min(100, Math.max(0, analysis.experienceQualityScore));
  analysis.overallCredibilityScore = Math.min(100, Math.max(0, analysis.overallCredibilityScore));

  db.analyses.unshift(analysis);
  
  // Store or update in audit_scores collection
  const internshipId = normalizeId(analysis.companyName, analysis.position);
  db.audit_scores = db.audit_scores.filter(a => a.internshipId !== internshipId);
  db.audit_scores.push({
    internshipId,
    companyName: analysis.companyName,
    position: analysis.position,
    auditScore: analysis.overallCredibilityScore,
    createdAt: new Date().toISOString()
  });

  saveDatabase(db);
  
  // Run overall scores reconciliation for this internship
  reconcileInternshipScores(internshipId);
}

export function addReview(review: CommunityReview): void {
  const db = getDatabase();
  const internshipId = normalizeId(review.companyName, review.position);
  review.internshipId = internshipId;

  // Rule 1: Single Review Per Verified Student Validation
  const duplicate = db.reviews.find(r => r.studentId === review.studentId && r.internshipId === internshipId);
  if (duplicate) {
    throw new Error("Review already submitted. You may edit your existing review but cannot create multiple reviews.");
  }

  // Pre-initialize safety scores
  review.verified = !!(review.verifiedParticipant || review.participated);
  review.trust_weight = review.verified ? 1.0 : 0.2;
  review.outlier_score = 0;
  review.review_confidence = review.verified ? "High" : "Low";
  review.isOutlier = false;
  review.isFlagged = false;
  review.flagReason = "";

  db.reviews.unshift(review);
  saveDatabase(db);

  // Run full anti-manipulation evaluation chain
  evaluateAntiManipulation(review.id);
}

export function updateReview(id: string, updated: CommunityReview): void {
  const db = getDatabase();
  const index = db.reviews.findIndex(r => r.id === id);
  if (index !== -1) {
    const internshipId = normalizeId(updated.companyName, updated.position);
    updated.internshipId = internshipId;

    // Check single review constraint for other reviews
    const duplicate = db.reviews.find(r => r.id !== id && r.studentId === updated.studentId && r.internshipId === internshipId);
    if (duplicate) {
      throw new Error("Review already submitted. You may edit your existing review but cannot create multiple reviews.");
    }

    db.reviews[index] = { 
      ...db.reviews[index], 
      ...updated,
      verified: !!(updated.verifiedParticipant || updated.participated)
    };
    saveDatabase(db);

    // Run full anti-manipulation evaluation chain
    evaluateAntiManipulation(id);
  }
}

export function deleteReview(id: string): void {
  const db = getDatabase();
  const review = db.reviews.find(r => r.id === id);
  if (review) {
    const internshipId = review.internshipId;
    db.reviews = db.reviews.filter(r => r.id !== id);
    db.review_verifications = db.review_verifications.filter(v => v.reviewId !== id);
    db.review_flags = db.review_flags.filter(f => f.reviewId !== id);
    saveDatabase(db);

    // Reconcile consensus and scores for this internship
    reorganizeConsensusForInternship(internshipId);
    reconcileInternshipScores(internshipId);
  }
}

/**
 * Run the comprehensive threat, consensus, fraud, and outlier evaluations for a review
 */
export function evaluateAntiManipulation(reviewId: string) {
  const db = getDatabase();
  const rIdx = db.reviews.findIndex(r => r.id === reviewId);
  if (rIdx === -1) return;

  const review = db.reviews[rIdx];
  const internshipId = review.internshipId;

  let trustWeight = review.verified ? 1.0 : 0.2;
  let isFlagged = false;
  let flagReasons: string[] = [];

  // Prune any stale flags for this review
  db.review_flags = db.review_flags.filter(f => f.reviewId !== reviewId);

  // 1. Store verification info if uploaded (Rule 6 Step 2)
  if (review.verificationProofUploaded && review.verificationProofName) {
    db.review_verifications = db.review_verifications.filter(v => v.reviewId !== reviewId);
    db.review_verifications.push({
      id: `ver-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      reviewId: review.id,
      studentId: review.studentId,
      internshipId: review.internshipId,
      docType: review.verificationDocType || "Upload Document",
      fileName: review.verificationProofName,
      extractedStudentName: review.ocrName || review.authorName,
      extractedInternshipName: review.ocrPosition || review.position,
      extractedCompanyName: review.ocrCompany || review.companyName,
      extractedDates: review.ocrDates || "Not specified",
      verifiedAt: new Date().toISOString()
    });
  }

  // 2. Automated Fraud Checks (Rule 7)
  
  // A. Duplicate document uploaded by different students
  if (review.verificationProofUploaded && review.verificationProofName) {
    const duplicateDoc = db.reviews.find(other => 
      other.id !== review.id && 
      other.studentId !== review.studentId && 
      other.verificationProofUploaded && 
      other.verificationProofName?.toLowerCase() === review.verificationProofName?.toLowerCase()
    );
    if (duplicateDoc) {
      isFlagged = true;
      flagReasons.push("Duplicate verification document uploaded by multiple users.");
      trustWeight = 0.1; // Reduce trust weight extremely heavily
      db.review_flags.push({
        id: `flag-${Date.now()}-doc`,
        reviewId: review.id,
        flagType: 'duplicate_document',
        reason: "The exact same review proof document has been uploaded by multiple users.",
        createdAt: new Date().toISOString(),
        reducedWeight: 0.1
      });
    }
  }

  // B. Repeated review patterns / duplicate text (Spam campaigns)
  if (review.reviewText && review.reviewText.trim().length > 10) {
    const duplicateText = db.reviews.find(other => 
      other.id !== review.id && 
      other.reviewText && 
      other.reviewText.trim().toLowerCase() === review.reviewText.trim().toLowerCase()
    );
    if (duplicateText) {
      isFlagged = true;
      flagReasons.push("Repeated review text matching another submission (spam campaign).");
      trustWeight = 0.1;
      db.review_flags.push({
        id: `flag-${Date.now()}-rep`,
        reviewId: review.id,
        flagType: 'repeated_pattern',
        reason: "Review commentary matches another existing review letter-for-letter.",
        createdAt: new Date().toISOString(),
        reducedWeight: 0.1
      });
    }
  }

  // C. Campaign burst frequency check (e.g. excessive positive/negative campaigns)
  const sameInternshipReviews = db.reviews.filter(other => 
    other.internshipId === internshipId && 
    other.id !== review.id
  );
  
  const totalSameRatingReviews = sameInternshipReviews.filter(other => 
    other.overallRating === review.overallRating
  );
  if (totalSameRatingReviews.length >= 3) {
    // Check if added within last 2 hours
    const recentBurst = totalSameRatingReviews.filter(other => {
      const diffMs = Math.abs(new Date(review.createdAt).getTime() - new Date(other.createdAt).getTime());
      return diffMs < 120 * 60 * 1000; // 2 hours
    });
    if (recentBurst.length >= 2) {
      isFlagged = true;
      flagReasons.push("Excessive rating burst campaign detected.");
      trustWeight = Math.min(trustWeight, 0.25);
      db.review_flags.push({
        id: `flag-${Date.now()}-ext`,
        reviewId: review.id,
        flagType: 'excessive_campaign',
        reason: "Spike of identical ratings submitted for this internship in quick succession.",
        createdAt: new Date().toISOString(),
        reducedWeight: 0.25
      });
    }
  }

  // 3. Outlier Detection (Rule 4)
  let outlierScore = 0;
  let isOutlier = false;
  let auditScoreValue = 80; // Standard default basis

  // Check audit scores list / analyses list
  const auditRec = db.analyses.find(a => normalizeId(a.companyName, a.position) === internshipId);
  if (auditRec) {
    auditScoreValue = auditRec.overallCredibilityScore;
    const reviewScoreVal = review.overallRating * 20; // Scale 1-5 rating to 100 max
    outlierScore = Math.abs(auditScoreValue - reviewScoreVal);
    
    // Outlier condition
    if (outlierScore >= 40) {
      isOutlier = true;
      isFlagged = true;
      flagReasons.push("Review significantly differs from audit findings.");
      trustWeight = Math.min(trustWeight, 0.1); // Exclude or minimize influence
      
      db.review_flags.push({
        id: `flag-${Date.now()}-out`,
        reviewId: review.id,
        flagType: 'outlier',
        reason: `Review rating (${review.overallRating}/5) significantly opposes the certified AI Audit Score findings (${auditScoreValue}/100) by ${outlierScore} points.`,
        createdAt: new Date().toISOString(),
        reducedWeight: 0.1
      });
    }
  }

  review.trust_weight = trustWeight;
  review.outlier_score = outlierScore;
  review.isOutlier = isOutlier;
  review.review_confidence = trustWeight >= 0.8 ? "High" : trustWeight >= 0.4 ? "Medium" : "Low";
  review.isFlagged = isFlagged;
  review.flagReason = flagReasons.join(" | ");

  db.reviews[rIdx] = review;
  saveDatabase(db);

  // Recalculate consensus metrics and Hybrid scores
  reorganizeConsensusForInternship(internshipId);
  reconcileInternshipScores(internshipId);
}

/**
 * Recalculate the consensus values for an internship based on verified reviews collected
 */
export function reorganizeConsensusForInternship(internshipId: string) {
  const db = getDatabase();
  
  // Find all reviews under this internship
  const reviewsList = db.reviews.filter(r => r.internshipId === internshipId);
  const companyReview = reviewsList[0];
  if (!companyReview) {
    // If no reviews left, delete consensus record
    db.review_consensus = db.review_consensus.filter(c => c.internshipId !== internshipId);
    db.community_scores = db.community_scores.filter(c => c.internshipId !== internshipId);
    saveDatabase(db);
    return;
  }

  // Count verified reviewers (excluding flagged ones or count all legitimate verified ones)
  const verifiedReviews = reviewsList.filter(r => (r.verifiedParticipant || r.participated) && !r.isOutlier && !r.isFlagged);
  const reviewerCount = verifiedReviews.length;

  // Rule 5: Consensus Confidence Weighting
  // 1–3 Reviews → 20% confidence
  // 4–10 Reviews → 50% confidence
  // 11–25 Reviews → 80% confidence
  // 25+ Reviews → 100% confidence
  let confidenceScore = 20;
  let trustLevel: 'Low' | 'Medium' | 'High' = 'Low';

  if (reviewerCount >= 25) {
    confidenceScore = 100;
    trustLevel = 'High';
  } else if (reviewerCount >= 11) {
    confidenceScore = 80;
    trustLevel = 'High';
  } else if (reviewerCount >= 4) {
    confidenceScore = 50;
    trustLevel = 'Medium';
  } else {
    confidenceScore = 20;
    trustLevel = 'Low';
  }

  // Community Experience Score calculation (Factoring trust_weight and non-neutral ratings)
  let weightedScoreSum = 0;
  let totalWeightSum = 0;

  reviewsList.forEach(r => {
    // Outliers or flagged duplicate spam reviews are assigned extremely low trust, effectively excluding them.
    const rating = r.overallRating || 3.0;
    weightedScoreSum += (rating * 20) * r.trust_weight;
    totalWeightSum += r.trust_weight;
  });

  const finalAvgCommunityScore = totalWeightSum > 0 ? Math.round(weightedScoreSum / totalWeightSum) : 80;
  const rawAverage = totalWeightSum > 0 ? Number((weightedScoreSum / 20 / totalWeightSum).toFixed(1)) : 4.0;

  // Storing community score collection (relational database requirement)
  db.community_scores = db.community_scores.filter(c => c.internshipId !== internshipId);
  db.community_scores.push({
    internshipId,
    companyName: companyReview.companyName,
    position: companyReview.position,
    score: finalAvgCommunityScore,
    rawAverage,
    trustLevel,
    createdAt: new Date().toISOString()
  });

  // Storing review_consensus collection (relational database requirement)
  db.review_consensus = db.review_consensus.filter(c => c.internshipId !== internshipId);
  db.review_consensus.push({
    internshipId,
    companyName: companyReview.companyName,
    position: companyReview.position,
    reviewerCount,
    averageRating: rawAverage,
    confidenceScore,
    trustLevel,
    lastCalculated: new Date().toISOString()
  });

  // Apply confidence score back to each review record
  db.reviews = db.reviews.map(r => {
    if (r.internshipId === internshipId) {
      return {
        ...r,
        consensus_score: confidenceScore
      };
    }
    return r;
  });

  saveDatabase(db);
}

/**
 * Recalculate Hybrid Scores for this internship
 */
export function reconcileInternshipScores(internshipId: string) {
  const db = getDatabase();

  const auditRecIdx = db.analyses.findIndex(a => normalizeId(a.companyName, a.position) === internshipId);
  const commRec = db.community_scores.find(c => c.internshipId === internshipId);
  const consensusRec = db.review_consensus.find(c => c.internshipId === internshipId);

  if (auditRecIdx === -1) return;

  const analysis = db.analyses[auditRecIdx];

  // AI Audit Score
  const auditScore = analysis.overallCredibilityScore;

  // Community Experience Score (if none exists, default to standard basis of 80)
  const communityScore = commRec ? commRec.score : 80;

  // Rule 3: Hybrid Scoring Formula:
  // Final Score = (Audit Score × 0.60) + (Community Score × 0.40)
  const finalScore = Number(((auditScore * 0.60) + (communityScore * 0.40)).toFixed(1));

  analysis.overallCredibilityScore = Math.floor(finalScore);
  
  // Tag on custom calculation properties directly to the analyses payload
  // representing Rule 3 and 5 additions
  (analysis as any).audit_score = auditScore;
  (analysis as any).final_score = Math.floor(finalScore);
  (analysis as any).community_score = communityScore;
  (analysis as any).consensus_score = consensusRec ? consensusRec.confidenceScore : 0;
  (analysis as any).reviewer_count = consensusRec ? consensusRec.reviewerCount : 0;

  db.analyses[auditRecIdx] = analysis;
  saveDatabase(db);
}
