import React from 'react';
import { motion } from 'framer-motion';
import { Users, FileCheck, TrendingUp, Star } from 'lucide-react';

export default function StatsStrip() {
  const stats = [
    {
      icon: <Users className="w-6 h-6 text-[#5B4DFF]" />,
      bg: "bg-[#EEF2FF]",
      value: "10,000+",
      label: "Mock Interviews"
    },
    {
      icon: <FileCheck className="w-6 h-6 text-[#F59E0B]" />,
      bg: "bg-orange-50",
      value: "84",
      label: "Average ATS Score"
    },
    {
      icon: <TrendingUp className="w-6 h-6 text-[#22C55E]" />,
      bg: "bg-green-50",
      value: "92%",
      label: "Placement Success"
    },
    {
      icon: <Star className="w-6 h-6 text-[#7C6CFF]" />,
      bg: "bg-purple-50",
      value: "4.8/5",
      label: "User Satisfaction"
    }
  ];

  return (
    <div className="w-full max-w-7xl mx-auto px-6 lg:px-8 mt-1 mb-8">
      <motion.div 
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-50px" }}
        transition={{ duration: 0.6 }}
        className="bg-white rounded-[24px] py-6 px-6 md:py-7 md:px-10 shadow-sm border border-[#E2E8F0]"
      >
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-4 divide-y md:divide-y-0 md:divide-x divide-[#E2E8F0]">
          {stats.map((stat, idx) => (
            <div key={idx} className={`flex flex-col items-center text-center ${idx > 0 && idx % 2 === 0 ? 'pt-8 md:pt-0' : idx % 2 !== 0 ? 'pt-0 md:pt-0' : 'pt-8 md:pt-0'} ${idx === 0 || idx === 1 ? 'pt-0' : ''}`}>
              <div className={`w-14 h-14 rounded-full ${stat.bg} flex items-center justify-center mb-4`}>
                {stat.icon}
              </div>
              {/* Framer motion could do a count-up here, using standard text for simplicity and stability */}
              <motion.h3 
                initial={{ opacity: 0, scale: 0.8 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: 0.2 + (idx * 0.1), duration: 0.5, type: "spring" }}
                className="text-4xl font-[800] text-[#0F172A] mb-1"
              >
                {stat.value}
              </motion.h3>
              <p className="text-sm font-bold text-[#64748B] uppercase tracking-wider">{stat.label}</p>
            </div>
          ))}
        </div>
      </motion.div>
    </div>
  );
}
