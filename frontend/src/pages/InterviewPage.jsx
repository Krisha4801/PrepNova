import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { 
  Mic, 
  MicOff, 
  Square, 
  SkipForward, 
  Clock, 
  AlertTriangle, 
  CheckCircle2, 
  Sparkles, 
  LayoutDashboard, 
  PlayCircle, 
  Code2, 
  History as HistoryIcon, 
  BookOpen, 
  Settings, 
  Menu, 
  X, 
  Volume2, 
  FileText, 
  Send, 
  Lightbulb, 
  Radio, 
  TrendingUp, 
  HelpCircle
} from 'lucide-react';

export default function InterviewPage() {
  const navigate = useNavigate();
  const { sessionId: paramSessionId } = useParams();

  // Session configuration from URL / localStorage
  const [sessionId, setSessionId] = useState(
    paramSessionId || localStorage.getItem('prepnova_session_id') || `session-${Date.now().toString(36)}`
  );
  const [role] = useState(
    localStorage.getItem('prepnova_role') || localStorage.getItem('selected_role') || 'Software Engineer'
  );
  const [difficulty] = useState(
    localStorage.getItem('prepnova_difficulty') || 'Medium'
  );
  const totalQuestions = parseInt(localStorage.getItem('prepnova_question_count') || '10', 10);
  const initialMode = localStorage.getItem('prepnova_format') === 'text' ? 'Text' : 'Voice';

  // Navigation & UI state
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [interviewMode, setInterviewMode] = useState(initialMode); // 'Voice' | 'Text'
  
  // Progress & Questions State
  const [currentQuestionIdx, setCurrentQuestionIdx] = useState(5);
  const [questionText, setQuestionText] = useState(
    'Why do you want to work in our organization?'
  );
  const [loading, setLoading] = useState(false);
  const [textAnswer, setTextAnswer] = useState('');
  const [showEndModal, setShowEndModal] = useState(false);
  const [confidenceScore, setConfidenceScore] = useState(88);

  // Voice & Audio States
  const [isMuted, setIsMuted] = useState(false);
  const [isRecording, setIsRecording] = useState(true);
  const [transcript, setTranscript] = useState('');
  const recognitionRef = useRef(null);

  // Timer State (HH:MM:SS) - default starts at 00:12:40 (760s) or counts up
  const [secondsElapsed, setSecondsElapsed] = useState(760);

  // Question Bank Fallback for seamless offline HR interview simulation
  const fallbackQuestions = [
    'Why do you want to work in our organization?',
    'Tell me about a challenging situation with a team member and how you handled it.',
    'Where do you see yourself professionally in the next 3 to 5 years?',
    'What work culture and environment allows you to do your best work?',
    'Describe a situation where you had to adapt quickly to unexpected organizational changes.',
    'Can you share an achievement you are particularly proud of and what it taught you?',
    'How do you manage stress and prioritize competing high-stakes deadlines?',
    'How do you approach receiving constructive criticism and feedback?',
    'Tell me about a time you went above and beyond for a customer or colleague.',
    'What motivates you to do your best work every single day?'
  ];

  // Initialize Speech Recognition if supported
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
          if (interviewMode === 'Text') {
            setTextAnswer(currentTranscript);
          }
        };

        recognition.onerror = (err) => {
          console.warn('Speech recognition warning:', err.error);
        };

        recognitionRef.current = recognition;
        if (isRecording && !isMuted && interviewMode === 'Voice') {
          recognition.start();
        }
      } catch (e) {
        console.warn('Speech recognition initialization skipped:', e);
      }
    }

    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch (_) {}
      }
    };
  }, [interviewMode]);

  // Handle Speech Recognition toggle on mute/pause
  useEffect(() => {
    if (!recognitionRef.current) return;
    try {
      if (isRecording && !isMuted && interviewMode === 'Voice') {
        recognitionRef.current.start();
      } else {
        recognitionRef.current.stop();
      }
    } catch (_) {}
  }, [isRecording, isMuted, interviewMode]);

  // Session Timer
  useEffect(() => {
    const interval = setInterval(() => {
      setSecondsElapsed((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // Format Timer into 00:MM:SS or HH:MM:SS
  const formatTimer = (totalSeconds) => {
    const hrs = Math.floor(totalSeconds / 3600);
    const mins = Math.floor((totalSeconds % 3600) / 60);
    const secs = totalSeconds % 60;
    const pad = (n) => String(n).padStart(2, '0');
    return `${pad(hrs)}:${pad(mins)}:${pad(secs)}`;
  };

  // Start / Fetch session question from backend on mount
  useEffect(() => {
    let isMounted = true;
    const initSession = async () => {
      try {
        const token = localStorage.getItem('prepNova_token');
        const candidateName = localStorage.getItem('prepnova_user_name') || 'Candidate';
        
        const response = await fetch('http://localhost:5000/api/interview/start', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(token && { Authorization: `Bearer ${token}` })
          },
          body: JSON.stringify({
            name: candidateName,
            role: role,
            level: difficulty.toLowerCase()
          })
        });

        if (response.ok) {
          const data = await response.json();
          if (isMounted) {
            if (data.sessionId) setSessionId(data.sessionId);
            if (data.question) setQuestionText(data.question);
            if (data.progress?.current) setCurrentQuestionIdx(data.progress.current);
          }
        }
      } catch (err) {
        console.warn('Connecting to backend question stream offline fallback:', err);
      }
    };

    initSession();
    return () => {
      isMounted = false;
    };
  }, [role, difficulty]);

  // Simulate Confidence changes dynamically
  useEffect(() => {
    const confInterval = setInterval(() => {
      if (isRecording && !isMuted) {
        setConfidenceScore(prev => {
          const delta = (Math.random() * 4 - 1.8);
          return Math.min(98, Math.max(76, Math.round(prev + delta)));
        });
      }
    }, 4500);
    return () => clearInterval(confInterval);
  }, [isRecording, isMuted]);

  // Handlers
  const handleToggleMute = () => {
    setIsMuted(prev => !prev);
  };

  const handleStopRecording = () => {
    // When stop is clicked in voice mode, pause recording or submit the answer turn
    setIsRecording(prev => !prev);
  };

  const handleSkipQuestion = async () => {
    setLoading(true);
    try {
      const response = await fetch('http://localhost:5000/api/interview/skip', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId })
      });

      if (response.ok) {
        const data = await response.json();
        if (data.question) {
          setQuestionText(data.question);
        } else {
          advanceFallbackQuestion();
        }
        if (data.progress?.current) {
          setCurrentQuestionIdx(data.progress.current);
        } else {
          setCurrentQuestionIdx(prev => Math.min(totalQuestions, prev + 1));
        }
      } else {
        advanceFallbackQuestion();
      }
    } catch (e) {
      advanceFallbackQuestion();
    } finally {
      setTextAnswer('');
      setTranscript('');
      setLoading(false);
    }
  };

  const advanceFallbackQuestion = () => {
    setCurrentQuestionIdx(prev => {
      const nextIdx = prev + 1;
      const qIndex = (nextIdx - 1) % fallbackQuestions.length;
      setQuestionText(fallbackQuestions[qIndex]);
      return Math.min(totalQuestions, nextIdx);
    });
  };

  const handleSubmitAnswer = async (e) => {
    if (e) e.preventDefault();
    const answer = interviewMode === 'Text' ? textAnswer.trim() : (transcript.trim() || 'My response utilizing STAR framework.');
    if (!answer && interviewMode === 'Text') return;

    setLoading(true);
    try {
      const response = await fetch('http://localhost:5000/api/interview/followup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId,
          answer: answer || 'Candidate provided answer.'
        })
      });

      if (response.ok) {
        const data = await response.json();
        if (data.completed) {
          navigate(`/results/${sessionId}`, {
            state: {
              sessionId,
              role,
              difficulty,
              finalScore: data.finalScore,
              categoryScores: data.categoryScores,
              duration: formatTimer(secondsElapsed),
              questionsAnswered: currentQuestionIdx,
              totalQuestions
            }
          });
          return;
        }
        if (data.question) {
          setQuestionText(data.question);
        } else {
          advanceFallbackQuestion();
        }
        if (data.progress?.current) {
          setCurrentQuestionIdx(data.progress.current);
        } else {
          setCurrentQuestionIdx(prev => Math.min(totalQuestions, prev + 1));
        }
      } else {
        advanceFallbackQuestion();
      }
    } catch (err) {
      advanceFallbackQuestion();
    } finally {
      setTextAnswer('');
      setTranscript('');
      setLoading(false);
    }
  };

  const handleEndInterview = async () => {
    try {
      await fetch(`http://localhost:5000/api/interview/${encodeURIComponent(sessionId)}`, {
        method: 'DELETE'
      }).catch(() => null);
    } catch (_) {}
    navigate(`/results/${sessionId}`, {
      state: {
        sessionId,
        role,
        difficulty,
        duration: formatTimer(secondsElapsed),
        questionsAnswered: currentQuestionIdx,
        totalQuestions
      }
    });
  };

  // Waveform Bar heights simulation for voice visualizer
  const waveHeights = [24, 38, 55, 32, 68, 88, 45, 95, 70, 42, 60, 84, 96, 62, 48, 75, 90, 52, 35, 78, 92, 40, 28, 50];

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-[#0F172A] font-sans flex flex-col md:flex-row antialiased selection:bg-[#2563EB]/15 selection:text-[#2563EB]">
      
      {/* ======================================================== */}
      {/* DESKTOP LEFT SIDEBAR (220px)                             */}
      {/* ======================================================== */}
      <aside className="w-[220px] bg-white border-r border-[#E5E7EB] flex-col justify-between py-6 px-4 shrink-0 hidden md:flex min-h-screen">
        <div>
          {/* PrepNova Logo */}
          <Link to="/dashboard" className="flex items-center gap-2.5 px-3 mb-8 group">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-[#2563EB] to-blue-400 flex items-center justify-center text-white shadow-sm shadow-[#2563EB]/25 group-hover:scale-105 transition-transform duration-180">
              <Sparkles className="w-4 h-4 fill-white/20" />
            </div>
            <div className="flex items-baseline font-bold tracking-tight text-xl">
              <span className="text-[#0F172A]">Prep</span>
              <span className="text-[#2563EB]">Nova</span>
            </div>
          </Link>

          {/* Navigation Links */}
          <nav className="space-y-1">
            <Link
              to="/dashboard"
              className="flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium text-[#64748B] hover:text-[#0F172A] hover:bg-slate-50 transition-all duration-180"
            >
              <LayoutDashboard className="w-4 h-4" />
              <span>Dashboard</span>
            </Link>

            {/* Start Interview (Active - Soft blue background & rounded corners) */}
            <div className="flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-semibold bg-[#2563EB]/10 text-[#2563EB] transition-all duration-180">
              <PlayCircle className="w-4 h-4 text-[#2563EB]" />
              <span>Start Interview</span>
            </div>

            <Link
              to="/history"
              className="flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium text-[#64748B] hover:text-[#0F172A] hover:bg-slate-50 transition-all duration-180"
            >
              <HistoryIcon className="w-4 h-4" />
              <span>History</span>
            </Link>

            <Link
              to="/settings"
              className="flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium text-[#64748B] hover:text-[#0F172A] hover:bg-slate-50 transition-all duration-180"
            >
              <Settings className="w-4 h-4" />
              <span>Settings</span>
            </Link>
          </nav>
        </div>

        {/* Mode Switcher Pill */}
        <div className="pt-4 border-t border-[#E5E7EB]">
          <div className="text-[11px] font-semibold uppercase tracking-wider text-[#64748B] px-2 mb-2">Input Mode</div>
          <div className="grid grid-cols-2 p-1 bg-slate-100 rounded-xl">
            <button
              onClick={() => setInterviewMode('Voice')}
              className={`flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs font-semibold transition-all duration-180 ${
                interviewMode === 'Voice' ? 'bg-white text-[#2563EB] shadow-xs' : 'text-[#64748B] hover:text-[#0F172A]'
              }`}
            >
              <Mic className="w-3.5 h-3.5" />
              <span>Voice</span>
            </button>
            <button
              onClick={() => setInterviewMode('Text')}
              className={`flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs font-semibold transition-all duration-180 ${
                interviewMode === 'Text' ? 'bg-white text-[#2563EB] shadow-xs' : 'text-[#64748B] hover:text-[#0F172A]'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Text</span>
            </button>
          </div>
        </div>
      </aside>

      {/* ======================================================== */}
      {/* MOBILE HEADER (☰ Menu + Timer + Logo)                    */}
      {/* ======================================================== */}
      <header className="md:hidden bg-white border-b border-[#E5E7EB] px-4 py-3 flex items-center justify-between sticky top-0 z-30">
        <button
          onClick={() => setMobileMenuOpen(true)}
          className="p-2 -ml-1 text-[#0F172A] hover:bg-slate-100 rounded-xl transition-colors duration-180 flex items-center gap-2"
          aria-label="Toggle menu"
        >
          <Menu className="w-5 h-5" />
          <span className="text-xs font-bold text-[#64748B]">Menu</span>
        </button>

        <div className="flex items-center gap-2 font-bold text-sm">
          <div className="w-2 h-2 rounded-full bg-[#16A34A] animate-pulse"></div>
          <span className="text-[#0F172A]">{role}</span>
        </div>

        <div className="flex items-center gap-1.5 bg-slate-100 px-2.5 py-1 rounded-lg text-xs font-mono font-medium text-[#0F172A]">
          <Clock className="w-3.5 h-3.5 text-[#64748B]" />
          <span>{formatTimer(secondsElapsed)}</span>
        </div>
      </header>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 flex md:hidden">
          <div 
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs transition-opacity duration-180" 
            onClick={() => setMobileMenuOpen(false)}
          />
          <div className="relative w-64 max-w-[80vw] bg-white h-full shadow-2xl p-6 flex flex-col justify-between z-10 animate-in slide-in-from-left duration-200">
            <div>
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-baseline font-bold tracking-tight text-xl">
                  <span className="text-[#0F172A]">Prep</span>
                  <span className="text-[#2563EB]">Nova</span>
                </div>
                <button 
                  onClick={() => setMobileMenuOpen(false)}
                  className="p-1.5 text-[#64748B] hover:text-[#0F172A] rounded-lg"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <nav className="space-y-1.5">
                <Link
                  to="/dashboard"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-[#64748B]"
                >
                  <LayoutDashboard className="w-4 h-4" />
                  <span>Dashboard</span>
                </Link>
                <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold bg-[#2563EB] text-white">
                  <PlayCircle className="w-4 h-4" />
                  <span>Start Interview</span>
                </div>
                <Link
                  to="/history"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-[#64748B]"
                >
                  <HistoryIcon className="w-4 h-4" />
                  <span>History</span>
                </Link>
              </nav>
            </div>

            <button
              onClick={() => {
                setMobileMenuOpen(false);
                setShowEndModal(true);
              }}
              className="w-full py-2.5 bg-[#EF4444] text-white font-medium rounded-xl text-sm flex items-center justify-center gap-2"
            >
              <span>End Interview</span>
            </button>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MAIN INTERVIEW CONTENT AREA                              */}
      {/* ======================================================== */}
      <main className="flex-1 flex flex-col min-w-0 h-screen overflow-y-auto">
        
        {/* ====================================================== */}
        {/* TOP BAR                                                */}
        {/* ====================================================== */}
        <section className="bg-white border-b border-[#E5E7EB] px-6 lg:px-10 py-3.5 shrink-0 flex items-center justify-between gap-4">
          
          {/* Left: Question Progress & Thin Animated Bar */}
          <div className="flex flex-col gap-1.5 w-48 sm:w-64 md:w-80">
            <div className="flex items-center justify-between text-xs sm:text-sm">
              <span className="font-bold text-[#0F172A]">
                Question {currentQuestionIdx} of {totalQuestions}
              </span>
            </div>
            
            {/* Thin animated progress bar below */}
            <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
              <div 
                className="h-full bg-[#2563EB] rounded-full transition-all duration-300 ease-out"
                style={{ width: `${Math.min(100, Math.max(5, (currentQuestionIdx / totalQuestions) * 100))}%` }}
              />
            </div>
          </div>

          {/* Right: Timer & Red End Interview Button */}
          <div className="flex items-center gap-3 sm:gap-4">
            <div className="hidden sm:flex items-center gap-2 bg-[#F8FAFC] border border-[#E5E7EB] px-3.5 py-2 rounded-xl text-sm font-mono font-semibold text-[#0F172A] shadow-2xs">
              <Clock className="w-4 h-4 text-[#64748B]" />
              <span>{formatTimer(secondsElapsed)}</span>
            </div>

            <button
              onClick={() => setShowEndModal(true)}
              className="px-4 py-2 bg-[#EF4444] hover:bg-red-600 text-white text-xs sm:text-sm font-semibold rounded-xl shadow-xs transition-all duration-180 hover:-translate-y-0.5 active:translate-y-0 flex items-center gap-1.5 cursor-pointer"
            >
              <span>End Interview</span>
            </button>
          </div>
        </section>

        {/* ====================================================== */}
        {/* WORKSPACE AREA: Main Card + Right Floating Status      */}
        {/* ====================================================== */}
        <div className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto flex gap-6 items-start justify-center">
          
          {/* Main Interview Column */}
          <div className="flex-1 flex flex-col gap-5 max-w-4xl w-full">
            
            {/* ================================================== */}
            {/* MAIN INTERVIEW CARD (Large rounded white card)     */}
            {/* ================================================== */}
            <div className="bg-white rounded-[20px] border border-[#E5E7EB] p-6 sm:p-8 lg:p-10 shadow-xs flex flex-col justify-between transition-all duration-180">
              
              {/* Card Header: HR Interviewer Avatar + Title + Live Badge */}
              <div className="flex items-center justify-between pb-6 border-b border-[#E5E7EB]/80">
                <div className="flex items-center gap-4">
                  {/* Circular blue avatar with "HR" + breathing glow */}
                  <div className="relative">
                    <div className="w-12 h-12 rounded-full bg-[#2563EB] text-white flex items-center justify-center font-bold text-base shadow-sm animate-avatar-breathe tracking-wider select-none">
                      HR
                    </div>
                    <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full bg-[#16A34A] border-2 border-white" />
                  </div>

                  <div>
                    <h3 className="font-bold text-base sm:text-lg text-[#0F172A] leading-tight">
                      HR Interviewer
                    </h3>
                    <p className="text-xs sm:text-sm text-[#64748B]">
                      People & Culture Specialist
                    </p>
                  </div>
                </div>

                {/* Small green live badge: ● Live */}
                <div className="flex items-center gap-2 bg-emerald-50 text-[#16A34A] border border-emerald-200/60 px-3 py-1.5 rounded-full text-xs font-semibold shadow-2xs">
                  <span className="w-2 h-2 rounded-full bg-[#16A34A] animate-ping" />
                  <span className="w-2 h-2 rounded-full bg-[#16A34A] -ml-4" />
                  <span>● Live</span>
                </div>
              </div>

              {/* Question Text: Large typography (28–32px), center aligned */}
              <div className="py-8 sm:py-12 flex flex-col items-center justify-center text-center px-2">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 text-[#2563EB] text-xs font-semibold uppercase tracking-wider mb-4">
                  <span>Question #{currentQuestionIdx}</span>
                </div>
                <h2 className="text-2xl sm:text-[28px] lg:text-[32px] font-semibold text-[#0F172A] leading-snug tracking-tight max-w-3xl mx-auto">
                  {questionText}
                </h2>
              </div>

              {/* Suggested Approach Card: Light gray card with subtle left blue border */}
              <div className="bg-[#F8FAFC] border border-[#E5E7EB] border-l-4 border-l-[#2563EB] rounded-2xl p-4 sm:p-5 my-3 w-full text-left transition-all duration-180">
                <div className="flex items-center gap-2 mb-2 text-[#0F172A] font-bold text-sm">
                  <Sparkles className="w-4 h-4 text-[#2563EB]" />
                  <span>Suggested Approach</span>
                </div>
                <ul className="text-xs sm:text-sm text-[#475569] space-y-1.5 pl-5 list-disc marker:text-[#2563EB] font-normal">
                  <li>Show that you researched the company</li>
                  <li>Align your goals with their values</li>
                  <li>Be genuine and specific</li>
                </ul>
              </div>

              {/* VOICE VISUALIZER OR TEXT INTERVIEW MODE */}
              <div className="pt-6 mt-2 border-t border-[#E5E7EB]/80">
                {interviewMode === 'Voice' ? (
                  /* ============================================ */
                  /* VOICE VISUALIZER                             */
                  /* ============================================ */
                  <div className="flex flex-col items-center justify-center py-6">
                    {/* Centered waveform animation */}
                    <div className="h-16 flex items-center justify-center gap-1.5 sm:gap-2 px-4 w-full max-w-md">
                      {waveHeights.map((h, i) => (
                        <div
                          key={i}
                          className={`w-1 sm:w-1.5 rounded-full transition-all duration-180 ${
                            isRecording && !isMuted
                              ? 'bg-[#2563EB] wave-bar'
                              : 'bg-slate-300 opacity-40'
                          }`}
                          style={{
                            height: isRecording && !isMuted ? `${h}%` : '20%',
                            animationDelay: `${(i * 0.06).toFixed(2)}s`,
                            animationDuration: `${0.9 + (i % 5) * 0.15}s`
                          }}
                        />
                      ))}
                    </div>

                    {/* Text below: Listening... / Ready to record */}
                    <div className="mt-4 flex flex-col items-center text-center">
                      <p className="text-sm font-semibold text-[#0F172A] tracking-tight">
                        {isRecording && !isMuted ? 'Listening...' : 'Ready to record'}
                      </p>
                      <p className="text-xs text-[#64748B] mt-0.5">
                        {isMuted 
                          ? 'Microphone muted. Click Mute to resume speaking.' 
                          : 'Speak clearly into your microphone.'}
                      </p>
                    </div>

                    {/* Live speech transcription preview if active */}
                    {transcript && (
                      <div className="mt-4 p-3 bg-slate-50 border border-[#E5E7EB] rounded-xl text-xs text-[#64748B] max-w-lg w-full text-center italic line-clamp-2">
                        "{transcript}"
                      </div>
                    )}
                  </div>
                ) : (
                  /* ============================================ */
                  /* TEXT INTERVIEW MODE                          */
                  /* ============================================ */
                  <form onSubmit={handleSubmitAnswer} className="flex flex-col gap-3 py-2">
                    <label htmlFor="answerInput" className="text-xs font-semibold text-[#64748B] uppercase tracking-wider">
                      Your Written Response
                    </label>
                    <textarea
                      id="answerInput"
                      rows={4}
                      value={textAnswer}
                      onChange={(e) => setTextAnswer(e.target.value)}
                      placeholder="Type your answer here..."
                      className="w-full rounded-2xl border border-[#E5E7EB] p-4 text-sm sm:text-base text-[#0F172A] placeholder-[#94A3B8] focus:border-[#2563EB] focus:ring-2 focus:ring-[#2563EB]/20 transition-all duration-180 outline-none resize-none"
                    />
                    <div className="flex justify-end pt-1">
                      <button
                        type="submit"
                        disabled={loading || !textAnswer.trim()}
                        className="px-6 py-2.5 bg-[#2563EB] hover:bg-blue-700 disabled:opacity-50 disabled:pointer-events-none text-white text-sm font-semibold rounded-xl shadow-xs transition-all duration-180 flex items-center gap-2 cursor-pointer"
                      >
                        <Send className="w-4 h-4" />
                        <span>{loading ? 'Submitting...' : 'Submit Answer'}</span>
                      </button>
                    </div>
                  </form>
                )}
              </div>

            </div>

            {/* ================================================== */}
            {/* BOTTOM CONTROLS (Three equal buttons)              */}
            {/* ================================================== */}
            <div className="grid grid-cols-3 gap-3 sm:gap-4 w-full">
              
              {/* Button 1: Mute (Outline Gray) */}
              <button
                type="button"
                onClick={handleToggleMute}
                className="py-3 px-4 bg-white border border-[#E5E7EB] hover:bg-slate-50 text-[#0F172A] font-semibold text-xs sm:text-sm rounded-xl transition-all duration-180 flex items-center justify-center gap-2 shadow-2xs hover:-translate-y-0.5 active:translate-y-0 cursor-pointer"
              >
                {isMuted ? (
                  <>
                    <MicOff className="w-4 h-4 text-[#EF4444]" />
                    <span>Unmute</span>
                  </>
                ) : (
                  <>
                    <Mic className="w-4 h-4 text-[#64748B]" />
                    <span>Mute</span>
                  </>
                )}
              </button>

              {/* Button 2: Stop (Filled Red - calls existing stop handler) */}
              <button
                type="button"
                onClick={handleSubmitAnswer}
                className="py-3 px-4 bg-[#EF4444] hover:bg-red-600 text-white font-semibold text-xs sm:text-sm rounded-xl transition-all duration-180 flex items-center justify-center gap-2 shadow-sm hover:-translate-y-0.5 active:translate-y-0 cursor-pointer"
              >
                <Square className="w-4 h-4 fill-white" />
                <span>{loading ? 'Processing...' : 'Stop'}</span>
              </button>

              {/* Button 3: Skip (Outline Gray - calls existing skip handler) */}
              <button
                type="button"
                onClick={handleSkipQuestion}
                disabled={loading}
                className="py-3 px-4 bg-white border border-[#E5E7EB] hover:bg-slate-50 text-[#0F172A] font-semibold text-xs sm:text-sm rounded-xl transition-all duration-180 flex items-center justify-center gap-2 shadow-2xs hover:-translate-y-0.5 active:translate-y-0 cursor-pointer disabled:opacity-50"
              >
                <SkipForward className="w-4 h-4 text-[#64748B]" />
                <span>Skip</span>
              </button>
            </div>

          </div>

          {/* ==================================================== */}
          {/* HR TIPS FLOATING CARD (Desktop Only)                 */}
          {/* ==================================================== */}
          <aside className="w-72 bg-white rounded-[20px] border border-[#E5E7EB] p-6 shadow-xs space-y-5 shrink-0 hidden lg:block sticky top-8">
            <div>
              <div className="flex items-center justify-between pb-3 border-b border-[#E5E7EB]">
                <h4 className="font-bold text-sm text-[#0F172A] tracking-tight flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-[#2563EB]" />
                  <span>HR Tips</span>
                </h4>
                <div className="w-2 h-2 rounded-full bg-[#16A34A] animate-pulse" />
              </div>

              <ul className="text-xs text-[#475569] space-y-2 pt-3 pl-4 list-disc marker:text-[#2563EB]">
                <li>Be authentic</li>
                <li>Use STAR when relevant</li>
                <li>Keep answers 1–2 minutes</li>
              </ul>
            </div>

            <div className="space-y-3.5 text-xs pt-3 border-t border-[#E5E7EB]">
              <div className="font-semibold text-[11px] uppercase tracking-wider text-[#64748B]">Session Status</div>
              
              {/* Difficulty */}
              <div className="flex items-center justify-between py-0.5">
                <span className="text-[#64748B]">Difficulty</span>
                <span className="font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-[#0F172A] border border-[#E5E7EB] capitalize">
                  {difficulty}
                </span>
              </div>

              {/* Questions Left */}
              <div className="flex items-center justify-between py-0.5">
                <span className="text-[#64748B]">Questions Left</span>
                <span className="font-semibold text-[#0F172A]">
                  {Math.max(0, totalQuestions - currentQuestionIdx)} left
                </span>
              </div>

              {/* Voice / Text Mode */}
              <div className="flex items-center justify-between py-0.5">
                <span className="text-[#64748B]">Interview Mode</span>
                <span className="font-semibold text-[#2563EB] flex items-center gap-1">
                  {interviewMode === 'Voice' ? <Radio className="w-3.5 h-3.5" /> : <FileText className="w-3.5 h-3.5" />}
                  <span>{interviewMode} Mode</span>
                </span>
              </div>

              {/* Live Confidence */}
              <div className="py-1 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-[#64748B] flex items-center gap-1">
                    <TrendingUp className="w-3.5 h-3.5 text-[#16A34A]" />
                    <span>Confidence (Live)</span>
                  </span>
                  <span className="font-bold text-[#16A34A]">
                    {confidenceScore}%
                  </span>
                </div>
                <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-[#16A34A] rounded-full transition-all duration-300"
                    style={{ width: `${confidenceScore}%` }}
                  />
                </div>
              </div>
            </div>
          </aside>

        </div>

      </main>

      {/* ======================================================== */}
      {/* END INTERVIEW CONFIRMATION MODAL                         */}
      {/* ======================================================== */}
      {showEndModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div 
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs transition-opacity duration-180" 
            onClick={() => setShowEndModal(false)}
          />
          <div className="relative bg-white rounded-[20px] border border-[#E5E7EB] p-6 max-w-md w-full shadow-2xl z-10 animate-in fade-in zoom-in-95 duration-180">
            <div className="w-12 h-12 rounded-2xl bg-red-50 text-[#EF4444] flex items-center justify-center mb-4">
              <AlertTriangle className="w-6 h-6" />
            </div>

            <h3 className="text-lg font-bold text-[#0F172A] mb-1">
              End Interview Session?
            </h3>
            <p className="text-sm text-[#64748B] mb-6">
              Are you sure you want to end this interview? Your completed answers and progress will be saved to your dashboard.
            </p>

            <div className="flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setShowEndModal(false)}
                className="px-4 py-2.5 rounded-xl border border-[#E5E7EB] text-sm font-semibold text-[#0F172A] hover:bg-slate-50 transition-all duration-180 cursor-pointer"
              >
                Continue Interview
              </button>
              <button
                type="button"
                onClick={handleEndInterview}
                className="px-5 py-2.5 rounded-xl bg-[#EF4444] hover:bg-red-600 text-sm font-semibold text-white transition-all duration-180 shadow-xs cursor-pointer"
              >
                End Session
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
