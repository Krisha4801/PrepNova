import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowRight, CheckCircle2 } from 'lucide-react';
import { cn } from '../../lib/utils';

export default function ActivityTable({ activities = [], className }) {
  const navigate = useNavigate();

  const getDifficultyBadge = (difficulty) => {
    switch (difficulty) {
      case 'Easy':
        return 'text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800/40';
      case 'Hard':
        return 'text-rose-700 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-900/40';
      default:
        return 'text-[#2563EB] dark:text-[#38BDF8] bg-blue-50 dark:bg-[#1E293B] border-blue-200/60 dark:border-[#334155]';
    }
  };

  return (
    <div 
      className={cn(
        "bg-white dark:bg-[#0F172A] rounded-[16px] border border-[#E5E7EB] dark:border-[#1E293B] shadow-xs overflow-hidden",
        className
      )}
    >
      {/* Table Header Row */}
      <div className="p-5 sm:p-6 pb-4 flex items-center justify-between gap-4 border-b border-[#E5E7EB] dark:border-[#1E293B]">
        <div>
          <h3 className="text-base font-bold text-[#0F172A] dark:text-[#F8FAFC]">
            Recent Activity
          </h3>
          <p className="text-xs text-[#64748B] dark:text-[#94A3B8] mt-0.5">
            Your latest mock interview evaluations and scores
          </p>
        </div>

        <Link
          to="/history"
          className="text-xs font-semibold text-[#2563EB] dark:text-[#3B82F6] hover:underline inline-flex items-center gap-1 shrink-0"
        >
          <span>View all history</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      {/* Table Container */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs sm:text-sm">
          <thead>
            <tr className="border-b border-[#E5E7EB] dark:border-[#1E293B] text-[11px] font-semibold text-[#64748B] dark:text-[#94A3B8] uppercase tracking-wider bg-slate-50/50 dark:bg-[#0D1527]/50">
              <th className="py-3 px-5">Role</th>
              <th className="py-3 px-4">Score</th>
              <th className="py-3 px-4">Difficulty</th>
              <th className="py-3 px-4">Date</th>
              <th className="py-3 px-5 text-right">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#E5E7EB]/60 dark:divide-[#1E293B]/60">
            {activities.map((item) => (
              <tr 
                key={item.id}
                onClick={() => navigate(item.link || '/history')}
                className="group hover:bg-slate-50/80 dark:hover:bg-[#1E293B]/50 transition-colors duration-180 cursor-pointer"
              >
                {/* Role */}
                <td className="py-4 px-5 font-semibold text-[#0F172A] dark:text-[#F8FAFC] group-hover:text-[#2563EB] dark:group-hover:text-[#3B82F6] transition-colors">
                  {item.role}
                </td>

                {/* Score */}
                <td className="py-4 px-4 font-bold text-[#0F172A] dark:text-[#F8FAFC] whitespace-nowrap">
                  <span className={cn(
                    "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold",
                    item.score >= 85 
                      ? "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/40"
                      : "bg-blue-50 dark:bg-blue-950/40 text-[#2563EB] dark:text-[#38BDF8] border border-blue-200 dark:border-blue-800/40"
                  )}>
                    {item.score}%
                  </span>
                </td>

                {/* Difficulty */}
                <td className="py-4 px-4 whitespace-nowrap">
                  <span className={cn("px-2.5 py-0.5 text-xs font-semibold rounded-full border", getDifficultyBadge(item.difficulty))}>
                    {item.difficulty}
                  </span>
                </td>

                {/* Date */}
                <td className="py-4 px-4 text-xs text-[#64748B] dark:text-[#94A3B8] whitespace-nowrap">
                  {item.date}
                </td>

                {/* Status */}
                <td className="py-4 px-5 text-right whitespace-nowrap">
                  <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    {item.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
