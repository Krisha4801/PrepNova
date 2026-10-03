import React, { useState, useRef } from 'react';
import { 
  Upload, 
  FileText, 
  Download, 
  Trash2, 
  Check, 
  AlertTriangle, 
  CheckCircle2, 
  Sparkles, 
  X, 
  UploadCloud, 
  FileSearch, 
  Loader2, 
  ArrowRight,
  ShieldCheck,
  Tag
} from 'lucide-react';
import WorkspaceLayout from '../components/layout/WorkspaceLayout';

export default function ResumeAnalysisPage() {
  const [activeTab, setActiveTab] = useState('suggestions'); // 'suggestions' | 'keywords' | 'structure'
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [toastMessage, setToastMessage] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef(null);

  // Resume Data State
  const [resumeData, setResumeData] = useState(() => {
    const saved = localStorage.getItem('prepnova_uploaded_resume');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { /* ignore */ }
    }
    return null;
  });

  const suggestions = [
    {
      id: 1,
      priority: 'High',
      priorityColor: 'badge-primary',
      title: 'Include measurable metrics in project bullet points',
      explanation: 'Quantify scale, latency reduction, user volume, or throughput (e.g. "Reduced API response times by 35% across 50k DAU").'
    },
    {
      id: 2,
      priority: 'High',
      priorityColor: 'badge-primary',
      title: 'Ensure keyword density matches target job description',
      explanation: 'Verify required framework keywords (e.g., React, TypeScript, Node.js, SQL) are present in your skills and project summaries.'
    },
    {
      id: 3,
      priority: 'Medium',
      priorityColor: 'badge-neutral',
      title: 'Maintain single-column chronological layout',
      explanation: 'Multi-column tables and complex graphical headers can confuse standard ATS parsers. Keep headings standard (Experience, Skills, Education).'
    },
    {
      id: 4,
      priority: 'Medium',
      priorityColor: 'badge-neutral',
      title: 'Standardize date formatting (MM/YYYY — MM/YYYY)',
      explanation: 'Use uniform date formats throughout all job and education entries for unambiguous duration parsing.'
    }
  ];

  const matchedKeywords = [
    'React.js', 'JavaScript (ES6+)', 'TypeScript', 'Node.js', 
    'REST APIs', 'Git', 'Tailwind CSS', 'Next.js', 'Unit Testing'
  ];

  const missingKeywords = [
    'Docker', 'GraphQL', 'AWS / Cloud', 'CI/CD Pipelines', 'Redis'
  ];

  const handleFile = (file) => {
    if (!file) return;

    const validExtensions = ['.pdf', '.docx'];
    const hasValidExt = validExtensions.some(ext => file.name.toLowerCase().endsWith(ext));

    if (!hasValidExt) {
      setToastMessage('Supported formats: PDF or DOCX only.');
      setTimeout(() => setToastMessage(null), 3500);
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setToastMessage('File size exceeds the 5MB maximum limit.');
      setTimeout(() => setToastMessage(null), 3500);
      return;
    }

    setIsAnalyzing(true);
    setToastMessage(`Reading ${file.name}...`);

    setTimeout(() => {
      const parsedResume = {
        fileName: file.name,
        fileSize: `${(file.size / (1024 * 1024)).toFixed(1)} MB`,
        uploadDate: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
        atsScore: 84,
        status: 'Parsed'
      };
      setResumeData(parsedResume);
      localStorage.setItem('prepnova_uploaded_resume', JSON.stringify(parsedResume));
      setIsAnalyzing(false);
      setToastMessage('Document parsed successfully.');
      setTimeout(() => setToastMessage(null), 3000);
    }, 600);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleFile(file);
  };

  const handleRemoveResume = () => {
    setResumeData(null);
    localStorage.removeItem('prepnova_uploaded_resume');
  };

  return (
    <WorkspaceLayout title="Resume & ATS Analysis">
      
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white px-4 py-2.5 rounded-xl shadow-lg text-xs font-semibold flex items-center gap-2 border border-slate-700 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      <input
        type="file"
        ref={fileInputRef}
        onChange={(e) => handleFile(e.target.files?.[0])}
        accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
        className="hidden"
      />

      <div className="max-w-4xl mx-auto space-y-7">
        
        {!resumeData ? (
          /* ================================================== */
          /* EMPTY / UPLOAD STATE                              */
          /* ================================================== */
          <div className="panel-card p-8 sm:p-12 text-center space-y-6">
            <div className="max-w-md mx-auto space-y-2">
              <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mx-auto mb-4 border border-indigo-100 dark:border-indigo-800/50">
                <FileSearch className="w-6 h-6" />
              </div>
              <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
                Upload Resume for ATS Parsing
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
                Check your resume layout, keyword density, and formatting against standard Applicant Tracking Systems.
              </p>
            </div>

            {/* Drag and drop area */}
            <div
              onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`p-8 sm:p-10 border-2 border-dashed rounded-2xl transition-all cursor-pointer flex flex-col items-center justify-center gap-3 ${
                isDragging
                  ? 'border-indigo-600 bg-indigo-50/50 dark:bg-indigo-950/40'
                  : 'border-slate-200 dark:border-slate-800 hover:border-indigo-400 dark:hover:border-indigo-700 bg-slate-50/60 dark:bg-slate-900/40'
              }`}
            >
              {isAnalyzing ? (
                <div className="flex flex-col items-center gap-2">
                  <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
                  <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">Parsing document structure...</span>
                </div>
              ) : (
                <>
                  <UploadCloud className="w-8 h-8 text-slate-400" />
                  <div className="text-center">
                    <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                      Click to upload or drag and drop
                    </p>
                    <p className="text-xs text-slate-400 mt-0.5">PDF or DOCX (Max 5MB)</p>
                  </div>
                </>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 text-left border-t border-slate-100 dark:border-slate-800">
              <div className="space-y-1">
                <span className="text-xs font-bold text-slate-900 dark:text-slate-200">Keyword Matching</span>
                <p className="text-[11px] text-slate-400">Identifies essential technical terms and framework skills.</p>
              </div>
              <div className="space-y-1">
                <span className="text-xs font-bold text-slate-900 dark:text-slate-200">Layout Verification</span>
                <p className="text-[11px] text-slate-400">Ensures single-column parsing compatibility.</p>
              </div>
              <div className="space-y-1">
                <span className="text-xs font-bold text-slate-900 dark:text-slate-200">Impact Metrics</span>
                <p className="text-[11px] text-slate-400">Highlights quantifiable outcomes in bullet points.</p>
              </div>
            </div>
          </div>
        ) : (
          /* ================================================== */
          /* PARSED RESUME VIEW                                */
          /* ================================================== */
          <div className="space-y-6">
            
            {/* Header / Active Document Card */}
            <div className="panel-card flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3.5 min-w-0">
                <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0 border border-indigo-100 dark:border-indigo-800/50">
                  <FileText className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white truncate">{resumeData.fileName}</h3>
                  <p className="text-xs text-slate-400 mt-0.5">Uploaded on {resumeData.uploadDate} • {resumeData.fileSize}</p>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="btn-secondary text-xs"
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span>Replace</span>
                </button>
                <button
                  type="button"
                  onClick={handleRemoveResume}
                  className="p-2 rounded-xl text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 text-xs transition-colors"
                  title="Remove document"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Score & Tabs Overview */}
            <div className="panel-card space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800">
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">ATS Compliance Overview</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Summary of layout and keyword density benchmarks.</p>
                </div>

                <div className="flex items-center gap-3">
                  <div className="px-3.5 py-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 text-xs font-bold border border-emerald-200/60">
                    ATS Score: {resumeData.atsScore}%
                  </div>
                </div>
              </div>

              {/* Tab Switcher */}
              <div className="flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-2">
                {[
                  { id: 'suggestions', label: 'Actionable Suggestions' },
                  { id: 'keywords', label: 'Keyword Match Overview' }
                ].map((tab) => (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setActiveTab(tab.id)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                      activeTab === tab.id
                        ? 'bg-indigo-600 text-white shadow-2xs'
                        : 'text-slate-500 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              {/* Tab 1: Suggestions */}
              {activeTab === 'suggestions' && (
                <div className="space-y-3.5">
                  {suggestions.map((item) => (
                    <div 
                      key={item.id} 
                      className="p-4 rounded-xl bg-slate-50/80 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800 space-y-1"
                    >
                      <div className="flex items-center gap-2">
                        <span className={`${item.priorityColor} text-[11px]`}>{item.priority} Priority</span>
                        <h4 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">{item.title}</h4>
                      </div>
                      <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed pl-0.5">
                        {item.explanation}
                      </p>
                    </div>
                  ))}
                </div>
              )}

              {/* Tab 2: Keywords */}
              {activeTab === 'keywords' && (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <span className="text-xs font-bold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider block">
                      Found Keywords
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {matchedKeywords.map((kw) => (
                        <span key={kw} className="badge-success text-xs">
                          ✓ {kw}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                    <span className="text-xs font-bold text-amber-700 dark:text-amber-400 uppercase tracking-wider block">
                      Suggested Competency Keywords
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {missingKeywords.map((kw) => (
                        <span key={kw} className="badge-neutral text-xs">
                          + {kw}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

      </div>
    </WorkspaceLayout>
  );
}
