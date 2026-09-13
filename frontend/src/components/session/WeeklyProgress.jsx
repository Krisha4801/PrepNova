import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, Target, Flame, BrainCircuit } from 'lucide-react';
import { cn } from '../../lib/utils';

export default function WeeklyProgress() {
  const [view, setView] = useState('week');
  const chartData = view === 'week' 
    ? [40, 65, 45, 80, 55, 90, 75]
    : [60, 75, 65, 85, 70, 80, 95];
  const days = view === 'week' 
    ? ['M', 'T', 'W', 'T', 'F', 'S', 'S']
    : ['W1', 'W2', 'W3', 'W4', 'W5', 'W6', 'W7'];

  return (
    <div className="w-full grid lg:grid-cols-5 gap-6">
      
      {/* Chart Section */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="lg:col-span-3 bg-white rounded-[18px] p-6 sm:p-8 shadow-soft border border-border flex flex-col"
      >
        <div className="flex justify-between items-center mb-8">
          <div>
            <h3 className="text-xl font-bold text-heading">Practice Analytics</h3>
            <p className="text-sm text-body">Your interview frequency</p>
          </div>
          <div className="flex bg-gray-100 rounded-lg p-1">
            <button 
              onClick={() => setView('week')}
              className={cn("px-4 py-1.5 rounded-md text-sm font-semibold transition-all", view === 'week' ? "bg-white text-heading shadow-sm" : "text-body hover:text-heading")}
            >
              Week
            </button>
            <button 
              onClick={() => setView('month')}
              className={cn("px-4 py-1.5 rounded-md text-sm font-semibold transition-all", view === 'month' ? "bg-white text-heading shadow-sm" : "text-body hover:text-heading")}
            >
              Month
            </button>
          </div>
        </div>
        
        <div className="h-48 flex items-end justify-between gap-2 mt-auto">
          {chartData.map((height, idx) => (
            <div key={`${view}-${idx}`} className="flex flex-col items-center gap-3 flex-1">
              <div className="w-full max-w-[48px] h-40 bg-gray-50 rounded-t-lg flex items-end relative overflow-hidden group">
                <motion.div 
                  initial={{ height: 0 }}
                  animate={{ height: `${height}%` }}
                  transition={{ duration: 0.8, delay: idx * 0.1, ease: "easeOut" }}
                  className={cn(
                    "w-full rounded-t-lg transition-colors duration-300",
                    height > 75 ? "bg-primary" : "bg-primary/20 group-hover:bg-primary/40"
                  )}
                />
              </div>
              <span className="text-xs font-semibold text-body">{days[idx]}</span>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Stats Section */}
      <div className="lg:col-span-2 grid grid-cols-2 gap-4">
        <motion.div 
          initial={{ opacity: 0, x: 20 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          className="bg-white rounded-[18px] p-5 shadow-soft border border-border flex flex-col justify-center"
        >
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center mb-3">
            <Target className="w-5 h-5" />
          </div>
          <p className="text-xs font-semibold text-body uppercase tracking-wider mb-1">Completed</p>
          <h4 className="text-2xl font-bold text-heading">18</h4>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, x: 20 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-[18px] p-5 shadow-soft border border-border flex flex-col justify-center"
        >
          <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center mb-3">
            <TrendingUp className="w-5 h-5" />
          </div>
          <p className="text-xs font-semibold text-body uppercase tracking-wider mb-1">Highest ATS</p>
          <h4 className="text-2xl font-bold text-heading">84<span className="text-sm text-body font-normal">/100</span></h4>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, x: 20 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-[18px] p-5 shadow-soft border border-border flex flex-col justify-center relative overflow-hidden"
        >
          <div className="w-10 h-10 rounded-xl bg-orange-50 text-orange-600 flex items-center justify-center mb-3 relative z-10">
            <Flame className="w-5 h-5" />
          </div>
          <p className="text-xs font-semibold text-body uppercase tracking-wider mb-1 relative z-10">Streak</p>
          <h4 className="text-2xl font-bold text-heading flex items-baseline gap-1 relative z-10">
            7 <span className="text-xs font-semibold text-orange-500">Days</span>
          </h4>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, x: 20 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.3 }}
          className="bg-white rounded-[18px] p-5 shadow-soft border border-border flex flex-col justify-center"
        >
          <div className="w-10 h-10 rounded-xl bg-green-50 text-green-600 flex items-center justify-center mb-3">
            <BrainCircuit className="w-5 h-5" />
          </div>
          <p className="text-xs font-semibold text-body uppercase tracking-wider mb-1">Confidence</p>
          <h4 className="text-2xl font-bold text-heading">High</h4>
        </motion.div>
      </div>

    </div>
  );
}
