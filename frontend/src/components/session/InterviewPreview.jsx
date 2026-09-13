import React from 'react';
import { motion } from 'framer-motion';
import { FileCheck, Code2, MessagesSquare, Lightbulb } from 'lucide-react';
import { cn } from '../../lib/utils';

export default function InterviewPreview() {
  const stats = [
    {
      id: 'ats',
      title: 'ATS Score Analysis',
      subtitle: 'Keyword matching & alignment',
      icon: FileCheck,
      color: 'text-blue-600',
      bg: 'bg-blue-100'
    },
    {
      id: 'technical',
      title: 'Technical Evaluation',
      subtitle: 'Skill depth & accuracy',
      icon: Code2,
      color: 'text-purple-600',
      bg: 'bg-purple-100'
    },
    {
      id: 'communication',
      title: 'Communication Score',
      subtitle: 'Clarity & confidence',
      icon: MessagesSquare,
      color: 'text-green-600',
      bg: 'bg-green-100'
    },
    {
      id: 'feedback',
      title: 'Personalized Feedback',
      subtitle: 'Actionable improvements',
      icon: Lightbulb,
      color: 'text-orange-600',
      bg: 'bg-orange-100'
    }
  ];

  return (
    <div className="w-full">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {stats.map((stat, idx) => {
          const Icon = stat.icon;
          return (
            <motion.div
              key={stat.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: idx * 0.1 }}
              className="bg-white p-5 rounded-2xl border border-border flex flex-col items-start shadow-soft"
            >
              <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center mb-4", stat.bg, stat.color)}>
                <Icon className="w-5 h-5" />
              </div>
              <h4 className="font-bold text-heading text-sm mb-1">{stat.title}</h4>
              <p className="text-xs text-body">{stat.subtitle}</p>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
