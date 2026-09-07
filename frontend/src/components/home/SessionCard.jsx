import React from 'react';
import { motion } from 'framer-motion';
import { FileText, BriefcaseBusiness, CheckCircle2 } from 'lucide-react';
import { cn } from '../../lib/utils';

export default function SessionCard({ mode, selectedMode, onSelectMode }) {
  const isSelected = selectedMode === mode.id;
  const Icon = mode.icon;

  return (
    <motion.div
      whileHover={{ y: -4 }}
      onClick={() => onSelectMode(mode.id)}
      className={cn(
        "relative cursor-pointer rounded-[24px] p-6 sm:p-8 transition-all duration-300 border",
        isSelected 
          ? "border-[#5B4DFF] bg-[#5B4DFF]/[0.03] shadow-[0_12px_36px_rgba(91,77,255,0.14)] ring-2 ring-[#5B4DFF]/20" 
          : "bg-white border-[#E7EAF3] shadow-soft hover:shadow-md hover:border-slate-300"
      )}
    >
      {isSelected && (
        <div className="absolute top-6 right-6 text-[#5B4DFF] animate-in fade-in zoom-in duration-300">
          <CheckCircle2 className="w-6 h-6 fill-[#5B4DFF]/15" />
        </div>
      )}
      
      <div className={cn(
        "w-12 h-12 rounded-2xl flex items-center justify-center mb-5 transition-colors shadow-2xs",
        isSelected ? "bg-gradient-to-tr from-[#5B4DFF] to-[#7C6CFF] text-white" : "bg-slate-100 text-[#64748B]"
      )}>
        <Icon className="w-6 h-6" />
      </div>
      
      <h3 className="text-xl sm:text-2xl font-[800] text-[#0F172A] mb-2">{mode.title}</h3>
      <p className="text-[#64748B] text-sm leading-relaxed mb-6">{mode.description}</p>
      
      <div className="flex flex-wrap gap-1.5 sm:gap-2">
        {mode.features.map((feature, idx) => (
          <span 
            key={idx} 
            className={cn(
              "px-3 py-1 text-xs font-semibold rounded-full border transition-colors",
              isSelected 
                ? "bg-[#5B4DFF]/10 text-[#5B4DFF] border-[#5B4DFF]/20" 
                : "bg-slate-50 text-[#64748B] border-[#E7EAF3]"
            )}
          >
            {feature}
          </span>
        ))}
      </div>
    </motion.div>
  );
}
