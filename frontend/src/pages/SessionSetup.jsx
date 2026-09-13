import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FileText, 
  ClipboardList, 
  Briefcase, 
  Target, 
  Check, 
  Upload, 
  X, 
  Sparkles, 
  ArrowRight, 
  CheckCircle2, 
  FileCheck2,
  AlertCircle,
  File,
  RotateCcw
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import WorkspaceLayout from '../components/layout/WorkspaceLayout';

export default function SessionSetup() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const fileInputRef = useRef(null);
  const jdFileInputRef = useRef(null);

  // Selected Sources State (Multi-selection allowed)
  const [sources, setSources] = useState({
    resume: true,
    jobDescription: false,
    role: true,
    general: false
  });

  // Resume Input State
  const [resumeFile, setResumeFile] = useState({
    name: 'Alex_Chen_Resume.pdf',
    size: '1.4 MB',
    uploadedAt: 'Just now'
  });
  const [isDragging, setIsDragging] = useState(false);

  // Job Description State (Text + PDF tabs)
  const [jdTab, setJdTab] = useState('text'); // 'text' | 'pdf'
  const [jobDescription, setJobDescription] = useState('');
  const [jdFile, setJdFile] = useState(null);
  const [jdIsDragging, setJdIsDragging] = useState(false);
  const [jdUploadProgress, setJdUploadProgress] = useState(null);
  const [jdExtractSuccess, setJdExtractSuccess] = useState(false);

  // Role State
  const [roleInput, setRoleInput] = useState(user?.preferredRole || 'Software Engineer');
  const [errorMessage, setErrorMessage] = useState(null);

  // Popular role chips
  const popularRoles = [
    'Software Engineer',
    'Frontend',
    'Backend',
    'Full Stack',
    'Data Analyst',
    'HR Executive',
    'Product Manager'
  ];

  // Card Selection Handlers
  const toggleSource = (sourceKey) => {
    setErrorMessage(null);
    if (sourceKey === 'general') {
      // General Interview deselects everything else
      setSources(prev => ({
        resume: false,
        jobDescription: false,
        role: false,
        general: !prev.general
      }));
    } else {
      // Selecting Resume, JD, or Role disables General
      setSources(prev => ({
        ...prev,
        general: false,
        [sourceKey]: !prev[sourceKey]
      }));
    }
  };

  // Resume Drag and drop handlers
  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processResumeFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      processResumeFile(e.target.files[0]);
    }
  };

  const processResumeFile = (file) => {
    // Check file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setErrorMessage('Resume file size exceeds the 5MB limit. Please upload a smaller PDF or DOCX file.');
      return;
    }
    const sizeInMb = (file.size / (1024 * 1024)).toFixed(1);
    setResumeFile({
      name: file.name,
      size: `${sizeInMb} MB`,
      uploadedAt: 'Just now'
    });
    setErrorMessage(null);
  };

  const handleRemoveResume = () => {
    setResumeFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Job Description PDF Drag and Drop handlers
  const handleJdDragOver = (e) => {
    e.preventDefault();
    setJdIsDragging(true);
  };

  const handleJdDragLeave = (e) => {
    e.preventDefault();
    setJdIsDragging(false);
  };

  const handleJdDrop = (e) => {
    e.preventDefault();
    setJdIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processJdFile(e.dataTransfer.files[0]);
    }
  };

  const handleJdFileChange = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      processJdFile(e.target.files[0]);
    }
  };

  const processJdFile = (file) => {
    if (!file) return;

    // Check file format - Accept only .pdf
    const isPdf = file.name.toLowerCase().endsWith('.pdf') || file.type === 'application/pdf';
    if (!isPdf) {
      setErrorMessage('Invalid file format. Please upload a PDF file (.pdf) for the Job Description.');
      return;
    }

    // Check size limit: max 5MB
    if (file.size > 5 * 1024 * 1024) {
      setErrorMessage('PDF file exceeds the 5MB maximum limit. Please upload a smaller file.');
      return;
    }

    setErrorMessage(null);
    setJdUploadProgress(25);

    const sizeInMb = (file.size / (1024 * 1024)).toFixed(1);

    // Simulate animated upload & text extraction
    setTimeout(() => {
      setJdUploadProgress(65);
      setTimeout(() => {
        setJdUploadProgress(100);
        setTimeout(() => {
          setJdUploadProgress(null);
          setJdFile({
            name: file.name,
            size: `${sizeInMb} MB`,
            uploadedAt: 'Just now'
          });

          // Extract text representation from PDF and populate job description
          const extractedText = `Target Role: ${roleInput || 'Senior Software Engineer'}
Department: Engineering & Product Development
Position Summary:
We are looking for a skilled engineer to contribute to our mission-critical platform architectures, design resilient backend APIs, and collaborate on user-centric applications.

Key Responsibilities:
• Architect, implement, and maintain high-scale web applications and distributed microservices.
• Partner with product managers, design leads, and engineering teams to translate requirements into robust technical specifications.
• Advocate for code quality, comprehensive automated testing, and CI/CD best practices.
• Identify and eliminate performance bottlenecks across system layers and databases.

Qualifications & Requirements:
• 3+ years of professional software engineering experience.
• Hands-on proficiency in modern frameworks (React, TypeScript, Node.js, Go, or Python).
• Practical understanding of relational databases, caching systems, and distributed system fundamentals.
• Strong problem-solving abilities and clear technical communication.`;

          // If no custom text was typed, or to populate extracted content
          setJobDescription(extractedText);
          setJdExtractSuccess(true);
        }, 300);
      }, 400);
    }, 300);
  };

  const handleRemoveJdFile = () => {
    setJdFile(null);
    setJdExtractSuccess(false);
    if (jdFileInputRef.current) {
      jdFileInputRef.current.value = '';
    }
  };

  // Continue validation
  const isAnySelected = sources.general || sources.resume || sources.jobDescription || sources.role;

  const handleContinue = () => {
    if (!isAnySelected) {
      setErrorMessage('Please select at least one preparation source or choose General Interview.');
      return;
    }

    if (sources.role && !roleInput.trim()) {
      setErrorMessage('Please enter or select a job role.');
      return;
    }

    if (sources.resume && !resumeFile) {
      setErrorMessage('Please upload a resume or uncheck the Resume option.');
      return;
    }

    // Job Description requirement is satisfied if either text is entered OR a PDF has been uploaded and parsed
    if (sources.jobDescription) {
      const hasText = jobDescription && jobDescription.trim().length > 0;
      const hasPdf = jdFile !== null;
      if (!hasText && !hasPdf) {
        setErrorMessage('Please provide a job description by pasting text or uploading a PDF.');
        return;
      }
    }

    // Persist configuration to localStorage
    const activeSourcesList = [];
    if (sources.general) activeSourcesList.push('general');
    if (sources.resume) activeSourcesList.push('resume');
    if (sources.jobDescription) activeSourcesList.push('job_description');
    if (sources.role) activeSourcesList.push('role');

    const effectiveRole = sources.general 
      ? 'General Practice Candidate' 
      : (roleInput.trim() || 'Software Engineer');

    localStorage.setItem('prepnova_sources', JSON.stringify(activeSourcesList));
    localStorage.setItem('prepnova_role', effectiveRole);
    localStorage.setItem('prepnova_mode', sources.general ? 'general' : 'flexible');

    // Prioritize edited text if present, or JD file name
    if (sources.jobDescription) {
      if (jobDescription.trim()) {
        localStorage.setItem('prepnova_job_description', jobDescription.trim());
      }
      if (jdFile) {
        localStorage.setItem('prepnova_jd_file_name', jdFile.name);
      }
    } else {
      localStorage.removeItem('prepnova_job_description');
      localStorage.removeItem('prepnova_jd_file_name');
    }

    if (sources.resume && resumeFile) {
      localStorage.setItem('prepnova_resume_name', resumeFile.name);
    } else {
      localStorage.removeItem('prepnova_resume_name');
    }

    // Navigate to Step 2: Customize Interview
    navigate('/customize');
  };

  return (
    <WorkspaceLayout title="Start Interview" maxWidth="max-w-[1180px]">
      <div className="w-full space-y-8 pb-20">
        
        {/* ======================================================== */}
        {/* HEADER & BREADCRUMB                                      */}
        {/* ======================================================== */}
        <div className="pb-2 border-b border-[#E5E7EB] dark:border-white/[0.08]">
          {/* Breadcrumb: Dashboard / Start Interview */}
          <div className="flex items-center gap-1.5 text-xs font-semibold text-[#64748B] dark:text-[#94A3B8] mb-2.5">
            <Link to="/dashboard" className="hover:text-[#2563EB] dark:hover:text-[#38BDF8] transition-colors">
              Dashboard
            </Link>
            <span>/</span>
            <span className="text-[#111827] dark:text-[#F8FAFC]">Start Interview</span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#111827] dark:text-[#F8FAFC] tracking-tight">
            Start Interview
          </h1>
          <p className="text-sm sm:text-base text-[#64748B] dark:text-[#94A3B8] mt-1.5 leading-relaxed max-w-3xl">
            Select what information you want to provide. Use any combination to generate a personalized mock interview.
          </p>
        </div>

        {/* ERROR NOTIFICATION */}
        <AnimatePresence>
          {errorMessage && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="p-4 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/40 text-rose-700 dark:text-rose-400 rounded-2xl text-sm font-semibold flex items-center gap-3 shadow-xs"
            >
              <AlertCircle className="w-5 h-5 shrink-0 text-rose-600 dark:text-rose-400" />
              <span className="flex-1">{errorMessage}</span>
              <button 
                type="button" 
                onClick={() => setErrorMessage(null)}
                className="text-rose-600 hover:text-rose-800 dark:text-rose-400 p-1 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ======================================================== */}
        {/* STEP 1: SELECT INFORMATION SOURCES (4 Selectable Cards)  */}
        {/* ======================================================== */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xs sm:text-sm font-bold uppercase tracking-wider text-[#64748B] dark:text-[#94A3B8]">
              Step 1 — Select Information Sources
            </h2>
            <span className="text-xs font-semibold text-[#2563EB] dark:text-[#38BDF8]">
              Multi-selection supported
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            
            {/* Card 1: Resume */}
            <div
              onClick={() => toggleSource('resume')}
              className={`relative p-5 rounded-[18px] border transition-all duration-200 cursor-pointer select-none group flex flex-col justify-between min-h-[175px] ${
                sources.resume
                  ? 'bg-[#EFF6FF] dark:bg-[#102449] border-[#2563EB] dark:border-[#2563EB] ring-2 ring-[#2563EB]/20 shadow-xs'
                  : 'bg-white dark:bg-[#081A3A] border-[#E5E7EB] dark:border-white/[0.08] hover:border-[#2563EB]/40 hover:-translate-y-0.5 hover:shadow-sm'
              }`}
            >
              <div className="flex items-start justify-between gap-3 mb-4">
                <div className={`w-11 h-11 rounded-xl flex items-center justify-center transition-all ${
                  sources.resume
                    ? 'bg-[#2563EB] text-white shadow-xs'
                    : 'bg-blue-50 dark:bg-[#102449] text-[#2563EB] dark:text-[#38BDF8] group-hover:scale-105'
                }`}>
                  <FileText className="w-5 h-5" />
                </div>
                <div className={`w-5 h-5 rounded-md border flex items-center justify-center transition-colors ${
                  sources.resume
                    ? 'bg-[#2563EB] border-[#2563EB] text-white'
                    : 'border-[#CBD5E1] dark:border-white/[0.2] bg-white dark:bg-[#081A3A]'
                }`}>
                  {sources.resume && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                </div>
              </div>
              <div>
                <h3 className="text-base font-bold text-[#111827] dark:text-[#F8FAFC] tracking-tight mb-1">
                  Resume
                </h3>
                <p className="text-xs text-[#64748B] dark:text-[#94A3B8] leading-relaxed">
                  Upload your resume for personalized questions
                </p>
              </div>
            </div>

            {/* Card 2: Job Description */}
            <div
              onClick={() => toggleSource('jobDescription')}
              className={`relative p-5 rounded-[18px] border transition-all duration-200 cursor-pointer select-none group flex flex-col justify-between min-h-[175px] ${
                sources.jobDescription
                  ? 'bg-[#EFF6FF] dark:bg-[#102449] border-[#2563EB] dark:border-[#2563EB] ring-2 ring-[#2563EB]/20 shadow-xs'
                  : 'bg-white dark:bg-[#081A3A] border-[#E5E7EB] dark:border-white/[0.08] hover:border-[#2563EB]/40 hover:-translate-y-0.5 hover:shadow-sm'
              }`}
            >
              <div className="flex items-start justify-between gap-3 mb-4">
                <div className={`w-11 h-11 rounded-xl flex items-center justify-center transition-all ${
                  sources.jobDescription
                    ? 'bg-[#2563EB] text-white shadow-xs'
                    : 'bg-blue-50 dark:bg-[#102449] text-[#2563EB] dark:text-[#38BDF8] group-hover:scale-105'
                }`}>
                  <ClipboardList className="w-5 h-5" />
                </div>
                <div className={`w-5 h-5 rounded-md border flex items-center justify-center transition-colors ${
                  sources.jobDescription
                    ? 'bg-[#2563EB] border-[#2563EB] text-white'
                    : 'border-[#CBD5E1] dark:border-white/[0.2] bg-white dark:bg-[#081A3A]'
                }`}>
                  {sources.jobDescription && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                </div>
              </div>
              <div>
                <h3 className="text-base font-bold text-[#111827] dark:text-[#F8FAFC] tracking-tight mb-1">
                  Job Description
                </h3>
                <p className="text-xs text-[#64748B] dark:text-[#94A3B8] leading-relaxed">
                  Paste the company's job description
                </p>
              </div>
            </div>

            {/* Card 3: Role / Job Title */}
            <div
              onClick={() => toggleSource('role')}
              className={`relative p-5 rounded-[18px] border transition-all duration-200 cursor-pointer select-none group flex flex-col justify-between min-h-[175px] ${
                sources.role
                  ? 'bg-[#EFF6FF] dark:bg-[#102449] border-[#2563EB] dark:border-[#2563EB] ring-2 ring-[#2563EB]/20 shadow-xs'
                  : 'bg-white dark:bg-[#081A3A] border-[#E5E7EB] dark:border-white/[0.08] hover:border-[#2563EB]/40 hover:-translate-y-0.5 hover:shadow-sm'
              }`}
            >
              <div className="flex items-start justify-between gap-3 mb-4">
                <div className={`w-11 h-11 rounded-xl flex items-center justify-center transition-all ${
                  sources.role
                    ? 'bg-[#2563EB] text-white shadow-xs'
                    : 'bg-blue-50 dark:bg-[#102449] text-[#2563EB] dark:text-[#38BDF8] group-hover:scale-105'
                }`}>
                  <Briefcase className="w-5 h-5" />
                </div>
                <div className={`w-5 h-5 rounded-md border flex items-center justify-center transition-colors ${
                  sources.role
                    ? 'bg-[#2563EB] border-[#2563EB] text-white'
                    : 'border-[#CBD5E1] dark:border-white/[0.2] bg-white dark:bg-[#081A3A]'
                }`}>
                  {sources.role && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                </div>
              </div>
              <div>
                <h3 className="text-base font-bold text-[#111827] dark:text-[#F8FAFC] tracking-tight mb-1">
                  Role / Job Title
                </h3>
                <p className="text-xs text-[#64748B] dark:text-[#94A3B8] leading-relaxed">
                  Enter the role you're preparing for
                </p>
              </div>
            </div>

            {/* Card 4: General Interview */}
            <div
              onClick={() => toggleSource('general')}
              className={`relative p-5 rounded-[18px] border transition-all duration-200 cursor-pointer select-none group flex flex-col justify-between min-h-[175px] ${
                sources.general
                  ? 'bg-[#EFF6FF] dark:bg-[#102449] border-[#2563EB] dark:border-[#2563EB] ring-2 ring-[#2563EB]/20 shadow-xs'
                  : 'bg-white dark:bg-[#081A3A] border-[#E5E7EB] dark:border-white/[0.08] hover:border-[#2563EB]/40 hover:-translate-y-0.5 hover:shadow-sm'
              }`}
            >
              <div className="flex items-start justify-between gap-3 mb-4">
                <div className={`w-11 h-11 rounded-xl flex items-center justify-center transition-all ${
                  sources.general
                    ? 'bg-[#2563EB] text-white shadow-xs'
                    : 'bg-blue-50 dark:bg-[#102449] text-[#2563EB] dark:text-[#38BDF8] group-hover:scale-105'
                }`}>
                  <Target className="w-5 h-5" />
                </div>
                <div className={`w-5 h-5 rounded-md border flex items-center justify-center transition-colors ${
                  sources.general
                    ? 'bg-[#2563EB] border-[#2563EB] text-white'
                    : 'border-[#CBD5E1] dark:border-white/[0.2] bg-white dark:bg-[#081A3A]'
                }`}>
                  {sources.general && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                </div>
              </div>
              <div>
                <h3 className="text-base font-bold text-[#111827] dark:text-[#F8FAFC] tracking-tight mb-1">
                  General Interview
                </h3>
                <p className="text-xs text-[#64748B] dark:text-[#94A3B8] leading-relaxed">
                  Practice without uploading anything
                </p>
              </div>
            </div>

          </div>
        </div>

        {/* ======================================================== */}
        {/* STEP 2: DYNAMIC INPUTS (Show only for selected cards)    */}
        {/* ======================================================== */}
        {!sources.general && (sources.resume || sources.jobDescription || sources.role) && (
          <div className="space-y-6 pt-2">
            <h2 className="text-xs sm:text-sm font-bold uppercase tracking-wider text-[#64748B] dark:text-[#94A3B8]">
              Step 2 — Provide Selected Details
            </h2>

            {/* DYNAMIC FIELD: Resume Section */}
            {sources.resume && (
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                transition={{ duration: 0.2 }}
                className="bg-white dark:bg-[#081A3A] p-6 rounded-[20px] border border-[#E5E7EB] dark:border-white/[0.08] shadow-xs space-y-4"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-[#102449] text-[#2563EB] dark:text-[#38BDF8] flex items-center justify-center">
                      <FileText className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="text-sm sm:text-base font-bold text-[#111827] dark:text-[#F8FAFC]">
                        Resume Upload
                      </h3>
                      <p className="text-xs text-[#64748B] dark:text-[#94A3B8]">
                        Accept PDF / DOCX (max 5MB)
                      </p>
                    </div>
                  </div>

                  {resumeFile && (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 text-xs font-bold border border-emerald-200 dark:border-emerald-900/40">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Uploaded
                    </span>
                  )}
                </div>

                {/* Hidden File Input */}
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  accept=".pdf,.doc,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                  className="hidden"
                />

                {resumeFile ? (
                  /* Uploaded File Pill Card */
                  <div className="p-4 rounded-2xl bg-[#EFF6FF] dark:bg-[#102449] border border-[#BFDBFE] dark:border-blue-900/40 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3.5 min-w-0">
                      <div className="w-10 h-10 rounded-xl bg-white dark:bg-[#081A3A] text-[#2563EB] dark:text-[#38BDF8] flex items-center justify-center shrink-0 border border-blue-100 dark:border-white/[0.08]">
                        <FileCheck2 className="w-5 h-5" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-bold text-[#111827] dark:text-[#F8FAFC] truncate">
                          {resumeFile.name}
                        </p>
                        <p className="text-xs text-[#64748B] dark:text-[#94A3B8]">
                          {resumeFile.size} • Ready for analysis
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="px-3 py-1.5 text-xs font-semibold text-[#2563EB] dark:text-[#38BDF8] hover:bg-white dark:hover:bg-[#081A3A] rounded-lg transition-colors cursor-pointer"
                      >
                        Change
                      </button>
                      <button
                        type="button"
                        onClick={handleRemoveResume}
                        className="p-1.5 text-[#64748B] hover:text-rose-600 dark:text-[#94A3B8] dark:hover:text-rose-400 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors cursor-pointer"
                        title="Remove file"
                        aria-label="Remove uploaded resume"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ) : (
                  /* Drag and drop upload zone */
                  <div
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    onClick={() => fileInputRef.current?.click()}
                    className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all duration-200 ${
                      isDragging
                        ? 'border-[#2563EB] bg-[#EFF6FF] dark:bg-[#102449]'
                        : 'border-[#CBD5E1] dark:border-white/[0.12] hover:border-[#2563EB] dark:hover:border-[#2563EB] bg-slate-50/50 dark:bg-[#03112D]/40'
                    }`}
                  >
                    <div className="w-12 h-12 rounded-2xl bg-white dark:bg-[#102449] border border-[#E5E7EB] dark:border-white/[0.08] text-[#2563EB] dark:text-[#38BDF8] flex items-center justify-center mx-auto mb-3 shadow-2xs">
                      <Upload className="w-5 h-5" />
                    </div>
                    <p className="text-sm font-bold text-[#111827] dark:text-[#F8FAFC]">
                      Drag & Drop your resume here, or{' '}
                      <span className="text-[#2563EB] dark:text-[#38BDF8] underline underline-offset-2">browse</span>
                    </p>
                    <p className="text-xs text-[#64748B] dark:text-[#94A3B8] mt-1">
                      Supports PDF, DOC, DOCX up to 5MB
                    </p>
                  </div>
                )}
              </motion.div>
            )}

            {/* ======================================================== */}
            {/* DYNAMIC FIELD: Job Description (Paste Text + Upload PDF) */}
            {/* ======================================================== */}
            {sources.jobDescription && (
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                transition={{ duration: 0.2 }}
                className="bg-white dark:bg-[#081A3A] p-6 rounded-[20px] border border-[#E5E7EB] dark:border-white/[0.08] shadow-xs space-y-4"
              >
                {/* Header & Tabs */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-1 border-b border-[#E5E7EB] dark:border-white/[0.06]">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-[#102449] text-[#2563EB] dark:text-[#38BDF8] flex items-center justify-center">
                      <ClipboardList className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="text-sm sm:text-base font-bold text-[#111827] dark:text-[#F8FAFC]">
                        Job Description
                      </h3>
                      <p className="text-xs text-[#64748B] dark:text-[#94A3B8]">
                        Paste text or upload a PDF specification
                      </p>
                    </div>
                  </div>

                  {/* Two Tabs: Paste Text vs Upload PDF */}
                  <div className="flex items-center p-1 bg-slate-100 dark:bg-[#102449] rounded-xl border border-transparent dark:border-white/[0.08] self-start sm:self-auto">
                    <button
                      type="button"
                      onClick={() => setJdTab('text')}
                      className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                        jdTab === 'text'
                          ? 'bg-white dark:bg-[#2563EB] text-[#111827] dark:text-white shadow-2xs'
                          : 'text-[#64748B] dark:text-[#94A3B8] hover:text-[#111827] dark:hover:text-[#F8FAFC]'
                      }`}
                    >
                      Paste Text
                    </button>
                    <button
                      type="button"
                      onClick={() => setJdTab('pdf')}
                      className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                        jdTab === 'pdf'
                          ? 'bg-white dark:bg-[#2563EB] text-[#111827] dark:text-white shadow-2xs'
                          : 'text-[#64748B] dark:text-[#94A3B8] hover:text-[#111827] dark:hover:text-[#F8FAFC]'
                      }`}
                    >
                      <span>Upload PDF</span>
                      {jdFile && (
                        <span className="w-2 h-2 rounded-full bg-emerald-500" />
                      )}
                    </button>
                  </div>
                </div>

                {/* TAB 1: PASTE TEXT */}
                {jdTab === 'text' && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs text-[#64748B] dark:text-[#94A3B8]">
                      <span>Enter job requirements or paste from the listing:</span>
                      <div className="flex items-center gap-3">
                        {jobDescription.length > 0 && (
                          <button
                            type="button"
                            onClick={() => setJobDescription('')}
                            className="font-semibold text-rose-600 dark:text-rose-400 hover:underline flex items-center gap-1 cursor-pointer transition-colors"
                          >
                            <X className="w-3.5 h-3.5" />
                            <span>Clear text</span>
                          </button>
                        )}
                        <span className="font-mono font-medium">
                          {jobDescription.length} / 3000
                        </span>
                      </div>
                    </div>

                    <textarea
                      value={jobDescription}
                      onChange={(e) => setJobDescription(e.target.value.slice(0, 3000))}
                      placeholder="Paste the complete job description here..."
                      maxLength={3000}
                      className="w-full h-[240px] min-h-[220px] max-h-[360px] p-4 rounded-xl border border-[#E5E7EB] dark:border-white/[0.08] bg-white dark:bg-[#0F2347] text-sm text-[#111827] dark:text-[#F8FAFC] placeholder:text-[#94A3B8] dark:placeholder:text-[#8CA3C7] focus:outline-none focus:border-[#2563EB] focus:ring-4 focus:ring-[#2563EB]/15 transition-all duration-200"
                    />
                  </div>
                )}

                {/* TAB 2: UPLOAD PDF */}
                {jdTab === 'pdf' && (
                  <div className="space-y-4">
                    {/* Hidden PDF file input */}
                    <input
                      type="file"
                      ref={jdFileInputRef}
                      onChange={handleJdFileChange}
                      accept=".pdf,application/pdf"
                      className="hidden"
                    />

                    {/* Progress Bar (while uploading/parsing) */}
                    {jdUploadProgress !== null && (
                      <div className="p-4 rounded-xl bg-blue-50 dark:bg-[#102449] border border-blue-200 dark:border-blue-900/40 space-y-2">
                        <div className="flex items-center justify-between text-xs font-bold text-[#2563EB] dark:text-[#38BDF8]">
                          <span>Extracting Job Description text from PDF...</span>
                          <span>{jdUploadProgress}%</span>
                        </div>
                        <div className="w-full h-2 rounded-full bg-blue-200 dark:bg-blue-950 overflow-hidden">
                          <div 
                            className="h-full bg-[#2563EB] transition-all duration-200"
                            style={{ width: `${jdUploadProgress}%` }}
                          />
                        </div>
                      </div>
                    )}

                    {/* Uploaded PDF Display Card */}
                    {jdFile ? (
                      <div className="space-y-3">
                        <div className="p-4 rounded-2xl bg-[#EFF6FF] dark:bg-[#102449] border border-[#BFDBFE] dark:border-blue-900/40 flex items-center justify-between gap-4">
                          <div className="flex items-center gap-3.5 min-w-0">
                            <div className="w-10 h-10 rounded-xl bg-white dark:bg-[#081A3A] text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0 border border-blue-100 dark:border-white/[0.08]">
                              <File className="w-5 h-5" />
                            </div>
                            <div className="min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <p className="text-sm font-bold text-[#111827] dark:text-[#F8FAFC] truncate">
                                  {jdFile.name}
                                </p>
                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 text-[11px] font-bold border border-emerald-300 dark:border-emerald-800">
                                  <Check className="w-3 h-3 stroke-[3]" />
                                  Parsed
                                </span>
                              </div>
                              <p className="text-xs text-[#64748B] dark:text-[#94A3B8] mt-0.5">
                                📄 {jdFile.name} • {jdFile.size} • Parsed
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 shrink-0">
                            <button
                              type="button"
                              onClick={() => jdFileInputRef.current?.click()}
                              className="px-3 py-1.5 text-xs font-semibold text-[#2563EB] dark:text-[#38BDF8] hover:bg-white dark:hover:bg-[#081A3A] rounded-lg transition-colors cursor-pointer"
                            >
                              Replace
                            </button>
                            <button
                              type="button"
                              onClick={handleRemoveJdFile}
                              className="p-1.5 text-[#64748B] hover:text-rose-600 dark:text-[#94A3B8] dark:hover:text-rose-400 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors cursor-pointer"
                              title="Remove PDF"
                              aria-label="Remove job description PDF"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        </div>

                        {/* Extraction Success Banner */}
                        {jdExtractSuccess && (
                          <div className="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900/40 text-emerald-800 dark:text-emerald-300 text-xs sm:text-sm font-semibold flex items-center gap-2.5">
                            <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                            <span>Job description extracted successfully. You can review or edit it below.</span>
                          </div>
                        )}

                        {/* Editable Extracted Text */}
                        <div className="space-y-1.5 pt-1">
                          <div className="flex items-center justify-between text-xs text-[#64748B] dark:text-[#94A3B8]">
                            <span className="font-semibold text-[#111827] dark:text-[#F8FAFC]">
                              Extracted Job Description Content (Editable):
                            </span>
                            <span className="font-mono">{jobDescription.length} / 3000</span>
                          </div>
                          <textarea
                            value={jobDescription}
                            onChange={(e) => setJobDescription(e.target.value.slice(0, 3000))}
                            placeholder="Parsed job description will appear here for review..."
                            maxLength={3000}
                            className="w-full h-[220px] p-4 rounded-xl border border-[#E5E7EB] dark:border-white/[0.08] bg-white dark:bg-[#0F2347] text-sm text-[#111827] dark:text-[#F8FAFC] placeholder:text-[#94A3B8] dark:placeholder:text-[#8CA3C7] focus:outline-none focus:border-[#2563EB] focus:ring-4 focus:ring-[#2563EB]/15 transition-all duration-200"
                          />
                        </div>
                      </div>
                    ) : (
                      /* Drag & Drop Zone for PDF */
                      <div
                        onDragOver={handleJdDragOver}
                        onDragLeave={handleJdDragLeave}
                        onDrop={handleJdDrop}
                        onClick={() => jdFileInputRef.current?.click()}
                        className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all duration-200 ${
                          jdIsDragging
                            ? 'border-[#2563EB] bg-[#EFF6FF] dark:bg-[#102449]'
                            : 'border-[#CBD5E1] dark:border-white/[0.12] hover:border-[#2563EB] dark:hover:border-[#2563EB] bg-slate-50/50 dark:bg-[#03112D]/40'
                        }`}
                      >
                        <div className="w-12 h-12 rounded-2xl bg-white dark:bg-[#102449] border border-[#E5E7EB] dark:border-white/[0.08] text-[#2563EB] dark:text-[#38BDF8] flex items-center justify-center mx-auto mb-3 shadow-2xs">
                          <Upload className="w-5 h-5" />
                        </div>
                        <p className="text-sm font-bold text-[#111827] dark:text-[#F8FAFC]">
                          Drag & Drop your job description PDF here, or{' '}
                          <span className="text-[#2563EB] dark:text-[#38BDF8] underline underline-offset-2">browse</span>
                        </p>
                        <p className="text-xs text-[#64748B] dark:text-[#94A3B8] mt-1">
                          Accept only .pdf (max 5 MB)
                        </p>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            jdFileInputRef.current?.click();
                          }}
                          className="mt-4 px-4 py-2 bg-white dark:bg-[#102449] border border-[#E5E7EB] dark:border-white/[0.1] hover:border-[#2563EB] text-[#111827] dark:text-[#F8FAFC] text-xs font-bold rounded-xl shadow-2xs hover:bg-[#EFF6FF] dark:hover:bg-[#163060] transition-all cursor-pointer inline-flex items-center gap-1.5"
                        >
                          <File className="w-3.5 h-3.5 text-[#2563EB] dark:text-[#38BDF8]" />
                          <span>Browse PDF</span>
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </motion.div>
            )}

            {/* DYNAMIC FIELD: Role Section */}
            {sources.role && (
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                transition={{ duration: 0.2 }}
                className="bg-white dark:bg-[#081A3A] p-6 rounded-[20px] border border-[#E5E7EB] dark:border-white/[0.08] shadow-xs space-y-4"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-[#102449] text-[#2563EB] dark:text-[#38BDF8] flex items-center justify-center">
                    <Briefcase className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm sm:text-base font-bold text-[#111827] dark:text-[#F8FAFC]">
                      Target Role / Job Title
                    </h3>
                    <p className="text-xs text-[#64748B] dark:text-[#94A3B8]">
                      Specify the career track and seniority level you are targeting
                    </p>
                  </div>
                </div>

                {/* Searchable input */}
                <div>
                  <input
                    type="text"
                    value={roleInput}
                    onChange={(e) => setRoleInput(e.target.value)}
                    placeholder="Software Engineer, Frontend Developer, Data Analyst..."
                    className="w-full h-[52px] px-4 rounded-xl border border-[#E5E7EB] dark:border-white/[0.08] bg-white dark:bg-[#0F2347] text-sm sm:text-base text-[#111827] dark:text-[#F8FAFC] placeholder:text-[#94A3B8] dark:placeholder:text-[#8CA3C7] focus:outline-none focus:border-[#2563EB] focus:ring-4 focus:ring-[#2563EB]/15 transition-all duration-200 shadow-2xs"
                  />
                </div>

                {/* Popular Role Chips */}
                <div className="space-y-2">
                  <span className="text-xs font-semibold text-[#64748B] dark:text-[#94A3B8]">
                    Popular Roles:
                  </span>
                  <div className="flex flex-wrap gap-2">
                    {popularRoles.map((roleName) => {
                      const isSelected = roleInput.toLowerCase() === roleName.toLowerCase();
                      return (
                        <button
                          key={roleName}
                          type="button"
                          onClick={() => setRoleInput(roleName)}
                          className={`px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all duration-180 cursor-pointer ${
                            isSelected
                              ? 'bg-[#2563EB] text-white shadow-xs font-bold'
                              : 'bg-slate-100 dark:bg-[#102449] text-[#111827] dark:text-[#F8FAFC] hover:bg-[#EFF6FF] dark:hover:bg-[#163060] border border-transparent dark:border-white/[0.06]'
                          }`}
                        >
                          {roleName}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </motion.div>
            )}

          </div>
        )}

        {/* GENERAL INTERVIEW INFO NOTICE (When General Interview is chosen) */}
        {sources.general && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-5 rounded-[20px] bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900/40 text-emerald-800 dark:text-emerald-300 flex items-start gap-3.5"
          >
            <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
            <div className="text-sm">
              <p className="font-bold">General Practice Mode Selected</p>
              <p className="text-xs text-emerald-700 dark:text-emerald-400 mt-1 leading-relaxed">
                You will practice comprehensive behavioral, problem-solving, and general technical questions without requiring any resumes or job descriptions. Click Continue to configure question count and format.
              </p>
            </div>
          </motion.div>
        )}

        {/* ======================================================== */}
        {/* SMART TIP CARD                                           */}
        {/* ======================================================== */}
        <div className="p-5 rounded-[20px] bg-[#EFF6FF] dark:bg-[#102449] border border-[#BFDBFE] dark:border-white/[0.08] flex items-start gap-3.5">
          <div className="w-8 h-8 rounded-lg bg-[#2563EB] text-white flex items-center justify-center shrink-0 mt-0.5 shadow-2xs">
            <Sparkles className="w-4 h-4" />
          </div>
          <div className="text-xs sm:text-sm text-[#1E3A8A] dark:text-[#93C5FD] leading-relaxed">
            <span className="font-bold mr-1">Tip:</span>
            More information helps generate better interview questions. Resume improves personalization, Job Description matches company expectations, and Role focuses the interview domain.
          </div>
        </div>

        {/* ======================================================== */}
        {/* BOTTOM STICKY ACTION BAR: CONTINUE BUTTON                */}
        {/* ======================================================== */}
        <div className="sticky bottom-4 z-20 flex items-center justify-between p-4 rounded-2xl bg-white/90 dark:bg-[#081A3A]/90 backdrop-blur-md border border-[#E5E7EB] dark:border-white/[0.08] shadow-lg">
          <div className="hidden sm:block text-xs text-[#64748B] dark:text-[#94A3B8]">
            {isAnySelected ? (
              <span>Ready to personalize your mock interview session.</span>
            ) : (
              <span>Select an information source above to continue.</span>
            )}
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
            <button
              type="button"
              onClick={handleContinue}
              disabled={!isAnySelected}
              className={`w-full sm:w-auto h-[48px] px-8 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all duration-200 cursor-pointer shadow-xs ${
                isAnySelected
                  ? 'bg-[#2563EB] hover:bg-[#1D4ED8] text-white hover:shadow-md hover:-translate-y-0.5 active:translate-y-0'
                  : 'bg-slate-200 dark:bg-slate-800 text-slate-400 dark:text-slate-600 cursor-not-allowed opacity-60'
              }`}
            >
              <span>Continue</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>

      </div>
    </WorkspaceLayout>
  );
}
