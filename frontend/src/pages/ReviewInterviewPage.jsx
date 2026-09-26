import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Briefcase, 
  Layers, 
  ShieldCheck, 
  HelpCircle, 
  Clock, 
  Mic, 
  FileText, 
  CheckCircle2, 
  Sparkles, 
  Play, 
  ArrowLeft, 
  Check, 
  Menu, 
  Loader2, 
  AlertCircle 
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import WorkspaceLayout from '../components/layout/WorkspaceLayout';

export default function ReviewInterviewPage() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [isStarting, setIsStarting] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);

  // Retrieve configured state from localStorage with robust fallbacks
  const role = localStorage.getItem('prepnova_role') || 'Software Engineer';
  const difficulty = localStorage.getItem('prepnova_difficulty') || 'medium';
  const questionCount = Number(localStorage.getItem('prepnova_question_count')) || 15;
  const interviewFormat = localStorage.getItem('prepnova_format') || 'voice';
  const mode = localStorage.getItem('prepnova_mode') || 'role';
  const industry = localStorage.getItem('prepnova_industry') || 'Technology';

  // Parse interview types from localStorage
  const interviewTypes = (() => {
    try {
      const stored = localStorage.getItem('prepnova_interview_types');
      if (stored) return JSON.parse(stored);
    } catch (e) {
      console.error(e);
    }
    return { technical: true, hr: true, behavioral: false, domain: false };
  })();

  // Parse resume data from localStorage (if uploaded)
  const resumeData = (() => {
    try {
      const stored = localStorage.getItem('prepNova_resume');
      if (stored) return JSON.parse(stored);
    } catch (e) {
      console.error(e);
    }
    return null;
  })();

  // Format active interview types with dots: Technical • HR • Project-Based
  const formattedTypes = (() => {
    const active = [];
    if (interviewTypes.technical) active.push('Technical');
    if (interviewTypes.hr) active.push('HR');
    if (interviewTypes.project) active.push('Project-Based');
    if (interviewTypes.skill) active.push('Skill-Based');
    if (interviewTypes.logic) active.push('Logic & Puzzle');
    if (interviewTypes.scenario) active.push('Scenario-Based');
    if (interviewTypes.behavioral) active.push('Behavioral');
    if (interviewTypes.domain) active.push('Domain');
    return active.length > 0 ? active.join(' • ') : 'Technical • HR';
  })();

  // Format difficulty label
  const formattedDifficulty = (() => {
    if (difficulty === 'easy') return 'Easy';
    if (difficulty === 'hard') return 'Hard';
    return 'Medium';
  })();

  // Format estimated time
  const getEstimatedTime = (count) => {
    if (count <= 10) return '~15 Minutes';
    if (count <= 15) return '~25 Minutes';
    if (count <= 20) return '~35 Minutes';
    if (count <= 25) return '~42 Minutes';
    return '~50 Minutes';
  };

  // Format interview mode label & icon
  const formatInfo = (() => {
    if (interviewFormat === 'text') {
      return { label: 'Text Interview', icon: FileText };
    }
    return { label: 'Voice Interview', icon: Mic };
  })();

  const FormatIcon = formatInfo.icon;

  // Determine "Based On" value
  const basedOnText = (resumeData && mode === 'resume') 
    ? 'Your Resume' 
    : 'Job Description';

  // Bottom Navigation Handlers
  const handleBack = () => {
    navigate('/customize');
  };

  // Start Interview Handler (Preserves existing API, payload, and navigation exactly)
  const handleStartInterview = async () => {
    setIsStarting(true);
    setErrorMessage(null);

    const sessionId = `session_${Date.now()}`;
    const userName = user?.name || localStorage.getItem('prepnova_user_name') || 'Candidate';

    try {
      const payload = {
        userName,
        name: userName,
        email: user?.email || '',
        mode,
        role,
        industry,
        difficulty,
        level: difficulty === 'easy' ? 'beginner' : difficulty === 'medium' ? 'intermediate' : 'advanced',
        questionCount,
        format: interviewFormat
      };

      const token = localStorage.getItem("prepNova_token");
      try {
        const response = await fetch("http://localhost:5000/api/interview/start", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...(token && { Authorization: `Bearer ${token}` })
          },
          body: JSON.stringify(payload)
        });

        if (!response.ok) {
          await fetch("http://localhost:5000/api/session/start", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              ...(token && { Authorization: `Bearer ${token}` })
            },
            body: JSON.stringify(payload)
          });
        }
      } catch (networkErr) {
        console.warn("Backend API unavailable, starting session offline:", networkErr);
      }

      // Persist session identifiers
      localStorage.setItem("prepnova_session_id", sessionId);
      localStorage.setItem("prepnova_user_name", userName);
      localStorage.setItem("prepnova_role", role);
      localStorage.setItem("prepnova_difficulty", difficulty);
      localStorage.setItem("prepnova_mode", mode);

      // Navigate to the dedicated interview format room
      const targetRoute = interviewFormat === 'text' ? '/interview/text' : '/interview/voice';
      navigate(targetRoute, {
        state: {
          targetRole: role,
          difficulty,
          format: interviewFormat,
          sessionId,
          interviewTypes
        }
      });
    } catch (err) {
      console.error("Start interview error:", err);
      setErrorMessage("Unable to initialize interview session. Please try again.");
      setIsStarting(false);
    }
  };

  return (
    <WorkspaceLayout title="Review & Start Interview" maxWidth="max-w-[1180px]">
      <div className="w-full space-y-6">
            
            {/* TOP PROGRESS STEPPER: ✓ Role & JD → ✓ Customize → 3 Review (Step 3 highlighted blue) */}
            <div className="w-full max-w-2xl mx-auto px-4 py-2">
              <div className="flex items-center justify-between relative">
                
                {/* Step 1: Role & JD (Completed) */}
                <Link to="/role-job" className="flex items-center gap-2.5 z-10 bg-[#F8FAFC] pr-3 group">
                  <div className="w-8 h-8 rounded-full bg-blue-100 text-[#2563EB] flex items-center justify-center font-bold text-xs border border-blue-200">
                    <Check className="w-4 h-4 text-[#2563EB]" />
                  </div>
                  <span className="text-xs sm:text-sm font-semibold text-[#64748B] group-hover:text-[#2563EB] transition-colors hidden sm:inline">
                    Role & JD
                  </span>
                </Link>

                {/* Connecting Line 1 */}
                <div className="flex-1 h-[2px] bg-[#2563EB] mx-1" />

                {/* Step 2: Customize (Completed) */}
                <Link to="/customize" className="flex items-center gap-2.5 z-10 bg-[#F8FAFC] px-3 group">
                  <div className="w-8 h-8 rounded-full bg-blue-100 text-[#2563EB] flex items-center justify-center font-bold text-xs border border-blue-200">
                    <Check className="w-4 h-4 text-[#2563EB]" />
                  </div>
                  <span className="text-xs sm:text-sm font-semibold text-[#64748B] group-hover:text-[#2563EB] transition-colors hidden sm:inline">
                    Customize
                  </span>
                </Link>

                {/* Connecting Line 2 */}
                <div className="flex-1 h-[2px] bg-[#2563EB] mx-1" />

                {/* Step 3: Review (ACTIVE - highlighted blue) */}
                <div className="flex items-center gap-2.5 z-10 bg-[#F8FAFC] pl-3">
                  <div className="w-8 h-8 rounded-full bg-[#2563EB] text-white flex items-center justify-center font-bold text-xs shadow-xs">
                    3
                  </div>
                  <span className="text-xs sm:text-sm font-bold text-[#2563EB]">
                    Review
                  </span>
                </div>

              </div>
            </div>

            {/* ERROR ALERT (if start fails) */}
            {errorMessage && (
              <div className="max-w-[760px] mx-auto p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs sm:text-sm font-semibold flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* MAIN REVIEW CARD (Centered 700–760px on Desktop, 90% Tablet, Full Width Mobile) */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.18 }}
              className="w-full max-w-[760px] mx-auto bg-white rounded-[20px] border border-[#E5E7EB] p-6 sm:p-8 lg:p-10 shadow-xs hover:-translate-y-0.5 transition-all duration-200"
            >
              
              {/* Header */}
              <div className="mb-8 border-b border-[#E5E7EB] pb-5">
                <h2 className="text-2xl sm:text-3xl font-[800] text-[#0F172A] tracking-tight mb-2">
                  Review Your Interview Setup
                </h2>
                <p className="text-sm sm:text-base text-[#64748B] leading-relaxed">
                  Please verify your interview configuration before starting.
                </p>
              </div>

              {/* Rows of Selected Information */}
              <div className="divide-y divide-[#E5E7EB]/80">
                
                {/* Row 1: Job Role */}
                <div className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 sm:gap-4">
                  <div className="flex items-center gap-3 text-sm text-[#64748B] font-medium">
                    <div className="w-8 h-8 rounded-lg bg-blue-50 text-[#2563EB] flex items-center justify-center shrink-0">
                      <Briefcase className="w-4 h-4" />
                    </div>
                    <span>Job Role</span>
                  </div>
                  <span className="font-bold text-sm sm:text-base text-[#0F172A] sm:text-right pl-11 sm:pl-0">
                    {role}
                  </span>
                </div>

                {/* Row 2: Interview Types */}
                <div className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 sm:gap-4">
                  <div className="flex items-center gap-3 text-sm text-[#64748B] font-medium">
                    <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center shrink-0">
                      <Layers className="w-4 h-4" />
                    </div>
                    <span>Interview Types</span>
                  </div>
                  <span className="font-bold text-sm text-[#0F172A] sm:text-right pl-11 sm:pl-0">
                    {formattedTypes}
                  </span>
                </div>

                {/* Row 3: Difficulty (Blue pill badge) */}
                <div className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 sm:gap-4">
                  <div className="flex items-center gap-3 text-sm text-[#64748B] font-medium">
                    <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                      <ShieldCheck className="w-4 h-4" />
                    </div>
                    <span>Difficulty</span>
                  </div>
                  <div className="pl-11 sm:pl-0">
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-[#EFF6FF] text-[#2563EB] border border-[#BFDBFE]">
                      {formattedDifficulty}
                    </span>
                  </div>
                </div>

                {/* Row 4: Number of Questions */}
                <div className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 sm:gap-4">
                  <div className="flex items-center gap-3 text-sm text-[#64748B] font-medium">
                    <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
                      <HelpCircle className="w-4 h-4" />
                    </div>
                    <span>Number of Questions</span>
                  </div>
                  <span className="font-bold text-sm text-[#0F172A] sm:text-right pl-11 sm:pl-0">
                    {questionCount} Questions
                  </span>
                </div>

                {/* Row 5: Estimated Time */}
                <div className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 sm:gap-4">
                  <div className="flex items-center gap-3 text-sm text-[#64748B] font-medium">
                    <div className="w-8 h-8 rounded-lg bg-blue-50 text-[#2563EB] flex items-center justify-center shrink-0">
                      <Clock className="w-4 h-4" />
                    </div>
                    <span>Estimated Time</span>
                  </div>
                  <span className="font-bold text-sm text-[#0F172A] sm:text-right pl-11 sm:pl-0">
                    {getEstimatedTime(questionCount)}
                  </span>
                </div>

                {/* Row 6: Interview Mode */}
                <div className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 sm:gap-4">
                  <div className="flex items-center gap-3 text-sm text-[#64748B] font-medium">
                    <div className="w-8 h-8 rounded-lg bg-slate-100 text-[#0F172A] flex items-center justify-center shrink-0">
                      <FormatIcon className="w-4 h-4 text-[#2563EB]" />
                    </div>
                    <span>Interview Mode</span>
                  </div>
                  <span className="font-bold text-sm text-[#0F172A] sm:text-right pl-11 sm:pl-0">
                    {formatInfo.label}
                  </span>
                </div>

                {/* Row 7: Based On */}
                <div className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 sm:gap-4">
                  <div className="flex items-center gap-3 text-sm text-[#64748B] font-medium">
                    <div className="w-8 h-8 rounded-lg bg-blue-50 text-[#2563EB] flex items-center justify-center shrink-0">
                      <FileText className="w-4 h-4" />
                    </div>
                    <span>Based On</span>
                  </div>
                  <span className="font-bold text-sm text-[#0F172A] sm:text-right pl-11 sm:pl-0">
                    {basedOnText}
                  </span>
                </div>

              </div>

              {/* RESUME SUMMARY (If Resume Exists) */}
              {resumeData && (
                <div className="mt-6 p-4 sm:p-5 rounded-2xl bg-emerald-50/40 border border-emerald-200/80 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3 truncate">
                    <div className="w-10 h-10 rounded-xl bg-white text-[#16A34A] flex items-center justify-center shrink-0 border border-emerald-200 shadow-2xs">
                      <CheckCircle2 className="w-5 h-5 text-[#16A34A]" />
                    </div>
                    <div className="truncate">
                      <h4 className="text-xs sm:text-sm font-bold text-[#0F172A] truncate">
                        {resumeData.fileName || 'Resume Verified'}
                      </h4>
                      <p className="text-[11px] text-[#16A34A] font-semibold mt-0.5">
                        Resume uploaded successfully • ATS Score: {resumeData.atsScore || 78}%
                      </p>
                    </div>
                  </div>

                  <span className="text-[11px] font-bold text-[#16A34A] bg-white px-2.5 py-1 rounded-full border border-emerald-200 shadow-2xs shrink-0">
                    Verified
                  </span>
                </div>
              )}

              {/* AI NOTICE: Small blue information box */}
              <div className="mt-6 p-4 rounded-xl bg-[#EFF6FF] border border-[#BFDBFE] text-xs sm:text-sm text-[#1E40AF] leading-relaxed flex items-start gap-2.5">
                <Sparkles className="w-4 h-4 text-[#2563EB] shrink-0 mt-0.5" />
                <span>
                  ✨ AI will generate personalized questions using your selected role, experience level, resume, and interview preferences.
                </span>
              </div>

              {/* BOTTOM BUTTONS: Left ← Back, Right Start Interview */}
              <div className="mt-8 pt-6 border-t border-[#E5E7EB] flex flex-col sm:flex-row items-center justify-between gap-4">
                
                {/* Left: Outline Button ← Back */}
                <button
                  type="button"
                  onClick={handleBack}
                  disabled={isStarting}
                  className="w-full sm:w-auto h-[48px] px-6 rounded-xl border border-[#E5E7EB] bg-white hover:bg-slate-50 text-sm font-semibold text-[#0F172A] flex items-center justify-center gap-2 transition-all duration-200 cursor-pointer shadow-2xs disabled:opacity-50"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Back</span>
                </button>

                {/* Right: Primary Blue Button Start Interview (Includes Play Icon) */}
                <button
                  type="button"
                  onClick={handleStartInterview}
                  disabled={isStarting}
                  className="w-full sm:w-auto h-[48px] px-8 rounded-xl bg-[#2563EB] hover:bg-[#1D4ED8] text-white font-bold text-sm flex items-center justify-center gap-2.5 transition-all duration-200 cursor-pointer shadow-xs hover:shadow-md disabled:opacity-75 disabled:cursor-not-allowed"
                >
                  {isStarting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin text-white" />
                      <span>Preparing Interview...</span>
                    </>
                  ) : (
                    <>
                      <Play className="w-4 h-4 fill-current text-white" />
                      <span>Start Interview</span>
                    </>
                  )}
                </button>

              </div>

            </motion.div>

      </div>
    </WorkspaceLayout>
  );
}
