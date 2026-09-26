import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Briefcase, 
  Building2, 
  GraduationCap, 
  UploadCloud, 
  FileText, 
  Check, 
  ArrowLeft, 
  ArrowRight, 
  ChevronDown, 
  Sparkles, 
  AlertCircle, 
  X, 
  Menu, 
  CheckCircle2,
  FileCheck
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import WorkspaceLayout from '../components/layout/WorkspaceLayout';

export default function RoleJobPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const fileInputRef = useRef(null);

  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('select-role'); // 'select-role' | 'upload-jd'

  // Form State
  const [selectedRole, setSelectedRole] = useState(user?.preferredRole || 'Frontend Developer');
  const [industry, setIndustry] = useState('Technology');
  const [experienceLevel, setExperienceLevel] = useState('Mid-Level');
  const [jobDescription, setJobDescription] = useState('');
  const [jdFile, setJdFile] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Popular Roles Chips
  const popularRoles = [
    'Software Engineer',
    'Frontend Developer',
    'Backend Developer',
    'Full Stack',
    'Data Analyst',
    'DevOps',
    'Product Manager',
    'QA Engineer',
    'HR Executive',
    'Marketing Executive'
  ];

  // Industry Options
  const industries = [
    'Technology',
    'Finance & Fintech',
    'Healthcare & Biotech',
    'Education & EdTech',
    'E-Commerce & Retail',
    'Consulting & Services'
  ];

  // Experience Level Options
  const experienceLevels = [
    'Fresher (0–1 years)',
    'Junior (1–3 years)',
    'Mid-Level (3–5 years)',
    'Senior (5+ years)',
    'Lead / Staff (8+ years)'
  ];

  // All Available Roles for Dropdown
  const allRoles = [
    'Frontend Developer',
    'Backend Developer',
    'Full Stack Engineer',
    'Software Engineer',
    'React Developer',
    'Python Developer',
    'Java Developer',
    'Node.js Developer',
    'AI Engineer',
    'ML Engineer',
    'Prompt Engineer',
    'Data Analyst',
    'Data Engineer',
    'Cloud Architect',
    'DevOps Engineer',
    'Site Reliability Engineer (SRE)',
    'Cybersecurity Analyst',
    'Product Manager',
    'QA Engineer',
    'HR Executive',
    'Marketing Executive',
    'Engineering Manager'
  ];

  // Drag and Drop handlers for JD upload
  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const processJdFile = (file) => {
    if (!file) return;
    const validExtensions = ['.pdf', '.txt', '.docx'];
    const hasValidExt = validExtensions.some(ext => file.name.toLowerCase().endsWith(ext));
    
    if (!hasValidExt) {
      setError('Please upload a PDF or TXT file.');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError('File size must be under 5MB.');
      return;
    }

    setError(null);
    setJdFile(file);

    // If it's a text file, preview text into textarea
    if (file.type === 'text/plain' || file.name.endsWith('.txt')) {
      const reader = new FileReader();
      reader.onload = (e) => {
        if (e.target?.result) {
          setJobDescription(e.target.result);
        }
      };
      reader.readAsText(file);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processJdFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      processJdFile(e.target.files[0]);
    }
  };

  // Bottom Navigation Handlers
  const handleBack = () => {
    navigate('/setup');
  };

  const handleNext = async () => {
    if (!selectedRole || !selectedRole.trim()) {
      setError('Please select or specify a target role.');
      return;
    }

    setError(null);
    setIsSubmitting(true);

    try {
      // Map experience level to difficulty
      const diffMap = {
        'Fresher (0–1 years)': 'easy',
        'Junior (1–3 years)': 'easy',
        'Mid-Level (3–5 years)': 'medium',
        'Senior (5+ years)': 'hard',
        'Lead / Staff (8+ years)': 'hard'
      };
      const difficulty = diffMap[experienceLevel] || 'medium';

      const payload = {
        userName: user?.name || 'Candidate',
        name: user?.name || 'Candidate',
        email: user?.email || '',
        mode: 'role',
        role: selectedRole.trim(),
        industry,
        experienceLevel,
        difficulty,
        level: difficulty === 'easy' ? 'beginner' : difficulty === 'medium' ? 'intermediate' : 'advanced',
        jobDescription: jobDescription.trim() || undefined
      };

      const token = localStorage.getItem("prepNova_token");
      
      try {
        await fetch("http://localhost:5000/api/interview/start", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...(token && { Authorization: `Bearer ${token}` })
          },
          body: JSON.stringify(payload)
        });
      } catch (networkErr) {
        console.warn("Backend unavailable, continuing offline session:", networkErr);
      }

      // Store in localStorage for Step 2: Customize Interview
      localStorage.setItem("prepnova_role", selectedRole.trim());
      localStorage.setItem("prepnova_difficulty", difficulty);
      localStorage.setItem("prepnova_mode", "role");
      localStorage.setItem("prepnova_industry", industry);
      localStorage.setItem("prepnova_experience_level", experienceLevel);
      if (jobDescription) {
        localStorage.setItem("prepnova_job_description", jobDescription);
      }

      // Navigate to Step 2: Customize Interview
      navigate('/customize');
    } catch (err) {
      console.error("Navigation error:", err);
      setError("Unable to initialize interview. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <WorkspaceLayout title="Role & Configuration" maxWidth="max-w-[1180px]">
      <div className="w-full space-y-6">
            
            {/* TOP PROGRESS INDICATOR: [1 Role & JD] ---- [2 Customize] ---- [3 Review] */}
            <div className="w-full max-w-2xl mx-auto px-4 py-2">
              <div className="flex items-center justify-between relative">
                
                {/* Step 1: Role & JD (Active / Current) */}
                <div className="flex items-center gap-2.5 z-10 bg-[#F8FAFC] pr-3">
                  <div className="w-8 h-8 rounded-full bg-[#2563EB] text-white flex items-center justify-center font-bold text-xs shadow-xs">
                    1
                  </div>
                  <span className="text-xs sm:text-sm font-bold text-[#2563EB]">
                    Role & JD
                  </span>
                </div>

                {/* Connecting Line 1 */}
                <div className="flex-1 h-[2px] bg-[#E5E7EB] mx-1" />

                {/* Step 2: Customize */}
                <div className="flex items-center gap-2.5 z-10 bg-[#F8FAFC] px-3">
                  <div className="w-8 h-8 rounded-full bg-white border border-[#CBD5E1] text-[#64748B] flex items-center justify-center font-bold text-xs">
                    2
                  </div>
                  <span className="text-xs sm:text-sm font-medium text-[#64748B] hidden sm:inline">
                    Customize
                  </span>
                </div>

                {/* Connecting Line 2 */}
                <div className="flex-1 h-[2px] bg-[#E5E7EB] mx-1" />

                {/* Step 3: Review */}
                <div className="flex items-center gap-2.5 z-10 bg-[#F8FAFC] pl-3">
                  <div className="w-8 h-8 rounded-full bg-white border border-[#CBD5E1] text-[#64748B] flex items-center justify-center font-bold text-xs">
                    3
                  </div>
                  <span className="text-xs sm:text-sm font-medium text-[#64748B] hidden sm:inline">
                    Review
                  </span>
                </div>

              </div>
            </div>

            {/* ERROR ALERT */}
            {error && (
              <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs sm:text-sm font-semibold flex items-center justify-between gap-3 animate-in fade-in">
                <div className="flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                  <span>{error}</span>
                </div>
                <button 
                  onClick={() => setError(null)} 
                  className="text-rose-500 hover:text-rose-800"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}

            {/* MAIN CARD (White, Radius 20px, Generous Spacing) */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className="bg-white rounded-[20px] border border-[#E5E7EB] p-6 sm:p-8 lg:p-10 shadow-xs"
            >
              {/* Header */}
              <div className="mb-8">
                <h2 className="text-2xl sm:text-3xl font-[800] text-[#0F172A] tracking-tight mb-2">
                  Select Role & Job Description
                </h2>
                <p className="text-sm sm:text-base text-[#64748B] max-w-2xl leading-relaxed">
                  Choose your target role and optionally add a job description to generate personalized interview questions.
                </p>
              </div>

              {/* Pill Segmented Tabs with Animated Blue Indicator */}
              <div className="mb-8">
                <div className="flex items-center p-1.5 bg-slate-100/90 rounded-2xl w-fit border border-[#E5E7EB]">
                  <button
                    type="button"
                    onClick={() => setActiveTab('select-role')}
                    className={`relative px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all duration-200 cursor-pointer ${
                      activeTab === 'select-role'
                        ? 'bg-[#2563EB] text-white shadow-xs'
                        : 'text-[#64748B] hover:text-[#0F172A]'
                    }`}
                  >
                    Select Role
                  </button>

                  <button
                    type="button"
                    onClick={() => setActiveTab('upload-jd')}
                    className={`relative px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all duration-200 cursor-pointer ${
                      activeTab === 'upload-jd'
                        ? 'bg-[#2563EB] text-white shadow-xs'
                        : 'text-[#64748B] hover:text-[#0F172A]'
                    }`}
                  >
                    Upload Job Description
                  </button>
                </div>
              </div>

              {/* TABS CONTENT */}
              <AnimatePresence mode="wait">
                
                {/* TAB 1: SELECT ROLE (Active by default) */}
                {activeTab === 'select-role' ? (
                  <motion.div
                    key="tab-select-role"
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{ duration: 0.2 }}
                    className="space-y-8"
                  >
                    {/* 2-Column Dropdown Grid (Desktop & Tablet: 2 cols, Mobile: 1 col) */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      
                      {/* Section 1 — Job Role Dropdown */}
                      <div className="space-y-2">
                        <label className="block text-xs font-bold uppercase tracking-wider text-[#0F172A]">
                          Job Role <span className="text-rose-500">*</span>
                        </label>
                        <div className="relative">
                          <select
                            value={selectedRole}
                            onChange={(e) => {
                              setSelectedRole(e.target.value);
                              if (error) setError(null);
                            }}
                            className="w-full appearance-none px-4 py-3.5 rounded-xl border border-[#E5E7EB] bg-slate-50/60 hover:border-slate-300 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20 text-sm font-semibold text-[#0F172A] transition-all duration-200 cursor-pointer"
                          >
                            <option value="" disabled>Select a role</option>
                            {allRoles.map(role => (
                              <option key={role} value={role} className="text-[#0F172A] font-medium">
                                {role}
                              </option>
                            ))}
                          </select>
                          <ChevronDown className="w-4 h-4 text-[#64748B] absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none" />
                        </div>
                      </div>

                      {/* Section 2 — Industry Dropdown */}
                      <div className="space-y-2">
                        <label className="block text-xs font-bold uppercase tracking-wider text-[#0F172A]">
                          Industry
                        </label>
                        <div className="relative">
                          <select
                            value={industry}
                            onChange={(e) => setIndustry(e.target.value)}
                            className="w-full appearance-none px-4 py-3.5 rounded-xl border border-[#E5E7EB] bg-slate-50/60 hover:border-slate-300 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20 text-sm font-semibold text-[#0F172A] transition-all duration-200 cursor-pointer"
                          >
                            {industries.map(ind => (
                              <option key={ind} value={ind} className="text-[#0F172A] font-medium">
                                {ind}
                              </option>
                            ))}
                          </select>
                          <ChevronDown className="w-4 h-4 text-[#64748B] absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none" />
                        </div>
                      </div>

                      {/* Section 3 — Experience Level Dropdown */}
                      <div className="space-y-2 md:col-span-2">
                        <label className="block text-xs font-bold uppercase tracking-wider text-[#0F172A]">
                          Experience Level
                        </label>
                        <div className="relative">
                          <select
                            value={experienceLevel}
                            onChange={(e) => setExperienceLevel(e.target.value)}
                            className="w-full appearance-none px-4 py-3.5 rounded-xl border border-[#E5E7EB] bg-slate-50/60 hover:border-slate-300 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20 text-sm font-semibold text-[#0F172A] transition-all duration-200 cursor-pointer"
                          >
                            {experienceLevels.map(lvl => (
                              <option key={lvl} value={lvl} className="text-[#0F172A] font-medium">
                                {lvl}
                              </option>
                            ))}
                          </select>
                          <ChevronDown className="w-4 h-4 text-[#64748B] absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none" />
                        </div>
                      </div>

                    </div>

                    {/* Popular Roles Chips */}
                    <div className="pt-2">
                      <span className="block text-xs font-bold uppercase tracking-wider text-[#64748B] mb-3">
                        Popular Roles
                      </span>

                      <div className="flex flex-wrap gap-2.5">
                        {popularRoles.map((role) => {
                          const isSelected = selectedRole === role;
                          return (
                            <button
                              key={role}
                              type="button"
                              onClick={() => {
                                setSelectedRole(role);
                                if (error) setError(null);
                              }}
                              className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm transition-all duration-200 cursor-pointer flex items-center gap-1.5 ${
                                isSelected
                                  ? 'bg-blue-50 border-2 border-[#2563EB] text-[#2563EB] font-bold shadow-xs'
                                  : 'bg-white border border-[#E5E7EB] text-[#0F172A] font-medium hover:-translate-y-0.5 hover:border-slate-300'
                              }`}
                            >
                              {isSelected && <Check className="w-3.5 h-3.5 text-[#2563EB]" />}
                              <span>{role}</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </motion.div>
                ) : (
                  /* TAB 2: UPLOAD JOB DESCRIPTION */
                  <motion.div
                    key="tab-upload-jd"
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{ duration: 0.2 }}
                    className="space-y-6"
                  >
                    {/* Hidden input for JD file upload */}
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleFileChange}
                      accept=".pdf,.txt,.docx,application/pdf,text/plain"
                      className="hidden"
                    />

                    {/* Drag & Drop Upload Area */}
                    <div
                      onDragOver={handleDragOver}
                      onDragLeave={handleDragLeave}
                      onDrop={handleDrop}
                      onClick={() => fileInputRef.current?.click()}
                      className={`relative flex flex-col items-center justify-center p-8 rounded-[18px] border-2 border-dashed cursor-pointer transition-all duration-200 ${
                        isDragging
                          ? 'border-[#2563EB] bg-blue-50/50'
                          : 'border-[#E5E7EB] bg-slate-50/50 hover:bg-slate-50 hover:border-slate-300'
                      }`}
                    >
                      <div className="w-12 h-12 rounded-2xl bg-blue-50 text-[#2563EB] flex items-center justify-center mb-3 border border-blue-100">
                        <UploadCloud className="w-6 h-6" />
                      </div>
                      
                      <p className="text-sm font-bold text-[#0F172A] mb-1">
                        Upload JD (PDF or TXT)
                      </p>
                      <p className="text-xs text-[#64748B]">
                        Drag and drop file here, or click to browse (up to 5MB)
                      </p>

                      {jdFile && (
                        <div className="mt-4 px-3 py-1.5 rounded-lg bg-white border border-[#E5E7EB] text-xs font-semibold text-[#2563EB] flex items-center gap-2">
                          <FileCheck className="w-4 h-4" />
                          <span>{jdFile.name}</span>
                        </div>
                      )}
                    </div>

                    {/* "or" Separator */}
                    <div className="relative flex items-center justify-center">
                      <div className="flex-grow border-t border-[#E5E7EB]" />
                      <span className="px-3 text-xs font-bold uppercase tracking-wider text-[#64748B] bg-white">
                        or
                      </span>
                      <div className="flex-grow border-t border-[#E5E7EB]" />
                    </div>

                    {/* Paste Job Description Large Textarea */}
                    <div className="space-y-2">
                      <label className="block text-xs font-bold uppercase tracking-wider text-[#0F172A]">
                        Paste Job Description
                      </label>
                      <textarea
                        rows={6}
                        value={jobDescription}
                        onChange={(e) => setJobDescription(e.target.value)}
                        placeholder="Paste the job description or role requirements here..."
                        className="w-full p-4 rounded-[16px] border border-[#E5E7EB] bg-slate-50/40 hover:border-slate-300 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20 text-sm font-normal text-[#0F172A] leading-relaxed transition-all duration-200"
                      />
                    </div>
                  </motion.div>
                )}

              </AnimatePresence>

              {/* Bottom Navigation */}
              <div className="mt-10 pt-6 border-t border-[#E5E7EB] flex flex-col sm:flex-row items-center justify-between gap-4">
                
                {/* Left: Outline button ← Back */}
                <button
                  type="button"
                  onClick={handleBack}
                  className="w-full sm:w-auto h-[48px] px-6 rounded-xl border border-[#E5E7EB] bg-white hover:bg-slate-50 text-sm font-semibold text-[#0F172A] flex items-center justify-center gap-2 transition-all duration-200 cursor-pointer shadow-2xs"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Back</span>
                </button>

                {/* Right: Blue button Next → */}
                <button
                  type="button"
                  onClick={handleNext}
                  disabled={isSubmitting}
                  className="w-full sm:w-auto h-[48px] px-8 rounded-xl bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-sm font-bold flex items-center justify-center gap-2 transition-all duration-200 cursor-pointer shadow-xs hover:shadow-md disabled:opacity-50"
                >
                  <span>{isSubmitting ? 'Starting...' : 'Next'}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>

              </div>

            </motion.div>

      </div>
    </WorkspaceLayout>
  );
}
