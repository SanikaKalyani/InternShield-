import React from 'react';
import { ShieldCheck, BookOpen, AlertCircle, FileSpreadsheet, Star, Users, Briefcase, FileCheck, CheckCircle, ArrowRight } from 'lucide-react';
import { InternshipAnalysis, CommunityReview } from '../types.js';

interface HomeProps {
  onNavigate: (tab: string) => void;
  analyses: InternshipAnalysis[];
  reviews: CommunityReview[];
}

export default function Home({ onNavigate, analyses, reviews }: HomeProps) {
  // Compute lively stats based on base database counts
  const totalAnalyzed = analyses.length;
  const totalReviewsCount = reviews.length;
  const verifiedCompaniesCount = analyses.filter(a => a.overallCredibilityScore >= 80).length;

  return (
    <div className="space-y-16 py-4 animate-fade-in">
      {/* Hero Section */}
      <section className="relative text-center max-w-4xl mx-auto py-12 px-4 space-y-6">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-indigo-50 border border-indigo-100 text-indigo-850 rounded-full font-mono text-xs font-semibold uppercase tracking-wider mb-2">
          <ShieldCheck className="w-3.5 h-3.5 text-indigo-600" />
          Shielding Student Futures
        </div>
        <h1 className="text-4xl sm:text-5xl md:text-6xl font-display font-medium tracking-tight text-slate-900 leading-[1.1]">
          Verify Internships Before You Invest Your <span className="text-indigo-650 font-bold underline decoration-indigo-200 underline-offset-8">Time & Money</span>
        </h1>
        <p className="text-lg sm:text-xl text-slate-600 max-w-2xl mx-auto font-sans leading-relaxed">
          AI-powered internship credibility analysis. Distinguish genuine industry opportunities from paid certificates, tutoring programs, and high-risk operations.
        </p>
        
        <div className="flex flex-col sm:flex-row gap-4 items-center justify-center pt-4">
          <button
            onClick={() => onNavigate('analyze')}
            id="hero-btn-analyze"
            className="w-full sm:w-auto px-8 py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-xl shadow-lg shadow-indigo-100/50 transition-all flex items-center justify-center gap-2"
          >
            Analyze Internship
            <ArrowRight className="w-4 h-4 text-indigo-200" />
          </button>
          <button
            onClick={() => onNavigate('reviews')}
            id="hero-btn-reviews"
            className="w-full sm:w-auto px-8 py-3.5 bg-white hover:bg-slate-50 border border-slate-200 text-slate-800 font-medium rounded-xl transition-all flex items-center justify-center gap-2"
          >
            Explore Reviews
            <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
          </button>
        </div>
      </section>

      {/* Live Statistics */}
      <section className="grid grid-cols-1 sm:grid-cols-3 gap-6 max-w-5xl mx-auto px-4">
        {[
          { label: 'Internships Analyzed', value: totalAnalyzed, icon: Briefcase, color: 'text-indigo-600 bg-indigo-50' },
          { label: 'Community Reviews', value: totalReviewsCount, icon: Star, color: 'text-amber-600 bg-amber-50' },
          { label: 'Verified Companies', value: verifiedCompaniesCount, icon: CheckCircle, color: 'text-emerald-600 bg-emerald-50' },
        ].map((stat, i) => (
          <div key={i} className="bg-white border border-slate-200 p-6 rounded-2xl flex items-center gap-5 transition-shadow hover:shadow-sm">
            <div className={`p-4 rounded-xl ${stat.color}`}>
              <stat.icon className="w-6 h-6" />
            </div>
            <div>
              <div className="font-mono text-3xl font-bold text-slate-900">{stat.value}</div>
              <div className="text-slate-500 text-sm font-medium">{stat.label}</div>
            </div>
          </div>
        ))}
      </section>

      {/* Features Grid */}
      <section className="max-w-5xl mx-auto px-4 space-y-8">
        <div className="text-center space-y-2">
          <h2 className="text-3xl font-display font-medium text-slate-900">Comprehensive Risk Evaluation</h2>
          <p className="text-slate-500 max-w-xl mx-auto">We analyze internship structures meticulously to filter out bad offers.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
          <div className="bg-white border border-slate-200 rounded-2xl p-6 space-y-4 hover:shadow-sm transition-shadow">
            <div className="w-10 h-10 rounded-lg bg-indigo-50 flex items-center justify-center font-bold text-indigo-700">01</div>
            <h3 className="text-xl font-medium text-slate-900">Company Verification</h3>
            <p className="text-slate-600 text-sm leading-relaxed">
              We investigate real company records, domains, LinkedIn employee clusters, and legal registration logs to confirm the operating entity is not a shell organization.
            </p>
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl p-6 space-y-4 hover:shadow-sm transition-shadow">
            <div className="w-10 h-10 rounded-lg bg-indigo-50 flex items-center justify-center font-bold text-indigo-700">02</div>
            <h3 className="text-xl font-medium text-slate-900">Mentor Quality Analytics</h3>
            <p className="text-slate-600 text-sm leading-relaxed">
              Checks assigned developer supervisors, their genuine industry tenure, and ex-employer records to guarantee individual engineering leadership instead of support bot automation.
            </p>
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl p-6 space-y-4 hover:shadow-sm transition-shadow">
            <div className="w-10 h-10 rounded-lg bg-purple-50 flex items-center justify-center font-bold text-purple-700">03</div>
            <h3 className="text-xl font-medium text-slate-900">Project Quality Appraisal</h3>
            <p className="text-slate-600 text-sm leading-relaxed">
              Evaluates the task scope (e.g. real team codebase contributions vs elementary offline school assignments like drawing static tables) to prevent educational redundancies.
            </p>
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl p-6 space-y-4 hover:shadow-sm transition-shadow">
            <div className="w-10 h-10 rounded-lg bg-emerald-50 flex items-center justify-center font-bold text-emerald-700">04</div>
            <h3 className="text-xl font-medium text-slate-900">Community Audits</h3>
            <p className="text-slate-600 text-sm leading-relaxed">
              Direct, unmoderated feedback ledger compiled from real student peers detailing mentorship availability, cert pricing structures, and actual stipend fulfillment rates.
            </p>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="bg-slate-950 text-white rounded-3xl p-8 sm:p-12 max-w-5xl mx-auto mx-4 space-y-10 border border-slate-800">
        <div className="text-center space-y-2">
          <h2 className="text-3xl font-display font-medium">How InternShield Protects You</h2>
          <p className="text-slate-400 max-w-md mx-auto">Get verified in four easy steps before making choices.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 pt-4">
          {[
            { step: '1', title: 'Submit Context', desc: 'Paste the posting URL, or upload the offer poster / PDF directly.' },
            { step: '2', title: 'AI Extraction', desc: 'Our advanced multimodal OCR model parses fees, mentors, and program scope.' },
            { step: '3', title: 'Verify Details', desc: 'The engine scores company trust, mentor backgrounds, and project utility.' },
            { step: '4', title: 'Collect Report', desc: 'Download a clean credibility report or compare with peer reviews.' }
          ].map((item, index) => (
            <div key={index} className="space-y-3 relative">
              <div className="w-12 h-12 bg-indigo-500/10 text-indigo-400 border border-indigo-400/20 font-mono text-lg font-bold flex items-center justify-center rounded-xl">
                {item.step}
              </div>
              <h3 className="font-semibold text-lg text-slate-200">{item.title}</h3>
              <p className="text-slate-400 text-xs leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
