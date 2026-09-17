import React from 'react';

export default function ProgressBar({
  current = 1,
  total = 12,
  category = ''
}) {
  const percentage = Math.min(100, Math.max(0, Math.round((current / total) * 100)));

  return (
    <div className="w-full space-y-2 select-none">
      <div className="flex items-center justify-between text-[13px]">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-[#0F172A] dark:text-[#F8FAFC]">
            Question {current} of {total}
          </span>
          {category && (
            <span className="text-[#64748B] dark:text-[#94A3B8] text-[12px]">
              • {category}
            </span>
          )}
        </div>
        <span className="font-mono text-[12px] font-medium text-[#64748B] dark:text-[#94A3B8]">
          {percentage}% completed
        </span>
      </div>

      {/* Progress Bar Track */}
      <div className="h-1.5 w-full bg-slate-100 dark:bg-white/10 rounded-full overflow-hidden">
        <div 
          className="h-full bg-[#2563EB] rounded-full transition-all duration-300 ease-out"
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}
