import React, { useState } from 'react';
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
  AlertCircle 
} from 'lucide-react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import WorkspaceLayout from '../components/layout/WorkspaceLayout';
import { useAuth } from '../context/AuthContext';

export default function ReviewInterviewPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();

  const [isStarting, setIsStarting] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);

  // Retrieve configured state
  const role = location.state?.role || localStorage.getItem('prepnova_role') || 'Frontend Developer';
  const difficulty = location.state?.difficulty || localStorage.getItem('prepnova_difficulty') || 'intermediate';
  const questionCount = location.state?.questionCount || Number(localStorage.getItem('prepnova_question_count')) || 6;
  const interviewMode = location.state?.interviewMode || localStorage.getItem('prepnova_mode') || 'Text';
  const selectedSkills = location.state?.selectedSkills || ['React.js', 'JavaScript (ES6+)', 'REST APIs'];

  const handleLaunch = async () => {
    setIsStarting(true);
    setErrorMessage(null);

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
          role: role,
          level: difficulty.toLowerCase()
        })
      });

      if (response.ok) {
        const data = await response.json();
        if (data.sessionId) {
          localStorage.setItem('prepnova_session_id', data.sessionId);
        }
        navigate(`/interview/${data.sessionId || 'session'}`, {
          state: {
            role,
            difficulty,
            questionCount,
            interviewMode,
            sessionId: data.sessionId
          }
        });
      } else {
        // Navigate with fallback session
        navigate('/interview', {
          state: {
            role,
            difficulty,
            questionCount,
            interviewMode
          }
        });
      }
    } catch (err) {
      console.warn('Network issue starting interview, continuing with client session:', err);
      navigate('/interview', {
        state: {
          role,
          difficulty,
          questionCount,
          interviewMode
        }
      });
    } finally {
      setIsStarting(false);
    }
  };

  return (
    <WorkspaceLayout title="Review & Launch">
      <div className="max-w-3xl mx-auto space-y-7">
        
        {/* Step Progression Bar */}
        <div className="flex items-center justify-between px-2 text-xs font-semibold text-slate-400">
          <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400">
            <span className="w-5 h-5 rounded-full bg-indigo-600 text-white flex items-center justify-center text-[11px]"><Check className="w-3 h-3" /></span>
            <span>Role & Discipline</span>
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
              Verify your session parameters below. Once started, you will be presented with {questionCount} adaptive questions.
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
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Target Role</span>
              <span className="text-sm font-bold text-slate-900 dark:text-slate-100 mt-1 block">{role}</span>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Difficulty Level</span>
              <span className="text-sm font-bold text-slate-900 dark:text-slate-100 mt-1 block capitalize">{difficulty}</span>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Session Volume</span>
              <span className="text-sm font-bold text-slate-900 dark:text-slate-100 mt-1 block">{questionCount} Questions</span>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Interaction Mode</span>
              <span className="text-sm font-bold text-slate-900 dark:text-slate-100 mt-1 block flex items-center gap-1.5">
                {interviewMode === 'Voice' ? <Mic className="w-3.5 h-3.5 text-indigo-600" /> : <FileText className="w-3.5 h-3.5 text-indigo-600" />}
                <span>{interviewMode} Mode</span>
              </span>
            </div>
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
