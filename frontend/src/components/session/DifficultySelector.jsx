import React from 'react';
import { motion } from 'framer-motion';
import { CheckCircle2 } from 'lucide-react';
import { cn } from '../../lib/utils';

export default function DifficultySelector({ selectedDifficulty, onSelectDifficulty }) {
  const difficulties = [
    {
      id: 'beginner',
      title: 'Easy',
      description: 'Foundational concepts & standard questions',
      badge: 'Beginner'
    },
    {
      id: 'intermediate',
      title: 'Medium',
      description: 'Real-world problem solving & applied scenarios',
      badge: 'Recommended'
    },
    {
      id: 'advanced',
      title: 'Hard',
      description: 'Advanced edge-cases & deep system design',
      badge: 'Company Level'
    }
  ];

  return (
    <div className="w-full">
      {/* Segmented Pill Selector Bar */}
      <div className="p-1.5 bg-[#F1F4F9] rounded-2xl flex flex-col sm:flex-row gap-2 border border-[#E7EAF3]">
        {difficulties.map((level) => {
          const isSelected = selectedDifficulty === level.id;

          return (
            <button
              key={level.id}
              type="button"
              onClick={() => onSelectDifficulty(level.id)}
              className={cn(
                "relative flex-1 py-3.5 px-4 rounded-xl text-center transition-all duration-200 flex flex-col sm:flex-row items-center justify-center gap-2 font-bold text-sm",
                isSelected 
                  ? "bg-white text-[#5B4DFF] shadow-sm shadow-[#5B4DFF]/15 border border-[#5B4DFF]/30 ring-1 ring-[#5B4DFF]/20" 
                  : "text-[#64748B] hover:text-[#0F172A] hover:bg-white/60"
              )}
            >
              <span>{level.title}</span>
              {level.badge && (
                <span className={cn(
                  "px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wider rounded-full",
                  isSelected 
                    ? "bg-[#5B4DFF]/10 text-[#5B4DFF]" 
                    : "bg-slate-200/70 text-slate-500"
                )}>
                  {level.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Description caption */}
      <div className="mt-3 text-center sm:text-left text-xs text-[#64748B]">
        {difficulties.find(d => d.id === selectedDifficulty)?.description}
      </div>
    </div>
  );
}
