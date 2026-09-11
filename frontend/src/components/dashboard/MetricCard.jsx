import React from 'react';
import { motion } from 'framer-motion';

export default function MetricCard({ 
  icon: Icon, 
  title, 
  value, 
  subtitle, 
  trend,
  color = "text-[#2563EB] dark:text-[#38BDF8]", 
  bg = "bg-blue-50 dark:bg-blue-950/50",
  delay = 0 
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay }}
      whileHover={{ y: -3 }}
      className="bg-white dark:bg-[#0F172A] p-5 sm:p-6 rounded-[20px] border border-[#E5E7EB] dark:border-[#334155] shadow-2xs hover:shadow-sm transition-all duration-200 flex flex-col justify-between"
    >
      <div className="flex items-center justify-between mb-4">
        <span className="text-xs sm:text-sm font-semibold text-[#64748B] dark:text-[#94A3B8]">{title}</span>
        {Icon && (
          <div className={`w-10 h-10 rounded-xl ${bg} ${color} flex items-center justify-center shrink-0 shadow-2xs`}>
            <Icon className="w-5 h-5" />
          </div>
        )}
      </div>

      <div>
        <div className="text-2xl sm:text-3xl font-extrabold text-[#0F172A] dark:text-[#F8FAFC] tracking-tight mb-1">
          {value}
        </div>
        
        <div className="flex items-center gap-2">
          {trend && (
            <span className={`text-xs font-bold ${trend.isPositive ? 'text-emerald-600 dark:text-emerald-400' : 'text-[#64748B] dark:text-[#94A3B8]'}`}>
              {trend.value}
            </span>
          )}
          {subtitle && (
            <span className="text-xs text-[#64748B] dark:text-[#94A3B8] font-medium truncate">
              {subtitle}
            </span>
          )}
        </div>
      </div>
    </motion.div>
  );
}
