import React from 'react';
import { Loader2, Mic, MicOff, Send, SkipForward } from 'lucide-react';
import { countWords } from '../../../lib/interviewFormat';

/**
 * Answer text area with voice dictation, skip and submit actions.
 * Ctrl/Cmd + Enter submits.
 *
 * @param {object} props
 * @param {string} props.value current answer text
 * @param {(text: string) => void} props.onChange
 * @param {() => void} props.onSubmit
 * @param {() => void} props.onSkip
 * @param {boolean} props.loading
 * @param {boolean} props.isRecording
 * @param {() => void} props.onToggleRecording
 */
export default function AnswerComposer({
  value,
  onChange,
  onSubmit,
  onSkip,
  loading,
  isRecording,
  onToggleRecording,
}) {
  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      onSubmit();
    }
  };

  return (
    <div className="panel-card p-5 sm:p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <label htmlFor="interview-answer" className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
            Your Answer
          </label>
          <span className="text-xs text-slate-400">({countWords(value)} words)</span>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onToggleRecording}
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
          id="interview-answer"
          rows={7}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="State your definition, practical implementation steps, trade-offs, and examples... (Ctrl + Enter to submit)"
          className="w-full p-4 bg-slate-50/80 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-700 rounded-xl text-sm sm:text-base text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:bg-white dark:focus:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition-all resize-y leading-relaxed font-normal"
        />
      </div>

      <div className="flex items-center justify-between pt-2">
        <button
          type="button"
          disabled={loading}
          onClick={onSkip}
          className="btn-secondary text-xs px-3.5 py-2"
        >
          <SkipForward className="w-3.5 h-3.5 text-slate-400" />
          <span>Skip Question</span>
        </button>

        <button
          type="button"
          disabled={loading || !value.trim()}
          onClick={onSubmit}
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
  );
}
