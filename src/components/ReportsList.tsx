import React, { useState } from 'react';
import { 
  Briefcase, Search, Filter, ShieldAlert, BadgeCheck, Download, Printer, 
  ChevronRight, Calendar, AlertCircle, TrendingUp, BarChart as BarChartIcon,
  ArrowRight
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { InternshipAnalysis } from '../types.js';

interface ReportsListProps {
  analyses: InternshipAnalysis[];
  onNavigate?: (tab: string) => void;
}

export default function ReportsList({ analyses, onNavigate }: ReportsListProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [riskFilter, setRiskFilter] = useState<string>('All');
  const [categoryFilter, setCategoryFilter] = useState<string>('All');
  const [selectedReportId, setSelectedReportId] = useState<string | null>(
    analyses.length > 0 ? analyses[0].id : null
  );

  // Empty state handling
  if (analyses.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center max-w-xl mx-auto space-y-6 bg-white border border-slate-200 rounded-3xl shadow-sm mt-8 animate-fade-in">
        <div className="w-16 h-16 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-600 mb-2">
          <Briefcase className="w-8 h-8" />
        </div>
        <div className="space-y-2">
          <h3 className="text-xl font-display font-semibold text-slate-900">No internship audits yet.</h3>
          <p className="text-sm text-slate-500 leading-relaxed font-sans">
            Analyze an internship to generate your first audit report.
          </p>
        </div>
        {onNavigate && (
          <button
            onClick={() => onNavigate('analyze')}
            className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-xl flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
          >
            <span>Analyze Internship</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
    );
  }

  // Filter computation
  const filteredReports = analyses.filter(report => {
    const matchesSearch = 
      report.companyName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      report.position.toLowerCase().includes(searchTerm.toLowerCase()) ||
      report.description.toLowerCase().includes(searchTerm.toLowerCase());
      
    const matchesRisk = riskFilter === 'All' || report.riskLevel === riskFilter;
    const matchesCategory = categoryFilter === 'All' || report.internshipCategory === categoryFilter;

    return matchesSearch && matchesRisk && matchesCategory;
  });

  const selectedReport = analyses.find(r => r.id === selectedReportId) || filteredReports[0];

  // Distribution chart computation
  const categoriesList = [
    'Genuine Industry Internship', 
    'Training-Oriented Program', 
    'Certificate-Oriented Program', 
    'High-Risk Opportunity'
  ];
  
  const chartData = categoriesList.map(cat => {
    const count = analyses.filter(a => a.internshipCategory === cat).length;
    let shortName = cat.split(' ')[0];
    if (shortName === 'Genuine') shortName = 'Real Industry';
    if (shortName === 'Training-Oriented') shortName = 'Training';
    if (shortName === 'Certificate-Oriented') shortName = 'Certificate';
    if (shortName === 'High-Risk') shortName = 'High Risk';
    
    return {
      name: shortName,
      fullCategoryName: cat,
      count: count,
      fill: cat.startsWith('Genuine') ? '#10b981' : cat.startsWith('Training') ? '#6366f1' : cat.startsWith('Certificate') ? '#f59e0b' : '#ef4444'
    };
  });

  const getRiskColor = (risk: string) => {
    switch (risk.toLowerCase()) {
      case 'low': return 'text-emerald-700 bg-emerald-50 border-emerald-100';
      case 'medium': return 'text-amber-700 bg-amber-50 border-amber-100';
      case 'high': return 'text-red-700 bg-red-50 border-red-100';
      case 'critical': return 'text-rose-850 bg-rose-50 border-rose-100';
      default: return 'text-slate-700 bg-slate-50 border-slate-100';
    }
  };

  const handleDownloadMD = (report: InternshipAnalysis) => {
    const blob = new Blob([report.reportMarkdown], { type: 'text/markdown;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `InternShield_Report_${report.companyName.replace(/\s+/g, '_')}.md`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-8 animate-fade-in py-2">
      
      {/* Search and charts banner */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start no-print">
        {/* Statistics and Graph panel */}
        <div className="bg-white border border-slate-100 p-6 rounded-2xl lg:col-span-1 space-y-4 shadow-sm">
          <div className="flex items-center gap-2 text-slate-800 font-semibold border-b border-slate-100 pb-2.5">
            <BarChartIcon className="w-4 h-4 text-indigo-600" />
            Audit Category Distribution
          </div>
          
          <div style={{ width: '100%', height: 140 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                <XAxis dataKey="name" stroke="#94a3b8" fontSize={9} tickLine={false} />
                <YAxis stroke="#94a3b8" fontSize={9} allowDecimals={false} />
                <Tooltip 
                  cursor={{ fill: 'transparent' }}
                  contentStyle={{ background: '#0f172a', border: 'none', borderRadius: '8px', color: '#fff', fontSize: '10px' }}
                />
                <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Filters and search card */}
        <div className="bg-white border border-slate-100 p-6 rounded-2xl lg:col-span-2 space-y-4 shadow-sm">
          <div className="flex flex-col sm:flex-row gap-4 items-center">
            {/* Search Input */}
            <div className="relative w-full">
              <Search className="absolute left-3 top-3.5 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search audited companies, jobs, or descriptions..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-slate-200 bg-slate-50/50 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 text-sm focus:border-indigo-500"
              />
            </div>
            
            {/* Reset Filter Button */}
            {(searchTerm || riskFilter !== 'All' || categoryFilter !== 'All') && (
              <button
                onClick={() => {
                  setSearchTerm('');
                  setRiskFilter('All');
                  setCategoryFilter('All');
                }}
                className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 bg-indigo-50 hover:bg-indigo-100/70 border border-indigo-100 px-3.5 py-2.5 rounded-lg shrink-0 transition-all cursor-pointer"
              >
                Clear Filters
              </button>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-4 text-sm font-medium">
            {/* Risk filter */}
            <div className="flex items-center gap-2 bg-slate-50 border border-slate-100 px-3 py-1.5 rounded-xl text-slate-600 text-xs font-semibold">
              <Filter className="w-3.5 h-3.5" />
              <span>Risk:</span>
              <select
                value={riskFilter}
                onChange={e => setRiskFilter(e.target.value)}
                className="bg-transparent border-none rounded focus:ring-0 focus:outline-none font-sans text-xs"
              >
                <option value="All">All Exposure</option>
                <option value="Low">Low Risk</option>
                <option value="Medium">Medium Risk</option>
                <option value="High">High Risk</option>
                <option value="Critical">Critical Risk</option>
              </select>
            </div>

            {/* Category filter */}
            <div className="flex items-center gap-2 bg-slate-50 border border-slate-100 px-3 py-1.5 rounded-xl text-slate-600 text-xs font-semibold">
              <Briefcase className="w-3.5 h-3.5" />
              <span>Type:</span>
              <select
                value={categoryFilter}
                onChange={e => setCategoryFilter(e.target.value)}
                className="bg-transparent border-none rounded focus:ring-0 focus:outline-none font-sans text-xs max-w-[150px] overflow-ellipsis"
              >
                <option value="All">All Categories</option>
                {categoriesList.map((cat, idx) => (
                  <option key={idx} value={cat}>{cat}</option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Double Column Panel */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
        
        {/* Master: Lists column */}
        <div className="grid grid-cols-1 gap-4 md:col-span-5 no-print max-h-[70vh] overflow-y-auto pr-1">
          {filteredReports.length > 0 ? (
            filteredReports.map(report => {
              const isActive = selectedReport?.id === report.id;
              return (
                <div
                  key={report.id}
                  id={`list-item-${report.id}`}
                  onClick={() => setSelectedReportId(report.id)}
                  className={`border p-4 rounded-2xl cursor-pointer transition-all hover:translate-x-1 ${
                    isActive 
                      ? 'border-indigo-500 bg-indigo-50/10 shadow-sm' 
                      : 'border-slate-100 bg-white hover:border-slate-200'
                  }`}
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className={`px-2.5 py-0.5 rounded-md text-[9px] font-bold border ${getRiskColor(report.riskLevel)}`}>
                        {report.riskLevel} Risk
                      </span>
                      <span className="text-[10px] text-slate-400 font-mono flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {new Date(report.createdAt).toLocaleDateString()}
                      </span>
                    </div>

                    <div>
                      <h4 className="font-semibold text-slate-800 text-sm leading-tight">{report.companyName}</h4>
                      <p className="text-xs text-slate-500 mt-0.5 font-medium">{report.position}</p>
                    </div>

                    <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-100/50">
                      <div className="flex items-center gap-1">
                        <span className="font-mono font-bold text-slate-700">{report.overallCredibilityScore}</span>
                        <span className="text-[9px] text-slate-400 font-semibold uppercase tracking-wider">Audit Score</span>
                      </div>
                      <ChevronRight className={`w-3.5 h-3.5 transition-transform ${isActive ? 'translate-x-1 text-indigo-600' : 'text-slate-400'}`} />
                    </div>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="bg-slate-50 border border-slate-100 rounded-2xl p-8 text-center space-y-2">
              <AlertCircle className="w-7 h-7 text-slate-400 mx-auto" />
              <div className="text-sm font-semibold text-slate-700">No Audits Found</div>
              <p className="text-xs text-slate-400">Try clear your parameters or start a new analysis.</p>
            </div>
          )}
        </div>

        {/* Detail: Inspector column */}
        <div className="md:col-span-7 bg-white border border-slate-100 rounded-3xl p-6 sm:p-8 space-y-6 shadow-sm min-h-[400px]">
          {selectedReport ? (
            <div className="space-y-6">
              <div className="border-b border-slate-100 pb-5 space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <span className={`px-3 py-1 rounded-md text-xs font-semibold border ${getRiskColor(selectedReport.riskLevel)}`}>
                    {selectedReport.riskLevel} Risk Verified
                  </span>
                  
                  <div className="flex gap-2 no-print">
                    <button
                      onClick={() => handleDownloadMD(selectedReport)}
                      className="p-1 px-2 border border-slate-200 text-slate-600 hover:text-slate-900 rounded-lg bg-slate-50 text-xs font-semibold flex items-center gap-1 transition-all"
                    >
                      <Download className="w-3.5 h-3.5" /> Download MD
                    </button>
                    <button
                      onClick={() => window.print()}
                      className="p-1 px-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1 transition-all"
                    >
                      <Printer className="w-3.5 h-3.5" /> Print Audit
                    </button>
                  </div>
                </div>

                <div>
                  <h3 className="text-2xl font-display font-medium text-slate-900 leading-tight">
                    {selectedReport.companyName}
                  </h3>
                  <p className="text-sm text-indigo-700 font-semibold font-sans mt-1">
                    {selectedReport.position} · {selectedReport.duration}
                  </p>
                </div>
              </div>

              {/* Rule 3 Hybrid Decisive Rating Score UI panel */}
              <div className="bg-gradient-to-r from-slate-900 to-slate-950 text-white rounded-2xl p-5 border border-white/10 grid grid-cols-3 gap-4 text-center">
                <div className="space-y-1">
                  <span className="text-[10px] text-indigo-300 uppercase font-mono tracking-widest block font-bold">AI Audit</span>
                  <div className="text-2xl font-bold font-mono text-indigo-100">{selectedReport.overallCredibilityScore || 0}%</div>
                </div>
                <div className="space-y-1 border-x border-white/10">
                  <span className="text-[10px] text-indigo-300 uppercase font-mono tracking-widest block font-bold">Community</span>
                  <div className="text-2xl font-bold font-mono text-emerald-450">{selectedReport.community_score !== undefined ? `${selectedReport.community_score}%` : 'N/A'}</div>
                </div>
                <div className="space-y-1">
                  <span className="text-[10px] text-emerald-305 uppercase font-mono tracking-widest block font-bold">Decisive</span>
                  <div className="text-2xl font-extrabold font-mono text-indigo-400">{selectedReport.final_score || selectedReport.overallCredibilityScore || 0}%</div>
                </div>
              </div>

              {/* Score grid details */}
              <div className="grid grid-cols-2 gap-4">
                {[
                  { title: 'Company Trust Rating', value: selectedReport.companyTrustScore },
                  { title: 'Mentor Competency', value: selectedReport.mentorVerificationScore },
                  { title: 'Project Validity', value: selectedReport.projectQualityScore },
                  { title: 'Fee Transparency', value: selectedReport.feeTransparencyScore },
                ].map((item, id) => (
                  <div key={id} className="border border-slate-100 rounded-xl p-3 bg-slate-50/30">
                    <div className="text-[10px] uppercase font-mono tracking-widest text-slate-400 font-bold">{item.title}</div>
                    <div className="flex items-center gap-2 mt-1">
                      <div className="font-mono text-lg font-bold text-slate-800">{item.value}%</div>
                      <div className="w-full bg-slate-100 h-1 rounded-full overflow-hidden">
                        <div 
                          className="bg-indigo-600 h-1 transition-all" 
                          style={{ width: `${item.value}%` }}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Categorization & Recommendation */}
              <div className="space-y-4">
                <div>
                  <h4 className="text-xs uppercase tracking-widest font-mono text-slate-400 font-bold border-b border-slate-100 pb-1.5 mb-2">Category Assessment</h4>
                  <div className="text-sm font-semibold text-slate-800 flex items-center gap-1.5">
                    <BadgeCheck className="w-4 h-4 text-emerald-500" />
                    {selectedReport.internshipCategory}
                  </div>
                  <p className="text-xs text-slate-600 mt-1">{selectedReport.riskLevelReasoning}</p>
                </div>

                <div>
                  <h4 className="text-xs uppercase tracking-widest font-mono text-slate-400 font-bold border-b border-slate-100 pb-1.5 mb-2">Technical Learnings & Works Critique</h4>
                  <p className="text-xs text-slate-600 leading-relaxed font-sans">{selectedReport.educationalValueExplanation}</p>
                </div>

                <div>
                  <h4 className="text-xs uppercase tracking-widest font-mono text-slate-400 font-bold border-b border-slate-100 pb-1.5 mb-2">AI Agent Recommendation</h4>
                  <p className="text-xs text-slate-600 leading-relaxed bg-indigo-50/10 p-3 rounded-xl border border-indigo-100">{selectedReport.aiRecommendation}</p>
                </div>
              </div>

              {/* Printable raw report preview block (Only visible for prints recursively) */}
              <div className="hidden print-only print:block border-t pt-8">
                <div className="font-mono text-xs whitespace-pre-wrap leading-relaxed select-all">
                  {selectedReport.reportMarkdown}
                </div>
              </div>

            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-center space-y-3 py-16">
              <AlertCircle className="w-10 h-10 text-slate-300" />
              <div className="text-slate-550 font-semibold">Select an Audit Entry</div>
              <p className="text-xs text-slate-400 max-w-xs">Select any completed certificate or job analysis on the left grid directory to inspect detailed risk breakdowns.</p>
            </div>
          )}
        </div>

      </div>

    </div>
  );
}
