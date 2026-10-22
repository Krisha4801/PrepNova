import React from 'react';
import { CheckCircle2 } from 'lucide-react';
import { INTERVIEW_DEFAULTS } from '../../../constants/interview';

/**
 * Shows the score and feedback for the previously answered question.
 *
 * @param {object} props
 * @param {{ rating?: number, feedback?: string, correctness?: number, clarity?: number }} props.evaluation
 */
export default function EvaluationBanner({ evaluation }) {
  const fallback = INTERVIEW_DEFAULTS.RATING;

  return (
    <div className="p-4 rounded-xl bg-indigo-50/70 dark:bg-indigo-950/40 border border-indigo-100 dark:border-indigo-900/40 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
      <div className="flex items-center gap-2">
        <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
        <span className="font-semibold text-slate-800 dark:text-slate-200">
          Previous Score: {evaluation.rating || fallback}/10
        </span>
        <span className="text-slate-400">|</span>
        <span className="text-slate-600 dark:text-slate-400 truncate">{evaluation.feedback}</span>
      </div>
      <div className="flex items-center gap-3 shrink-0 text-[11px] font-medium text-slate-500">
        <span>Correctness: {evaluation.correctness || fallback}/10</span>
        <span>Clarity: {evaluation.clarity || fallback}/10</span>
      </div>
    </div>
  );
}
