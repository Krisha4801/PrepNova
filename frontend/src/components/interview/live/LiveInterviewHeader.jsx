import React from 'react';
import { Link } from 'react-router-dom';
import { Clock } from 'lucide-react';

/**
 * Sticky top bar of the live interview: exit link, role/difficulty,
 * elapsed timer and the "End Interview" button.
 *
 * @param {object} props
 * @param {string} props.role
 * @param {string} props.difficulty
 * @param {string} props.elapsed formatted timer (MM:SS)
 * @param {() => void} props.onEndClick
 */
export default function LiveInterviewHeader({ role, difficulty, elapsed, onEndClick }) {
  return (
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

      <div className="flex items-center gap-3.5 shrink-0">
        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800/90 text-xs font-mono font-medium text-slate-700 dark:text-slate-300">
          <Clock className="w-3.5 h-3.5 text-slate-400" />
          <span>{elapsed}</span>
        </div>

        <button
          type="button"
          onClick={onEndClick}
          className="px-3 py-1.5 rounded-xl border border-rose-200 dark:border-rose-900/50 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-xs font-semibold transition-colors"
        >
          End Interview
        </button>
      </div>
    </header>
  );
}
