import React, { useState, useRef } from 'react';
import { 
  Globe, FileImage, FileText, Settings, ShieldAlert, BadgeCheck, AlertTriangle, 
  HelpCircle, Sparkles, Download, Printer, CheckCircle2, ArrowLeft, RefreshCw, Upload, Eye
} from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
import { InternshipAnalysis } from '../types.js';

interface AnalyzeProps {
  onAnalyzeSuccess: (newAnalysis: InternshipAnalysis) => void;
}

type InputTab = 'url' | 'poster' | 'pdf' | 'manual';

export default function Analyze({ onAnalyzeSuccess }: AnalyzeProps) {
  const [activeTab, setActiveTab] = useState<InputTab>('url');
  
  // Input fields state
  const [urlInput, setUrlInput] = useState('');
  const [companyWebsiteUrl, setCompanyWebsiteUrl] = useState('');
  const [companyLinkedinUrl, setCompanyLinkedinUrl] = useState('');
  
  // File upload state (Poster/PDF)
  const [uploadedBase64, setUploadedBase64] = useState<string | null>(null);
  const [uploadedMime, setUploadedMime] = useState<string | null>(null);
  const [uploadedFileName, setUploadedFileName] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);
  
  // Manual Form state
  const [manualForm, setManualForm] = useState({
    companyName: '',
    position: '',
    duration: '',
    fees: 'No fees',
    mentorDetails: '',
    description: ''
  });

  // Processing state
  const [isProcessing, setIsProcessing] = useState(false);
  const [pipelineStep, setPipelineStep] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Result state
  const [analysisResult, setAnalysisResult] = useState<InternshipAnalysis | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Handle Drag Events for File Upload
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  // Convert files to base64
  const processSelectedFile = (file: File) => {
    if (!file) return;

    // Validate size (limit to 10MB just to prevent browser hangs)
    if (file.size > 10 * 1024 * 1024) {
      setErrorMessage("File exceeds 10MB limit. Please provide a lighter image or document.");
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setUploadedBase64(reader.result as string);
      setUploadedMime(file.type);
      setUploadedFileName(file.name);
      setErrorMessage(null);
    };
    reader.readAsDataURL(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processSelectedFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processSelectedFile(e.target.files[0]);
    }
  };

  // Run AI analysis pipeline
  const handleStartAnalysis = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsProcessing(true);
    setErrorMessage(null);
    setAnalysisResult(null);

    try {
      // 1. Initial validation
      if (activeTab === 'url' && !urlInput.trim()) {
        throw new Error("Please specify an internship URL to analyze.");
      }
      if ((activeTab === 'poster' || activeTab === 'pdf') && !uploadedBase64) {
        throw new Error("Please upload a file before pressing analyze.");
      }
      if (activeTab === 'manual' && (!manualForm.companyName.trim() || !manualForm.position.trim())) {
        throw new Error("Please fill in the Company Name and Position fields.");
      }

      // Step 2. Trigger pipeline updates
      setPipelineStep("Initializing Credibility Pipeline...");
      await new Promise(r => setTimeout(r, 600));

      if (activeTab === 'poster' || activeTab === 'pdf') {
        setPipelineStep("Triggering Multimodal OCR Extraction...");
        await new Promise(r => setTimeout(r, 700));
      } else {
        setPipelineStep("Processing Information Payload...");
        await new Promise(r => setTimeout(r, 500));
      }

      setPipelineStep("Verifying Company Domain & Web Footprint...");
      await new Promise(r => setTimeout(r, 600));

      setPipelineStep("Querying AI Mentor & Engineering Credentials...");
      await new Promise(r => setTimeout(r, 600));

      setPipelineStep("Compiling Credibility Ledger with Gemini...");

      // Submit API request
      const payload: any = {};
      if (activeTab === 'url') {
        payload.url = urlInput;
        payload.companyWebsiteUrl = companyWebsiteUrl;
        payload.companyLinkedinUrl = companyLinkedinUrl;
      } else if (activeTab === 'poster' || activeTab === 'pdf') {
        payload.fileBase64 = uploadedBase64;
        payload.fileMime = uploadedMime;
        payload.url = `Uploaded file: ${uploadedFileName}`;
      } else {
        payload.manualData = manualForm;
      }

      const res = await fetch('/api/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        throw new Error(`API returned failure state: ${res.statusText}`);
      }

      const result: InternshipAnalysis = await res.json();
      setAnalysisResult(result);
      onAnalyzeSuccess(result);

    } catch (err: any) {
      console.error(err);
      setErrorMessage(err.message || 'Verification pipeline failed. Check your API connectivity or configuration.');
    } finally {
      setIsProcessing(false);
      setPipelineStep('');
    }
  };

  // Recharts parameters for circular credibility visualizer
  const getCredibilityColor = (score: number) => {
    if (score >= 80) return '#10b981'; // Emerald
    if (score >= 55) return '#f59e0b'; // Amber
    return '#ef4444'; // Red
  };

  const getRiskColorClass = (risk: string) => {
    const r = (risk || '').toLowerCase();
    if (r.includes('low')) return 'text-emerald-700 bg-emerald-50 border-emerald-100';
    if (r.includes('medium')) return 'text-amber-700 bg-amber-50 border-amber-100';
    if (r.includes('high')) return 'text-red-700 bg-red-50 border-red-100';
    if (r.includes('critical')) return 'text-rose-800 bg-rose-50 border-rose-100';
    return 'text-slate-700 bg-slate-50 border-slate-100';
  };

  // Download analytical report as a standard raw Markdown document
  const downloadReportMarkdown = () => {
    if (!analysisResult) return;
    const blob = new Blob([analysisResult.reportMarkdown], { type: 'text/markdown;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `InternShield_Audit_${analysisResult.companyName.replace(/\s+/g, '_')}.md`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Print system handles downloading to physical / PDF formatted page natively
  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-fade-in py-2">
      
      {/* Title */}
      <div className="text-center space-y-2 no-print">
        <h1 className="text-3xl sm:text-4xl font-display font-medium text-slate-900">
          Verify Internship Opportunity
        </h1>
        <p className="text-slate-500 text-sm max-w-xl mx-auto">
          Submit details via posting URL, image poster, PDF documents, or manually to check risk scores and claim credibility statements.
        </p>
      </div>

      {!analysisResult ? (
        <div className="bg-white border border-slate-100 rounded-2xl shadow-sm p-6 sm:p-8 no-print">
          {/* Intake selection tabs */}
          <div className="flex border-b border-slate-100 gap-2 mb-6">
            {[
              { id: 'url', label: 'URL Address', icon: Globe },
              { id: 'poster', label: 'Poster Upload', icon: FileImage },
              { id: 'pdf', label: 'PDF Document', icon: FileText },
              { id: 'manual', label: 'Manual Entry', icon: Settings },
            ].map(tab => (
              <button
                key={tab.id}
                id={`tab-btn-${tab.id}`}
                onClick={() => {
                  setActiveTab(tab.id as InputTab);
                  setErrorMessage(null);
                  setUploadedBase64(null);
                  setUploadedFileName(null);
                }}
                className={`flex items-center gap-2 px-4 py-3 font-medium text-sm border-b-2 transition-all ${
                  activeTab === tab.id 
                    ? 'border-indigo-600 text-indigo-700' 
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                <tab.icon className="w-4 h-4" />
                <span className="hidden sm:inline">{tab.label}</span>
              </button>
            ))}
          </div>

          {/* Error Banner */}
          {errorMessage && (
            <div className="bg-rose-50 border border-rose-100 text-rose-800 rounded-xl p-4 text-sm mb-6 flex items-start gap-2.5">
              <ShieldAlert className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <div>{errorMessage}</div>
            </div>
          )}

          {/* Form Content */}
          <form onSubmit={handleStartAnalysis} className="space-y-6">
            {activeTab === 'url' && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-700">Paste Internship Link</label>
                  <input
                    type="url"
                    placeholder="e.g. https://www.linkedin.com/jobs/view/..."
                    value={urlInput}
                    onChange={e => setUrlInput(e.target.value)}
                    className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 bg-slate-50/50"
                  />
                  <p className="text-xs text-slate-400">Supported portals: LinkedIn, Internshala, Indeed, Naukri, or individual company careers page.</p>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-700">Company Website URL (Optional)</label>
                  <input
                    type="url"
                    placeholder="https://companyname.com"
                    value={companyWebsiteUrl}
                    onChange={e => setCompanyWebsiteUrl(e.target.value)}
                    className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 bg-slate-50/50 text-sm"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-700">Company LinkedIn URL (Optional)</label>
                  <input
                    type="url"
                    placeholder="https://linkedin.com/company/companyname"
                    value={companyLinkedinUrl}
                    onChange={e => setCompanyLinkedinUrl(e.target.value)}
                    className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 bg-slate-50/50 text-sm"
                  />
                </div>
              </div>
            )}

            {(activeTab === 'poster' || activeTab === 'pdf') && (
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700">
                  {activeTab === 'poster' ? 'Select Poster File (PNG, JPG, JPEG)' : 'Select PDF Contract / Proposal (PDF File)'}
                </label>
                
                {/* Drag-and-Drop Area */}
                <div
                  onDragEnter={handleDrag}
                  onDragOver={handleDrag}
                  onDragLeave={handleDrag}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all ${
                    dragActive 
                      ? 'border-indigo-500 bg-indigo-50/50' 
                      : 'border-slate-200 bg-slate-50 hover:bg-slate-50/70 hover:border-slate-300'
                  }`}
                >
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    accept={activeTab === 'poster' ? "image/png, image/jpeg, image/jpg" : "application/pdf"}
                    className="hidden"
                  />
                  
                  <div className="flex flex-col items-center gap-3">
                    <div className="p-4 bg-white shadow-sm border border-slate-100 rounded-xl">
                      <Upload className="w-6 h-6 text-slate-500 animate-pulse" />
                    </div>
                    {uploadedFileName ? (
                      <div className="space-y-1">
                        <p className="text-sm font-medium text-slate-900">{uploadedFileName}</p>
                        <p className="text-xs text-emerald-600 font-semibold flex items-center justify-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5" /> File Selected! Ready for OCR analysis
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-1">
                        <p className="text-sm font-medium text-slate-800">
                          Drag and drop your file here, or <span className="text-indigo-600 hover:underline">browse files</span>
                        </p>
                        <p className="text-xs text-slate-400">
                          {activeTab === 'poster' 
                            ? 'Recommended: PNG, JPG, or JPEG up to 10MB' 
                            : 'Recommended: Completed PDF proposals or description files up to 10MB'}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'manual' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Company Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Apex Software Corp"
                    value={manualForm.companyName}
                    onChange={e => setManualForm({...manualForm, companyName: e.target.value})}
                    className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 bg-slate-50/10"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Job Roll / Position *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Software Engineer Intern"
                    value={manualForm.position}
                    onChange={e => setManualForm({...manualForm, position: e.target.value})}
                    className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 bg-slate-50/10"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Duration</label>
                  <input
                    type="text"
                    placeholder="e.g. 3 Months"
                    value={manualForm.duration}
                    onChange={e => setManualForm({...manualForm, duration: e.target.value})}
                    className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 bg-slate-50/10"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Fees Demanded</label>
                  <input
                    type="text"
                    placeholder="e.g. No fees, or $50 tuition"
                    value={manualForm.fees}
                    onChange={e => setManualForm({...manualForm, fees: e.target.value})}
                    className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 bg-slate-50/10"
                  />
                </div>
                <div className="space-y-1 md:col-span-2">
                  <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Mentor Credentials</label>
                  <input
                    type="text"
                    placeholder="e.g. Dr. Jane Smith (Technical Advisor, 8 years exp at IBM)"
                    value={manualForm.mentorDetails}
                    onChange={e => setManualForm({...manualForm, mentorDetails: e.target.value})}
                    className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 bg-slate-50/10"
                  />
                </div>
                <div className="space-y-1 md:col-span-2">
                  <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Internship Description / Works</label>
                  <textarea
                    rows={4}
                    placeholder="Paste the tasks description, required deliverables, and technical topics here..."
                    value={manualForm.description}
                    onChange={e => setManualForm({...manualForm, description: e.target.value})}
                    className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 bg-slate-50/10"
                  />
                </div>
              </div>
            )}

            {/* Form submit button / progress screen */}
            {isProcessing ? (
              <div className="border border-indigo-100 bg-indigo-50/10 rounded-2xl p-6 flex flex-col items-center justify-center space-y-4">
                <RefreshCw className="w-8 h-8 text-indigo-600 animate-spin" />
                <div className="text-center">
                  <div className="text-sm font-semibold text-slate-800">Processing Audit Pipeline</div>
                  <div className="text-xs font-mono text-indigo-700 mt-1">{pipelineStep}</div>
                </div>
              </div>
            ) : (
              <button
                type="submit"
                id="btn-trigger-ai-audit"
                className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-xl flex items-center justify-center gap-2 cursor-pointer transition-colors shadow-lg shadow-indigo-100"
              >
                <Sparkles className="w-4 h-4 text-indigo-200 fill-indigo-200" />
                Analyze Internship Value
              </button>
            )}
          </form>
        </div>
      ) : (
        /* Rich Audit Results Panel */
        <div className="space-y-8 animate-fade-in">
          
          <div className="flex items-center justify-between no-print">
            <button
              onClick={() => setAnalysisResult(null)}
              className="flex items-center gap-2 text-slate-600 hover:text-slate-900 text-sm font-medium border border-slate-200 px-4 py-2 bg-white rounded-xl hover:bg-slate-50 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" /> Analyze Another Offer
            </button>
            
            <div className="flex gap-2">
              <button
                onClick={downloadReportMarkdown}
                className="flex items-center gap-1.5 text-slate-700 hover:text-slate-900 text-sm font-medium border border-slate-200 px-4 py-2 bg-white rounded-xl hover:bg-slate-50 transition-colors"
              >
                <Download className="w-4 h-4 text-slate-600" />
                <span className="hidden sm:inline">Download MD</span>
              </button>
              <button
                onClick={handlePrint}
                className="flex items-center gap-1.5 text-white bg-indigo-600 hover:bg-indigo-700 text-sm font-medium px-4 py-2 rounded-xl transition-colors shadow-sm shadow-indigo-100"
              >
                <Printer className="w-4 h-4 text-white" />
                <span>Print Report</span>
              </button>
            </div>
          </div>

          {/* Primary result overview card */}
          <div className="bg-white border border-slate-100 rounded-3xl shadow-sm p-6 sm:p-8 space-y-8">
            <div className="border-b border-rose-50 pb-6 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
              <div className="space-y-2">
                <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${getRiskColorClass(analysisResult.riskLevel)}`}>
                  {analysisResult.riskLevel} Risk Ledger
                </span>
                <h2 className="text-2xl sm:text-3xl font-display font-semibold text-slate-900">{analysisResult.companyName}</h2>
                <p className="text-slate-500 font-medium text-sm flex items-center gap-1.5">
                  <BadgeCheck className="w-4 h-4 text-indigo-600" />
                  {analysisResult.position} · {analysisResult.duration}
                </p>
              </div>

              {/* Piechart Speedometer Indicator */}
              <div className="flex items-center gap-4 border-l border-slate-100 pl-4 md:pl-8">
                <div style={{ width: 100, height: 100, position: 'relative' }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={[
                          { value: analysisResult.overallCredibilityScore },
                          { value: 100 - analysisResult.overallCredibilityScore }
                        ]}
                        cx="50%"
                        cy="50%"
                        innerRadius={30}
                        outerRadius={45}
                        startAngle={180}
                        endAngle={0}
                        paddingAngle={0}
                        dataKey="value"
                      >
                        <Cell fill={getCredibilityColor(analysisResult.overallCredibilityScore)} />
                        <Cell fill="#f1f5f9" />
                      </Pie>
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="absolute inset-0 flex flex-col items-center justify-center pt-3">
                    <span className="text-2xl font-mono font-bold text-slate-800">{analysisResult.overallCredibilityScore}</span>
                    <span className="text-[9px] text-slate-400 font-semibold uppercase tracking-wider">Credibility</span>
                  </div>
                </div>
                <div className="space-y-1">
                  <div className="text-xs font-bold text-slate-400 uppercase tracking-widest font-mono">Category Verdict</div>
                  <div className="font-semibold text-slate-800 text-sm max-w-[200px] leading-tight">
                    {analysisResult.internshipCategory}
                  </div>
                </div>
              </div>
            </div>

            {/* Sub-metrics scorecard bento grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
              {[
                { label: 'Company Trust', value: analysisResult.companyTrustScore, text: analysisResult.companyTrustReasoning, icon: BadgeCheck, color: 'text-indigo-600 border-indigo-100 bg-indigo-50/20' },
                { label: 'Mentor Legitimacy', value: analysisResult.mentorVerificationScore, text: analysisResult.mentorVerificationReasoning, icon: HelpCircle, color: 'text-indigo-650 border-indigo-100 bg-indigo-50/20' },
                { label: 'Project Quality', value: analysisResult.projectQualityScore, text: analysisResult.projectQualityReasoning, icon: Sparkles, color: 'text-purple-600 border-purple-100 bg-purple-50/20' },
                { label: 'Experience Quality', value: analysisResult.experienceQualityScore || 0, text: analysisResult.experienceQualityReasoning || 'N/A', icon: CheckCircle2, color: 'text-pink-600 border-pink-100 bg-pink-50/20' },
                { label: 'Fee Transparency', value: analysisResult.feeTransparencyScore, text: analysisResult.feeTransparencyReasoning, icon: ShieldAlert, color: 'text-emerald-600 border-emerald-100 bg-emerald-50/20' },
              ].map((metric, i) => (
                <div key={i} className="border border-slate-100 rounded-2xl p-5 space-y-3 flex flex-col justify-between">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{metric.label}</span>
                    <span className={`px-2 py-0.5 rounded-md font-mono text-xs font-bold border ${metric.color}`}>
                      {metric.value}%
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed font-sans line-clamp-4">{metric.text}</p>
                </div>
              ))}
            </div>

            {/* Risk Explanation block */}
            <div className="bg-slate-50 border border-slate-100 rounded-2xl p-5 space-y-2">
              <div className="flex items-center gap-1.5 text-sm font-semibold text-slate-800">
                <AlertTriangle className="w-4 h-4 text-slate-600" />
                Risk Exposure Explanation
              </div>
              <p className="text-xs text-slate-600 whitespace-pre-wrap leading-relaxed">{analysisResult.riskLevelReasoning}</p>
            </div>

            {/* Strengths vs Flags Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Key Strengths */}
              <div className="border border-emerald-100 bg-emerald-50/10 rounded-2xl p-5 space-y-4">
                <h3 className="text-md font-semibold text-emerald-850 flex items-center gap-1.5 border-b border-emerald-100/50 pb-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" /> Authentic Strengths
                </h3>
                {analysisResult.keyStrengths.length > 0 ? (
                  <ul className="space-y-2 text-xs text-slate-600 leading-relaxed">
                    {analysisResult.keyStrengths.map((str, index) => (
                      <li key={index} className="flex items-start gap-1.5">
                        <span className="text-emerald-500 font-semibold mt-0.5">✓</span>
                        {str}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <div className="text-xs text-slate-400">No substantial authentic indicators extracted.</div>
                )}
              </div>

              {/* Red Flags warnings */}
              <div className="border border-rose-100 bg-rose-50/10 rounded-2xl p-5 space-y-4">
                <h3 className="text-md font-semibold text-rose-850 flex items-center gap-1.5 border-b border-rose-100/50 pb-2">
                  <ShieldAlert className="w-4 h-4 text-rose-600" /> Critical Warnings & Red Flags
                </h3>
                {analysisResult.redFlags.length > 0 ? (
                  <ul className="space-y-2 text-xs text-slate-600 leading-relaxed">
                    {analysisResult.redFlags.map((flag, index) => (
                      <li key={index} className="flex items-start gap-1.5">
                        <span className="text-rose-500 font-semibold mt-0.5">⚠️</span>
                        {flag}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <div className="text-xs text-slate-500 font-medium text-emerald-600 flex items-center gap-1">
                    ✓ Outstanding profile - No immediate financial warnings detected.
                  </div>
                )}
              </div>
            </div>

            {/* Recommendations & Education */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 border-t border-slate-100 pt-6">
              <div className="space-y-2">
                <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider font-mono">Student Action Recommendation</div>
                <p className="text-xs text-slate-700 leading-relaxed font-sans">{analysisResult.aiRecommendation}</p>
              </div>
              <div className="space-y-2">
                <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider font-mono">Technical Skill Value Critique</div>
                <p className="text-xs text-slate-700 leading-relaxed font-sans">{analysisResult.educationalValueExplanation}</p>
              </div>
            </div>
          </div>

          {/* Printable Report preview block */}
          <div className="bg-slate-950 text-slate-200 border border-slate-850 rounded-3xl p-6 sm:p-8 space-y-6">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div>
                <h3 className="text-lg font-medium text-white">Full Printable Audit Ledger</h3>
                <p className="text-[10px] font-mono text-slate-400">Verifiably generated on absolute sandbox parameters</p>
              </div>
              <button
                onClick={handlePrint}
                className="flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-xs px-3 py-1.5 text-white rounded-lg transition-colors border border-slate-700"
              >
                <Printer className="w-3.5 h-3.5" /> Direct Print/PDF
              </button>
            </div>
            
            <div className="font-mono text-xs text-slate-300 leading-relaxed whitespace-pre-wrap select-all bg-slate-900 border border-slate-850 p-4 rounded-xl max-h-80 overflow-y-auto">
              {analysisResult.reportMarkdown}
            </div>
            <p className="text-[11px] text-slate-500 text-center">Tip: Selecting internal text copies completed Markdown code directly for clipboard placement.</p>
          </div>
        </div>
      )}
    </div>
  );
}
