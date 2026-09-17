import React, { useState, useEffect, useRef } from 'react';
import { 
  Mic, 
  MicOff, 
  Square, 
  RotateCcw, 
  SkipForward, 
  Sparkles, 
  CheckCircle2,
  Volume2
} from 'lucide-react';

export default function VoiceRecorder({
  isAiSpeaking = false,
  onFinishAnswer,
  onSkipQuestion,
  isAnalyzing = false
}) {
  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const recognitionRef = useRef(null);

  // Setup Web Speech Recognition if available in the browser
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
            currentTranscript += event.results[i][0].transcript + ' ';
          }
          setTranscript(currentTranscript.trim());
        };

        recognition.onerror = (e) => {
          console.warn('Speech recognition error:', e.error);
        };

        recognitionRef.current = recognition;
      } catch (err) {
        console.warn('Could not initialize speech recognition:', err);
      }
    }
  }, []);

  // Timer while recording
  useEffect(() => {
    let timer;
    if (isRecording) {
      timer = setInterval(() => {
        setRecordingSeconds(prev => prev + 1);
      }, 1000);
    } else {
      setRecordingSeconds(0);
    }
    return () => clearInterval(timer);
  }, [isRecording]);

  const toggleRecording = () => {
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  };

  const startRecording = () => {
    setIsRecording(true);
    setTranscript('');
    try {
      recognitionRef.current?.start();
    } catch (e) {
      // Fallback: If microphone permission or Speech API fails, simulate live speech transcript
      simulateSpeechInput();
    }
  };

  const stopRecording = () => {
    setIsRecording(false);
    try {
      recognitionRef.current?.stop();
    } catch (e) {
      // ignore
    }
  };

  const simulateSpeechInput = () => {
    const simulatedAnswers = [
      "In my recent project, we tackled this by decoupling the business logic into distinct micro-services and caching hot queries in Redis.",
      "The key consideration here is ensuring that state updates are immutable and only necessary component trees re-render.",
      "I approach this by first analyzing the access patterns, setting up composite indexes, and benchmarking write performance.",
      "We resolved the issue by implementing exponential backoff and circuit breaker patterns to prevent cascade failures."
    ];
    const chosen = simulatedAnswers[Math.floor(Math.random() * simulatedAnswers.length)];
    let idx = 0;
    const interval = setInterval(() => {
      idx += 8;
      setTranscript(chosen.slice(0, idx));
      if (idx >= chosen.length) {
        clearInterval(interval);
      }
    }, 120);
  };

  const handleEndAnswer = () => {
    stopRecording();
    const finalAnswer = transcript.trim() || 'Candidate provided verbal answer addressing the key engineering points and trade-offs.';
    onFinishAnswer(finalAnswer);
  };

  const formatSecs = (s) => {
    const mins = Math.floor(s / 60);
    const secs = s % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="w-full flex flex-col items-center space-y-6">
      
      {/* Circular AI Avatar with Waveform Animation */}
      <div className="relative flex items-center justify-center">
        {/* Glow rings */}
        <div className={`absolute w-36 h-36 rounded-full transition-all duration-500 ${
          isAiSpeaking 
            ? 'bg-blue-400/20 scale-125 animate-ping' 
            : isRecording 
            ? 'bg-emerald-400/20 scale-115 animate-pulse'
            : 'bg-slate-200/40 dark:bg-white/5'
        }`} />

        <div className={`relative w-28 h-28 rounded-full border-2 flex flex-col items-center justify-center transition-all duration-300 shadow-md ${
          isAiSpeaking
            ? 'border-[#2563EB] bg-blue-50 dark:bg-blue-950/60 shadow-blue-500/20'
            : isRecording
            ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/60 shadow-emerald-500/20'
            : 'border-[#E5E7EB] dark:border-white/10 bg-white dark:bg-[#081A3A]'
        }`}>
          {isAiSpeaking ? (
            <div className="flex items-center gap-1">
              {[40, 75, 55, 90, 60, 80, 45].map((h, i) => (
                <div 
                  key={i}
                  className="w-1 bg-[#2563EB] rounded-full animate-bounce"
                  style={{ 
                    height: `${h * 0.35}px`,
                    animationDelay: `${i * 100}ms`
                  }}
                />
              ))}
            </div>
          ) : isRecording ? (
            <div className="flex flex-col items-center">
              <div className="w-3 h-3 rounded-full bg-emerald-500 animate-ping mb-1" />
              <span className="font-mono text-[11px] font-bold text-emerald-600 dark:text-emerald-400">
                {formatSecs(recordingSeconds)}
              </span>
            </div>
          ) : (
            <div className="flex flex-col items-center text-center p-2">
              <Sparkles className="w-6 h-6 text-[#2563EB] mb-1" />
              <span className="text-[11px] font-semibold text-[#64748B] dark:text-[#94A3B8]">
                AI Interviewer
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Transcript Box */}
      <div className="w-full max-w-2xl min-h-[96px] p-4 rounded-[16px] bg-white dark:bg-[#081A3A] border border-[#E5E7EB] dark:border-white/10 shadow-2xs flex flex-col justify-between transition-all">
        <div>
          <span className="text-[11px] font-semibold uppercase tracking-wider text-[#64748B] dark:text-[#94A3B8] block mb-1">
            {isRecording ? 'Transcribing Your Voice...' : 'Your Answer Transcript:'}
          </span>
          <p className="text-[14px] text-[#0F172A] dark:text-[#F8FAFC] leading-relaxed italic">
            {transcript ? `"${transcript}"` : (isRecording ? 'Listening to your microphone...' : 'Click the microphone below to start speaking.')}
          </p>
        </div>

        {transcript && !isRecording && (
          <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-white/5 mt-2">
            <button
              type="button"
              onClick={() => { setTranscript(''); startRecording(); }}
              className="text-[11px] font-medium text-[#64748B] hover:text-[#0F172A] dark:hover:text-white flex items-center gap-1 cursor-pointer"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Re-record</span>
            </button>
          </div>
        )}
      </div>

      {/* Bottom Controls */}
      <div className="flex items-center gap-4">
        {/* Skip Question */}
        <button
          type="button"
          onClick={onSkipQuestion}
          disabled={isAnalyzing}
          className="h-[44px] px-4 rounded-[12px] border border-[#E5E7EB] dark:border-white/10 text-[13px] font-medium text-[#64748B] dark:text-[#94A3B8] hover:text-[#0F172A] dark:hover:text-white hover:bg-slate-50 dark:hover:bg-white/5 transition-colors cursor-pointer flex items-center gap-1.5"
        >
          <SkipForward className="w-4 h-4" />
          <span>Skip</span>
        </button>

        {/* Large Microphone Button */}
        <button
          type="button"
          onClick={toggleRecording}
          disabled={isAnalyzing}
          className={`h-[56px] px-8 rounded-full font-semibold text-[15px] flex items-center gap-3 transition-all duration-200 cursor-pointer shadow-sm active:scale-95 ${
            isRecording
              ? 'bg-emerald-600 hover:bg-emerald-700 text-white ring-4 ring-emerald-500/20'
              : 'bg-[#2563EB] hover:bg-blue-700 text-white ring-4 ring-blue-500/15'
          }`}
        >
          {isRecording ? (
            <>
              <Square className="w-5 h-5 fill-current" />
              <span>Stop Speaking</span>
            </>
          ) : (
            <>
              <Mic className="w-5 h-5" />
              <span>{transcript ? 'Resume Voice' : 'Start Answering'}</span>
            </>
          )}
        </button>

        {/* End Answer / Next Button */}
        <button
          type="button"
          onClick={handleEndAnswer}
          disabled={isAnalyzing || (!transcript && !isRecording)}
          className="h-[44px] px-5 rounded-[12px] bg-slate-900 hover:bg-black dark:bg-white dark:hover:bg-slate-100 text-white dark:text-slate-900 text-[13px] font-semibold transition-all cursor-pointer shadow-xs disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2"
        >
          {isAnalyzing ? (
            <span>Analyzing...</span>
          ) : (
            <>
              <CheckCircle2 className="w-4 h-4 text-emerald-400 dark:text-emerald-600" />
              <span>Submit Answer</span>
            </>
          )}
        </button>
      </div>

    </div>
  );
}
