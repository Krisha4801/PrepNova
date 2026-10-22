import React, { useState, useEffect } from 'react';
import { 
  Play, 
  ArrowLeft, 
  Check, 
  ChevronRight, 
  Sparkles, 
  Layers, 
  Clock, 
  Mic, 
  FileText, 
  ShieldCheck, 
  Loader2, 
  AlertCircle,
  CheckCircle2,
  AlertTriangle,
  Info,
  ShieldAlert,
  HelpCircle,
  Compass
} from 'lucide-react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import WorkspaceLayout from '../components/layout/WorkspaceLayout';
import { useAuth } from '../context/AuthContext';
import { validateInterviewInputsApi } from '../lib/api';

export default function ReviewInterviewPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();

  const [isStarting, setIsStarting] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);

  // Fit & Alignment State
  const [isValidating, setIsValidating] = useState(true);
  const [fitData, setFitData] = useState(null);
  const [selectedClarificationRole, setSelectedClarificationRole] = useState(null);

  // Retrieve configured state
  const mode = location.state?.mode || localStorage.getItem('prepnova_session_mode') || null;
  const roleRequiredModes = ['role', 'resume_role', 'role_jd', 'resume_jd_role'];
  const isRoleMode = roleRequiredModes.includes(mode);
  const initialRole = isRoleMode ? (location.state?.role || localStorage.getItem('prepnova_role') || '') : '';
  const difficulty = location.state?.difficulty || localStorage.getItem('prepnova_difficulty') || 'intermediate';
  const questionCount = location.state?.questionCount || Number(localStorage.getItem('prepnova_question_count')) || 6;
  const interviewMode = location.state?.interviewMode || localStorage.getItem('prepnova_mode') || 'Text';
  const selectedSkills = location.state?.selectedSkills || JSON.parse(localStorage.getItem('prepnova_skills') || '[]');

  const resumePermittedModes = ['resume', 'resume_jd', 'resume_role', 'resume_jd_role'];
  const jdPermittedModes = ['jd', 'resume_jd', 'role_jd', 'resume_jd_role'];
  const resumeId = resumePermittedModes.includes(mode)
    ? (location.state?.resumeId || localStorage.getItem('prepnova_resume_id') || null)
    : null;
  const jdId = jdPermittedModes.includes(mode)
    ? (location.state?.jdId || localStorage.getItem('prepnova_jd_id') || null)
    : null;

  // Active target role (allowing candidate to override if clarification was prompted)
  const effectiveRole = selectedClarificationRole || initialRole;

  // Run pre-interview 6-dimension fit validation
  useEffect(() => {
    let isMounted = true;

    async function runFitValidation() {
      setIsValidating(true);
      try {
        const payload = {
          role: isRoleMode ? initialRole : (initialRole || undefined),
          resumeId: resumeId || null,
          jdId: jdId || null,
          mode: mode || undefined
        };
        const res = await validateInterviewInputsApi(payload);
        if (isMounted && res) {
          setFitData(res);
          if (res.target_role_detected && !initialRole) {
            setSelectedClarificationRole(res.target_role_detected);
          }
        }
      } catch (err) {
        console.warn('Pre-flight fit validation advisory notice:', err);
      } finally {
        if (isMounted) setIsValidating(false);
      }
    }

    runFitValidation();
    return () => { isMounted = false; };
  }, [initialRole, resumeId, jdId, mode, isRoleMode]);

  const handleLaunch = async () => {
    setIsStarting(true);
    setErrorMessage(null);

    const roleToUse = effectiveRole || (isRoleMode ? initialRole : (initialRole || undefined));

    try {
      const token = localStorage.getItem('prepNova_token');
      const response = await fetch('http://localhost:5000/api/interview/start', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { Authorization: `Bearer ${token}` })
        },
        body: JSON.stringify({
          name: user?.name || 'Candidate',
          role: roleToUse,
          level: difficulty.toLowerCase(),
          mode: mode || undefined,
          resumeId: resumeId || null,
          jdId: jdId || null,
          maxQuestions: questionCount,
          focusAreas: selectedSkills
        })
      });

      if (response.ok) {
        const data = await response.json();
        if (data.sessionId) {
          localStorage.setItem('prepnova_session_id', data.sessionId);
        }
        navigate(`/interview/${data.sessionId || 'session'}`, {
          state: {
            role: data.matchedRole || roleToUse,
            difficulty,
            questionCount,
            interviewMode,
            sessionId: data.sessionId,
            firstQuestion: data.question,
            resumeId,
            jdId
          }
        });
      } else {
        const errData = await response.json().catch(() => ({}));
        setErrorMessage(errData.error || 'Failed to start interview session. Please try again.');
        setIsStarting(false);
        return;
      }
    } catch (err) {
      console.warn('Network issue starting interview, continuing with client session:', err);
      navigate('/interview', {
        state: {
          role: roleToUse,
          difficulty,
          questionCount,
          interviewMode
        }
      });
    } finally {
      setIsStarting(false);
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'READY':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
            <CheckCircle2 className="w-3.5 h-3.5" />
            Ready • Strong Alignment
          </span>
        );
      case 'READY_WITH_WARNINGS':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-300 dark:border-amber-800">
            <AlertTriangle className="w-3.5 h-3.5" />
            Ready with Advisories
          </span>
        );
      case 'NEEDS_CLARIFICATION':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-purple-100 text-purple-800 dark:bg-purple-950/60 dark:text-purple-300 border border-purple-300 dark:border-purple-800">
            <HelpCircle className="w-3.5 h-3.5" />
            Clarification Needed
          </span>
        );
      case 'INSUFFICIENT_EVIDENCE':
      case 'INVALID_INPUT':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300 border border-rose-300 dark:border-rose-800">
            <ShieldAlert className="w-3.5 h-3.5" />
            Insufficient Evidence
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-indigo-100 text-indigo-800 dark:bg-indigo-950/60 dark:text-indigo-300 border border-indigo-300 dark:border-indigo-800">
            <Sparkles className="w-3.5 h-3.5" />
            Analyzed
          </span>
        );
    }
  };

  return (
    <WorkspaceLayout title="Review & Launch">
      <div className="max-w-3xl mx-auto space-y-7">
        
        {/* Step Progression Bar */}
        <div className="flex items-center justify-between px-2 text-xs font-semibold text-slate-400">
          <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400">
            <span className="w-5 h-5 rounded-full bg-indigo-600 text-white flex items-center justify-center text-[11px]"><Check className="w-3 h-3" /></span>
            <span>Source & Role Setup</span>
          </div>
          <ChevronRight className="w-4 h-4 text-slate-300 dark:text-slate-700" />
          <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400">
            <span className="w-5 h-5 rounded-full bg-indigo-600 text-white flex items-center justify-center text-[11px]"><Check className="w-3 h-3" /></span>
            <span>Interview Parameters</span>
          </div>
          <ChevronRight className="w-4 h-4 text-slate-300 dark:text-slate-700" />
          <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400 font-bold">
            <span className="w-5 h-5 rounded-full bg-indigo-600 text-white flex items-center justify-center text-[11px]">3</span>
            <span>Review & Launch</span>
          </div>
        </div>

        {/* Main Review Card */}
        <div className="panel-card space-y-6">
          <div>
            <span className="badge-primary mb-2">Step 3 of 3 • Final Verification</span>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">
              Ready to Launch Your Mock Interview
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
              Verify your session parameters and AI fit assessment below. Once started, you will be presented with {questionCount} adaptive questions.
            </p>
          </div>

          {errorMessage && (
            <div className="p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 text-rose-700 dark:text-rose-300 rounded-xl text-xs font-medium flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Configuration Summary Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                {isRoleMode ? 'Target Role' : 'Interview Focus'}
              </span>
              <span className="text-sm font-bold text-slate-900 dark:text-slate-100 mt-1 block">
                {effectiveRole || (isRoleMode
                  ? (initialRole || 'Custom Role')
                  : mode === 'resume'
                  ? 'Resume-Driven Evaluation'
                  : mode === 'jd'
                  ? 'Job Description Evaluation'
                  : mode === 'resume_jd'
                  ? 'Resume & Job Description Match'
                  : 'General Practice Evaluation')}
              </span>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Context Mode</span>
              <span className="text-sm font-bold text-slate-900 dark:text-slate-100 mt-1 block capitalize">
                {mode ? mode.replace(/_/g, ' + ') : 'Auto-detected'}
              </span>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Difficulty Level</span>
              <span className="text-sm font-bold text-slate-900 dark:text-slate-100 mt-1 block capitalize">{difficulty}</span>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Session Volume</span>
              <span className="text-sm font-bold text-slate-900 dark:text-slate-100 mt-1 block">{questionCount} Questions</span>
            </div>

            {resumeId && (
              <div className="p-4 rounded-xl bg-emerald-50/60 dark:bg-emerald-950/20 border border-emerald-200/80 dark:border-emerald-900/40">
                <span className="text-[11px] font-bold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider block">Connected Resume</span>
                <span className="text-sm font-bold text-slate-900 dark:text-slate-100 mt-1 block truncate">
                  {location.state?.resumeDoc?.name || localStorage.getItem('prepnova_resume_name') || 'Saved Resume'}
                </span>
              </div>
            )}

            {jdId && (
              <div className="p-4 rounded-xl bg-blue-50/60 dark:bg-blue-950/20 border border-blue-200/80 dark:border-blue-900/40">
                <span className="text-[11px] font-bold text-blue-700 dark:text-blue-400 uppercase tracking-wider block">Connected Job Description</span>
                <span className="text-sm font-bold text-slate-900 dark:text-slate-100 mt-1 block truncate">
                  {location.state?.jdDoc?.name || 'Active Job Description'}
                </span>
              </div>
            )}
          </div>

          {/* AI Explainable Fit Assessment Panel */}
          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-gradient-to-b from-slate-50/60 to-slate-100/30 dark:from-slate-900/50 dark:to-slate-900/20 p-5 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-indigo-100 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                  <Compass className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                    Explainable Multi-Dimension Fit Assessment
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    6-dimension objective alignment calibration
                  </p>
                </div>
              </div>
              <div>
                {isValidating ? (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    Calibrating fit...
                  </span>
                ) : fitData ? (
                  getStatusBadge(fitData.status)
                ) : null}
              </div>
            </div>

            {/* User message from validation engine */}
            {fitData?.user_message && (
              <div className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/70 dark:border-slate-800 text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
                {fitData.user_message}
              </div>
            )}

            {/* 6-Dimension Progress Metrics */}
            {fitData?.fit_dimensions && (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-2">
                <div className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-200/70 dark:border-slate-800">
                  <div className="flex justify-between items-center text-xs mb-1">
                    <span className="text-slate-500 font-medium">Skill Alignment</span>
                    <span className="font-bold text-slate-800 dark:text-slate-200">{Math.round(fitData.fit_dimensions.skill_alignment)}%</span>
                  </div>
                  <div className="w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
                    <div 
                      className="bg-indigo-600 h-full rounded-full transition-all duration-500" 
                      style={{ width: `${Math.min(100, Math.max(0, fitData.fit_dimensions.skill_alignment))}%` }}
                    />
                  </div>
                </div>

                <div className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-200/70 dark:border-slate-800">
                  <div className="flex justify-between items-center text-xs mb-1">
                    <span className="text-slate-500 font-medium">Experience Fit</span>
                    <span className="font-bold text-slate-800 dark:text-slate-200">{Math.round(fitData.fit_dimensions.experience_alignment)}%</span>
                  </div>
                  <div className="w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
                    <div 
                      className="bg-emerald-600 h-full rounded-full transition-all duration-500" 
                      style={{ width: `${Math.min(100, Math.max(0, fitData.fit_dimensions.experience_alignment))}%` }}
                    />
                  </div>
                </div>

                <div className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-200/70 dark:border-slate-800">
                  <div className="flex justify-between items-center text-xs mb-1">
                    <span className="text-slate-500 font-medium">Project Evidence</span>
                    <span className="font-bold text-slate-800 dark:text-slate-200">{Math.round(fitData.fit_dimensions.project_evidence)}%</span>
                  </div>
                  <div className="w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
                    <div 
                      className="bg-blue-600 h-full rounded-full transition-all duration-500" 
                      style={{ width: `${Math.min(100, Math.max(0, fitData.fit_dimensions.project_evidence))}%` }}
                    />
                  </div>
                </div>

                <div className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-200/70 dark:border-slate-800">
                  <div className="flex justify-between items-center text-xs mb-1">
                    <span className="text-slate-500 font-medium">Semantic Relevance</span>
                    <span className="font-bold text-slate-800 dark:text-slate-200">{Math.round(fitData.fit_dimensions.semantic_relevance)}%</span>
                  </div>
                  <div className="w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
                    <div 
                      className="bg-violet-600 h-full rounded-full transition-all duration-500" 
                      style={{ width: `${Math.min(100, Math.max(0, fitData.fit_dimensions.semantic_relevance))}%` }}
                    />
                  </div>
                </div>

                <div className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-200/70 dark:border-slate-800">
                  <div className="flex justify-between items-center text-xs mb-1">
                    <span className="text-slate-500 font-medium">Confidence</span>
                    <span className="font-bold text-slate-800 dark:text-slate-200">{Math.round(fitData.fit_dimensions.evidence_confidence)}%</span>
                  </div>
                  <div className="w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
                    <div 
                      className="bg-amber-600 h-full rounded-full transition-all duration-500" 
                      style={{ width: `${Math.min(100, Math.max(0, fitData.fit_dimensions.evidence_confidence))}%` }}
                    />
                  </div>
                </div>

                <div className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-200/70 dark:border-slate-800">
                  <div className="flex justify-between items-center text-xs mb-1">
                    <span className="text-slate-500 font-medium">Critical Gaps</span>
                    <span className={`font-bold ${fitData.fit_dimensions.critical_gaps_count > 0 ? 'text-rose-600 dark:text-rose-400' : 'text-emerald-600 dark:text-emerald-400'}`}>
                      {fitData.fit_dimensions.critical_gaps_count} identified
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-400 truncate">
                    {fitData.fit_dimensions.critical_gaps_count > 0 ? 'Foundation focus' : 'Core requirements met'}
                  </div>
                </div>
              </div>
            )}

            {/* Role Conflict Clarification Selector */}
            {fitData?.role_conflict_detected && fitData?.clarification_options?.length > 0 && (
              <div className="p-4 rounded-xl bg-purple-50/70 dark:bg-purple-950/30 border border-purple-200 dark:border-purple-900/60 space-y-3">
                <div className="flex items-center gap-2 text-purple-900 dark:text-purple-200 text-xs font-bold uppercase tracking-wider">
                  <HelpCircle className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                  <span>Target Role Focus Clarification</span>
                </div>
                <p className="text-xs text-purple-800 dark:text-purple-300">
                  The uploaded job description diverges from your entered target role. Select your preferred interview alignment:
                </p>
                <div className="flex flex-col sm:flex-row gap-2">
                  {fitData.clarification_options.map((opt) => (
                    <button
                      key={opt}
                      type="button"
                      onClick={() => setSelectedClarificationRole(opt)}
                      className={`px-3 py-2 text-xs font-semibold rounded-lg border transition-all text-left flex items-center justify-between ${
                        effectiveRole === opt
                          ? 'bg-purple-600 text-white border-purple-600 shadow-xs'
                          : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 border-slate-300 dark:border-slate-700 hover:border-purple-400'
                      }`}
                    >
                      <span>Focus on: {opt}</span>
                      {effectiveRole === opt && <Check className="w-3.5 h-3.5 ml-2 shrink-0" />}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Critical Missing Requirements Banner (PDF §9) */}
            {fitData?.critical_missing_requirements?.length > 0 && (
              <div className="p-4 rounded-xl bg-amber-50/80 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/60 space-y-2">
                <div className="flex items-center gap-2 text-amber-900 dark:text-amber-200 text-xs font-bold uppercase tracking-wider">
                  <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                  <span>Missing Role-Critical Requirements</span>
                </div>
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {fitData.critical_missing_requirements.map((item) => (
                    <span key={item} className="px-2 py-0.5 rounded text-[11px] font-semibold bg-amber-200/60 dark:bg-amber-900/50 text-amber-900 dark:text-amber-200">
                      {item}
                    </span>
                  ))}
                </div>
                <p className="text-xs text-amber-800 dark:text-amber-300 pt-1 leading-relaxed">
                  You can continue with practice despite the identified gaps, but questions will focus heavily on validating foundational knowledge and transferable skills.
                </p>
              </div>
            )}

            {/* Keyword Stuffing Advisory */}
            {fitData?.keyword_stuffing_warning && (
              <div className="p-3 rounded-xl bg-orange-50 dark:bg-orange-950/30 border border-orange-200 dark:border-orange-900/60 text-xs text-orange-800 dark:text-orange-300 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-orange-600" />
                <span>
                  <strong>Keyword Density Notice:</strong> High density of buzzwords detected with limited project narrative context. Experience alignment calibrated accordingly.
                </span>
              </div>
            )}
          </div>

          {/* Focus Competencies */}
          <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800">
            <span className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider block">
              Active Focus Areas
            </span>
            <div className="flex flex-wrap gap-2">
              {selectedSkills.map((skill) => (
                <span key={skill} className="badge-neutral text-xs">
                  {skill}
                </span>
              ))}
            </div>
          </div>

          {/* Action Row */}
          <div className="flex items-center justify-between pt-4 border-t border-slate-100 dark:border-slate-800">
            <Link
              to="/customize"
              className="btn-secondary text-xs"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back: Parameters</span>
            </Link>

            <button
              type="button"
              disabled={isStarting}
              onClick={handleLaunch}
              className="btn-primary h-11 px-6 shadow-xs"
            >
              {isStarting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Initializing simulator...</span>
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 fill-white" />
                  <span>Begin Mock Interview</span>
                </>
              )}
            </button>
          </div>
        </div>

      </div>
    </WorkspaceLayout>
  );
}
