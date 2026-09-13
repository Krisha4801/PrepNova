import React from 'react';
import { motion } from 'framer-motion';
import { Flame, Trophy, Star, Target } from 'lucide-react';

export default function Achievements() {
  const achievements = [
    { id: 1, title: '7 Day Streak', icon: Flame, color: 'text-orange-500', bg: 'bg-orange-50', progress: 100, isComplete: true },
    { id: 2, title: 'First 100 Qs', icon: Trophy, color: 'text-yellow-500', bg: 'bg-yellow-50', progress: 75, isComplete: false },
    { id: 3, title: 'ATS Above 80', icon: Star, color: 'text-purple-500', bg: 'bg-purple-50', progress: 100, isComplete: true },
    { id: 4, title: 'Consistency', icon: Target, color: 'text-blue-500', bg: 'bg-blue-50', progress: 40, isComplete: false },
  ];

  return (
    <div className="w-full">
      <h2 className="text-3xl font-extrabold text-heading tracking-tight mb-8">Achievements</h2>
      
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
        {achievements.map((achievement, idx) => {
          const Icon = achievement.icon;
          const radius = 30;
          const circumference = 2 * Math.PI * radius;
          const strokeDashoffset = circumference - (achievement.progress / 100) * circumference;

          return (
            <motion.div
              key={achievement.id}
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: idx * 0.1 }}
              whileHover={{ y: -2 }}
              className="bg-white rounded-2xl p-5 border border-border shadow-sm flex flex-col items-center text-center relative"
            >
              {/* SVG Progress Ring */}
              <div className="relative w-24 h-24 mb-4">
                <svg className="w-full h-full -rotate-90 transform" viewBox="0 0 80 80">
                  <circle
                    cx="40"
                    cy="40"
                    r={radius}
                    fill="transparent"
                    stroke="#F1F5F9"
                    strokeWidth="6"
                  />
                  <motion.circle
                    initial={{ strokeDashoffset: circumference }}
                    whileInView={{ strokeDashoffset }}
                    viewport={{ once: true }}
                    transition={{ duration: 1.5, ease: "easeOut", delay: 0.2 }}
                    cx="40"
                    cy="40"
                    r={radius}
                    fill="transparent"
                    stroke={achievement.isComplete ? 'currentColor' : '#CBD5E1'}
                    strokeWidth="6"
                    strokeLinecap="round"
                    className={achievement.isComplete ? achievement.color : ''}
                    style={{ strokeDasharray: circumference }}
                  />
                </svg>
                {/* Center Icon */}
                <div className={`absolute inset-0 flex items-center justify-center`}>
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center ${achievement.isComplete ? achievement.bg : 'bg-gray-50'}`}>
                    <Icon className={`w-6 h-6 ${achievement.isComplete ? achievement.color : 'text-gray-400'}`} />
                  </div>
                </div>
              </div>
              
              <h3 className="font-bold text-heading text-sm mb-1">{achievement.title}</h3>
              <p className="text-xs font-semibold text-body">
                {achievement.isComplete ? 'Completed!' : `${achievement.progress}% done`}
              </p>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
