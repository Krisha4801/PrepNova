import React, { useState } from 'react';
import { Target, ChevronDown } from 'lucide-react';
import { cn } from '../../lib/utils';

export default function GoalTracker({
  initialGoal = 'Software Engineer (L4)',
  completed = 3,
  total = 10,
  className
}) {
  const [selectedGoal, setSelectedGoal] = useState(initialGoal);

  const goalOptions = [
    'Software Engineer (L4)',
    'Senior Frontend Engineer',
    'Backend Systems Engineer',
    'Full Stack Engineer'
  ];

  const percent = Math.min(100, Math.round((completed / total) * 100));

  return (
    <div 
      className={cn(
        "bg-white dark:bg-[#0F172A] rounded-[16px] p-5 border border-[#E5E7EB] dark:border-[#1E293B] shadow-xs space-y-4",
        className
      )}
    >
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-[#64748B] dark:text-[#94A3B8]">
          Goal Tracker
        </span>
        <Target className="w-4 h-4 text-[#64748B] dark:text-[#94A3B8]" />
      </div>

      {/* Select Role */}
      <div className="relative">
        <select
          value={selectedGoal}
          onChange={(e) => setSelectedGoal(e.target.value)}
          aria-label="Target Goal"
          className="w-full appearance-none bg-slate-50 dark:bg-[#1E293B] border border-[#E5E7EB] dark:border-[#334155]/60 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm font-semibold text-[#0F172A] dark:text-[#F8FAFC] focus:outline-none focus:border-[#2563EB] cursor-pointer pr-8 transition-colors"
        >
          {goalOptions.map((goal) => (
            <option key={goal} value={goal} className="bg-white dark:bg-[#0F172A] text-[#0F172A] dark:text-[#F8FAFC]">
              {goal}
            </option>
          ))}
        </select>
        <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
      </div>

      {/* Progress */}
      <div className="space-y-2 pt-1">
        <div className="flex items-center justify-between text-xs font-medium text-[#64748B] dark:text-[#94A3B8]">
          <span>{completed} / {total} interviews</span>
          <span className="font-bold text-[#0F172A] dark:text-[#F8FAFC]">{percent}%</span>
        </div>

        <div className="w-full h-2 bg-slate-100 dark:bg-[#1E293B] rounded-full overflow-hidden">
          <div 
            className="h-full bg-[#2563EB] dark:bg-[#3B82F6] rounded-full transition-all duration-500"
            style={{ width: `${percent}%` }}
          />
        </div>
      </div>
    </div>
  );
}
