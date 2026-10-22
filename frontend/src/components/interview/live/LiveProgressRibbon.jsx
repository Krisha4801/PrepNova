import React from 'react';

/**
 * Thin progress ribbon under the header.
 *
 * @param {object} props
 * @param {number} props.current current question number (1-based)
 * @param {number} props.total total number of questions
 */
export default function LiveProgressRibbon({ current, total }) {
  const percent = Math.min(100, Math.round((current / total) * 100));

  return (
    <div className="w-full bg-slate-200 dark:bg-slate-800 h-1">
      <div
        className="bg-indigo-600 h-1 transition-all duration-300 ease-out"
        style={{ width: `${percent}%` }}
      />
    </div>
  );
}
