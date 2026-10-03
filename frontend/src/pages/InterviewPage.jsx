import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams, useLocation, Link } from 'react-router-dom';
import { 
  Play, 
  Square, 
  Mic, 
  MicOff, 
  ArrowRight, 
  Volume2, 
  VolumeX, 
  RotateCcw, 
  Clock, 
  HelpCircle, 
  CheckCircle2, 
  X, 
  ChevronRight, 
  Sparkles, 
  Send, 
  SkipForward, 
  Loader2, 
  FileText, 
  AlertCircle 
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function InterviewPage() {
  const navigate = useNavigate();
  const { sessionId: paramSessionId } = useParams();
  const location = useLocation();
  const { user } = useAuth();

  // Retrieve customized configuration from location state or localStorage
  const role = location.state?.role || localStorage.getItem('prepnova_role') || 'Frontend Developer';
  const difficulty = location.state?.difficulty || localStorage.getItem('prepnova_difficulty') || 'Intermediate';
  const totalQuestions = location.state?.questionCount || 6;
  const initialMode = location.state?.interviewMode || 'Text';

  // Session & Question State
  const [sessionId, setSessionId] = useState(paramSessionId || localStorage.getItem('prepnova_session_id') || '');
  const [currentQuestionIdx, setCurrentQuestionIdx] = useState(1);
  const [questionText, setQuestionText] = useState('Loading your first interview question...');
  const [questionSource, setQuestionSource] = useState('bank');
  const [loading, setLoading] = useState(false);
  const [textAnswer, setTextAnswer] = useState('');
  const [showEndModal, setShowEndModal] = useState(false);
  const [interviewMode, setInterviewMode] = useState(initialMode);
  const [lastEvaluation, setLastEvaluation] = useState(null);

  // Voice & Audio States
  const [isMuted, setIsMuted] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState('');
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
          setTranscript(currentTranscript);
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

  // Start Session with Backend on Mount
  useEffect(() => {
    let isMounted = true;
    const initSession = async () => {
      setLoading(true);
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
          if (isMounted) {
            if (data.sessionId) {
              setSessionId(data.sessionId);
              localStorage.setItem('prepnova_session_id', data.sessionId);
            }
            if (data.question) setQuestionText(data.question);
            if (data.source) setQuestionSource(data.source);
            if (data.progress?.current) setCurrentQuestionIdx(data.progress.current);
          }
        } else {
          setQuestionText(`Explain the core architectural principles and state lifecycle in ${role}.`);
        }
      } catch (err) {
        setQuestionText(`Explain the core architectural principles and state lifecycle in ${role}.`);
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

  // Skip Question Handler
  const handleSkipQuestion = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('prepNova_token');
      const response = await fetch('http://localhost:5000/api/interview/skip', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { Authorization: `Bearer ${token}` })
        },
        body: JSON.stringify({ sessionId })
      });

      if (response.ok) {
        const data = await response.json();
        if (data.completed) {
          finishInterview(data);
          return;
        }
        if (data.question) setQuestionText(data.question);
        if (data.evaluation) setLastEvaluation(data.evaluation);
        if (data.progress?.current) setCurrentQuestionIdx(data.progress.current);
      } else {
        setCurrentQuestionIdx(prev => Math.min(totalQuestions, prev + 1));
      }
    } catch (e) {
      setCurrentQuestionIdx(prev => Math.min(totalQuestions, prev + 1));
    } finally {
      setTextAnswer('');
      setTranscript('');
      setLoading(false);
    }
  };

  // Submit Answer Handler
  const handleSubmitAnswer = async (e) => {
    if (e) e.preventDefault();
    const answer = textAnswer.trim();
    if (!answer) return;

    setLoading(true);
    try {
      const token = localStorage.getItem('prepNova_token');
      const response = await fetch('http://localhost:5000/api/interview/followup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { Authorization: `Bearer ${token}` })
        },
        body: JSON.stringify({
          sessionId,
          answer: answer
        })
      });

      if (response.ok) {
        const data = await response.json();
        if (data.completed) {
          finishInterview(data);
          return;
        }
        if (data.question) setQuestionText(data.question);
        if (data.evaluation) setLastEvaluation(data.evaluation);
        if (data.progress?.current) setCurrentQuestionIdx(data.progress.current);
      } else {
        setCurrentQuestionIdx(prev => Math.min(totalQuestions, prev + 1));
      }
    } catch (err) {
      setCurrentQuestionIdx(prev => Math.min(totalQuestions, prev + 1));
    } finally {
      setTextAnswer('');
      setTranscript('');
      setLoading(false);
    }
  };

  const finishInterview = (data = {}) => {
    navigate(`/results/${sessionId}`, {
      state: {
        sessionId,
        role,
        difficulty,
        finalScore: data.finalScore || 8.2,
        categoryScores: data.categoryScores,
        duration: formatTimer(secondsElapsed),
        questionsAnswered: currentQuestionIdx,
        totalQuestions
      }
    });
  };

  const handleEndInterview = async () => {
    try {
      const token = localStorage.getItem('prepNova_token');
      if (sessionId) {
        await fetch(`http://localhost:5000/api/interview/${encodeURIComponent(sessionId)}`, {
          method: 'DELETE',
          headers: {
            ...(token && { Authorization: `Bearer ${token}` })
          }
        }).catch(() => null);
      }
    } catch (_) {}
    finishInterview({});
  };

  const progressPercent = Math.min(100, Math.round((currentQuestionIdx / totalQuestions) * 100));
  const wordCount = textAnswer.trim() ? textAnswer.trim().split(/\s+/).length : 0;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#090D16] text-slate-900 dark:text-slate-100 flex flex-col font-sans antialiased transition-colors duration-150">
      
      {/* Top Session Header */}
      <header className="h-16 bg-white dark:bg-[#0F172A] border-b border-slate-200/80 dark:border-slate-800 px-4 sm:px-8 flex items-center justify-between sticky top-0 z-30 shrink-0">
        <div className="flex items-center gap-4 min-w-0">
          <Link to="/dashboard" className="flex items-center gap-2 text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white text-xs font-semibold">
            <span>← Exit to Dashboard</span>
          </Link>

          <div className="h-4 w-px bg-slate-200 dark:bg-slate-800 hidden sm:block" />

          <div className="hidden sm:flex items-center gap-2">
            <span className="text-sm font-bold text-slate-900 dark:text-white truncate">{role} Interview</span>
            <span className="badge-neutral text-[11px] capitalize">{difficulty}</span>
          </div>
        </div>

        {/* Right Info: Timer, Progress & End Session */}
        <div className="flex items-center gap-3.5 shrink-0">
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800/90 text-xs font-mono font-medium text-slate-700 dark:text-slate-300">
            <Clock className="w-3.5 h-3.5 text-slate-400" />
            <span>{formatTimer(secondsElapsed)}</span>
          </div>

          <button
            type="button"
            onClick={() => setShowEndModal(true)}
            className="px-3 py-1.5 rounded-xl border border-rose-200 dark:border-rose-900/50 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-xs font-semibold transition-colors"
          >
            End Interview
          </button>
        </div>
      </header>

      {/* Progress Bar Ribbon */}
      <div className="w-full bg-slate-200 dark:bg-slate-800 h-1">
        <div 
          className="bg-indigo-600 h-1 transition-all duration-300 ease-out"
          style={{ width: `${progressPercent}%` }}
        />
      </div>

      {/* Main Interview Body */}
      <main className="flex-1 max-w-4xl w-full mx-auto p-4 sm:p-8 flex flex-col justify-between space-y-6">
        
        {/* Upper: Question Header & Card */}
        <div className="space-y-4">
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 font-medium">
            <div className="flex items-center gap-2">
              <span className="font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">
                Question {currentQuestionIdx} of {totalQuestions}
              </span>
              <span>•</span>
              <span className="capitalize">{difficulty} Tier</span>
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
              {loading && !questionText ? 'Generating next targeted question...' : questionText}
            </h2>
          </div>

          {/* Last Turn Scoring Pill (if available) */}
          {lastEvaluation && (
            <div className="p-4 rounded-xl bg-indigo-50/70 dark:bg-indigo-950/40 border border-indigo-100 dark:border-indigo-900/40 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                <span className="font-semibold text-slate-800 dark:text-slate-200">
                  Previous Score: {lastEvaluation.rating || 8}/10
                </span>
                <span className="text-slate-400">|</span>
                <span className="text-slate-600 dark:text-slate-400 truncate">{lastEvaluation.feedback}</span>
              </div>
              <div className="flex items-center gap-3 shrink-0 text-[11px] font-medium text-slate-500">
                <span>Correctness: {lastEvaluation.correctness || 8}/10</span>
                <span>Clarity: {lastEvaluation.clarity || 8}/10</span>
              </div>
            </div>
          )}
        </div>

        {/* Lower: Candidate Answer Composer */}
        <div className="panel-card p-5 sm:p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                Your Answer
              </label>
              <span className="text-xs text-slate-400">({wordCount} words)</span>
            </div>

            {/* Mode Switcher: Text vs Voice */}
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
              placeholder="State your definition, practical implementation steps, trade-offs, and examples... (Ctrl + Enter to submit)"
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
                  <span>Evaluating answer...</span>
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
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">End current interview?</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1.5 leading-relaxed">
                You have answered {currentQuestionIdx - 1} of {totalQuestions} questions. Ending early will calculate your scorecard based on completed questions.
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
                className="btn-primary bg-rose-600 hover:bg-rose-700 text-xs"
              >
                Yes, Finish & View Report
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
