import React from 'react';
import { Volume2 } from 'lucide-react';

/** Map raw section IDs to human-readable labels. */
function formatSection(sectionId) {
  if (!sectionId) return '';
  const map = {
    introduction: 'Introduction',
    projects: 'Projects',
    skills: 'Skills',
    technical_concepts: 'Technical Concepts',
    scenario: 'Scenario',
    behavioral: 'Behavioral',
  };
  return map[sectionId] || sectionId.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

/**
 * Question counter, section label, "Listen" button and the active question prompt.
 *
 * @param {object} props
 * @param {number} props.current current question number (1-based)
 * @param {number} props.total total number of questions
 * @param {string} [props.section] active section id (e.g. "projects")
 * @param {string} props.difficulty
 * @param {string} props.questionText
 * @param {boolean} props.loading
 * @param {() => void} props.onSpeak reads the question aloud
 */
export default function QuestionPanel({ current, total, section, difficulty, questionText, loading, onSpeak }) {
  const sectionLabel = formatSection(section);

  return (
    <>
      <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 font-medium">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">
            Question {current} of {total}
          </span>
          {sectionLabel && (
            <>
              <span>•</span>
              <span className="px-2 py-0.5 rounded-full bg-indigo-100 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 font-semibold text-[11px] uppercase tracking-wider">
                {sectionLabel}
              </span>
            </>
          )}
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
