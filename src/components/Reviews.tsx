import React, { useState } from 'react';
import { 
  Users, Star, Sparkles, CheckCircle2, ShieldAlert, ArrowRight, X,
  CheckCircle, AlertTriangle, Upload, Trash2, Edit2, Calendar, ShieldCheck, HelpCircle, FileText, PlusCircle
} from 'lucide-react';
import { CommunityReview, InternshipAnalysis } from '../types.js';

interface ReviewsProps {
  reviews: CommunityReview[];
  analyses: InternshipAnalysis[];
  onReviewSubmitted: (newReview: CommunityReview) => void;
  onReviewUpdated: (updatedReview: CommunityReview) => void;
  onReviewDeleted: (deletedId: string) => void;
}

type SubmissionStep = 'verification' | 'questions' | 'preview';

export default function Reviews({ 
  reviews, 
  analyses,
  onReviewSubmitted, 
  onReviewUpdated, 
  onReviewDeleted 
}: ReviewsProps) {
  
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [isEditingReviewId, setIsEditingReviewId] = useState<string | null>(null);
  const [submissionStep, setSubmissionStep] = useState<SubmissionStep>('verification');
  
  // Search state (Simple filter)
  const [searchQuery, setSearchQuery] = useState('');

  // Confirmation state for deleting reviews
  const [reviewIdToDelete, setReviewIdToDelete] = useState<string | null>(null);

  // Form State
  const [companyName, setCompanyName] = useState('');
  const [position, setPosition] = useState('');
  const [authorName, setAuthorName] = useState('');
  const [reviewText, setReviewText] = useState('');
  const [studentId, setStudentId] = useState('sanikakalyani10@gmail.com');

  // Step 1: Participation Verification State
  const [participated, setParticipated] = useState<boolean | null>(null);
  const [verificationProofUploaded, setVerificationProofUploaded] = useState(false);
  const [verificationProofName, setVerificationProofName] = useState<string>('');
  const [verificationDocType, setVerificationDocType] = useState<string>('Offer Letter');
  const [isOcrProcessing, setIsOcrProcessing] = useState(false);
  const [ocrName, setOcrName] = useState('');
  const [ocrCompany, setOcrCompany] = useState('');
  const [ocrPosition, setOcrPosition] = useState('');
  const [ocrDates, setOcrDates] = useState('');
  
  // Step 2: Experience Evaluation State
  const [projectType, setProjectType] = useState<CommunityReview['projectType']>('Guided Projects');
  const [mentorInteraction, setMentorInteraction] = useState<CommunityReview['mentorInteraction']>('Weekly');
  const [workedWithTeam, setWorkedWithTeam] = useState(false);
  const [meetingsOrCodeReviews, setMeetingsOrCodeReviews] = useState(false);
  const [learningValue, setLearningValue] = useState<CommunityReview['learningValue']>('Moderate');
  const [selectedFees, setSelectedFees] = useState<string[]>(['No Fee']);
  const [otherFeeDetails, setOtherFeeDetails] = useState('');
  const [recommend, setRecommend] = useState(true);

  // Preview / Generation State
  const [aiReviewSummary, setAiReviewSummary] = useState('');
  const [overallRating, setOverallRating] = useState(3.0);
  const [isGeneratingSummary, setIsGeneratingSummary] = useState(false);
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Track owned reviews in localStorage
  const getMyReviewIds = (): string[] => {
    try {
      const stored = localStorage.getItem('internshield_my_review_ids');
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  };

  const saveMyReviewId = (id: string) => {
    try {
      const list = getMyReviewIds();
      if (!list.includes(id)) {
        list.push(id);
        localStorage.setItem('internshield_my_review_ids', JSON.stringify(list));
      }
    } catch (e) {
      console.error(e);
    }
  };

  const removeMyReviewId = (id: string) => {
    try {
      const list = getMyReviewIds().filter(item => item !== id);
      localStorage.setItem('internshield_my_review_ids', JSON.stringify(list));
    } catch (e) {
      console.error(e);
    }
  };

  // Helper metrics
  const myReviewIds = getMyReviewIds();

  // Metric Math
  const verifiedCount = reviews.filter(r => r.verifiedParticipant || r.participated).length;
  const unverifiedCount = reviews.filter(r => !(r.verifiedParticipant || r.participated)).length;
  
  // Community Experience Score (calculated with weighting)
  // Verified Participant review weight = 100%, Unverified = 20%
  let scoreSum = 0;
  let weightSum = 0;
  reviews.forEach(r => {
    const isVerified = r.verifiedParticipant || r.participated;
    const weight = isVerified ? 1.0 : 0.2;
    scoreSum += (r.overallRating || 3.0) * 20 * weight;
    weightSum += weight;
  });
  const communityScore = weightSum > 0 ? Math.round(scoreSum / weightSum) : 0;

  const totalRatingSum = reviews.reduce((sum, r) => sum + (r.overallRating || 3.0), 0);
  const avgRating = reviews.length > 0 ? Number((totalRatingSum / reviews.length).toFixed(1)) : 0.0;

  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const handleFileUploadClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setVerificationProofUploaded(true);
      setVerificationProofName(file.name);
      setIsOcrProcessing(true);
      setFormError(null);

      const reader = new FileReader();
      reader.onloadend = async () => {
        try {
          const base64 = reader.result as string;
          const res = await fetch('/api/reviews/ocr', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              fileBase64: base64,
              fileMime: file.type || 'application/pdf'
            })
          });

          if (!res.ok) {
            throw new Error("OCR extraction failed on server.");
          }

          const extracted = await res.json();
          setOcrName(extracted.studentName || '');
          setOcrCompany(extracted.companyName || '');
          setOcrPosition(extracted.internshipName || '');
          setOcrDates(extracted.dates || '');

          // Pre-populate if empty
          if (extracted.companyName && !companyName) setCompanyName(extracted.companyName);
          if (extracted.internshipName && !position) setPosition(extracted.internshipName);
          if (extracted.studentName && !authorName) setAuthorName(extracted.studentName);
        } catch (err) {
          console.error("Document auto-extraction failed:", err);
          setFormError("Document uploaded, but OCR auto-verification timed out. You can continue manual evaluation.");
        } finally {
          setIsOcrProcessing(false);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  // Toggle Fee Checkboxes
  const handleFeeCheckboxChange = (fee: string) => {
    if (fee === 'No Fee') {
      setSelectedFees(['No Fee']);
    } else {
      setSelectedFees(prev => {
        const filtered = prev.filter(f => f !== 'No Fee');
        if (filtered.includes(fee)) {
          const res = filtered.filter(f => f !== fee);
          return res.length === 0 ? ['No Fee'] : res;
        } else {
          return [...filtered, fee];
        }
      });
    }
  };

  // Generate Preview Review via Server
  const handleGenerateReviewPreview = async () => {
    if (!companyName.trim() || !position.trim() || !authorName.trim()) {
      setFormError("Company Name, Internship Role, and Your Name are required.");
      return;
    }

    setIsGeneratingSummary(true);
    setFormError(null);

    try {
      const payload = {
        companyName,
        position,
        participated: !!participated,
        verificationProofUploaded,
        verificationProofName,
        projectType,
        mentorInteraction,
        workedWithTeam,
        meetingsOrCodeReviews,
        learningValue,
        selectedFees,
        otherFeeDetails,
        recommend
      };

      const res = await fetch('/api/reviews/generate-summary', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        throw new Error("Unable to contact AI server backend for summary synthesis.");
      }

      const data = await res.json();
      setAiReviewSummary(data.aiReviewSummary);
      setOverallRating(data.overallRating);
      setSubmissionStep('preview');
    } catch (err: any) {
      setFormError(err.message || "Synthesizing review preview failed.");
    } finally {
      setIsGeneratingSummary(false);
    }
  };

  // Post Review handler
  const handlePostReview = async () => {
    setIsSubmittingReview(true);
    setFormError(null);

    const isEdit = isEditingReviewId !== null;

    try {
      const url = isEdit ? `/api/reviews/${isEditingReviewId}` : '/api/reviews';
      const method = isEdit ? 'PUT' : 'POST';

      const payload = {
        companyName,
        position,
        authorName,
        studentId: studentId || "sanikakalyani10@gmail.com",
        reviewText: reviewText || 'None provided.',
        participated: !!participated,
        verificationProofUploaded,
        verificationProofName,
        verifiedParticipant: participated === true,
        projectType,
        mentorInteraction,
        workedWithTeam,
        meetingsOrCodeReviews,
        learningValue,
        selectedFees,
        otherFeeDetails,
        recommend,
        aiReviewSummary,
        overallRating,
        verificationDocType,
        ocrName,
        ocrCompany,
        ocrPosition,
        ocrDates
      };

      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || "Form request failed on database engine.");
      }

      const savedReview = await res.json();

      if (isEdit) {
        onReviewUpdated(savedReview);
      } else {
        saveMyReviewId(savedReview.id);
        onReviewSubmitted(savedReview);
      }

      handleCloseModal();
    } catch (err: any) {
      setFormError(err.message || "Failed posting custom testimony.");
    } finally {
      setIsSubmittingReview(false);
    }
  };

  // Launch editing flow
  const handleEditInitiate = (review: CommunityReview) => {
    setIsEditingReviewId(review.id);
    setCompanyName(review.companyName);
    setPosition(review.position);
    setAuthorName(review.authorName);
    setStudentId(review.studentId || "sanikakalyani10@gmail.com");
    setReviewText(review.reviewText || '');
    
    setParticipated(review.participated);
    setVerificationProofUploaded(review.verificationProofUploaded);
    setVerificationProofName(review.verificationProofName || '');
    setVerificationDocType(review.verificationDocType || 'Offer Letter');
    setOcrName(review.ocrName || '');
    setOcrCompany(review.ocrCompany || '');
    setOcrPosition(review.ocrPosition || '');
    setOcrDates(review.ocrDates || '');
    
    setProjectType(review.projectType || 'Guided Projects');
    setMentorInteraction(review.mentorInteraction || 'Weekly');
    setWorkedWithTeam(review.workedWithTeam || false);
    setMeetingsOrCodeReviews(review.meetingsOrCodeReviews || false);
    setLearningValue(review.learningValue || 'Moderate');
    setSelectedFees(review.selectedFees || ['No Fee']);
    setOtherFeeDetails(review.otherFeeDetails || '');
    setRecommend(review.recommend !== undefined ? review.recommend : true);

    setAiReviewSummary(review.aiReviewSummary || '');
    setOverallRating(review.overallRating || 3.0);

    setSubmissionStep('verification');
    setShowSubmitModal(true);
  };

  // Final deletion handler
  const handleDeleteExecute = async () => {
    if (!reviewIdToDelete) return;
    try {
      const res = await fetch(`/api/reviews/${reviewIdToDelete}`, {
        method: 'DELETE'
      });

      if (res.ok) {
        onReviewDeleted(reviewIdToDelete);
        removeMyReviewId(reviewIdToDelete);
        setReviewIdToDelete(null);
      } else {
        alert("Failed to delete review.");
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleCloseModal = () => {
    setShowSubmitModal(false);
    setIsEditingReviewId(null);
    setSubmissionStep('verification');
    
    // reset forms
    setCompanyName('');
    setPosition('');
    setAuthorName('');
    setStudentId('sanikakalyani10@gmail.com');
    setReviewText('');
    setParticipated(null);
    setVerificationProofUploaded(false);
    setVerificationProofName('');
    setVerificationDocType('Offer Letter');
    setOcrName('');
    setOcrCompany('');
    setOcrPosition('');
    setOcrDates('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    setProjectType('Guided Projects');
    setMentorInteraction('Weekly');
    setWorkedWithTeam(false);
    setMeetingsOrCodeReviews(false);
    setLearningValue('Moderate');
    setSelectedFees(['No Fee']);
    setOtherFeeDetails('');
    setRecommend(true);
    setAiReviewSummary('');
    setOverallRating(3.0);
    setFormError(null);
  };

  // Simple review filtering
  const filteredReviews = reviews.filter(r => {
    const query = searchQuery.toLowerCase();
    return r.companyName.toLowerCase().includes(query) || 
           r.position.toLowerCase().includes(query) ||
           (r.authorName && r.authorName.toLowerCase().includes(query)) ||
           (r.aiReviewSummary && r.aiReviewSummary.toLowerCase().includes(query));
  });

  return (
    <div className="space-y-8 animate-fade-in py-2 max-w-5xl mx-auto">
      
      {/* SECTION 1: VERIFIED REVIEW STATISTICS */}
      <div className="bg-slate-900 text-white rounded-3xl p-6 sm:p-8 shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 translate-x-12 -translate-y-12 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl" />
        
        <div className="relative space-y-6">
          <div className="space-y-1.5">
            <span className="px-2.5 py-0.5 bg-indigo-500/20 border border-indigo-400/30 text-indigo-300 rounded-full font-mono text-[10px] font-bold uppercase tracking-wider">
              COMMUNITY LEDGER
            </span>
            <h2 className="text-2xl sm:text-3xl font-display font-medium text-white tracking-tight">
              Internship Reviews & Experiences
            </h2>
            <p className="text-slate-300 text-xs sm:text-sm max-w-2xl leading-relaxed">
              Real metrics gathered directly from current and past program participants. We audit proof of work to isolate authentic student feedback.
            </p>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 pt-2">
            
            <div className="bg-white/5 border border-white/10 rounded-2xl p-4 space-y-1">
              <span className="text-[10px] font-mono text-slate-400 font-bold uppercase block tracking-wider">VERIFIED REVIEWS</span>
              <div className="flex items-baseline gap-1.5">
                <span className="text-2xl sm:text-3xl font-bold font-mono text-emerald-400">{verifiedCount}</span>
                <span className="text-xs text-slate-450">participants</span>
              </div>
            </div>

            <div className="bg-white/5 border border-white/10 rounded-2xl p-4 space-y-1">
              <span className="text-[10px] font-mono text-slate-400 font-bold uppercase block tracking-wider">UNVERIFIED REVIEWS</span>
              <div className="flex items-baseline gap-1.5">
                <span className="text-2xl sm:text-3xl font-bold font-mono text-amber-400">{unverifiedCount}</span>
                <span className="text-xs text-slate-450">submissions</span>
              </div>
            </div>

            <div className="bg-white/5 border border-white/10 rounded-2xl p-4 space-y-1">
              <span className="text-[10px] font-mono text-slate-400 font-bold uppercase block tracking-wider">COMMUNITY SCORE</span>
              <div className="flex items-baseline gap-1">
                <span className="text-2xl sm:text-3xl font-bold font-mono text-indigo-300">{communityScore}</span>
                <span className="text-xs text-indigo-200/60">/ 100</span>
              </div>
            </div>

            <div className="bg-white/5 border border-white/10 rounded-2xl p-4 space-y-1">
              <span className="text-[10px] font-mono text-slate-400 font-bold uppercase block tracking-wider">AVERAGE RATING</span>
              <div className="flex items-baseline gap-1">
                <span className="text-2xl sm:text-3xl font-bold font-mono text-white">{avgRating}</span>
                <span className="text-xs text-slate-400">/ 5.0</span>
              </div>
            </div>

          </div>
        </div>
      </div>

      {/* Rule 2 Legal Trust Protocol Disclaimer */}
      <div className="p-4 bg-indigo-50/70 border border-indigo-100 rounded-2xl flex items-start gap-3.5 text-indigo-950 text-xs sm:text-sm leading-relaxed shadow-xs">
        <ShieldCheck className="w-5 h-5 text-indigo-600 shrink-0 mt-0.5" />
        <div>
          <span className="font-bold block uppercase font-mono tracking-wider text-[10px] text-indigo-700">InternShield Rigorous Integrity Protocol</span>
          <p className="font-sans text-[11px] font-medium leading-normal text-slate-700">
            "Verification confirms participation only. Internship quality is determined separately through AI auditing and collective student experiences."
          </p>
        </div>
      </div>

      {/* SECTION 3: SUBMIT REVIEW TRIGGER BUTTON & SIMPLE SEARCH */}
      <div className="flex flex-col sm:flex-row gap-4 items-stretch sm:items-center justify-between bg-white border border-slate-200 p-4 rounded-2xl shadow-sm">
        
        {/* Simple keyword search filter */}
        <div className="relative flex-grow max-w-sm">
          <input
            type="text"
            placeholder="Search reviews by company, position, summary keywords..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-600/15 focus:border-indigo-600 text-slate-700"
          />
        </div>

        <button
          onClick={() => {
            setSubmissionStep('verification');
            setShowSubmitModal(true);
          }}
          id="btn-submit-review"
          className="flex items-center justify-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs sm:text-sm font-semibold shadow-sm hover:shadow transition-all cursor-pointer whitespace-nowrap"
        >
          <PlusCircle className="w-5 h-5" /> Submit Internship Review
        </button>

      </div>

      {/* SECTION 2: REVIEW LIST */}
      <div className="space-y-6">
        {filteredReviews.length > 0 ? (
          filteredReviews.map(rev => {
            const isMyReview = myReviewIds.includes(rev.id);
            const isVerified = rev.verifiedParticipant || rev.participated;

            return (
              <div 
                key={rev.id} 
                className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-sm hover:shadow-md transition-shadow relative space-y-6"
              >
                {/* Header info */}
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-baseline gap-2.5 flex-wrap">
                      <h3 className="text-lg sm:text-xl font-bold text-slate-900 font-display leading-tight">{rev.companyName}</h3>
                      <span className="text-xs text-slate-400 font-mono">({rev.position})</span>
                    </div>

                    <div className="flex items-center gap-2 flex-wrap pt-1">
                      {isVerified ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-[10px] font-extrabold uppercase tracking-wide bg-emerald-50 border border-emerald-200 text-emerald-700 font-mono">
                          ✓ Verified Participant
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wide bg-amber-50 border border-amber-200 text-amber-700 font-mono">
                          ⚠ Unverified review
                        </span>
                      )}

                      <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-slate-100/80 text-slate-800 rounded text-xs font-mono font-bold">
                        <Star className="w-3 h-3 text-amber-500 fill-amber-500" />
                        {rev.overallRating ? rev.overallRating.toFixed(1) : '3.0'} / 5
                      </span>

                      <span className={`inline-flex items-center px-2 py-0.5 text-[9px] font-extrabold rounded font-mono border uppercase tracking-wider ${
                        rev.recommend 
                          ? 'bg-indigo-50 border-indigo-200 text-indigo-700' 
                          : 'bg-rose-50 border-rose-200 text-rose-700'
                      }`}>
                        {rev.recommend ? 'Recommended' : 'Not Recommended'}
                      </span>
                    </div>
                  </div>

                  {/* Edit/Delete self-toggles */}
                  {isMyReview && (
                    <div className="flex items-center gap-2 shrink-0 self-end sm:self-start">
                      <button
                        onClick={() => handleEditInitiate(rev)}
                        className="px-3 py-1.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-600 rounded-lg flex items-center gap-1 text-[11px] font-bold transition-all cursor-pointer"
                        title="Edit entry answers"
                      >
                        <Edit2 className="w-3 h-3" />
                        <span>Edit Review</span>
                      </button>
                      <button
                        onClick={() => setReviewIdToDelete(rev.id)}
                        className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-700 rounded-lg flex items-center gap-1 text-[11px] font-bold transition-all cursor-pointer"
                        title="Remove testimony"
                      >
                        <Trash2 className="w-3 h-3" />
                        <span>Delete</span>
                      </button>
                    </div>
                  )}
                </div>

                {/* Grid of structured experience parameters */}
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4 bg-slate-50/50 p-4 rounded-2xl border border-slate-200/55 text-xs text-slate-700">
                  <div className="space-y-0.5">
                    <span className="text-[10px] font-mono text-slate-400 block font-bold leading-none uppercase">Project Quality</span>
                    <span className="font-semibold text-slate-900">{rev.projectType || 'Guided Projects'}</span>
                  </div>
                  <div className="space-y-0.5">
                    <span className="text-[10px] font-mono text-slate-400 block font-bold leading-none uppercase">Mentorship Quality</span>
                    <span className="font-semibold text-slate-900 font-sans">{rev.mentorInteraction || 'Occasionally'}</span>
                  </div>
                  <div className="space-y-0.5">
                    <span className="text-[10px] font-mono text-slate-400 block font-bold leading-none uppercase">Industry Exposure</span>
                    <span className="font-semibold text-slate-900">
                      {rev.workedWithTeam ? 'Team Work' : 'Solo Task'} / {rev.meetingsOrCodeReviews ? 'Code Reviews' : 'No Syncs'}
                    </span>
                  </div>
                  <div className="space-y-0.5">
                    <span className="text-[10px] font-mono text-slate-400 block font-bold leading-none uppercase">Learning Value</span>
                    <span className="font-semibold text-slate-900">{rev.learningValue || 'Moderate'}</span>
                  </div>
                  <div className="space-y-0.5">
                    <span className="text-[10px] font-mono text-slate-400 block font-bold leading-none uppercase">Fee Transparency</span>
                    <span className={`font-semibold ${rev.hasCertificateFee ? 'text-red-650' : 'text-emerald-750'}`}>
                      {rev.hasCertificateFee ? 'Low (Fees Charged)' : 'High (Zero Cost)'}
                    </span>
                  </div>
                </div>

                {/* AI generated summary */}
                <div className="bg-indigo-50/20 border border-indigo-100/50 rounded-2xl p-5 space-y-2 relative">
                  <div className="text-[10px] font-mono font-bold text-indigo-600 flex items-center gap-1 uppercase select-none">
                    <Sparkles className="w-3.5 h-3.5 fill-indigo-100" />
                    AI Summary
                  </div>
                  <p className="text-xs sm:text-sm text-slate-700 font-mono leading-relaxed whitespace-pre-wrap">{rev.aiReviewSummary}</p>
                </div>

                {/* Anti-Manipulation & Consensus Indicators */}
                <div className="flex flex-wrap gap-2 pt-1">
                  <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded text-[10px] font-bold font-mono tracking-wider uppercase border ${
                    (rev.consensus_score && rev.consensus_score >= 80)
                      ? 'bg-emerald-50 border-emerald-250 text-emerald-800'
                      : (rev.consensus_score && rev.consensus_score >= 55)
                      ? 'bg-indigo-50 border-indigo-250 text-indigo-800'
                      : 'bg-slate-50 border-slate-200 text-slate-600'
                  }`}>
                    Consensus Score: {rev.consensus_score !== undefined ? `${rev.consensus_score}%` : 'Low (20%)'}
                  </span>

                  <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-slate-50 border border-slate-200 text-slate-700 rounded text-[10px] font-mono leading-none font-bold">
                    Influence Weight: {rev.trust_weight !== undefined ? Math.round(rev.trust_weight * 100) : 100}%
                  </span>

                  {rev.isFlagged && (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-rose-50 border border-rose-300 text-rose-800 font-mono" title={rev.flagReason}>
                      ⚠ Heuristic Flag: {rev.flagReason || "Fraud campaign pattern"}
                    </span>
                  )}

                  {rev.isOutlier && (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded text-[10px] font-extrabold uppercase tracking-widest bg-rose-50 border border-rose-300 text-rose-800 font-mono" title="Subjective rating deviates heavily from calculated AI Audit scores!">
                      ⚠ Outlier ratings
                    </span>
                  )}
                </div>

                {/* Bottom commentator tags */}
                <div className="flex items-center justify-between pt-1 border-t border-slate-100 text-[10px] font-semibold text-slate-500 font-mono">
                  <span>Reviewer: {rev.authorName}</span>
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5" />
                    {new Date(rev.createdAt).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })}
                  </span>
                </div>

              </div>
            );
          })
        ) : (
          <div className="bg-slate-50 border border-slate-200 rounded-3xl p-16 text-center space-y-4">
            <Users className="w-12 h-12 text-slate-300 mx-auto" />
            <h4 className="font-semibold text-slate-800 text-base">No evaluations found in database</h4>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              Be the first to share! Click “Submit Internship Review” to file your verified experiences.
            </p>
          </div>
        )}
      </div>

      {/* SUBMISSION MODAL */}
      {showSubmitModal && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in no-print">
          <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between p-5 border-b border-slate-100 bg-slate-50">
              <span className="font-display font-medium text-slate-800 flex items-center gap-2 text-sm">
                <FileText className="w-4 h-4 text-indigo-600" /> 
                {isEditingReviewId ? 'Edit Internship Review' : 'Submit Internship Review'}
              </span>
              <button 
                onClick={handleCloseModal}
                className="p-1.5 text-slate-405 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Step navigation flow tabs */}
            <div className="grid grid-cols-3 text-center border-b border-slate-100 text-[10px] font-mono leading-none bg-slate-50/40 select-none">
              <div className={`py-3.5 border-r border-slate-105 font-bold ${submissionStep === 'verification' ? 'bg-indigo-50 text-indigo-600' : 'text-slate-400'}`}>
                1. VERIFICATION
              </div>
              <div className={`py-3.5 border-r border-slate-105 font-bold ${submissionStep === 'questions' ? 'bg-indigo-50 text-indigo-600' : 'text-slate-400'}`}>
                2. EVALUATION
              </div>
              <div className={`py-3.5 font-bold ${submissionStep === 'preview' ? 'bg-indigo-50 text-indigo-600' : 'text-slate-400'}`}>
                3. AI PREVIEW
              </div>
            </div>

            {formError && (
              <div className="mx-6 mt-4 p-3 bg-rose-50 border border-rose-250 text-rose-800 rounded-xl text-xs font-semibold flex items-start gap-2.5">
                <ShieldAlert className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                <div>{formError}</div>
              </div>
            )}

            {/* Inner contents scrolling */}
            <div className="p-6 overflow-y-auto space-y-6 flex-grow">
              
              {/* STEP 1: VERIFICATION */}
              {submissionStep === 'verification' && (
                <div className="space-y-5 animate-fade-in">
                  
                  <div className="space-y-1">
                    <span className="text-[10px] font-mono font-bold text-indigo-600 uppercase tracking-widest block">Quality Control</span>
                    <h4 className="text-base font-semibold text-slate-900 font-display">Did you participate in this internship?</h4>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => {
                        setParticipated(true);
                        setFormError(null);
                      }}
                      className={`py-3.5 px-4 rounded-xl text-xs font-bold font-mono border flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                        participated === true 
                          ? 'bg-indigo-600 text-white border-indigo-600 shadow-md shadow-indigo-150' 
                          : 'bg-white hover:bg-slate-100 border-slate-200 text-slate-700'
                      }`}
                    >
                      <CheckCircle className="w-4 h-4" />
                      Yes, I did
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setParticipated(false);
                        setVerificationProofUploaded(false);
                        setVerificationProofName('');
                        setFormError(null);
                      }}
                      className={`py-3.5 px-4 rounded-xl text-xs font-bold font-mono border flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                        participated === false 
                          ? 'bg-slate-900 text-white border-slate-900 shadow-md' 
                          : 'bg-white hover:bg-slate-150 border-slate-200 text-slate-700'
                      }`}
                    >
                      <X className="w-4 h-4" />
                      No
                    </button>
                  </div>

                  {participated === true && (
                    <>
                      <div className="p-4 border border-indigo-100 bg-indigo-50/30 rounded-2xl space-y-3.5 animate-slide-up">
                        
                        {/* Wording & Rule 2 Warning Banner */}
                        <div className="p-3 bg-amber-50 border border-amber-200 text-amber-900 rounded-xl text-[11px] leading-relaxed flex items-start gap-2">
                          <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                          <div>
                            <span className="font-bold uppercase tracking-wider text-[10px] block text-amber-850">Rule 2 Trust Protocol Disclaimer</span>
                            Verification confirms participation only. Internship quality is determined separately through AI auditing and collective student experiences.
                          </div>
                        </div>

                        <div className="space-y-1">
                          <label className="text-xs font-bold text-slate-800 block">Select Verification Document Type *</label>
                          <select
                            value={verificationDocType}
                            onChange={e => setVerificationDocType(e.target.value)}
                            className="w-full text-xs px-3.5 py-2.5 border border-slate-200 rounded-xl bg-white focus:outline-none"
                          >
                            <option value="Offer Letter">Offer Letter</option>
                            <option value="Internship Completion Certificate">Internship Completion Certificate</option>
                            <option value="LOR (Letter of Recommendation)">LOR (Letter of Recommendation)</option>
                            <option value="Internship ID Card">Internship ID Card</option>
                            <option value="Official Internship Email Screenshot">Official Internship Email Screenshot</option>
                          </select>
                        </div>

                        <div className="space-y-1">
                          <label className="text-xs font-bold text-slate-800 block">Upload Verification Proof Document *</label>
                          <p className="text-[10px] text-slate-500 font-medium">Provide the document file corresponding to your selection.</p>
                        </div>

                        {verificationProofUploaded ? (
                          <div className="p-3.5 bg-white border border-emerald-150 rounded-xl space-y-2.5">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                                <div className="text-xs font-semibold text-slate-850 truncate font-mono">
                                  {verificationProofName} (VERIFIED)
                                </div>
                              </div>
                              <button
                                type="button"
                                onClick={() => {
                                  setVerificationProofUploaded(false);
                                  setVerificationProofName('');
                                  setOcrName('');
                                  setOcrCompany('');
                                  setOcrPosition('');
                                  setOcrDates('');
                                  if (fileInputRef.current) {
                                    fileInputRef.current.value = '';
                                  }
                                }}
                                className="bg-transparent text-rose-500 hover:text-rose-700 text-[10px] font-bold uppercase cursor-pointer"
                              >
                                Remove
                              </button>
                            </div>

                            {isOcrProcessing ? (
                              <div className="py-2.5 flex items-center justify-center gap-2 text-xs font-bold text-indigo-700 font-mono animate-pulse">
                                <Sparkles className="w-4 h-4 animate-spin text-indigo-550" />
                                Analyzing Document OCR extraction...
                              </div>
                            ) : ocrName || ocrCompany ? (
                              <div className="p-3 bg-indigo-50/50 border border-indigo-100 rounded-xl text-[11px] space-y-1.5 font-mono text-indigo-950">
                                <span className="font-extrabold text-[10px] text-indigo-700 uppercase tracking-wider block">✓ OCR Auto-Extracted Parameters</span>
                                <div className="grid grid-cols-2 gap-2 text-[10px] leading-tight">
                                  <div><span className="text-slate-500 block">STUDENT</span> <strong className="text-slate-800 text-[10px]">{ocrName || 'Not matched'}</strong></div>
                                  <div><span className="text-slate-500 block">COMPANY</span> <strong className="text-slate-800 text-[10px]">{ocrCompany || 'Not matched'}</strong></div>
                                  <div><span className="text-slate-500 block">EXTRACTED ROLE</span> <strong className="text-slate-800 text-[10px]">{ocrPosition || 'Not matched'}</strong></div>
                                  <div><span className="text-slate-500 block">DURATION / DATES</span> <strong className="text-slate-800 text-[10px]">{ocrDates || 'Not matched'}</strong></div>
                                </div>
                              </div>
                            ) : null}
                          </div>
                        ) : (
                          <>
                            <div 
                              onClick={handleFileUploadClick}
                              className="border-2 border-dashed border-slate-300 hover:border-indigo-500 p-6 rounded-xl text-center space-y-2 cursor-pointer hover:bg-white transition-all bg-slate-50/50"
                            >
                              <Upload className="w-8 h-8 text-indigo-600 mx-auto" />
                              <div className="text-xs font-semibold text-slate-705">Click to upload verification document</div>
                              <p className="text-[9px] text-slate-400 uppercase font-mono font-bold">PDF, PNG, JPG, JPEG, WEBP, DOCX, PPTX</p>
                            </div>
                            <input
                              type="file"
                              ref={fileInputRef}
                              onChange={handleFileChange}
                              className="hidden"
                              accept=".pdf,image/*,.docx,.pptx"
                            />
                          </>
                        )}
                      </div>

                      <div className="pt-4 border-t border-slate-100 flex justify-end">
                        <button
                          type="button"
                          disabled={isOcrProcessing}
                          onClick={() => {
                            if (!verificationProofUploaded) {
                              setFormError("Verified participants are required to supply a proof document file.");
                              return;
                            }
                            setFormError(null);
                            setSubmissionStep('questions');
                          }}
                          className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
                        >
                          <span>{isOcrProcessing ? "Parsing document..." : "Next: Evaluate Experience"}</span>
                          <ArrowRight className="w-4 h-4" />
                        </button>
                      </div>
                    </>
                  )}

                  {participated === false && (
                    <>
                      <div className="p-5 border border-red-200 bg-rose-50/40 rounded-2xl space-y-3 animate-slide-up text-center">
                        <ShieldAlert className="w-9 h-9 text-rose-500 mx-auto" />
                        <div className="space-y-1.5">
                          <p className="text-sm font-bold text-slate-850 leading-snug">
                            You can only submit a review if you have participated in this internship.
                          </p>
                          <p className="text-xs text-slate-550 leading-relaxed">
                            Reviews are intended to reflect real internship experiences and require participation verification.
                          </p>
                        </div>
                      </div>

                      <div className="pt-4 border-t border-slate-100 flex justify-end">
                        <button
                          type="button"
                          onClick={handleCloseModal}
                          className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold cursor-pointer transition-all"
                        >
                          Cancel
                        </button>
                      </div>
                    </>
                  )}

                  {participated === null && (
                    <div className="pt-4 border-t border-slate-100 flex justify-end">
                      <button
                        type="button"
                        disabled
                        className="px-5 py-2.5 bg-slate-100 text-slate-400 border border-slate-200 rounded-xl text-xs font-semibold flex items-center gap-1.5 cursor-not-allowed opacity-60"
                      >
                        <span>Next: Evaluate Experience</span>
                        <ArrowRight className="w-4 h-4 opacity-50" />
                      </button>
                    </div>
                  )}

                </div>
              )}

              {/* STEP 2: EXPERIENCE EVALUATION */}
              {submissionStep === 'questions' && (
                <div className="space-y-4 animate-fade-in font-sans">
                  
                  <div className="space-y-1">
                    <span className="text-[10px] font-mono font-bold text-indigo-600 uppercase tracking-wider block font-bold">METRICS SHEETS</span>
                    <h4 className="text-base font-semibold text-slate-900 font-display">Experience Evaluation Checklist</h4>
                  </div>

                  {/* Company Deck & Job title */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-[10px] font-semibold text-slate-650 uppercase font-bold tracking-wider block">Company Name *</label>
                      <input
                        type="text"
                        placeholder="e.g. CodSoft"
                        value={companyName}
                        onChange={e => setCompanyName(e.target.value)}
                        className="w-full text-xs px-3.5 py-2.5 border border-slate-200 rounded-xl focus:ring-0 focus:outline-none bg-slate-50"
                      />
                    </div>
                    
                    <div className="space-y-1">
                      <label className="text-[10px] font-semibold text-slate-650 uppercase font-bold tracking-wider block">Internship Role *</label>
                      <input
                        type="text"
                        placeholder="e.g. Artificial Intelligence Intern"
                        value={position}
                        onChange={e => setPosition(e.target.value)}
                        className="w-full text-xs px-3.5 py-2.5 border border-slate-200 rounded-xl focus:ring-0 focus:outline-none bg-slate-50"
                      />
                    </div>
                  </div>

                  {/* Project Quality */}
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700 block">Project Quality *</label>
                    <div className="space-y-1">
                      {[
                        { val: 'Real Client Projects', lbl: 'Real Client Projects (Live commercial workflows)' },
                        { val: 'Industry-Level Projects', lbl: 'Industry-Level Projects (Standard APIs / complex logic)' },
                        { val: 'Guided Projects', lbl: 'Guided Projects (Handheld course-defined modules)' },
                        { val: 'Basic Academic Projects', lbl: 'Basic Academic Projects (Standard portfolio / calculator templates)' },
                        { val: 'Only Assignments / Videos', lbl: 'Only Assignments / Videos (Low program challenge)' }
                      ].map(p => (
                        <label key={p.val} className="flex items-center gap-2 p-2 bg-slate-50 rounded-lg border border-slate-100 hover:bg-slate-100/50 cursor-pointer text-xs">
                          <input
                            type="radio"
                            name="projectType"
                            checked={projectType === p.val}
                            onChange={() => setProjectType(p.val as any)}
                            className="text-indigo-600 focus:ring-indigo-500"
                          />
                          <span className={`${projectType === p.val ? 'font-bold text-indigo-700' : 'text-slate-600'}`}>{p.lbl}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* Mentorship Frequency */}
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700 block">Mentorship Frequency *</label>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      {[
                        { val: 'Daily', lbl: 'Daily active syncs' },
                        { val: 'Weekly', lbl: 'Weekly catchups' },
                        { val: 'Occasionally', lbl: 'Occasionally if requested' },
                        { val: 'Never', lbl: 'Never (Self-taught)' }
                      ].map(m => (
                        <label key={m.val} className="flex items-center gap-2 p-2 bg-slate-50 border border-slate-100 rounded-lg hover:bg-slate-100/50 cursor-pointer">
                          <input
                            type="radio"
                            name="mentorInteraction"
                            checked={mentorInteraction === m.val}
                            onChange={() => setMentorInteraction(m.val as any)}
                            className="text-indigo-600 focus:ring-indigo-505"
                          />
                          <span className={mentorInteraction === m.val ? 'font-bold text-indigo-600' : 'text-slate-650'}>{m.lbl}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* Industry Exposure */}
                  <div className="space-y-2 p-4 bg-slate-50 border border-slate-200 rounded-2xl text-xs">
                    <span className="font-bold text-slate-750 block">Industry Exposure Metrics</span>
                    
                    <div className="flex items-center justify-between py-1 border-b border-slate-100">
                      <span>Did you work with a real team?</span>
                      <div className="flex gap-1">
                        <button
                          type="button"
                          onClick={() => setWorkedWithTeam(true)}
                          className={`px-3 py-1 font-bold border rounded-lg ${workedWithTeam ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-slate-705 border-slate-200 font-medium'}`}
                        >
                          Yes
                        </button>
                        <button
                          type="button"
                          onClick={() => setWorkedWithTeam(false)}
                          className={`px-3 py-1 font-bold border rounded-lg ${!workedWithTeam ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-slate-705 border-slate-200 font-medium'}`}
                        >
                          No
                        </button>
                      </div>
                    </div>

                    <div className="flex items-center justify-between py-1">
                      <span>Did you participate in meetings or code reviews?</span>
                      <div className="flex gap-1">
                        <button
                          type="button"
                          onClick={() => setMeetingsOrCodeReviews(true)}
                          className={`px-3 py-1 font-bold border rounded-lg ${meetingsOrCodeReviews ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-slate-705 border-slate-200 font-medium'}`}
                        >
                          Yes
                        </button>
                        <button
                          type="button"
                          onClick={() => setMeetingsOrCodeReviews(false)}
                          className={`px-3 py-1 font-bold border rounded-lg ${!meetingsOrCodeReviews ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-slate-705 border-slate-200 font-medium'}`}
                        >
                          No
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Learning Value */}
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700 block">Learning Value *</label>
                    <select
                      value={learningValue}
                      onChange={e => setLearningValue(e.target.value as any)}
                      className="w-full text-xs px-3.5 py-2.5 border border-slate-200 rounded-xl bg-slate-50 cursor-pointer"
                    >
                      <option value="Very High">Very High (Rapid personal development)</option>
                      <option value="High">High (Standard tooling lessons learned)</option>
                      <option value="Moderate">Moderate (Basic concepts learned offline)</option>
                      <option value="Low">Low (Felt highly repetitive / low design challenges)</option>
                      <option value="Very Low">Very Low (Practically learned nothing)</option>
                    </select>
                  </div>

                  {/* Fee Transparency */}
                  <div className="space-y-2 p-4 bg-slate-50 border border-slate-200 rounded-2xl">
                    <label className="text-xs font-bold text-slate-700 block">Fee Transparency (Select all requested costs)</label>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      {[
                        'Registration Fee', 'Certificate Fee', 'Training Fee', 
                        'LOR Fee', 'Other Fee', 'No Fee'
                      ].map((fee) => {
                        const checked = selectedFees.includes(fee);
                        return (
                          <label key={fee} className="flex items-center gap-2 p-2 bg-white rounded-lg border border-slate-100 cursor-pointer select-none">
                            <input
                              type="checkbox"
                              checked={checked}
                              onChange={() => handleFeeCheckboxChange(fee)}
                              className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                            />
                            <span className={checked ? 'font-bold text-indigo-700' : 'text-slate-650'}>{fee}</span>
                          </label>
                        );
                      })}
                    </div>
                    {selectedFees.includes('Other Fee') && (
                      <div className="mt-2 space-y-1">
                        <label className="text-[10px] font-bold text-slate-500 block uppercase font-mono">SPECIFY AMOUNT OR TYPE *</label>
                        <input
                          type="text"
                          placeholder="e.g. ₹999 security deposit"
                          value={otherFeeDetails}
                          onChange={e => setOtherFeeDetails(e.target.value)}
                          className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs bg-white"
                        />
                      </div>
                    )}
                  </div>

                  {/* Recommendation */}
                  <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl flex items-center justify-between text-xs">
                    <div>
                      <span className="font-bold text-slate-750 block">Would you recommend this internship? *</span>
                      <p className="text-[10px] text-slate-500">Should peer students enroll in this position?</p>
                    </div>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => setRecommend(true)}
                        className={`px-3 py-1.5 font-bold border rounded-lg ${recommend ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-slate-705 border-slate-200'}`}
                      >
                        Yes
                      </button>
                      <button
                        type="button"
                        onClick={() => setRecommend(false)}
                        className={`px-3 py-1.5 font-bold border rounded-lg ${!recommend ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-slate-705 border-slate-200'}`}
                      >
                        No
                      </button>
                    </div>
                  </div>

                  {/* Student unique ID (to enforce single review per student) */}
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-705 block font-sans">
                      Student unique Email / ID * <span className="font-mono text-[9px] text-indigo-600 font-bold">(Integrity verification)</span>
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. rollno_50 or student@college.edu"
                      value={studentId}
                      onChange={e => setStudentId(e.target.value)}
                      className="w-full text-xs px-3.5 py-2.5 border border-slate-205 rounded-xl focus:ring-0 focus:outline-none bg-slate-50 font-mono"
                      required
                      disabled={isEditingReviewId !== null}
                    />
                  </div>

                  {/* Writer details */}
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700 block">Your Screen Name / Alias *</label>
                    <input
                      type="text"
                      placeholder="e.g. Anonymous Intern"
                      value={authorName}
                      onChange={e => setAuthorName(e.target.value)}
                      className="w-full text-xs px-3.5 py-2.5 border border-slate-200 rounded-xl focus:ring-0 focus:outline-none bg-slate-50 font-mono"
                    />
                  </div>

                  {/* Detailed optional commentary */}
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700 block text-slate-650">Detailed commentary (Optional)</label>
                    <textarea
                      placeholder="Add any additional anecdotes, specific tasks, or notes..."
                      value={reviewText}
                      onChange={e => setReviewText(e.target.value)}
                      rows={3}
                      className="w-full text-xs px-3.5 py-2.5 border border-slate-200 rounded-xl focus:ring-0 focus:outline-none bg-slate-50"
                    />
                  </div>

                  <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                    <button
                      type="button"
                      onClick={() => setSubmissionStep('verification')}
                      className="px-4 py-2 border border-slate-200 text-slate-600 rounded-xl text-xs font-semibold hover:bg-slate-50 cursor-pointer"
                    >
                      Back
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        if (selectedFees.includes('Other Fee') && !otherFeeDetails.trim()) {
                          setFormError("Please fill out the description for the Other Fee selection.");
                          return;
                        }
                        handleGenerateReviewPreview();
                      }}
                      disabled={isGeneratingSummary}
                      className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                    >
                      {isGeneratingSummary ? (
                        <>
                          <HelpCircle className="w-4 h-4 animate-spin" />
                          <span>Generating AI summary...</span>
                        </>
                      ) : (
                        <>
                          <span>Generate AI Review Summary</span>
                          <ArrowRight className="w-4 h-4" />
                        </>
                      )}
                    </button>
                  </div>

                </div>
              )}

              {/* STEP 3: PREVIEW */}
              {submissionStep === 'preview' && (
                <div className="space-y-5 animate-fade-in font-mono text-xs">
                  
                  <div className="space-y-1 font-sans">
                    <span className="text-[10px] font-mono font-bold text-indigo-600 uppercase tracking-widest block font-bold">DRAFT REPORT</span>
                    <h4 className="text-base font-semibold text-slate-900 font-display">AI Generated Review Summary</h4>
                    <p className="text-xs text-slate-500">Inspect the compiled profile before posting to public ledger.</p>
                  </div>

                  <div className="bg-slate-950 text-slate-200 p-5 rounded-2xl border border-slate-800 space-y-4">
                    <div className="border-b border-white/10 pb-2 flex items-center justify-between">
                      <span className="text-indigo-400 font-sans font-bold text-[10px] tracking-wide uppercase uppercase">PREVIEW TRANSCRIPT</span>
                      <span className="text-emerald-400 font-bold bg-emerald-950 border border-emerald-900 px-2 py-0.5 rounded text-[10px] uppercase">
                        Score rating: {overallRating} / 5.0
                      </span>
                    </div>
                    
                    <p className="whitespace-pre-wrap leading-relaxed text-[11px]">{aiReviewSummary}</p>
                  </div>

                  {reviewText && (
                    <div className="p-4 bg-slate-50 border border-slate-205 rounded-xl text-slate-600 font-sans">
                      <span className="font-bold text-slate-700">Student Commentary Comment:</span> "{reviewText}"
                    </div>
                  )}

                  <div className="pt-4 border-t border-slate-100 flex items-center justify-between font-sans">
                    <button
                      type="button"
                      onClick={() => setSubmissionStep('questions')}
                      className="px-4 py-2 border border-slate-200 text-slate-650 rounded-xl text-xs font-semibold hover:bg-slate-50 cursor-pointer"
                    >
                      Edit Answers
                    </button>
                    <button
                      type="button"
                      onClick={handlePostReview}
                      disabled={isSubmittingReview}
                      className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-medium flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                    >
                      {isSubmittingReview ? (
                        <span>Saving...</span>
                      ) : (
                        <>
                          <CheckCircle className="w-4 h-4" />
                          <span>Post Review</span>
                        </>
                      )}
                    </button>
                  </div>

                </div>
              )}

            </div>

          </div>
        </div>
      )}

      {/* CONFIRMATION DIALOG FOR DELETE */}
      {reviewIdToDelete !== null && (
        <div className="fixed inset-0 bg-slate-950/50 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white border border-slate-200 rounded-2xl p-6 max-w-sm w-full space-y-4 shadow-2xl">
            <div className="flex gap-3 items-start">
              <div className="p-2 bg-rose-50 rounded-xl border border-rose-100 text-rose-600 shrink-0">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <h4 className="font-bold text-slate-900">Are you sure you want to delete this review?</h4>
                <p className="text-xs text-slate-500 leading-relaxed">This action cannot be undone. All testimony metrics will be permanently pruned from the statistics database.</p>
              </div>
            </div>
            
            <div className="flex justify-end gap-2 text-xs font-semibold">
              <button
                type="button"
                onClick={() => setReviewIdToDelete(null)}
                className="px-4 py-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 rounded-lg cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteExecute}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-lg cursor-pointer"
              >
                Delete Review
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
