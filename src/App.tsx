import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, Home as HomeIcon, Sparkles, FolderKanban, 
  Users, Mail, Heart, Github, Star 
} from 'lucide-react';

import Home from './components/Home.tsx';
import Analyze from './components/Analyze.tsx';
import ReportsList from './components/ReportsList.tsx';
import Reviews from './components/Reviews.tsx';
import { InternshipAnalysis, CommunityReview } from './types.js';

export default function App() {
  const [activeTab, setActiveTab] = useState<string>('home');
  const [analysesList, setAnalysesList] = useState<InternshipAnalysis[]>([]);
  const [reviewsList, setReviewsList] = useState<CommunityReview[]>([]);
  const [dbLoading, setDbLoading] = useState(true);

  // Fetch verified analyses and community reviews on load
  useEffect(() => {
    async function loadData() {
      try {
        const [reportsRes, reviewsRes] = await Promise.all([
          fetch('/api/reports'),
          fetch('/api/reviews')
        ]);
        
        if (reportsRes.ok && reviewsRes.ok) {
          const reports = await reportsRes.json();
          const reviews = await reviewsRes.json();
          setAnalysesList(reports);
          setReviewsList(reviews);
        }
      } catch (err) {
        console.error("Failed to load initial sandbox metrics database:", err);
      } finally {
        setDbLoading(false);
      }
    }
    loadData();
  }, []);

  return (
    <div className="min-h-screen flex flex-col bg-slate-50/50">
      
      {/* Header element with printing optimizations */}
      <header className="sticky top-0 bg-white/85 backdrop-blur-md border-b border-slate-150 z-30 no-print">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          
          {/* Logo Brand Icon */}
          <div 
            onClick={() => setActiveTab('home')}
            className="flex items-center gap-2 cursor-pointer group"
          >
            <div className="p-1.5 bg-indigo-600 rounded-lg group-hover:bg-indigo-700 transition-colors flex items-center justify-center">
              <ShieldCheck className="w-5 h-5 text-white" />
            </div>
            <span className="font-display font-medium text-lg text-slate-950 tracking-tight">
              Intern<span className="text-indigo-600 font-bold">Shield</span>
            </span>
          </div>

          {/* Core navigation links */}
          <nav className="hidden md:flex items-center gap-1.5 font-sans">
            {[
              { id: 'home', label: 'Home', icon: HomeIcon },
              { id: 'analyze', label: 'Analyze Offer', icon: Sparkles },
              { id: 'reports', label: 'Audit Ledger', icon: FolderKanban },
              { id: 'reviews', label: 'Student Reviews', icon: Users },
            ].map(tab => (
              <button
                key={tab.id}
                id={`nav-link-${tab.id}`}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-xl font-semibold text-xs transition-colors shrink-0 ${
                  activeTab === tab.id 
                    ? 'bg-indigo-50 text-indigo-600 border border-indigo-100 shadow-sm' 
                    : 'text-slate-550 border border-transparent hover:bg-slate-100 hover:text-slate-850'
                }`}
              >
                <tab.icon className="w-3.5 h-3.5" />
                {tab.label}
              </button>
            ))}
          </nav>

          {/* User badge / Session metrics */}
          <div className="flex items-center gap-3">
            <div className="hidden sm:flex flex-col text-right">
              <span className="text-[10px] text-slate-400 font-mono">SANDBOX SESSION</span>
              <span className="text-xs font-semibold text-slate-700">sanikakalyani10@gmail.com</span>
            </div>
            
            {/* Small hamburger fallback indicators on mobile */}
            <div className="md:hidden flex items-center pr-1 select-none">
              <span className="text-[10px] font-mono bg-indigo-50 text-indigo-700 border border-indigo-100 px-2.5 py-1 rounded-full font-bold">
                PLATFORM
              </span>
            </div>
          </div>

        </div>

        {/* Mobile Sub-Navigation slidebar */}
        <div className="md:hidden border-t border-slate-100 bg-white px-2 py-1.5 flex gap-1 overflow-x-auto select-none scrollbar-hide">
          {[
            { id: 'home', label: 'Home', icon: HomeIcon },
            { id: 'analyze', label: 'Analyze', icon: Sparkles },
            { id: 'reports', label: 'Audits', icon: FolderKanban },
            { id: 'reviews', label: 'Reviews', icon: Users },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-1 px-3 py-1.5 rounded-lg font-semibold text-[10px] shrink-0 transition-colors ${
                activeTab === tab.id 
                  ? 'bg-indigo-50 text-indigo-700 border border-indigo-100' 
                  : 'text-slate-500 hover:bg-slate-50'
              }`}
            >
              <tab.icon className="w-3.5 h-3.5" />
              {tab.label}
            </button>
          ))}
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-grow max-w-6xl mx-auto w-full px-4 py-8">
        {dbLoading ? (
          <div className="min-h-[50vh] flex flex-col items-center justify-center space-y-3">
            <div className="w-8 h-8 rounded-full border-4 border-slate-200 border-t-indigo-600 animate-spin" />
            <div className="text-xs font-mono text-slate-500">Retrieving Database Records...</div>
          </div>
        ) : (
          <>
            {activeTab === 'home' && (
              <Home 
                onNavigate={setActiveTab} 
                analyses={analysesList} 
                reviews={reviewsList} 
              />
            )}
            
            {activeTab === 'analyze' && (
              <Analyze 
                onAnalyzeSuccess={(newAudit) => {
                  setAnalysesList(prev => [newAudit, ...prev]);
                }} 
              />
            )}

            {activeTab === 'reports' && (
              <ReportsList analyses={analysesList} onNavigate={setActiveTab} />
            )}

            {activeTab === 'reviews' && (
              <Reviews 
                reviews={reviewsList} 
                analyses={analysesList}
                onReviewSubmitted={(newReview) => {
                  setReviewsList(prev => {
                    // Check if exists (could be adding or finishing edit)
                    const index = prev.findIndex(r => r.id === newReview.id);
                    if (index !== -1) {
                      return prev.map(r => r.id === newReview.id ? newReview : r);
                    }
                    return [newReview, ...prev];
                  });
                }} 
                onReviewUpdated={(updatedReview) => {
                  setReviewsList(prev => prev.map(r => r.id === updatedReview.id ? updatedReview : r));
                }}
                onReviewDeleted={(deletedId) => {
                  setReviewsList(prev => prev.filter(r => r.id !== deletedId));
                }}
              />
            )}
          </>
        )}
      </main>

      {/* Footer component */}
      <footer className="bg-white border-t border-slate-150 py-8 no-print">
        <div className="max-w-6xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="font-display font-medium text-sm text-slate-800">
              Intern<span className="text-indigo-600 font-bold">Shield</span>
            </span>
            <span className="text-slate-350 shrink-0 text-xs font-mono">|</span>
            <span className="text-[10px] text-slate-400 font-mono font-medium">© 2026 AUDIT COMPLETED LABS</span>
          </div>

          <div className="flex items-center gap-3.5 text-xs text-slate-450 font-semibold font-sans">
            <span className="flex items-center gap-1 text-[11px] text-slate-500 hover:text-slate-800">
              <Mail className="w-3.5 h-3.5" /> Support Services
            </span>
            <span className="text-slate-150 shrink-0 select-none">·</span>
            <span className="text-[11px] text-slate-450 font-semibold text-indigo-600 flex items-center gap-0.5">
              <Star className="w-3 h-3 text-indigo-600 fill-indigo-600 animate-pulse" /> Verified Student Network
            </span>
          </div>
        </div>
      </footer>

    </div>
  );
}
