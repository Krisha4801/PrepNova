import React from 'react';
import { Volume2 } from 'lucide-react';

/**
 * Question counter, "Listen" button and the active question prompt.
 *
 * @param {object} props
 * @param {number} props.current current question number (1-based)
 * @param {number} props.total total number of questions
 * @param {string} props.difficulty
 * @param {string} props.questionText
 * @param {boolean} props.loading
 * @param {() => void} props.onSpeak reads the question aloud
 */
export default function QuestionPanel({ current, total, difficulty, questionText, loading, onSpeak }) {
  return (
    <>
      <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 font-medium">
        <div className="flex items-center gap-2">
          <span className="font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">
            Question {current} of {total}
          </span>
          <span>•</span>
          <span className="capitalize">{difficulty} Tier</span>
        </div>
        <button
          type="button"
          onClick={onSpeak}
          className="inline-flex items-center gap-1.5 text-slate-500 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors p-1"
          title="Listen to question"
        >
          <Volume2 className="w-4 h-4" />
          <span className="hidden sm:inline">Listen</span>
        </button>
      </div>

      <div className="panel-card bg-white dark:bg-[#0F172A] border-slate-200/90 dark:border-slate-800/90 shadow-sm p-6 sm:p-7">
        <h2 className="text-lg sm:text-xl font-semibold text-slate-900 dark:text-white leading-relaxed tracking-tight">
          {loading && !questionText ? 'Generating next targeted question...' : questionText}
        </h2>
      </div>
    </>
  );
}
