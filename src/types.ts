export interface InternshipAnalysis {
  id: string;
  companyName: string;
  position: string;
  duration: string;
  fees: string;
  mentorDetails: string;
  description: string;
  sourceUrl?: string;
  createdAt: string;
  
  // AI-analyzed metrics
  companyTrustScore: number;
  companyTrustReasoning: string;
  mentorVerificationScore: number;
  mentorVerificationReasoning: string;
  projectQualityScore: number;
  projectQualityReasoning: string;
  feeTransparencyScore: number;
  feeTransparencyReasoning: string;
  experienceQualityScore: number;
  experienceQualityReasoning: string;
  
  overallCredibilityScore: number;
  riskLevel: 'Low' | 'Medium' | 'High' | 'Critical' | 'Low Risk' | 'Medium Risk' | 'High Risk';
  riskLevelReasoning: string;
  internshipCategory: 'Genuine Industry Internship' | 'Training-Oriented Program' | 'Certificate-Oriented Program' | 'High-Risk Opportunity';
  
  keyStrengths: string[];
  redFlags: string[];
  aiRecommendation: string;
  educationalValueExplanation: string;
  reportMarkdown: string;

  // Hybrid Scoring Metrics added backend side
  community_score?: number;
  final_score?: number;
}

export interface CommunityReview {
  id: string;
  companyName: string;
  position: string;
  reviewText: string;
  ratingAuthenticity: number; // 1-5
  ratingMentorship: number; // 1-5
  ratingProjectValue: number; // 1-5
  ratingFeeTransparency: number; // 1-5
  authorName: string;
  createdAt: string;
  hasCertificateFee: boolean;

  // Step 1: Participation Verification
  participated: boolean;
  verificationProofUploaded: boolean;
  verificationProofName?: string;
  verifiedParticipant: boolean;

  // Step 2: Experience Evaluation
  projectType: 'Real Client Projects' | 'Industry-Level Projects' | 'Guided Projects' | 'Academic Projects' | 'Only Assignments/Videos';
  mentorInteraction: 'Daily' | 'Weekly' | 'Occasionally' | 'Never';
  workedWithTeam: boolean;
  meetingsOrCodeReviews: boolean;
  learningValue: 'Very High' | 'High' | 'Moderate' | 'Low' | 'Very Low';
  selectedFees: string[];
  otherFeeDetails?: string;
  recommend: boolean;

  // AI Review Summary & Overall Experience Rating
  aiReviewSummary: string;
  overallRating: number;

  // Anti-manipulation system additions (Rule 1-7 fields)
  verified: boolean;
  studentId: string;     // student_id
  internshipId: string;   // internship_id
  review_confidence: string;  // "Low" | "Medium" | "High"
  outlier_score: number;
  trust_weight: number;   // 0.0 - 1.0 (Reduced on outlier or fraud flags)
  consensus_score: number; // confidence factor based on consensus count
  audit_score: number;
  final_score: number;
  isOutlier?: boolean;
  isFlagged?: boolean;
  flagReason?: string;
  verificationDocType?: string;
  ocrName?: string;
  ocrCompany?: string;
  ocrPosition?: string;
  ocrDates?: string;
}

export interface ReviewVerification {
  id: string;
  reviewId: string;
  studentId: string;
  internshipId: string;
  docType: string;
  fileName: string;
  extractedStudentName: string;
  extractedInternshipName: string;
  extractedCompanyName: string;
  extractedDates: string;
  verifiedAt: string;
}

export interface ReviewFlag {
  id: string;
  reviewId: string;
  flagType: 'duplicate_document' | 'repeated_pattern' | 'excessive_campaign' | 'spam' | 'outlier';
  reason: string;
  createdAt: string;
  reducedWeight: number;
}

export interface ReviewConsensus {
  internshipId: string;
  companyName: string;
  position: string;
  reviewerCount: number;
  averageRating: number;
  confidenceScore: number; // e.g. 20, 50, 80, 100 based on Rule 5
  trustLevel: 'Low' | 'Medium' | 'High';
  lastCalculated: string;
}

export interface AuditScore {
  internshipId: string;
  companyName: string;
  position: string;
  auditScore: number;
  createdAt: string;
}

export interface CommunityScore {
  internshipId: string;
  companyName: string;
  position: string;
  score: number; // 0-100 scale (averageRating * 20)
  rawAverage: number; // 1-5 scale
  trustLevel: string;
  createdAt: string;
}

export interface SeededStats {
  totalAnalyzed: number;
  totalReviews: number;
  verifiedCompanies: number;
}
