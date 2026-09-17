import React, { useState } from 'react';
import { 
  Clock, 
  HelpCircle, 
  Volume2, 
  VolumeX, 
  Lightbulb, 
  ChevronDown, 
  ChevronUp,
  Tag
} from 'lucide-react';

export default function QuestionCard({
  question,
  showHints = true,
  onAudioPlay
}) {
  const [hintsExpanded, setHintsExpanded] = useState(false);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);

  if (!question) return null;

  const handleSpeak = () => {
    if (!('speechSynthesis' in window)) return;

    if (isPlayingAudio) {
      window.speechSynthesis.cancel();
      setIsPlayingAudio(false);
      return;
    }

    window.speechSynthesis.cancel();
    const textToRead = `${question.title} ${question.context ? 'Context: ' + question.context : ''}`;
    const utterance = new SpeechSynthesisUtterance(textToRead);
    utterance.rate = 1.0;
    utterance.pitch = 1.0;

    utterance.onend = () => setIsPlayingAudio(false);
    utterance.onerror = () => setIsPlayingAudio(false);

    setIsPlayingAudio(true);
    window.speechSynthesis.speak(utterance);
    if (onAudioPlay) onAudioPlay(true);
  };

  return (
    <div className="bg-white dark:bg-[#081A3A] rounded-[18px] border border-[#E5E7EB] dark:border-white/10 p-6 sm:p-7 shadow-[0_2px_8px_rgba(15,23,42,0.04)] space-y-4 transition-all">
      
      {/* Top Meta Row */}
      <div className="flex flex-wrap items-center justify-between gap-2.5">
        <div className="flex items-center gap-2">
          {/* Category Badge */}
          <span className="px-2.5 py-1 rounded-full text-[11px] font-semibold bg-blue-50 dark:bg-blue-950/60 text-[#2563EB] dark:text-[#38BDF8] border border-blue-100 dark:border-blue-900/40">
            {question.category || 'Technical'}
          </span>

          {/* Difficulty Badge */}
          <span className={`px-2 py-0.5 rounded-md text-[11px] font-medium ${
            question.difficulty === 'Hard'
              ? 'bg-rose-50 text-rose-600 dark:bg-rose-950/40 dark:text-rose-400 border border-rose-100 dark:border-rose-900/40'
              : question.difficulty === 'Easy'
              ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-900/40'
              : 'bg-slate-100 text-slate-700 dark:bg-white/10 dark:text-[#CBD5E1]'
          }`}>
            {question.difficulty || 'Medium'}
          </span>
        </div>

        <div className="flex items-center gap-3">
          {/* Estimated Time */}
          <div className="flex items-center gap-1.5 text-[12px] text-[#64748B] dark:text-[#94A3B8]">
            <Clock className="w-3.5 h-3.5" />
            <span>{question.estimatedTime || '2-3 min'}</span>
          </div>

          {/* Speak Question Button */}
          <button
            type="button"
            onClick={handleSpeak}
            className={`p-1.5 rounded-lg border transition-colors cursor-pointer flex items-center gap-1 text-[12px] ${
              isPlayingAudio
                ? 'bg-blue-50 dark:bg-blue-950/60 border-blue-200 text-[#2563EB]'
                : 'border-[#E5E7EB] dark:border-white/10 text-[#64748B] dark:text-[#94A3B8] hover:text-[#0F172A] dark:hover:text-white hover:bg-slate-50 dark:hover:bg-white/5'
            }`}
            title={isPlayingAudio ? 'Stop audio' : 'Listen to question'}
          >
            {isPlayingAudio ? <VolumeX className="w-3.5 h-3.5 animate-pulse" /> : <Volume2 className="w-3.5 h-3.5" />}
            <span className="hidden sm:inline">{isPlayingAudio ? 'Stop' : 'Listen'}</span>
          </button>
        </div>
      </div>

      {/* Main Question Title */}
      <h2 className="text-[20px] sm:text-[22px] font-bold text-[#0F172A] dark:text-[#F8FAFC] leading-[1.4] tracking-tight">
        {question.title}
      </h2>

      {/* Optional Context / Scenario Box */}
      {question.context && (
        <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200/60 dark:border-white/10 text-[13px] text-[#475569] dark:text-[#CBD5E1] leading-relaxed">
          <span className="font-semibold text-[#0F172A] dark:text-white mr-1.5">Context:</span>
          {question.context}
        </div>
      )}

      {/* Optional Hints Dropdown */}
      {showHints && question.hint && (
        <div className="pt-2 border-t border-slate-100 dark:border-white/5">
          <button
            type="button"
            onClick={() => setHintsExpanded(prev => !prev)}
            className="flex items-center gap-1.5 text-[12px] font-medium text-[#2563EB] dark:text-[#38BDF8] hover:underline cursor-pointer"
          >
            <Lightbulb className="w-3.5 h-3.5" />
            <span>{hintsExpanded ? 'Hide Hint' : 'Need a hint?'}</span>
            {hintsExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
          </button>

          {hintsExpanded && (
            <div className="mt-2 p-3 rounded-lg bg-blue-50/60 dark:bg-blue-950/30 border border-blue-100 dark:border-blue-900/30 text-[12px] text-[#334155] dark:text-[#94A3B8] leading-relaxed animate-in fade-in duration-150">
              {question.hint}
            </div>
          )}
        </div>
      )}

    </div>
  );
}
