import React from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, Play } from 'lucide-react';
import workspaceHero from '../../assets/workspace-hero.jpg';

export default function Hero({ onStartClick, onExploreClick }) {
  const scrollToSetup = () => {
    if (onStartClick) {
      onStartClick();
    } else {
      document.getElementById('setup')?.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleDemo = () => {
    if (onExploreClick) {
      onExploreClick();
    } else {
      document.getElementById('setup')?.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <section className="w-full max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 pt-[48px] pb-[56px] bg-white">
      <div className="flex flex-col lg:flex-row items-center justify-between gap-10 lg:gap-12">
        
        {/* LEFT COLUMN: 46% */}
        <motion.div 
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="w-full lg:w-[46%] flex flex-col items-center lg:items-start text-center lg:text-left shrink-0"
        >
          {/* 1. Small outline pill */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#EFF6FF] border border-[#BFDBFE] text-xs font-semibold text-[#2563EB] mb-6">
            <span className="w-1.5 h-1.5 rounded-full bg-[#2563EB]" />
            <span>AI-Powered Interview Preparation</span>
          </div>

          {/* 2. Heading: 64px desktop, Bold 800, tight line-height, both lines black */}
          <h1 className="text-4xl sm:text-5xl lg:text-[64px] font-[800] text-[#0F172A] leading-[1.08] tracking-tight mb-6">
            Practice interviews. <br />
            Get interview ready.
          </h1>

          {/* 3. Paragraph: Exactly 2–3 lines wide (max-width 540px) */}
          <p className="text-[17px] sm:text-[18px] text-[#64748B] leading-relaxed max-w-[540px] mb-8 font-normal">
            From campus placements to corporate roles, prepare for HR, technical, and domain interviews with realistic mock interviews, resume analysis, and personalized feedback.
          </p>

          {/* 4. Buttons: Row layout, height 56px */}
          <div className="flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto">
            <motion.button 
              whileHover={{ y: -2 }} 
              whileTap={{ y: 0 }}
              onClick={scrollToSetup}
              className="w-full sm:w-auto h-[56px] px-8 rounded-xl bg-[#2563EB] hover:bg-[#1D4ED8] text-white font-semibold text-[16px] shadow-sm hover:shadow-md transition-all duration-200 flex items-center justify-center gap-2"
            >
              <span>Get Started Free</span>
              <ArrowRight className="w-4 h-4" />
            </motion.button>

            <motion.button 
              whileHover={{ y: -2 }} 
              whileTap={{ y: 0 }}
              onClick={handleDemo}
              className="w-full sm:w-auto h-[56px] px-8 rounded-xl bg-white hover:bg-slate-50 border border-[#E5E7EB] text-[#0F172A] font-semibold text-[16px] shadow-xs hover:border-slate-300 transition-all duration-200 flex items-center justify-center gap-2"
            >
              <Play className="w-4 h-4 fill-current text-[#2563EB]" />
              <span>Watch Demo</span>
            </motion.button>
          </div>
        </motion.div>

        {/* RIGHT COLUMN: 54% */}
        <motion.div
          initial={{ opacity: 0, x: 30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.7, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
          className="w-full lg:w-[54%] flex items-center justify-center"
        >
          <div className="w-full h-[360px] sm:h-[440px] lg:h-[520px] rounded-[28px] overflow-hidden border border-[#E5E7EB] bg-slate-100 shadow-sm">
            <img
              src={workspaceHero}
              alt="Realistic tech workspace with wooden desk, laptop, coffee mug, and soft daylight"
              className="w-full h-full object-cover object-center rounded-[28px]"
              loading="eager"
            />
          </div>
        </motion.div>

      </div>
    </section>
  );
}
