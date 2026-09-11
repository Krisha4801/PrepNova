import React from 'react';
import { cn } from '../../lib/utils';

export default function StatCard({ 
  icon: Icon, 
  label, 
  value, 
  trend, 
  trendPositive = true,
  className 
}) {
  return (
    <div 
      className={cn(
        "bg-white dark:bg-[#0F172A] rounded-[16px] p-5 border border-[#E5E7EB] dark:border-[#1E293B] shadow-xs hover:-translate-y-0.5 transition-all duration-180 flex flex-col justify-between h-full group",
        className
      )}
    >
      <div className="flex items-center justify-between gap-2 mb-2">
        <span className="text-xs font-semibold text-[#64748B] dark:text-[#94A3B8] tracking-tight">
          {label}
        </span>
        {Icon && (
          <Icon className="w-[18px] h-[18px] text-[#64748B] dark:text-[#94A3B8] group-hover:text-[#2563EB] dark:group-hover:text-[#3B82F6] transition-colors" />
        )}
      </div>

      <div className="space-y-1">
        <div className="text-2xl sm:text-[28px] font-bold text-[#0F172A] dark:text-[#F8FAFC] tracking-tight leading-none">
          {value}
        </div>
        {trend && (
          <div className="text-[11px] font-medium text-[#64748B] dark:text-[#94A3B8] pt-1">
            <span className={cn(
              "font-semibold",
              trendPositive 
                ? "text-emerald-600 dark:text-emerald-400" 
                : "text-[#64748B] dark:text-[#94A3B8]"
            )}>
              {trend}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
