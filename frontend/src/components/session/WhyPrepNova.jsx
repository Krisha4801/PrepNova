import React from 'react';
import { motion } from 'framer-motion';
import { Cpu, FileSearch, LineChart } from 'lucide-react';

export default function WhyPrepNova() {
  const features = [
    {
      title: 'RAG Question Generation',
      description: 'Questions generated from your resume, job description, and selected role for maximum relevance.',
      icon: Cpu,
      color: 'text-indigo-600',
      bg: 'bg-indigo-50'
    },
    {
      title: 'Resume Intelligence',
      description: 'Automatic skill extraction and ATS keyword matching to ensure your profile aligns with the role.',
      icon: FileSearch,
      color: 'text-blue-600',
      bg: 'bg-blue-50'
    },
    {
      title: 'Adaptive AI Evaluation',
      description: 'Detailed feedback with strengths, weaknesses, communication analysis, and an improvement roadmap.',
      icon: LineChart,
      color: 'text-purple-600',
      bg: 'bg-purple-50'
    }
  ];

  return (
    <div className="w-full">
      <div className="text-center mb-12">
        <h2 className="text-3xl md:text-4xl font-extrabold text-heading mb-4 tracking-tight">Why PrepNova?</h2>
        <p className="text-lg text-body max-w-2xl mx-auto">
          The most advanced AI interview simulator designed to get you hired faster.
        </p>
      </div>
      
      <div className="grid md:grid-cols-3 gap-8">
        {features.map((feature, idx) => {
          const Icon = feature.icon;
          return (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: idx * 0.1 }}
              className="bg-white rounded-[24px] p-8 shadow-soft border border-border hover:shadow-lg transition-shadow duration-300"
            >
              <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-6 ${feature.bg} ${feature.color}`}>
                <Icon className="w-7 h-7" />
              </div>
              <h3 className="text-xl font-bold text-heading mb-3">{feature.title}</h3>
              <p className="text-body leading-relaxed">{feature.description}</p>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
