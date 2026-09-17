import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  Clock, 
  X, 
  Sparkles, 
  AlertTriangle,
  Radio,
  FileText,
  Volume2
} from 'lucide-react';

export default function InterviewHeader({
  targetRole = 'Software Engineer',
  interviewType = 'Technical + HR',
  difficulty = 'Medium',
  format = 'voice',
  initialSeconds = 1500, // 25:00 default
  secondsRemaining: externalSeconds,
  activeStage = 'Introduction',
  showStages = false,
  onExit
}) {
  const navigate = useNavigate();
  const [internalSeconds, setInternalSeconds] = useState(initialSeconds);
  const [showExitModal, setShowExitModal] = useState(false);

  // If externalSeconds is provided, use it; otherwise use internal countdown
  const secondsRemaining = externalSeconds !== undefined ? externalSeconds : internalSeconds;

  useEffect(() => {
    if (externalSeconds !== undefined) return;
    if (secondsRemaining <= 0) return;
    const timer = setInterval(() => {
      setInternalSeconds(prev => Math.max(0, prev - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, [externalSeconds, secondsRemaining]);

  const formatTime = (secs) => {
    const mins = Math.floor(secs / 60);
    const remainingSecs = secs % 60;
    return `${mins.toString().padStart(2, '0')}:${remainingSecs.toString().padStart(2, '0')}`;
  };

  const isLowTime = secondsRemaining < 180; // under 3 min (wrap-up warning)

  const STAGES = [
    { id: 'intro', label: 'Introduction' },
    { id: 'tech', label: 'Technical Discussion' },
    { id: 'scenario', label: 'Scenario Round' },
    { id: 'wrapup', label: 'Wrap-up' }
  ];

  const handleConfirmExit = () => {
    setShowExitModal(false);
    if (onExit) {
      onExit();
    } else {
      navigate('/dashboard');
    }
  };

  return (
    <>
      <header className="h-[64px] border-b border-[#E5E7EB] dark:border-white/10 bg-white/95 dark:bg-[#0A0F1D]/95 backdrop-blur-md px-4 sm:px-8 flex items-center justify-between sticky top-0 z-40 select-none">
        
        {/* Left: Brand + Role Info */}
        <div className="flex items-center gap-3.5 min-w-0">
          <Link to="/dashboard" className="flex items-center gap-2 shrink-0 group">
            <div className="w-8 h-8 rounded-xl bg-[#2563EB] flex items-center justify-center text-white shadow-xs group-hover:scale-105 transition-transform">
              <Sparkles className="w-4 h-4" />
            </div>
            <span className="font-extrabold text-[17px] tracking-tight text-[#0F172A] dark:text-white hidden sm:inline">
              Prep<span className="text-[#2563EB]">Nova</span>
            </span>
          </Link>

          <div className="h-4 w-[1px] bg-[#E5E7EB] dark:bg-white/10 hidden sm:block shrink-0" />

          {/* Role + Format Pills */}
          <div className="flex items-center gap-2 min-w-0">
            <span className="text-[13px] font-semibold text-[#0F172A] dark:text-[#F8FAFC] truncate max-w-[140px] sm:max-w-[200px]">
              {targetRole}
            </span>

            <span className="hidden lg:inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-medium bg-blue-50 dark:bg-blue-950/60 text-[#2563EB] dark:text-[#38BDF8] border border-blue-100 dark:border-blue-900/40">
              {difficulty}
            </span>
          </div>
        </div>

        {/* Center: Stage Indicators (Voice Adaptive Mode) */}
        {showStages ? (
          <div className="hidden md:flex items-center gap-1.5 px-3 py-1 bg-slate-100/80 dark:bg-white/5 rounded-full border border-slate-200/60 dark:border-white/10">
            {STAGES.map((s, idx) => {
              const isCurrent = activeStage === s.label || (s.id === 'tech' && activeStage.includes('Technical'));
              return (
                <div key={s.id} className="flex items-center">
                  <span
                    className={`px-2.5 py-1 rounded-full text-[12px] font-medium transition-all ${
                      isCurrent
                        ? 'bg-[#2563EB] text-white font-semibold shadow-xs ring-2 ring-blue-500/20'
                        : 'text-[#64748B] dark:text-[#94A3B8] opacity-70'
                    }`}
                  >
                    {s.label}
                  </span>
                  {idx < STAGES.length - 1 && (
                    <span className="text-[#CBD5E1] dark:text-white/20 mx-1 text-[11px]">•</span>
                  )}
                </div>
              );
            })}
          </div>
        ) : null}

        {/* Right: Remaining Timer + Exit Button */}
        <div className="flex items-center gap-3 shrink-0">
          {/* Timer Display with "Remaining" */}
          <div 
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl border text-[13px] font-semibold tracking-wide transition-colors ${
              isLowTime
                ? 'bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 border-rose-200 dark:border-rose-900/50 animate-pulse'
                : 'bg-slate-50 dark:bg-white/5 text-[#0F172A] dark:text-[#F8FAFC] border-[#E5E7EB] dark:border-white/10'
            }`}
          >
            <Clock className="w-3.5 h-3.5 text-[#64748B] dark:text-[#94A3B8]" />
            <span className="tabular-nums font-mono">{formatTime(secondsRemaining)}</span>
            <span className="text-[11px] font-medium text-[#64748B] dark:text-[#94A3B8] hidden sm:inline ml-0.5">Remaining</span>
          </div>

          {/* Exit Interview Button */}
          <button
            type="button"
            onClick={() => setShowExitModal(true)}
            className="h-[36px] px-3.5 rounded-[10px] border border-[#E5E7EB] dark:border-white/10 hover:border-rose-300 dark:hover:border-rose-900 text-[13px] font-medium text-[#64748B] hover:text-rose-600 dark:text-[#94A3B8] dark:hover:text-rose-400 hover:bg-rose-50/50 dark:hover:bg-rose-950/20 transition-all cursor-pointer flex items-center gap-1.5"
            title="Exit interview session"
          >
            <X className="w-4 h-4" />
            <span className="hidden sm:inline">Exit</span>
          </button>
        </div>
      </header>

      {/* Exit Confirmation Modal */}
      {showExitModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div 
            className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity" 
            onClick={() => setShowExitModal(false)}
          />

          <div className="relative bg-white dark:bg-[#081A3A] border border-[#E5E7EB] dark:border-white/10 rounded-[18px] p-6 max-w-sm w-full shadow-2xl z-10 animate-in fade-in zoom-in-95 duration-150">
            <div className="w-10 h-10 rounded-full bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400 flex items-center justify-center mb-3">
              <AlertTriangle className="w-5 h-5" />
            </div>

            <h3 className="text-[17px] font-semibold text-[#0F172A] dark:text-[#F8FAFC] leading-[1.4]">
              Leave interview session?
            </h3>
            <p className="text-[13px] font-normal text-[#64748B] dark:text-[#94A3B8] mt-1 leading-[1.4]">
              Your current progress and live answers will be stopped. You can review past completed interviews anytime.
            </p>

            <div className="flex items-center justify-end gap-2.5 mt-5">
              <button
                type="button"
                onClick={() => setShowExitModal(false)}
                className="h-[36px] px-3.5 rounded-[10px] border border-[#E5E7EB] dark:border-white/10 text-[14px] font-medium text-[#64748B] dark:text-[#94A3B8] hover:text-[#0F172A] dark:hover:text-white transition-colors cursor-pointer"
              >
                Stay & Continue
              </button>
              <button
                type="button"
                onClick={handleConfirmExit}
                className="h-[36px] px-4 rounded-[10px] bg-rose-600 hover:bg-rose-700 text-[14px] font-medium text-white transition-colors cursor-pointer shadow-xs"
              >
                Exit Now
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
