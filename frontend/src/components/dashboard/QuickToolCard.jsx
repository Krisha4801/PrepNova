import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { cn } from '../../lib/utils';

export default function QuickToolCard({
  title,
  description,
  path,
  icon: Icon,
  className
}) {
  return (
    <Link
      to={path}
      className={cn(
        "group block bg-white dark:bg-[#0F172A] p-5 sm:p-6 rounded-[16px] border border-[#E5E7EB] dark:border-[#1E293B] shadow-xs hover:-translate-y-0.5 hover:border-[#2563EB]/40 dark:hover:border-[#3B82F6]/40 transition-all duration-180 flex flex-col justify-between",
        className
      )}
    >
      <div className="flex items-start justify-between gap-3 mb-4">
        <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-[#1E293B] text-[#0F172A] dark:text-[#F8FAFC] flex items-center justify-center group-hover:bg-[#2563EB] group-hover:text-white transition-colors duration-180 shrink-0">
          {Icon && <Icon className="w-5 h-5" />}
        </div>
        <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-[#2563EB] dark:group-hover:text-[#3B82F6] group-hover:translate-x-0.5 transition-all duration-180" />
      </div>

      <div className="space-y-1">
        <h4 className="text-sm sm:text-base font-bold text-[#0F172A] dark:text-[#F8FAFC] group-hover:text-[#2563EB] dark:group-hover:text-[#3B82F6] transition-colors">
          {title}
        </h4>
        <p className="text-xs text-[#64748B] dark:text-[#94A3B8] leading-relaxed">
          {description}
        </p>
      </div>
    </Link>
  );
}
