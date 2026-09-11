import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, BookOpen } from 'lucide-react';
import { cn } from '../../lib/utils';

export default function ContinueLearningCard({
  role = 'Frontend Engineering',
  topic = 'React State & Lifecycle',
  completedCount = 58,
  totalCount = 140,
  continueUrl = '/start-interview',
  className
}) {
  const percent = Math.min(100, Math.round((completedCount / totalCount) * 100));

  return (
    <div 
      className={cn(
        "bg-white dark:bg-[#0F172A] rounded-[16px] p-6 border border-[#E5E7EB] dark:border-[#1E293B] shadow-xs hover:-translate-y-0.5 transition-all duration-180 flex flex-col justify-between",
        className
      )}
    >
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div className="space-y-1.5 max-w-xl">
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#2563EB] dark:text-[#3B82F6]">
              Continue Learning
            </span>
            <span className="text-slate-300 dark:text-slate-600">•</span>
            <span className="text-xs font-medium text-[#64748B] dark:text-[#94A3B8]">
              {role}
            </span>
          </div>

          <h3 className="text-lg sm:text-xl font-bold text-[#0F172A] dark:text-[#F8FAFC] tracking-tight">
            {topic}
          </h3>

          <p className="text-xs sm:text-sm text-[#64748B] dark:text-[#94A3B8] leading-relaxed">
            Pick up right where you left off. Review custom hook state lifecycles and virtual DOM reconciliation.
          </p>
        </div>

        <Link
          to={continueUrl}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-[#2563EB] hover:bg-blue-700 active:scale-[0.98] text-white font-semibold text-xs sm:text-sm transition-all shadow-xs self-start shrink-0 cursor-pointer"
        >
          <span>Resume {topic.split(' ')[0]}</span>
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>

      {/* Progress Section */}
      <div className="mt-6 pt-4 border-t border-[#E5E7EB] dark:border-[#1E293B]/80 space-y-2">
        <div className="flex items-center justify-between text-xs font-medium text-[#64748B] dark:text-[#94A3B8]">
          <span>{completedCount} / {totalCount} completed</span>
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
