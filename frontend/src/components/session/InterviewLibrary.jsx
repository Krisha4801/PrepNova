import React, { useRef } from 'react';
import { motion } from 'framer-motion';
import { ChevronRight, ChevronLeft, Code, Database, Users, Server, Brain, Calculator, Coffee, Layout } from 'lucide-react';

export default function InterviewLibrary() {
  const scrollRef = useRef(null);

  const categories = [
    { name: 'Frontend', count: 120, time: '2.5h', icon: Layout, color: 'text-blue-500', bg: 'bg-blue-50' },
    { name: 'DSA', count: 250, time: '5h', icon: Code, color: 'text-purple-500', bg: 'bg-purple-50' },
    { name: 'SQL', count: 85, time: '1.5h', icon: Database, color: 'text-emerald-500', bg: 'bg-emerald-50' },
    { name: 'HR', count: 45, time: '1h', icon: Users, color: 'text-pink-500', bg: 'bg-pink-50' },
    { name: 'System Design', count: 60, time: '3h', icon: Server, color: 'text-indigo-500', bg: 'bg-indigo-50' },
    { name: 'AI', count: 90, time: '2h', icon: Brain, color: 'text-orange-500', bg: 'bg-orange-50' },
    { name: 'Aptitude', count: 150, time: '4h', icon: Calculator, color: 'text-teal-500', bg: 'bg-teal-50' },
    { name: 'Java', count: 180, time: '4.5h', icon: Coffee, color: 'text-red-500', bg: 'bg-red-50' },
  ];

  const scroll = (direction) => {
    if (scrollRef.current) {
      const { current } = scrollRef;
      const scrollAmount = direction === 'left' ? -300 : 300;
      current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  return (
    <div className="w-full relative">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-3xl font-extrabold text-heading tracking-tight">Interview Library</h2>
          <p className="text-body mt-1">Browse our curated collection of practice questions.</p>
        </div>
        <div className="hidden sm:flex items-center gap-2">
          <button 
            onClick={() => scroll('left')}
            className="w-10 h-10 rounded-full border border-border flex items-center justify-center text-heading hover:bg-gray-50 transition-colors"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button 
            onClick={() => scroll('right')}
            className="w-10 h-10 rounded-full border border-border flex items-center justify-center text-heading hover:bg-gray-50 transition-colors"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Horizontal scroll container */}
      <div 
        ref={scrollRef}
        className="flex overflow-x-auto gap-4 pb-6 pt-2 snap-x snap-mandatory hide-scrollbar -mx-4 px-4 sm:mx-0 sm:px-0"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        {categories.map((category, idx) => {
          const Icon = category.icon;
          return (
            <motion.div
              key={category.name}
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ delay: idx * 0.05 }}
              whileHover={{ y: -4 }}
              className="min-w-[240px] sm:min-w-[260px] bg-white rounded-2xl p-6 border border-border shadow-sm hover:shadow-md transition-all cursor-pointer snap-start shrink-0"
            >
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-5 ${category.bg} ${category.color}`}>
                <Icon className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-heading text-lg mb-1">{category.name}</h3>
              <div className="flex items-center gap-2 text-sm font-medium text-body">
                <span>{category.count} Questions</span>
                <span className="w-1 h-1 rounded-full bg-gray-300" />
                <span>{category.time}</span>
              </div>
            </motion.div>
          );
        })}
      </div>
      
      {/* CSS to hide scrollbar */}
      <style dangerouslySetInnerHTML={{__html: `
        .hide-scrollbar::-webkit-scrollbar {
          display: none;
        }
      `}} />
    </div>
  );
}
