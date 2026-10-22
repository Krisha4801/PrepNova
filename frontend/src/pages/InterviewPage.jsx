import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams, useLocation, Link } from 'react-router-dom';
import { 
  Mic, 
  MicOff, 
  Volume2, 
  Clock, 
  Send, 
  SkipForward, 
  Loader2, 
  AlertCircle,
  Sparkles,
  ChevronRight,
  ShieldCheck,
  RefreshCw
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import {
  startInterviewApi,
  followupInterviewApi,
  skipInterviewQuestionApi,
  endInterviewApi
} from '../lib/api';

export default function InterviewPage() {
  const navigate = useNavigate();
  const { sessionId: paramSessionId } = useParams();
  const location = useLocation();
  const { user } = useAuth();

  // Retrieve customized configuration from location state or localStorage
  const role = location.state?.role || localStorage.getItem('prepnova_role') || 'Candidate';
  const difficulty = location.state?.difficulty || localStorage.getItem('prepnova_difficulty') || 'Intermediate';
  const totalQuestions = location.state?.questionCount || Number(localStorage.getItem('prepnova_question_count')) || 6;
  const initialMode = location.state?.interviewMode || localStorage.getItem('prepnova_mode') || 'Text';

  // Session & Question State
  const [sessionId, setSessionId] = useState(paramSessionId || localStorage.getItem('prepnova_session_id') || '');
  const [currentQuestionIdx, setCurrentQuestionIdx] = useState(1);
  const [questionText, setQuestionText] = useState('Preparing your interview session...');
  const [currentSection, setCurrentSection] = useState('Introduction');
  const [questionType, setQuestionType] = useState('primary');
  const [loading, setLoading] = useState(false);
  const [isFinishingReport, setIsFinishingReport] = useState(false);
  const [submitError, setSubmitError] = useState(null);
  const [textAnswer, setTextAnswer] = useState('');
  const [showEndModal, setShowEndModal] = useState(false);

  // Voice & Audio States
  const [isRecording, setIsRecording] = useState(false);
  const recognitionRef = useRef(null);

  // Timer State (starts at 0s)
  const [secondsElapsed, setSecondsElapsed] = useState(0);

  // Speech Recognition
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      try {
        const recognition = new SpeechRecognition();
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = 'en-US';

        recognition.onresult = (event) => {
          let currentTranscript = '';
          for (let i = 0; i < event.results.length; i++) {
            currentTranscript += event.results[i][0].transcript;
          }
          setTextAnswer(currentTranscript);
        };

        recognition.onerror = (err) => {
          console.warn('Speech recognition notice:', err.error);
        };

        recognitionRef.current = recognition;
      } catch (e) {
        console.warn('Speech recognition initialization skipped:', e);
      }
    }

    return () => {
      if (recognitionRef.current) {
        try { recognitionRef.current.stop(); } catch (_) {}
      }
    };
  }, []);

  const toggleRecording = () => {
    if (!recognitionRef.current) return;
    if (isRecording) {
      try { recognitionRef.current.stop(); } catch (_) {}
      setIsRecording(false);
    } else {
      try { recognitionRef.current.start(); } catch (_) {}
      setIsRecording(true);
    }
  };

  // Timer Tick
  useEffect(() => {
    const interval = setInterval(() => {
      setSecondsElapsed((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const formatTimer = (totalSeconds) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    const pad = (n) => String(n).padStart(2, '0');
    return `${pad(mins)}:${pad(secs)}`;
  };

  // Format human-friendly section name
  const formatSectionTitle = (secId) => {
    if (!secId) return 'Technical Assessment';
    const clean = String(secId).toLowerCase().replace(/_/g, ' ');
    if (clean.includes('intro')) return 'Candidate Introduction';
    if (clean.includes('project')) return 'Key Projects & Ownership';
    if (clean.includes('skill')) return 'Core Skills & Practical Application';
    if (clean.includes('tech')) return 'Technical Fundamentals & Internals';
    if (clean.includes('scen')) return 'Scenario & Applied Problem Solving';
    if (clean.includes('behav')) return 'Behavioral & Collaboration (STAR)';
    return clean.charAt(0).toUpperCase() + clean.slice(1);
  };

  // Start Session with Backend on Mount
  useEffect(() => {
    let isMounted = true;

    // If session was already launched and passed from Review page
    if (location.state?.firstQuestion && location.state?.sessionId) {
      setSessionId(location.state.sessionId);
      setQuestionText(location.state.firstQuestion);
      if (location.state.section) setCurrentSection(location.state.section);
      return;
    }

    const initSession = async () => {
      setLoading(true);
      setSubmitError(null);
      try {
        const resumeId = location.state?.resumeId || localStorage.getItem('prepnova_resume_id') || null;
        const jdId = location.state?.jdId || localStorage.getItem('prepnova_jd_id') || null;
        const focusAreas = location.state?.selectedSkills || JSON.parse(localStorage.getItem('prepnova_skills') || '[]');

        const data = await startInterviewApi({
          name: user?.name || 'Candidate',
          role: role,
          level: difficulty.toLowerCase(),
          resumeId,
          jdId,
          maxQuestions: totalQuestions,
          focusAreas
        });

        if (isMounted) {
          if (data.sessionId) {
            setSessionId(data.sessionId);
            localStorage.setItem('prepnova_session_id', data.sessionId);
          }
          if (data.question) setQuestionText(data.question);
          if (data.section) setCurrentSection(data.section);
          if (data.questionType) setQuestionType(data.questionType);
          if (data.progress?.current) setCurrentQuestionIdx(data.progress.current);
        }
      } catch (err) {
        if (isMounted) {
          setQuestionText(`Hello! To get started, could you please introduce yourself and highlight the key experiences, projects, or technical skills most relevant to this ${role} position?`);
          setCurrentSection('introduction');
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    initSession();
    return () => { isMounted = false; };
  }, [role, difficulty]);

  // Text-To-Speech reader
  const handleSpeakQuestion = () => {
    if ('speechSynthesis' in window) {
      if (window.speechSynthesis.speaking) {
        window.speechSynthesis.cancel();
        return;
      }
      const utterance = new SpeechSynthesisUtterance(questionText);
      utterance.rate = 1.0;
      utterance.pitch = 1.0;
      window.speechSynthesis.speak(utterance);
    }
  };

  const finishInterview = (data = {}) => {
    setIsFinishingReport(true);
    // Smooth transition into report view
    setTimeout(() => {
      navigate(`/results/${sessionId}`, {
        state: {
          sessionId,
          role,
          difficulty,
          finalScore: data.finalScore || 8.0,
          categoryScores: data.categoryScores,
          duration: formatTimer(secondsElapsed),
          questionsAnswered: currentQuestionIdx,
          totalQuestions
        }
      });
    }, 800);
  };

  // Skip Question Handler
  const handleSkipQuestion = async () => {
    setLoading(true);
    setSubmitError(null);
    try {
      const data = await skipInterviewQuestionApi({ sessionId });
      if (data.completed) {
        finishInterview(data);
        return;
      }
      if (data.question) setQuestionText(data.question);
      if (data.section) setCurrentSection(data.section);
      if (data.questionType) setQuestionType(data.questionType);
      if (data.progress?.current) setCurrentQuestionIdx(data.progress.current);
      setTextAnswer('');
    } catch (e) {
      setSubmitError('Failed to skip question. Please check connection and try again.');
    } finally {
      setLoading(false);
    }
  };

  // Submit Answer Handler
  const handleSubmitAnswer = async (e) => {
    if (e) e.preventDefault();
    const answer = textAnswer.trim();
    if (!answer || loading) return;

    setLoading(true);
    setSubmitError(null);
    try {
      const data = await followupInterviewApi({
        sessionId,
        answer: answer
      });

      if (data.completed) {
        finishInterview(data);
        return;
      }

      if (data.question) setQuestionText(data.question);
      if (data.section) setCurrentSection(data.section);
      if (data.questionType) setQuestionType(data.questionType);
      if (data.progress?.current) setCurrentQuestionIdx(data.progress.current);
      setTextAnswer('');
    } catch (err) {
      console.warn("Answer submission error:", err);
      setSubmitError(err.message || 'Failed to submit answer. Your answer draft is preserved below. Please click retry.');
    } finally {
      setLoading(false);
    }
  };

  const handleEndInterview = async () => {
    setShowEndModal(false);
    setIsFinishingReport(true);
    try {
      if (sessionId) {
        const data = await endInterviewApi(sessionId).catch(() => null);
        finishInterview(data || {});
        return;
      }
    } catch (_) {}
    finishInterview({});
  };

  const progressPercent = Math.min(100, Math.round((currentQuestionIdx / totalQuestions) * 100));
  const wordCount = textAnswer.trim() ? textAnswer.trim().split(/\s+/).length : 0;

  if (isFinishingReport) {
    return (
      <div className="min-h-screen bg-slate-900 text-white flex flex-col items-center justify-center p-6 text-center space-y-5">
        <div className="w-16 h-16 rounded-2xl bg-indigo-600/30 border border-indigo-500/40 flex items-center justify-center text-indigo-400">
          <Loader2 className="w-8 h-8 animate-spin" />
        </div>
        <div className="space-y-2 max-w-md">
          <h2 className="text-2xl font-bold tracking-tight">Compiling Evaluation Report</h2>
          <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
            Evaluating your self-introduction, technical answers, and problem-solving trade-offs across all rubric criteria...
          </p>
        </div>
        <div className="w-64 bg-slate-800 rounded-full h-2 overflow-hidden">
          <div className="bg-indigo-500 h-full w-2/3 animate-pulse rounded-full" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#090D16] text-slate-900 dark:text-slate-100 flex flex-col font-sans antialiased transition-colors duration-150">
      
      {/* Header Bar */}
      <header className="sticky top-0 z-40 bg-white/90 dark:bg-[#0F172A]/90 backdrop-blur-md border-b border-slate-200/80 dark:border-slate-800/80 px-4 sm:px-8 py-3.5 flex items-center justify-between">
        
        {/* Left: Role and Progress status */}
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center font-bold text-sm shadow-xs">
            PN
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-sm text-slate-900 dark:text-white leading-tight">
                {role}
              </span>
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 border border-indigo-200/60 dark:border-indigo-800/60 capitalize">
                {difficulty}
              </span>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
              Live Conversational Mock Interview
            </p>
          </div>
        </div>

        {/* Center: Live Timer */}
        <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800/80 text-xs font-mono font-medium text-slate-700 dark:text-slate-300">
          <Clock className="w-3.5 h-3.5 text-indigo-500" />
          <span>{formatTimer(secondsElapsed)}</span>
        </div>

        {/* Right: End Session Button */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setShowEndModal(true)}
            className="btn-secondary text-xs px-3 py-1.5 hover:text-rose-600 dark:hover:text-rose-400"
          >
            Finish Interview
          </button>
        </div>
      </header>

      {/* Progress Track */}
      <div className="w-full bg-slate-200 dark:bg-slate-800 h-1">
        <div 
          className="bg-indigo-600 h-full transition-all duration-300 ease-out"
          style={{ width: `${progressPercent}%` }}
        />
      </div>

      {/* Main Interview Body */}
      <main className="flex-1 max-w-4xl w-full mx-auto p-4 sm:p-8 flex flex-col justify-between space-y-6">
        
        {/* Upper: Question Header & Card */}
        <div className="space-y-4">
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 font-medium">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">
                Question {currentQuestionIdx} of {totalQuestions}
              </span>
              <span>•</span>
              <span className="font-semibold text-slate-700 dark:text-slate-300">
                {formatSectionTitle(currentSection)}
              </span>
              {questionType === 'follow_up' && (
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 border border-amber-200/60 dark:border-amber-800/60">
                  Follow-up Question
                </span>
              )}
            </div>
            <button
              type="button"
              onClick={handleSpeakQuestion}
              className="inline-flex items-center gap-1.5 text-slate-500 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors p-1"
              title="Listen to question"
            >
              <Volume2 className="w-4 h-4" />
              <span className="hidden sm:inline">Listen</span>
            </button>
          </div>

          {/* Active Question Prompt */}
          <div className="panel-card bg-white dark:bg-[#0F172A] border-slate-200/90 dark:border-slate-800/90 shadow-sm p-6 sm:p-7">
            <h2 className="text-lg sm:text-xl font-semibold text-slate-900 dark:text-white leading-relaxed tracking-tight">
              {loading && !questionText ? 'Preparing next question...' : questionText}
            </h2>
          </div>

          {/* Notice Banner if submit error */}
          {submitError && (
            <div className="p-4 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 text-xs flex items-center justify-between gap-3 text-rose-700 dark:text-rose-300">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{submitError}</span>
              </div>
              <button
                type="button"
                onClick={handleSubmitAnswer}
                className="btn-secondary text-xs px-2.5 py-1 shrink-0"
              >
                <RefreshCw className="w-3 h-3" />
                <span>Retry</span>
              </button>
            </div>
          )}
        </div>

        {/* Lower: Candidate Answer Composer */}
        <div className="panel-card p-5 sm:p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                Your Response
              </label>
              <span className="text-xs text-slate-400">({wordCount} words)</span>
            </div>

            {/* Mode Switcher: Voice Dictate */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={toggleRecording}
                className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                  isRecording 
                    ? 'bg-rose-500 text-white animate-pulse' 
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
                }`}
              >
                {isRecording ? <MicOff className="w-3.5 h-3.5" /> : <Mic className="w-3.5 h-3.5" />}
                <span>{isRecording ? 'Listening...' : 'Voice Dictate'}</span>
              </button>
            </div>
          </div>

          <div className="relative">
            <textarea
              rows={7}
              value={textAnswer}
              onChange={(e) => setTextAnswer(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
                  e.preventDefault();
                  handleSubmitAnswer();
                }
              }}
              placeholder="State your clear explanations, architecture decisions, trade-offs, and examples... (Ctrl + Enter to submit)"
              className="w-full p-4 bg-slate-50/80 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-700 rounded-xl text-sm sm:text-base text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:bg-white dark:focus:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition-all resize-y leading-relaxed font-normal"
            />
          </div>

          {/* Action Row */}
          <div className="flex items-center justify-between pt-2">
            <button
              type="button"
              disabled={loading}
              onClick={handleSkipQuestion}
              className="btn-secondary text-xs px-3.5 py-2"
            >
              <SkipForward className="w-3.5 h-3.5 text-slate-400" />
              <span>Skip Question</span>
            </button>

            <button
              type="button"
              disabled={loading || !textAnswer.trim()}
              onClick={handleSubmitAnswer}
              className="btn-primary px-5 py-2.5"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Saving response...</span>
                </>
              ) : (
                <>
                  <span>Submit Answer</span>
                  <Send className="w-3.5 h-3.5" />
                </>
              )}
            </button>
          </div>
        </div>

      </main>

      {/* Confirmation End Session Modal */}
      {showEndModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-[#0F172A] rounded-2xl p-6 max-w-md w-full border border-slate-200 dark:border-slate-800 shadow-modal space-y-4">
            <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 flex items-center justify-center font-bold">
              <AlertCircle className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">Finish interview session?</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1.5 leading-relaxed">
                You have answered {currentQuestionIdx - 1} of {totalQuestions} questions. Finishing now will trigger holistic evaluation of your completed answers, including your opening self-introduction.
              </p>
            </div>
            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setShowEndModal(false)}
                className="btn-secondary text-xs"
              >
                Continue Interview
              </button>
              <button
                type="button"
                onClick={handleEndInterview}
                className="btn-primary bg-indigo-600 hover:bg-indigo-700 text-xs"
              >
                Finish & Evaluate
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
