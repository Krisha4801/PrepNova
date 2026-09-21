import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Upload, 
  FileText, 
  Download, 
  Trash2, 
  Eye, 
  Check, 
  AlertTriangle, 
  CheckCircle2, 
  Sparkles,
  FileCheck,
  X,
  UploadCloud,
  CheckCircle,
  Zap,
  Shield,
  FileSearch,
  LineChart
} from 'lucide-react';
import WorkspaceLayout from '../components/layout/WorkspaceLayout';

export default function ResumeAnalysisPage() {
  const [activeTab, setActiveTab] = useState('suggestions'); // 'suggestions' | 'keywords' | 'sections'
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [toastMessage, setToastMessage] = useState(null);
  const fileInputRef = useRef(null);

  // Resume Data State (Pre-filled with realistic sample data or localStorage)
  const [resumeData, setResumeData] = useState(() => {
    const saved = localStorage.getItem('prepnova_sample_resume');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { /* ignore */ }
    }
    return null;
  });

  // Key Insights checklist
  const keyInsights = [
    { text: 'Good use of action verbs', isPositive: true },
    { text: 'Relevant skills found', isPositive: true },
    { text: 'Clear section structure', isPositive: true },
    { text: 'Add more quantifiable achievements', isPositive: false },
    { text: 'Include relevant keywords', isPositive: false },
  ];

  // Suggestions Tab items
  const suggestions = [
    {
      id: 1,
      priority: 'High Priority',
      priorityColor: 'bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-400 border-rose-200 dark:border-rose-900/40',
      title: 'Add SQL & React keywords',
      explanation: 'Increase keyword relevance by matching the job description specifications and requirements.'
    },
    {
      id: 2,
      priority: 'High Priority',
      priorityColor: 'bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-400 border-rose-200 dark:border-rose-900/40',
      title: 'Quantify project impact with measurable metrics',
      explanation: 'Include latency reductions, user scale (e.g. 50k+ DAU), or performance gains in each bullet point.'
    },
    {
      id: 3,
      priority: 'Medium Priority',
      priorityColor: 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400 border-amber-200 dark:border-amber-900/40',
      title: 'Standardize chronological date formats',
      explanation: 'Use consistent "MM/YYYY — MM/YYYY" formatting across education and experience for flawless ATS parsing.'
    },
    {
      id: 4,
      priority: 'Medium Priority',
      priorityColor: 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400 border-amber-200 dark:border-amber-900/40',
      title: 'Highlight cloud deployment and containerization skills',
      explanation: 'Emphasize Docker, AWS, or CI/CD tools in both skills summary and corresponding project descriptions.'
    },
    {
      id: 5,
      priority: 'Medium Priority',
      priorityColor: 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400 border-amber-200 dark:border-amber-900/40',
      title: 'Group core technical competencies near top',
      explanation: 'Place programming languages, frameworks, and databases directly below your professional summary.'
    },
    {
      id: 6,
      priority: 'Low Priority',
      priorityColor: 'bg-blue-50 text-[#2563EB] dark:bg-blue-950/40 dark:text-[#38BDF8] border-blue-200 dark:border-blue-900/40',
      title: 'Strengthen initial bullet action verbs',
      explanation: 'Replace passive phrases like "Assisted with" with proactive verbs like "Architected", "Deployed", and "Engineered".'
    },
    {
      id: 7,
      priority: 'Low Priority',
      priorityColor: 'bg-blue-50 text-[#2563EB] dark:bg-blue-950/40 dark:text-[#38BDF8] border-blue-200 dark:border-blue-900/40',
      title: 'Maintain a single-column layout hierarchy',
      explanation: 'Avoid multi-column nested tables or floating graphics that disrupt text parsing robots.'
    }
  ];

  // Keywords Tab Data
  const matchedKeywords = [
    'React.js', 'JavaScript (ES6+)', 'TypeScript', 'Node.js', 
    'REST APIs', 'Git', 'TailwindCSS', 'Next.js', 
    'Redux Toolkit', 'Responsive Design', 'Jest / Unit Testing', 'HTML5 / CSS3'
  ];

  const missingKeywords = [
    'Docker', 'Kubernetes', 'GraphQL', 'AWS S3', 
    'CI/CD Pipelines', 'Redis Caching', 'System Architecture', 'Microservices'
  ];

  // Section Analysis Tab Data
  const sectionEvaluations = [
    { name: 'Summary', score: 80, rating: 'Good', ratingColor: 'text-[#2563EB] bg-blue-50 dark:bg-blue-950/40 dark:text-[#38BDF8] border-blue-200 dark:border-blue-900/40' },
    { name: 'Experience', score: 90, rating: 'Excellent', ratingColor: 'text-emerald-700 bg-emerald-50 dark:bg-emerald-950/40 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800/40' },
    { name: 'Skills', score: 85, rating: 'Very Good', ratingColor: 'text-emerald-700 bg-emerald-50 dark:bg-emerald-950/40 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800/40' },
    { name: 'Education', score: 95, rating: 'Excellent', ratingColor: 'text-emerald-700 bg-emerald-50 dark:bg-emerald-950/40 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800/40' },
    { name: 'Projects', score: 75, rating: 'Needs Improvement', ratingColor: 'text-amber-700 bg-amber-50 dark:bg-amber-950/40 dark:text-amber-400 border-amber-200 dark:border-amber-900/40' },
  ];

  // Upload Handling
  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const validTypes = [
      'application/pdf', 
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/msword'
    ];
    
    if (!validTypes.includes(file.type) && !file.name.endsWith('.pdf') && !file.name.endsWith('.docx')) {
      setToastMessage('Please upload a PDF or DOCX file format.');
      setTimeout(() => setToastMessage(null), 3000);
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setToastMessage('File size exceeds the 5MB maximum limit.');
      setTimeout(() => setToastMessage(null), 3000);
      return;
    }

    setIsAnalyzing(true);
    setToastMessage(`Parsing ${file.name}...`);

    setTimeout(() => {
      const updated = {
        fileName: file.name,
        fileSize: `${(file.size / (1024 * 1024)).toFixed(1)} MB`,
        uploadDate: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
        atsScore: Math.floor(Math.random() * 15) + 82,
        status: 'Optimal'
      };
      setResumeData(updated);
      localStorage.setItem('prepnova_sample_resume', JSON.stringify(updated));
      setIsAnalyzing(false);
      setToastMessage('Resume analyzed successfully with 84% score!');
      setTimeout(() => setToastMessage(null), 4000);
    }, 1500);
  };

  const handleDownloadImproved = () => {
    const element = document.createElement("a");
    const file = new Blob([
      `PrepNova ATS Improved Resume\n\nFile: ${resumeData.fileName}\nATS Score: ${resumeData.atsScore}%\nTarget Optimizations Applied:\n- Clean chronological layout\n- Keyword alignment: React, SQL, Cloud Architecture\n- Metric-driven impact metrics.`
    ], { type: 'text/plain' });
    element.href = URL.createObjectURL(file);
    element.download = `Improved_${resumeData.fileName.replace(/\.[^/.]+$/, "")}.txt`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
    setToastMessage('Improved resume downloaded!');
    setTimeout(() => setToastMessage(null), 3000);
  };

  if (!resumeData) {
    return (
      <WorkspaceLayout title="Resume & ATS">
        <input 
          type="file"
          ref={fileInputRef}
          onChange={handleFileUpload}
          accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
          className="hidden"
        />
        
        <div className="max-w-[960px] mx-auto w-full pt-8 pb-12 flex flex-col items-center">
          
          <div className="text-center mb-10">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 dark:bg-blue-900/30 text-[#2563EB] dark:text-[#38BDF8] text-[11px] font-bold uppercase tracking-wider mb-4 border border-blue-100 dark:border-blue-900/50">
              <Sparkles className="w-3.5 h-3.5" />
              ATS Optimization Engine
            </span>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-[#0F172A] dark:text-white tracking-tight mb-4">
              Resume & ATS Analysis
            </h1>
            <p className="text-sm sm:text-base text-[#64748B] dark:text-slate-400 max-w-2xl mx-auto leading-relaxed">
              Upload your resume to receive an instant ATS score, recruiter compatibility analysis, keyword matching, and personalized improvement suggestions.
            </p>
          </div>

          <div className="w-full bg-white dark:bg-slate-900 rounded-[20px] p-6 sm:p-8 shadow-sm border border-[#E5E7EB] dark:border-slate-800 mb-8">
            <div 
              onClick={() => fileInputRef.current?.click()}
              className="h-[240px] w-full rounded-2xl border-2 border-dashed border-[#BFDBFE] dark:border-blue-900/50 bg-[#F8FAFC] dark:bg-slate-800/50 hover:bg-blue-50/50 dark:hover:bg-blue-900/20 hover:border-[#2563EB] transition-all flex flex-col items-center justify-center cursor-pointer group"
            >
              <div className="w-16 h-16 rounded-full bg-white dark:bg-slate-800 shadow-sm border border-[#E5E7EB] dark:border-slate-700 flex items-center justify-center mb-4 group-hover:scale-105 transition-transform">
                <UploadCloud className="w-8 h-8 text-[#2563EB] dark:text-[#38BDF8]" />
              </div>
              <h3 className="text-lg font-bold text-[#0F172A] dark:text-white mb-1">
                {isAnalyzing ? 'Analyzing Document...' : 'Click to upload or drag and drop'}
              </h3>
              <p className="text-sm text-[#64748B] dark:text-slate-400">
                PDF or DOCX (Max 5MB)
              </p>
            </div>
            
            <div className="flex flex-wrap items-center justify-center gap-6 sm:gap-12 mt-6 text-sm text-[#64748B] dark:text-slate-400 font-medium">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-[#16A34A]" />
                92% Accuracy
              </div>
              <div className="flex items-center gap-2">
                <Zap className="w-4 h-4 text-[#F59E0B]" />
                15s Analysis
              </div>
              <div className="flex items-center gap-2">
                <Shield className="w-4 h-4 text-[#2563EB] dark:text-[#38BDF8]" />
                PDF / DOCX
              </div>
            </div>
          </div>

          <div className="w-full grid grid-cols-1 sm:grid-cols-2 gap-4">
            {[
              {
                icon: <FileSearch className="w-5 h-5 text-[#2563EB] dark:text-[#38BDF8]" />,
                title: 'ATS Parser Compatibility',
                desc: 'See exactly how recruiter software reads your resume and identify missing sections or formatting errors.'
              },
              {
                icon: <Zap className="w-5 h-5 text-[#F59E0B]" />,
                title: 'Keyword Gap Analysis',
                desc: 'Compare your resume against target roles to find missing hard skills and industry keywords.'
              },
              {
                icon: <LineChart className="w-5 h-5 text-[#16A34A]" />,
                title: 'Impact Scoring',
                desc: 'Get actionable suggestions to improve your bullet points with measurable metrics and action verbs.'
              },
              {
                icon: <FileText className="w-5 h-5 text-[#8B5CF6]" />,
                title: 'Smart formatting',
                desc: 'Receive layout recommendations to ensure your resume is human-readable and machine-friendly.'
              }
            ].map((feat, idx) => (
              <div key={idx} className="bg-white dark:bg-slate-900 p-5 rounded-[18px] border border-[#E5E7EB] dark:border-slate-800 flex items-start gap-4">
                <div className="w-10 h-10 rounded-xl bg-slate-50 dark:bg-slate-800 flex items-center justify-center shrink-0 border border-[#E5E7EB] dark:border-slate-700">
                  {feat.icon}
                </div>
                <div>
                  <h4 className="text-sm font-bold text-[#0F172A] dark:text-white mb-1">{feat.title}</h4>
                  <p className="text-xs text-[#64748B] dark:text-slate-400 leading-relaxed">{feat.desc}</p>
                </div>
              </div>
            ))}
          </div>

        </div>
      </WorkspaceLayout>
    );
  }

  const ringRadius = 70;
  const strokeWidth = 12;
  const normalizedRadius = ringRadius - strokeWidth * 2;
  const circumference = normalizedRadius * 2 * Math.PI;
  const strokeDashoffset = circumference - (resumeData.atsScore / 100) * circumference;

  return (
    <WorkspaceLayout 
      title="Resume & ATS"
      actions={
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={isAnalyzing}
          className="px-4 py-2 bg-[#2563EB] hover:bg-blue-700 text-white text-xs sm:text-sm font-semibold rounded-xl shadow-xs transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-75"
        >
          <Upload className="w-3.5 h-3.5" />
          <span>{isAnalyzing ? 'Analyzing...' : 'Upload New'}</span>
        </button>
      }
    >
      
      {/* Hidden File Input */}
      <input 
        type="file"
        ref={fileInputRef}
        onChange={handleFileUpload}
        accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
        className="hidden"
      />

      {/* FEEDBACK TOAST */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="p-3.5 bg-blue-50 dark:bg-[#1E293B] border border-blue-200 dark:border-[#334155] text-[#2563EB] dark:text-[#38BDF8] rounded-xl text-xs sm:text-sm font-semibold flex items-center gap-2 shadow-2xs"
          >
            <CheckCircle2 className="w-4 h-4 shrink-0 text-[#2563EB] dark:text-[#38BDF8]" />
            <span>{toastMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* PAGE HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-[#E5E7EB] dark:border-[#334155]/60">
        <div>
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-blue-50 dark:bg-[#1E293B] text-[#2563EB] dark:text-[#38BDF8] text-[11px] font-bold uppercase tracking-wider mb-1">
            <Sparkles className="w-3 h-3" />
            ATS Optimization Engine
          </span>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-[#0F172A] dark:text-[#F8FAFC] tracking-tight">
            Resume & ATS Analysis
          </h2>
          <p className="text-sm sm:text-base text-[#64748B] dark:text-[#94A3B8] mt-1">
            Review recruiter keyword compatibility, parse structure, and actionable recommendations.
          </p>
        </div>

        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={isAnalyzing}
          className="sm:hidden h-[44px] px-5 rounded-[14px] bg-[#2563EB] hover:bg-blue-700 text-white font-semibold text-sm shadow-xs transition-all flex items-center justify-center gap-2 self-start cursor-pointer disabled:opacity-75"
        >
          <Upload className="w-4 h-4" />
          <span>{isAnalyzing ? 'Analyzing...' : 'Upload New'}</span>
        </button>
      </div>

      {/* UPLOADED RESUME CARD */}
      <div className="w-full bg-white dark:bg-[#0F172A] rounded-[20px] border border-[#E5E7EB] dark:border-[#334155] p-5 sm:p-6 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-all">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-blue-50 dark:bg-blue-950/50 text-[#2563EB] dark:text-[#38BDF8] flex items-center justify-center shrink-0 border border-blue-100 dark:border-blue-900/40">
            <FileText className="w-6 h-6 text-[#2563EB] dark:text-[#38BDF8]" />
          </div>
          <div>
            <h3 className="text-sm sm:text-base font-bold text-[#0F172A] dark:text-[#F8FAFC]">
              {resumeData.fileName}
            </h3>
            <div className="flex items-center gap-2 text-xs text-[#64748B] dark:text-[#94A3B8] mt-0.5">
              <span>{resumeData.fileSize}</span>
              <span>•</span>
              <span>Uploaded {resumeData.uploadDate}</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 self-end sm:self-auto">
          <button
            type="button"
            onClick={() => setShowViewModal(true)}
            className="p-2.5 rounded-xl border border-[#E5E7EB] dark:border-[#334155] bg-white dark:bg-[#1E293B] text-[#64748B] dark:text-[#94A3B8] hover:text-[#0F172A] dark:hover:text-[#F8FAFC] hover:bg-slate-50 dark:hover:bg-[#283548] transition-colors cursor-pointer"
            title="View Details"
          >
            <Eye className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={handleDownloadImproved}
            className="p-2.5 rounded-xl border border-[#E5E7EB] dark:border-[#334155] bg-white dark:bg-[#1E293B] text-[#64748B] dark:text-[#94A3B8] hover:text-[#0F172A] dark:hover:text-[#F8FAFC] hover:bg-slate-50 dark:hover:bg-[#283548] transition-colors cursor-pointer"
            title="Download"
          >
            <Download className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => {
              setResumeData(null);
              localStorage.removeItem('prepnova_sample_resume');
              setToastMessage('Resume removed');
              setTimeout(() => setToastMessage(null), 3000);
            }}
            className="p-2.5 rounded-xl border border-[#E5E7EB] dark:border-[#334155] bg-white dark:bg-[#1E293B] text-[#64748B] dark:text-[#94A3B8] hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors cursor-pointer"
            title="Delete"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* TWO COLUMN GRID: ATS Score Card (Left) & Key Insights Dark Cards (Right) */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        
        {/* Left Card: Circular ATS Score */}
        <div className="lg:col-span-5 bg-white dark:bg-[#0F172A] rounded-[20px] border border-[#E5E7EB] dark:border-[#334155] p-6 shadow-2xs flex flex-col items-center justify-between text-center transition-all">
          <div className="w-full text-left">
            <h3 className="text-base font-bold text-[#0F172A] dark:text-[#F8FAFC]">
              ATS Match Score
            </h3>
          </div>

          {/* Large Circular Progress Ring */}
          <div className="my-6 relative flex items-center justify-center">
            <svg
              height={ringRadius * 2}
              width={ringRadius * 2}
              className="transform -rotate-90"
            >
              <circle
                stroke="currentColor"
                className="text-slate-100 dark:text-[#1E293B]"
                fill="transparent"
                strokeWidth={strokeWidth}
                r={normalizedRadius}
                cx={ringRadius}
                cy={ringRadius}
              />
              <motion.circle
                stroke="#2563EB"
                fill="transparent"
                strokeWidth={strokeWidth}
                strokeDasharray={`${circumference} ${circumference}`}
                initial={{ strokeDashoffset: circumference }}
                animate={{ strokeDashoffset }}
                transition={{ duration: 1.2, ease: "easeOut" }}
                strokeLinecap="round"
                r={normalizedRadius}
                cx={ringRadius}
                cy={ringRadius}
              />
            </svg>

            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-3xl font-[900] text-[#0F172A] dark:text-[#F8FAFC] tracking-tight">
                {resumeData.atsScore}%
              </span>
            </div>
          </div>

          <div>
            <span className="inline-block px-3 py-1 rounded-full text-xs font-bold bg-[#EFF6FF] dark:bg-[#1E293B] text-[#2563EB] dark:text-[#38BDF8] border border-[#BFDBFE] dark:border-[#334155] mb-1.5">
              {resumeData.status}
            </span>
            <p className="text-xs text-[#64748B] dark:text-[#94A3B8]">
              Your resume format aligns well with automated screening filters.
            </p>
          </div>
        </div>

        {/* Right Card: Key Insights Dark Cards */}
        <div className="lg:col-span-7 bg-white dark:bg-[#0F172A] rounded-[20px] border border-[#E5E7EB] dark:border-[#334155] p-6 shadow-2xs flex flex-col justify-between transition-all">
          <div>
            <h3 className="text-base font-bold text-[#0F172A] dark:text-[#F8FAFC] mb-4">
              Key Insights
            </h3>

            {/* Dark cards for each insight */}
            <div className="space-y-3">
              {keyInsights.map((insight, idx) => (
                <div 
                  key={idx}
                  className="flex items-center gap-3 p-3.5 rounded-xl bg-slate-50 dark:bg-[#111827] border border-[#E5E7EB] dark:border-[#334155] text-xs sm:text-sm font-medium text-[#0F172A] dark:text-[#F8FAFC] transition-colors"
                >
                  {insight.isPositive ? (
                    <div className="w-6 h-6 rounded-full bg-emerald-50 dark:bg-emerald-950/50 text-[#16A34A] dark:text-emerald-400 flex items-center justify-center shrink-0 border border-emerald-200 dark:border-emerald-800/40">
                      <Check className="w-3.5 h-3.5" />
                    </div>
                  ) : (
                    <div className="w-6 h-6 rounded-full bg-amber-50 dark:bg-amber-950/50 text-[#F59E0B] dark:text-amber-400 flex items-center justify-center shrink-0 border border-amber-200 dark:border-amber-800/40">
                      <AlertTriangle className="w-3.5 h-3.5" />
                    </div>
                  )}
                  <span className="font-semibold">{insight.text}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-[#E5E7EB] dark:border-[#334155] text-[11px] text-[#64748B] dark:text-[#94A3B8] flex items-center justify-between">
            <span>3 Passing Criteria</span>
            <span>2 Optimization Alerts</span>
          </div>
        </div>

      </section>

      {/* TABS SECTION */}
      <section className="space-y-4">
        
        {/* Pill Tabs Header */}
        <div className="flex items-center gap-2 p-1.5 bg-slate-100 dark:bg-[#1E293B] rounded-2xl w-fit border border-[#E5E7EB] dark:border-[#334155]">
          <button
            type="button"
            onClick={() => setActiveTab('suggestions')}
            className={`px-4 sm:px-5 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
              activeTab === 'suggestions'
                ? 'bg-white dark:bg-[#0F172A] text-[#2563EB] dark:text-[#38BDF8] shadow-2xs'
                : 'text-[#64748B] dark:text-[#94A3B8] hover:text-[#0F172A] dark:hover:text-[#F8FAFC]'
            }`}
          >
            Suggestions
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('keywords')}
            className={`px-4 sm:px-5 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
              activeTab === 'keywords'
                ? 'bg-white dark:bg-[#0F172A] text-[#2563EB] dark:text-[#38BDF8] shadow-2xs'
                : 'text-[#64748B] dark:text-[#94A3B8] hover:text-[#0F172A] dark:hover:text-[#F8FAFC]'
            }`}
          >
            Keyword Match
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('sections')}
            className={`px-4 sm:px-5 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
              activeTab === 'sections'
                ? 'bg-white dark:bg-[#0F172A] text-[#2563EB] dark:text-[#38BDF8] shadow-2xs'
                : 'text-[#64748B] dark:text-[#94A3B8] hover:text-[#0F172A] dark:hover:text-[#F8FAFC]'
            }`}
          >
            Section Analysis
          </button>
        </div>

        {/* TAB CONTENT */}
        <AnimatePresence mode="wait">
          
          {/* 1. SUGGESTIONS TAB */}
          {activeTab === 'suggestions' && (
            <motion.div
              key="suggestions-tab"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.25 }}
              className="bg-white dark:bg-[#0F172A] rounded-[20px] border border-[#E5E7EB] dark:border-[#334155] p-6 shadow-2xs space-y-4"
            >
              <div className="border-b border-[#E5E7EB] dark:border-[#334155] pb-3 mb-4">
                <h3 className="text-base font-bold text-[#0F172A] dark:text-[#F8FAFC]">
                  Improvement Recommendations
                </h3>
                <p className="text-xs text-[#64748B] dark:text-[#94A3B8] mt-0.5">
                  Targeted modifications to increase ATS parsing accuracy and ranking.
                </p>
              </div>

              <div className="grid grid-cols-1 gap-3.5">
                {suggestions.map((item) => (
                  <div
                    key={item.id}
                    className="p-4 rounded-xl border border-[#E5E7EB] dark:border-[#334155] bg-slate-50/70 dark:bg-[#111827] hover:bg-slate-100 dark:hover:bg-[#1E293B] transition-colors"
                  >
                    <div className="flex items-center gap-2 mb-1.5">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${item.priorityColor}`}>
                        {item.priority}
                      </span>
                      <h4 className="text-sm font-bold text-[#0F172A] dark:text-[#F8FAFC]">
                        {item.title}
                      </h4>
                    </div>
                    <p className="text-xs text-[#64748B] dark:text-[#94A3B8] leading-relaxed pl-1">
                      {item.explanation}
                    </p>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {/* 2. KEYWORD MATCH TAB */}
          {activeTab === 'keywords' && (
            <motion.div
              key="keywords-tab"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.25 }}
              className="bg-white dark:bg-[#0F172A] rounded-[20px] border border-[#E5E7EB] dark:border-[#334155] p-6 shadow-2xs space-y-6"
            >
              <div className="border-b border-[#E5E7EB] dark:border-[#334155] pb-3">
                <h3 className="text-base font-bold text-[#0F172A] dark:text-[#F8FAFC]">
                  Keyword Match Analysis
                </h3>
                <p className="text-xs text-[#64748B] dark:text-[#94A3B8] mt-0.5">
                  Matched vs. missing industry keywords based on modern tech job descriptions.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Matched Keywords */}
                <div className="p-5 rounded-2xl bg-emerald-50/40 dark:bg-[#111827] border border-emerald-100 dark:border-[#334155]">
                  <div className="flex items-center gap-2 mb-4">
                    <CheckCircle2 className="w-4 h-4 text-[#16A34A] dark:text-emerald-400" />
                    <h4 className="text-sm font-bold text-[#0F172A] dark:text-[#F8FAFC]">
                      Matched Keywords ({matchedKeywords.length})
                    </h4>
                  </div>
                  
                  <div className="flex flex-wrap gap-2">
                    {matchedKeywords.map((kw) => (
                      <span
                        key={kw}
                        className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 dark:bg-emerald-950/50 text-[#16A34A] dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/40"
                      >
                        <span className="w-1.5 h-1.5 rounded-full bg-[#16A34A] dark:bg-emerald-400" />
                        {kw}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Missing Keywords */}
                <div className="p-5 rounded-2xl bg-slate-50 dark:bg-[#111827] border border-[#E5E7EB] dark:border-[#334155]">
                  <div className="flex items-center gap-2 mb-4">
                    <AlertTriangle className="w-4 h-4 text-[#F59E0B] dark:text-amber-400" />
                    <h4 className="text-sm font-bold text-[#0F172A] dark:text-[#F8FAFC]">
                      Missing Keywords ({missingKeywords.length})
                    </h4>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {missingKeywords.map((kw) => (
                      <span
                        key={kw}
                        className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-white dark:bg-[#1E293B] text-[#64748B] dark:text-[#94A3B8] border border-dashed border-[#CBD5E1] dark:border-[#334155]"
                      >
                        <span className="w-1.5 h-1.5 rounded-full bg-slate-400 dark:bg-slate-500" />
                        {kw}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* 3. SECTION ANALYSIS TAB */}
          {activeTab === 'sections' && (
            <motion.div
              key="sections-tab"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.25 }}
              className="bg-white dark:bg-[#0F172A] rounded-[20px] border border-[#E5E7EB] dark:border-[#334155] p-6 shadow-2xs space-y-4"
            >
              <div className="border-b border-[#E5E7EB] dark:border-[#334155] pb-3 mb-4">
                <h3 className="text-base font-bold text-[#0F172A] dark:text-[#F8FAFC]">
                  Section Structure Evaluation
                </h3>
                <p className="text-xs text-[#64748B] dark:text-[#94A3B8] mt-0.5">
                  Rubric ratings of individual resume blocks for readability and impact.
                </p>
              </div>

              <div className="space-y-3.5">
                {sectionEvaluations.map((sec) => (
                  <div
                    key={sec.name}
                    className="p-4 rounded-xl border border-[#E5E7EB] dark:border-[#334155] bg-slate-50/70 dark:bg-[#111827] flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                  >
                    <div className="w-32">
                      <span className="text-sm font-bold text-[#0F172A] dark:text-[#F8FAFC]">
                        {sec.name}
                      </span>
                    </div>

                    {/* Animated Progress Bar */}
                    <div className="flex-1 flex items-center gap-3">
                      <div className="flex-1 h-2.5 bg-slate-200 dark:bg-[#1E293B] rounded-full overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${sec.score}%` }}
                          transition={{ duration: 0.8, ease: "easeOut" }}
                          className="h-full bg-[#2563EB] rounded-full"
                        />
                      </div>
                      <span className="text-xs font-bold text-[#0F172A] dark:text-[#F8FAFC] w-10 text-right">
                        {sec.score}%
                      </span>
                    </div>

                    {/* Status Badge */}
                    <div className="sm:w-36 sm:text-right">
                      <span className={`inline-block px-2.5 py-1 rounded-full text-xs font-bold border ${sec.ratingColor}`}>
                        {sec.rating}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

        </AnimatePresence>
      </section>

      {/* BOTTOM CTA: Blue Button */}
      <div className="pt-2 flex justify-end">
        <button
          type="button"
          onClick={handleDownloadImproved}
          className="w-full sm:w-auto h-[48px] px-8 rounded-[14px] bg-[#2563EB] hover:bg-blue-700 text-white font-bold text-sm shadow-xs transition-all flex items-center justify-center gap-2 cursor-pointer"
        >
          <Download className="w-4 h-4" />
          <span>Download Improved Resume</span>
        </button>
      </div>

      {/* VIEW MODAL DIALOG */}
      <AnimatePresence>
        {showViewModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white dark:bg-[#0F172A] rounded-3xl border border-[#E5E7EB] dark:border-[#334155] shadow-2xl max-w-lg w-full p-6 relative overflow-hidden"
            >
              <button
                onClick={() => setShowViewModal(false)}
                className="absolute top-5 right-5 p-2 rounded-full hover:bg-slate-100 dark:hover:bg-[#1E293B] text-[#64748B] dark:text-[#94A3B8] hover:text-[#0F172A] dark:hover:text-[#F8FAFC]"
                aria-label="Close dialog"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/50 text-[#2563EB] dark:text-[#38BDF8] flex items-center justify-center">
                  <FileCheck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-[#0F172A] dark:text-[#F8FAFC]">{resumeData.fileName}</h3>
                  <p className="text-xs text-[#64748B] dark:text-[#94A3B8]">Document Preview Summary</p>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-[#111827] border border-[#E5E7EB] dark:border-[#334155] text-xs space-y-2 text-[#0F172A] dark:text-[#F8FAFC] my-4">
                <div className="flex justify-between">
                  <span className="text-[#64748B] dark:text-[#94A3B8]">File Size:</span>
                  <span className="font-semibold">{resumeData.fileSize}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#64748B] dark:text-[#94A3B8]">Uploaded Date:</span>
                  <span className="font-semibold">{resumeData.uploadDate}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#64748B] dark:text-[#94A3B8]">ATS Compliance:</span>
                  <span className="font-semibold text-[#16A34A] dark:text-emerald-400">{resumeData.atsScore}% ({resumeData.status})</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#64748B] dark:text-[#94A3B8]">Format:</span>
                  <span className="font-semibold">Standard ATS Clean PDF</span>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  onClick={() => setShowViewModal(false)}
                  className="px-4 py-2 rounded-xl border border-[#E5E7EB] dark:border-[#334155] text-xs font-semibold hover:bg-slate-50 dark:hover:bg-[#1E293B]"
                >
                  Close
                </button>
                <button
                  onClick={() => {
                    setShowViewModal(false);
                    fileInputRef.current?.click();
                  }}
                  className="px-4 py-2 rounded-xl bg-[#2563EB] text-white text-xs font-semibold hover:bg-blue-700"
                >
                  Upload Replacement
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </WorkspaceLayout>
  );
}
