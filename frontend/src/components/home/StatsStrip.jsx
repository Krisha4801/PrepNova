import React from 'react';
import { motion } from 'framer-motion';
import { Users, FileCheck, TrendingUp, Star } from 'lucide-react';

export default function StatsStrip() {
  const stats = [
    {
      icon: Users,
      value: "10,000+",
      label: "Interviews",
      iconColor: "text-[#5B4DFF]",
      bg: "bg-[#EEF2FF]"
    },
    {
      icon: FileCheck,
      value: "84",
      label: "ATS",
      iconColor: "text-[#F59E0B]",
      bg: "bg-amber-50"
    },
    {
      icon: TrendingUp,
      value: "92%",
      label: "Placement",
      iconColor: "text-emerald-600",
      bg: "bg-emerald-50"
    },
    {
      icon: Star,
      value: "4.8",
      label: "Rating",
      iconColor: "text-[#7C6CFF]",
      bg: "bg-purple-50"
    }
  ];

  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-2 mb-10">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-50px" }}
        transition={{ duration: 0.5 }}
        className="bg-white rounded-[24px] p-6 sm:p-8 md:py-8 md:px-12 border border-[#E7EAF3] shadow-soft"
      >
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-4 divide-y md:divide-y-0 md:divide-x divide-[#E7EAF3]">
          {stats.map((stat, idx) => {
            const Icon = stat.icon;
            return (
              <div 
                key={idx} 
                className={`flex flex-col items-center text-center ${
                  idx > 0 && idx % 2 === 0 ? 'pt-6 md:pt-0' : idx % 2 !== 0 ? 'pt-0 md:pt-0' : 'pt-6 md:pt-0'
                } ${idx === 0 || idx === 1 ? 'pt-0' : ''}`}
              >
                <div className={`w-12 h-12 rounded-2xl ${stat.bg} ${stat.iconColor} flex items-center justify-center mb-3 shadow-2xs`}>
                  <Icon className="w-6 h-6" />
                </div>
                
                <motion.h3 
                  initial={{ opacity: 0, scale: 0.85 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.1 + (idx * 0.1), duration: 0.4 }}
                  className="text-3xl sm:text-4xl font-[800] text-[#0F172A] tracking-tight mb-1"
                >
                  {stat.value}
                  {stat.suffix && <span className="text-xl font-bold text-[#64748B]">{stat.suffix}</span>}
                </motion.h3>
                
                <p className="text-xs sm:text-sm font-bold text-[#64748B] uppercase tracking-wider">
                  {stat.label}
                </p>
              </div>
            );
          })}
        </div>
      </motion.div>
    </div>
  );
}
