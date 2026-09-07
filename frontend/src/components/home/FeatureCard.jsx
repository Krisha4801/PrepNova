import React from 'react';
import { motion } from 'framer-motion';
import { FileCheck, Bot, Mic } from 'lucide-react';

export default function FeatureCard() {
  const features = [
    {
      id: 'ats',
      title: 'ATS Resume Analysis',
      subtitle: 'Keyword match density and alignment ranking against real job descriptions to maximize shortlisting rates.',
      icon: FileCheck,
      color: 'text-[#5B4DFF]',
      bg: 'bg-[#EEF2FF]'
    },
    {
      id: 'adaptive',
      title: 'AI Adaptive Questions',
      subtitle: 'Dynamic RAG-powered technical and behavioral questions that adjust in real time to your depth of answer.',
      icon: Bot,
      color: 'text-[#7C6CFF]',
      bg: 'bg-purple-50'
    },
    {
      id: 'voice',
      title: 'Voice Feedback',
      subtitle: 'Instant delivery telemetry covering speech cadence, vocal tone, response structure, and confidence scores.',
      icon: Mic,
      color: 'text-emerald-600',
      bg: 'bg-emerald-50'
    }
  ];

  return (
    <div className="w-full">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
        {features.map((feature, idx) => {
          const Icon = feature.icon;
          return (
            <motion.div
              key={feature.id}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.35, delay: idx * 0.1 }}
              whileHover={{ y: -5 }}
              className="bg-white p-7 sm:p-8 rounded-[24px] border border-[#E7EAF3] flex flex-col items-start shadow-soft hover:shadow-xl hover:border-[#5B4DFF]/30 transition-all duration-300"
            >
              <div className={`w-13 h-13 rounded-2xl flex items-center justify-center mb-6 ${feature.bg} ${feature.color} shadow-2xs`}>
                <Icon className="w-6 h-6" />
              </div>
              <h4 className="font-[800] text-[#0F172A] text-xl mb-2.5">{feature.title}</h4>
              <p className="text-sm text-[#64748B] leading-relaxed">{feature.subtitle}</p>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
