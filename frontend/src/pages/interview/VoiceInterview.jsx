import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  Mic, 
  MicOff, 
  Square, 
  RotateCcw, 
  Sparkles, 
  Send, 
  HelpCircle, 
  ChevronDown, 
  ChevronUp, 
  SkipForward, 
  CheckCircle2, 
  Volume2, 
  VolumeX,
  Loader2,
  Radio,
  Clock,
  ShieldCheck
} from 'lucide-react';
import InterviewHeader from '../../components/interview/InterviewHeader';
import { useAuth } from '../../context/AuthContext';
import { 
  INTERVIEW_TOTAL_SECONDS, 
  getStageForTime, 
  generateOpeningQuestion, 
  analyzeCandidateAnswer, 
  generateNextQuestion, 
  compileFinalReport 
} from '../../data/adaptiveInterviewEngine';

export default function VoiceInterview() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();

  // Retrieve user choices from route state or localStorage
  const stateData = location.state || {};
  const role = stateData.targetRole || localStorage.getItem('prepnova_role') || 'Frontend Developer';
  const difficulty = stateData.difficulty || localStorage.getItem('prepnova_difficulty') || 'Medium';
  const focusSkills = useMemo(() => {
    return stateData.focusSkills || JSON.parse(localStorage.getItem('prepnova_focus_areas') || '["React", "JavaScript", "System Design"]');
  }, [stateData.focusSkills]);
  const candidateName = user?.name || 'Varunee';

  // 1. Initial 3-Second Loading Screen State
  const [loadingScreen, setLoadingScreen] = useState(true);
  const [loadingStep, setLoadingStep] = useState(0);

  const loadingMessages = [
    'Preparing your interviewer...',
    'Analyzing selected skills...',
    'Generating personalized interview...'
  ];

  useEffect(() => {
    const step1 = setTimeout(() => setLoadingStep(1), 1000);
    const step2 = setTimeout(() => setLoadingStep(2), 2000);
    const stepDone = setTimeout(() => setLoadingScreen(false), 3000);

    return () => {
      clearTimeout(step1);
      clearTimeout(step2);
      clearTimeout(stepDone);
    };
  }, []);

  // 2. Continuous 25:00 Countdown Timer
  const [secondsRemaining, setSecondsRemaining] = useState(INTERVIEW_TOTAL_SECONDS);

  useEffect(() => {
    if (loadingScreen) return;
    if (secondsRemaining <= 0) {
      handleFinalWrapUp();
      return;
    }

    const timer = setInterval(() => {
      setSecondsRemaining(prev => Math.max(0, prev - 1));
    }, 1000);

    return () => clearInterval(timer);
  }, [loadingScreen, secondsRemaining]);

  // Current stage computed dynamically from time remaining
  const currentStage = useMemo(() => getStageForTime(secondsRemaining), [secondsRemaining]);

  // 3. Conversation & Question State
  const [currentQuestion, setCurrentQuestion] = useState(null);
  const [exchanges, setExchanges] = useState([]);
  const [isAiSpeaking, setIsAiSpeaking] = useState(false);
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [showHint, setShowHint] = useState(false);
  const [audioMuted, setAudioMuted] = useState(false);

  // 4. Voice Recording & Transcript State
  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const recognitionRef = useRef(null);
  const speechSimTimerRef = useRef(null);

  // Initialize Opening Question once loading finishes
  useEffect(() => {
    if (!loadingScreen && !currentQuestion) {
      const opening = generateOpeningQuestion({ candidateName, targetRole: role });
      setCurrentQuestion(opening);
    }
  }, [loadingScreen, candidateName, role, currentQuestion]);

  // 5. Automatic AI Speech Synthesis for Current Question
  const speakText = useCallback((textToSpeak) => {
    if (audioMuted) return;
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(textToSpeak);
      utterance.rate = 0.98;
      utterance.pitch = 1.0;
      utterance.lang = 'en-US';

      // Pick a natural voice if available
      const voices = window.speechSynthesis.getVoices();
      const preferredVoice = voices.find(v => (v.name.includes('Natural') || v.name.includes('Google') || v.name.includes('Samantha') || v.name.includes('Ava')) && v.lang.startsWith('en'));
      if (preferredVoice) utterance.voice = preferredVoice;

      utterance.onstart = () => setIsAiSpeaking(true);
      utterance.onend = () => setIsAiSpeaking(false);
      utterance.onerror = () => setIsAiSpeaking(false);

      const delayTimer = setTimeout(() => {
        window.speechSynthesis.speak(utterance);
      }, 350);

      return () => {
        clearTimeout(delayTimer);
        window.speechSynthesis.cancel();
      };
    }
  }, [audioMuted]);

  useEffect(() => {
    if (!loadingScreen && currentQuestion?.title) {
      speakText(currentQuestion.title);
    }
    return () => {
      if ('speechSynthesis' in window) window.speechSynthesis.cancel();
    };
  }, [currentQuestion, loadingScreen, speakText]);

  // 6. Speech Recognition Setup
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      try {
        const recognition = new SpeechRecognition();
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = 'en-US';

        recognition.onresult = (event) => {
          let liveTranscript = '';
          for (let i = 0; i < event.results.length; i++) {
            liveTranscript += event.results[i][0].transcript + ' ';
          }
          setTranscript(liveTranscript.trim());
        };

        recognition.onerror = (e) => {
          console.warn('Speech recognition warning:', e.error);
        };

        recognitionRef.current = recognition;
      } catch (err) {
        console.warn('SpeechRecognition initialization error:', err);
      }
    }
  }, []);

  // Recording Timer
  useEffect(() => {
    let interval;
    if (isRecording) {
      interval = setInterval(() => {
        setRecordingSeconds(prev => prev + 1);
      }, 1000);
    } else {
      setRecordingSeconds(0);
    }
    return () => clearInterval(interval);
  }, [isRecording]);

  // 7. Start & Stop Voice Recording Handlers
  const startRecording = () => {
    // Silence AI if still speaking
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    setIsAiSpeaking(false);
    setIsRecording(true);
    setTranscript('');

    try {
      recognitionRef.current?.start();
    } catch {
      // Graceful fallback simulation if microphone access or browser API is restricted
      simulateLiveSpeechInput();
    }
  };

  const stopRecording = () => {
    setIsRecording(false);
    if (speechSimTimerRef.current) {
      clearInterval(speechSimTimerRef.current);
    }
    try {
      recognitionRef.current?.stop();
    } catch {
      // ignore
    }
  };

  // Fallback simulator for test environments or restricted mic permissions
  const simulateLiveSpeechInput = () => {
    const simSamples = [
      "In my recent project, I built a Bus Tracking App where we managed live location updates using WebSockets and clustered map markers to prevent UI re-renders.",
      "I generally prefer Redux Toolkit because it provides built-in Immer immutability and createAsyncThunk, whereas Context API can trigger redundant re-renders on large state changes.",
      "React uses reconciliation with the Fiber architecture to prioritize high-priority user interactions and break deep rendering work into incremental time-slices.",
      "To optimize rendering of 10,000 items, I use virtualized windowing like react-window and memoize expensive cell calculations with useMemo."
    ];
    const chosen = simSamples[Math.floor(Math.random() * simSamples.length)];
    let pos = 0;
    speechSimTimerRef.current = setInterval(() => {
      pos += 9;
      setTranscript(chosen.slice(0, pos));
      if (pos >= chosen.length) {
        clearInterval(speechSimTimerRef.current);
      }
    }, 120);
  };

  const handleReRecord = () => {
    setTranscript('');
    startRecording();
  };

  // 8. Submit Answer & Trigger Dynamic Evaluation
  const handleSubmitAnswer = () => {
    if (isRecording) {
      stopRecording();
    }

    const finalAnswer = transcript.trim() || 'Candidate provided a structured verbal explanation addressing the core technical mechanics.';
    setIsEvaluating(true);

    // Analyze answer internally
    const analysis = analyzeCandidateAnswer(finalAnswer, {
      currentQuestion,
      stage: currentStage.label,
      role
    });

    const newExchange = {
      questionTitle: currentQuestion.title,
      questionCategory: currentQuestion.category,
      answerText: finalAnswer,
      timestamp: new Date().toISOString(),
      analysis
    };

    const updatedExchanges = [...exchanges, newExchange];
    setExchanges(updatedExchanges);
    setTranscript('');
    setShowHint(false);

    // Natural brief pause to simulate AI processing the answer
    setTimeout(() => {
      setIsEvaluating(false);

      // Check if session has reached time limit or closing question
      if (secondsRemaining <= 10 || currentQuestion?.stage === 'Wrap-up') {
        finishSession(updatedExchanges);
      } else {
        // Generate dynamic next question based on candidate's answer & stage
        const nextQ = generateNextQuestion({
          previousAnswers: updatedExchanges,
          lastAnalysis: analysis,
          timeRemaining: secondsRemaining,
          targetRole: role,
          focusSkills,
          difficulty,
          candidateName
        });
        setCurrentQuestion(nextQ);
      }
    }, 900);
  };

  // 9. Skip Question (AI adapts gently)
  const handleSkipQuestion = () => {
    if (isRecording) stopRecording();
    if ('speechSynthesis' in window) window.speechSynthesis.cancel();
    setIsAiSpeaking(false);

    const skipExchange = {
      questionTitle: currentQuestion.title,
      questionCategory: currentQuestion.category,
      answerText: "Candidate chose to pass on this question to focus on alternative topics.",
      timestamp: new Date().toISOString(),
      analysis: {
        isStruggling: true,
        detectedKeywords: [],
        metrics: {
          technicalAccuracy: 50,
          communicationClarity: 70,
          confidence: 60,
          depth: 40,
          completeness: 40,
          overallScore: 52
        }
      }
    };

    const updated = [...exchanges, skipExchange];
    setExchanges(updated);
    setTranscript('');
    setShowHint(false);

    const nextQ = generateNextQuestion({
      previousAnswers: updated,
      lastAnalysis: skipExchange.analysis,
      timeRemaining: secondsRemaining,
      targetRole: role,
      focusSkills,
      difficulty,
      candidateName
    });
    setCurrentQuestion(nextQ);
  };

  // 10. Final Wrap-up & Results Compilation
  const handleFinalWrapUp = () => {
    finishSession(exchanges);
  };

  const finishSession = (finalExchanges) => {
    if ('speechSynthesis' in window) window.speechSynthesis.cancel();

    const report = compileFinalReport({
      exchanges: finalExchanges,
      targetRole: role,
      difficulty,
      timeSpentSecs: INTERVIEW_TOTAL_SECONDS - secondsRemaining
    });

    // Formatted answer map for results page
    const answersMap = {};
    report.transcript.forEach((item, idx) => {
      answersMap[`q_${idx}`] = {
        questionId: `q_${idx}`,
        questionTitle: item.questionTitle,
        category: item.category,
        answer: item.answer,
        score: item.score,
        feedback: item.feedback
      };
    });

    navigate('/interview/results', {
      state: {
        role,
        difficulty,
        format: 'voice',
        overallScore: report.overallScore,
        scores: report.scores,
        strengths: report.strengths,
        weaknesses: report.weaknesses,
        recommendedTopics: report.recommendedTopics,
        totalQuestions: report.transcript.length,
        answers: answersMap,
        completedAt: new Date().toISOString()
      }
    });
  };

  // Helper formatting for recording seconds
  const formatSeconds = (sec) => {
    const mins = Math.floor(sec / 60);
    const s = sec % 60;
    return `${mins}:${s.toString().padStart(2, '0')}`;
  };

  // ==========================================
  // RENDER: 3-Second Loading Screen
  // ==========================================
  if (loadingScreen) {
    return (
      <div className="fixed inset-0 z-50 bg-[#070B14] text-white flex flex-col items-center justify-center p-6 select-none">
        {/* Ambient glow */}
        <div className="absolute w-[500px] h-[500px] rounded-full bg-blue-600/10 blur-[120px] pointer-events-none" />

        <div className="relative z-10 max-w-md w-full flex flex-col items-center text-center space-y-7">
          {/* Pulsing Avatar Placeholder */}
          <div className="relative flex items-center justify-center">
            <div className="absolute w-28 h-28 rounded-full bg-blue-500/20 animate-ping" />
            <div className="w-24 h-24 rounded-full bg-linear-to-b from-blue-600 to-indigo-700 flex items-center justify-center shadow-lg shadow-blue-500/30">
              <Sparkles className="w-10 h-10 text-white animate-pulse" />
            </div>
          </div>

          <div className="space-y-2">
            <h2 className="text-[24px] font-bold tracking-tight text-white">
              Starting Your Voice Interview
            </h2>
            <p className="text-[14px] text-slate-400">
              Personalizing for <span className="text-white font-medium">{role}</span> candidate
            </p>
          </div>

          {/* Stepper Progress */}
          <div className="w-full space-y-3 pt-2">
            {loadingMessages.map((msg, i) => {
              const isPast = loadingStep > i;
              const isCurrent = loadingStep === i;
              return (
                <div 
                  key={i}
                  className={`flex items-center gap-3 p-3 rounded-xl border text-[13px] transition-all duration-300 ${
                    isCurrent 
                      ? 'bg-blue-600/15 border-blue-500/40 text-blue-300 font-semibold' 
                      : isPast 
                      ? 'bg-white/5 border-white/10 text-emerald-400 font-medium' 
                      : 'border-transparent text-slate-600 font-normal'
                  }`}
                >
                  {isPast ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  ) : isCurrent ? (
                    <Loader2 className="w-4 h-4 text-blue-400 animate-spin shrink-0" />
                  ) : (
                    <div className="w-4 h-4 rounded-full border border-slate-700 shrink-0" />
                  )}
                  <span>{msg}</span>
                </div>
              );
            })}
          </div>

          <div className="text-[12px] text-slate-500 pt-2 flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-blue-400" />
            <span>Real-time voice synthesis and adaptive conversation active</span>
          </div>
        </div>
      </div>
    );
  }

  // ==========================================
  // RENDER: Full Screen Dark Elegant Voice UI
  // ==========================================
  return (
    <div className="min-h-screen bg-[#070B14] text-white flex flex-col font-sans selection:bg-blue-600/30 selection:text-blue-200">
      
      {/* Top Header with Stages and Timer */}
      <InterviewHeader
        targetRole={role}
        difficulty={difficulty}
        format="voice"
        secondsRemaining={secondsRemaining}
        activeStage={currentStage.label}
        showStages={true}
        onExit={() => navigate('/customize')}
      />

      {/* Main Center Stage */}
      <main className="flex-1 max-w-4xl w-full mx-auto px-4 sm:px-6 py-6 sm:py-8 flex flex-col justify-between items-center relative">
        
        {/* Center: Large AI Interviewer Avatar & Speaking Waveform */}
        <div className="w-full flex flex-col items-center justify-center space-y-6 pt-2 sm:pt-4">
          
          <div className="relative flex items-center justify-center">
            {/* Ambient Wave Rings */}
            <div 
              className={`absolute w-44 h-44 rounded-full transition-all duration-700 pointer-events-none ${
                isAiSpeaking
                  ? 'bg-blue-600/20 scale-125 animate-ping'
                  : isRecording
                  ? 'bg-emerald-500/20 scale-125 animate-pulse'
                  : 'bg-white/[0.02]'
              }`} 
            />
            
            <div 
              className={`absolute w-36 h-36 rounded-full transition-all duration-500 pointer-events-none ${
                isAiSpeaking
                  ? 'bg-blue-500/25 blur-md'
                  : isRecording
                  ? 'bg-emerald-500/25 blur-md'
                  : 'bg-transparent'
              }`} 
            />

            {/* Avatar Circle */}
            <div 
              className={`relative w-28 h-28 sm:w-32 sm:h-32 rounded-full border-2 flex flex-col items-center justify-center transition-all duration-300 shadow-2xl ${
                isAiSpeaking
                  ? 'border-blue-500 bg-linear-to-b from-blue-900/60 to-[#0B1528] shadow-blue-500/30'
                  : isRecording
                  ? 'border-emerald-500 bg-linear-to-b from-emerald-950/60 to-[#071B16] shadow-emerald-500/30'
                  : 'border-white/10 bg-[#0C1222]'
              }`}
            >
              {isAiSpeaking ? (
                <div className="flex flex-col items-center justify-center">
                  <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-400 mb-1">
                    <Radio className="w-5 h-5 animate-pulse text-blue-400" />
                  </div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-blue-400">
                    Interviewer
                  </span>
                </div>
              ) : isRecording ? (
                <div className="flex flex-col items-center justify-center">
                  <div className="w-3.5 h-3.5 rounded-full bg-emerald-400 animate-ping mb-1" />
                  <span className="font-mono text-[13px] font-bold text-emerald-400 tracking-wider">
                    {formatSeconds(recordingSeconds)}
                  </span>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center">
                  <Sparkles className="w-8 h-8 text-blue-400 mb-1" />
                  <span className="text-[11px] font-semibold text-slate-300">
                    PrepNova AI
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* AI Speaking Indicator & Equalizer */}
          <div className="h-8 flex items-center justify-center">
            {isAiSpeaking ? (
              <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-600/15 border border-blue-500/30 text-blue-400 text-[12px] font-medium animate-in fade-in duration-200">
                <span className="flex items-center gap-1">
                  {[35, 75, 50, 95, 60, 85, 40].map((h, i) => (
                    <span 
                      key={i}
                      className="w-0.5 bg-blue-400 rounded-full animate-bounce"
                      style={{ 
                        height: `${h * 0.22}px`,
                        animationDelay: `${i * 120}ms`
                      }}
                    />
                  ))}
                </span>
                <span className="ml-1 font-semibold">AI is speaking...</span>
              </div>
            ) : isRecording ? (
              <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-[12px] font-medium animate-in fade-in duration-200">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                <span className="font-semibold">Microphone active — speaking</span>
              </div>
            ) : isEvaluating ? (
              <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-purple-500/15 border border-purple-500/30 text-purple-300 text-[12px] font-medium animate-pulse">
                <Loader2 className="w-3.5 h-3.5 animate-spin text-purple-400" />
                <span>Interviewer is analyzing your response...</span>
              </div>
            ) : (
              <div className="text-[12px] text-slate-400 font-medium">
                Stage: <span className="text-white font-semibold">{currentStage.label}</span>
              </div>
            )}
          </div>

          {/* Current Question Display (No question numbers, pure natural conversation) */}
          <div className="max-w-2xl w-full text-center px-2">
            <h1 className="text-[20px] sm:text-[24px] font-medium text-white leading-relaxed tracking-tight">
              {currentQuestion?.title || 'Preparing question...'}
            </h1>

            {/* Need a Hint Button (Single short bullet only) */}
            {currentQuestion?.hint && (
              <div className="mt-4 flex flex-col items-center">
                <button
                  type="button"
                  onClick={() => setShowHint(prev => !prev)}
                  className="inline-flex items-center gap-1.5 text-[12px] font-medium text-slate-400 hover:text-blue-400 transition-colors cursor-pointer py-1 px-3 rounded-full hover:bg-white/5"
                >
                  <HelpCircle className="w-3.5 h-3.5 text-blue-400" />
                  <span>Need a hint?</span>
                  {showHint ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                </button>

                {showHint && (
                  <div className="mt-2.5 max-w-lg p-3 rounded-xl bg-white/[0.04] border border-white/10 text-[13px] text-slate-300 animate-in fade-in duration-150">
                    <p className="flex items-start gap-2 text-left">
                      <span className="text-blue-400 font-bold">•</span>
                      <span>{currentQuestion.hint}</span>
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Elegant Glass Transcript Card */}
          <div className="w-full max-w-2xl min-h-[110px] p-5 rounded-2xl bg-white/[0.03] backdrop-blur-md border border-white/10 shadow-2xl flex flex-col justify-between transition-all">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                  {isRecording ? 'Transcribing live voice...' : 'Your response'}
                </span>
                {isRecording && (
                  <span className="text-[11px] font-mono text-emerald-400 flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                    Recording
                  </span>
                )}
              </div>

              <p className="text-[14px] sm:text-[15px] text-slate-200 leading-relaxed italic">
                {transcript ? (
                  `"${transcript}"`
                ) : isRecording ? (
                  <span className="text-slate-400 not-italic">Listening carefully to your answer...</span>
                ) : (
                  <span className="text-slate-500 not-italic">Click "Start Speaking" below when you are ready to answer.</span>
                )}
              </p>
            </div>

            {/* Post-recording actions: Re-record & Submit */}
            {transcript && !isRecording && (
              <div className="flex items-center justify-between pt-3 border-t border-white/10 mt-3">
                <button
                  type="button"
                  onClick={handleReRecord}
                  disabled={isEvaluating}
                  className="text-[12px] font-medium text-slate-400 hover:text-white flex items-center gap-1.5 cursor-pointer transition-colors"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Re-record</span>
                </button>

                <span className="text-[11px] text-slate-500">
                  Answer ready for interviewer review
                </span>
              </div>
            )}
          </div>

        </div>

        {/* Bottom Microphone Controls */}
        <div className="w-full max-w-md flex flex-col items-center space-y-4 pt-6 pb-2">
          
          <div className="flex items-center gap-4">
            
            {/* Secondary: Skip Question */}
            <button
              type="button"
              onClick={handleSkipQuestion}
              disabled={isEvaluating || isRecording}
              className="h-[46px] px-4 rounded-xl border border-white/10 text-[13px] font-medium text-slate-400 hover:text-white hover:bg-white/5 transition-all cursor-pointer flex items-center gap-1.5 disabled:opacity-40 disabled:cursor-not-allowed"
              title="Skip this question"
            >
              <SkipForward className="w-4 h-4" />
              <span className="hidden sm:inline">Skip</span>
            </button>

            {/* Large Microphone Primary Button */}
            {!isRecording ? (
              <button
                type="button"
                onClick={startRecording}
                disabled={isEvaluating}
                className="h-[54px] px-8 rounded-full bg-[#2563EB] hover:bg-blue-600 text-white font-semibold text-[15px] flex items-center gap-2.5 shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40 active:scale-98 transition-all cursor-pointer disabled:opacity-50"
              >
                <Mic className="w-5 h-5 text-white" />
                <span>Start Speaking</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={stopRecording}
                className="h-[54px] px-8 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-[15px] flex items-center gap-2.5 shadow-lg shadow-emerald-500/30 ring-4 ring-emerald-500/20 active:scale-98 transition-all cursor-pointer animate-pulse"
              >
                <Square className="w-4 h-4 fill-current text-white" />
                <span>Stop Recording</span>
              </button>
            )}

            {/* Submit Answer Button */}
            <button
              type="button"
              onClick={handleSubmitAnswer}
              disabled={isEvaluating || (!transcript && !isRecording)}
              className="h-[46px] px-5 rounded-xl bg-white hover:bg-slate-100 text-[#070B14] font-semibold text-[13px] transition-all cursor-pointer shadow-md disabled:opacity-30 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {isEvaluating ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Analyzing...</span>
                </>
              ) : (
                <>
                  <Send className="w-3.5 h-3.5" />
                  <span>Submit Answer</span>
                </>
              )}
            </button>
          </div>

          {/* Subtext info */}
          <div className="flex items-center gap-4 text-[11px] text-slate-500 select-none">
            <span>Adaptive AI evaluates depth & clarity</span>
            <span>•</span>
            <button 
              type="button"
              onClick={() => {
                if ('speechSynthesis' in window) window.speechSynthesis.cancel();
                setAudioMuted(prev => !prev);
              }}
              className="hover:text-slate-300 transition-colors cursor-pointer flex items-center gap-1"
            >
              {audioMuted ? <VolumeX className="w-3 h-3 text-rose-400" /> : <Volume2 className="w-3 h-3 text-blue-400" />}
              <span>{audioMuted ? 'Unmute AI Voice' : 'AI Voice Enabled'}</span>
            </button>
          </div>

        </div>

      </main>
    </div>
  );
}
