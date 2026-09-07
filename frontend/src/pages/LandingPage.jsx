import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import { 
  ArrowRight, 
  Play, 
  X, 
  CheckCircle2, 
  Radio, 
  FileText, 
  Sparkles, 
  BarChart3, 
  Code2, 
  Users, 
  Layers, 
  Zap, 
  Compass, 
  Brain 
} from 'lucide-react';
import workspaceHero from '../assets/workspace-hero.jpg';

export default function LandingPage() {
  const [showDemoModal, setShowDemoModal] = useState(false);

  // 1. Why PrepNova - 4 Equal Feature Cards (2x2 Grid)
  const whyPrepNovaFeatures = [
    {
      icon: Radio,
      title: 'AI Voice Interview',
      description: 'Real conversational interviews with adaptive questioning.',
      badgeColor: 'bg-blue-50 text-[#2563EB] dark:bg-blue-950/60 dark:text-[#38BDF8]'
    },
    {
      icon: FileText,
      title: 'ATS Resume Analysis',
      description: 'Professional resume scoring with improvement suggestions.',
      badgeColor: 'bg-indigo-50 text-[#4F46E5] dark:bg-indigo-950/60 dark:text-[#818CF8]'
    },
    {
      icon: Sparkles,
      title: 'Personalized Feedback',
      description: 'Communication, confidence, technical depth & STAR evaluation.',
      badgeColor: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400'
    },
    {
      icon: BarChart3,
      title: 'Progress Analytics',
      description: 'Track interview history, strengths, weak areas & growth.',
      badgeColor: 'bg-amber-50 text-amber-600 dark:bg-amber-950/60 dark:text-amber-400'
    }
  ];

  // 2. How It Works - 3 Horizontal Steps
  const steps = [
    {
      number: '1',
      title: 'Upload Resume',
      description: 'Import your resume or paste a job description to auto-generate personalized interview topics.'
    },
    {
      number: '2',
      title: 'Customize Interview',
      description: 'Select your interview format (Voice or Text), difficulty level, and target focus skills.'
    },
    {
      number: '3',
      title: 'Get AI Feedback',
      description: 'Receive rubric-based scores, communication critiques, and targeted improvement plans.'
    }
  ];

  // 3. Interview Categories - Grid of Six Cards
  const categories = [
    {
      title: 'Technical',
      description: 'Deep-dive into core architecture, algorithms, data structures, and framework mechanics.',
      icon: Code2,
      gradient: 'from-blue-600 to-indigo-600'
    },
    {
      title: 'HR',
      description: 'Behavioral situations, culture alignment, conflict resolution, and career storytelling.',
      icon: Users,
      gradient: 'from-emerald-500 to-teal-600'
    },
    {
      title: 'Project Based',
      description: 'In-depth probing on past architectures, technical decisions, trade-offs, and delivery.',
      icon: Layers,
      gradient: 'from-violet-600 to-purple-600'
    },
    {
      title: 'Skill Based',
      description: 'Targeted drills across specific languages, tools, cloud platforms, and modern stacks.',
      icon: Zap,
      gradient: 'from-amber-500 to-orange-600'
    },
    {
      title: 'Scenario Based',
      description: 'Triage live production incidents, system bottlenecks, outages, and engineering trade-offs.',
      icon: Compass,
      gradient: 'from-rose-500 to-pink-600'
    },
    {
      title: 'Logic & Puzzle',
      description: 'Test analytical rigor, quantitative problem-solving, and algorithmic speed under pressure.',
      icon: Brain,
      gradient: 'from-cyan-500 to-blue-600'
    }
  ];

  return (
    <div className="w-full bg-[#F8FAFC] dark:bg-[#060D1A] text-[#0F172A] dark:text-[#F8FAFC] font-sans transition-colors duration-200">
      
      {/* ======================================================== */}
      {/* 1. HERO SECTION                                         */}
      {/* ======================================================== */}
      <section className="w-full max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 pt-10 sm:pt-14 pb-14 lg:pb-22">
        <div className="flex flex-col lg:flex-row items-center justify-between gap-10 lg:gap-14">
          
          {/* Left Column: Headline & Action Buttons */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
            className="w-full lg:w-[48%] flex flex-col items-center lg:items-start text-center lg:text-left shrink-0"
          >
            {/* Tag Pill */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-50 dark:bg-blue-950/60 border border-blue-100 dark:border-blue-900/40 text-xs font-semibold text-[#2563EB] dark:text-[#38BDF8] mb-6">
              <span className="w-1.5 h-1.5 rounded-full bg-[#2563EB] dark:bg-[#38BDF8]" />
              <span>AI-Powered Interview Preparation</span>
            </div>

            {/* Main Headline: 48px Hierarchy */}
            <h1 className="text-4xl sm:text-5xl lg:text-[48px] font-extrabold text-[#0F172A] dark:text-white leading-[1.12] tracking-tight mb-5">
              Practice interviews. <br />
              Get interview ready.
            </h1>

            {/* Paragraph: 16px body */}
            <p className="text-[16px] text-[#64748B] dark:text-[#94A3B8] leading-relaxed max-w-[520px] mb-8 font-normal">
              From campus placements to corporate roles, prepare for HR, technical, and domain interviews with realistic mock interviews, resume analysis, and personalized feedback.
            </p>

            {/* Primary & Secondary Hero Buttons */}
            <div className="flex flex-col sm:flex-row items-center gap-3.5 w-full sm:w-auto">
              <Link
                to="/signup"
                className="w-full sm:w-auto h-[48px] px-7 rounded-[14px] bg-[#2563EB] hover:bg-[#1D4ED8] text-white font-semibold text-[15px] shadow-sm hover:shadow-md transition-all duration-200 flex items-center justify-center gap-2"
              >
                <span>Get Started Free</span>
                <ArrowRight className="w-4 h-4" />
              </Link>

              <button
                type="button"
                onClick={() => setShowDemoModal(true)}
                className="w-full sm:w-auto h-[48px] px-7 rounded-[14px] bg-white dark:bg-[#081A3A] hover:bg-slate-50 dark:hover:bg-[#102449] border border-[#E2E8F0] dark:border-white/10 text-[#0F172A] dark:text-white font-semibold text-[15px] shadow-xs hover:border-slate-300 dark:hover:border-white/20 transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer"
              >
                <Play className="w-4 h-4 fill-current text-[#2563EB] dark:text-[#38BDF8]" />
                <span>Watch Demo</span>
              </button>
            </div>
          </motion.div>

          {/* Right Column: Hero Workspace Image */}
          <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
            className="w-full lg:w-[52%] flex items-center justify-center"
          >
            <div className="w-full h-[320px] sm:h-[400px] lg:h-[460px] rounded-[20px] overflow-hidden border border-[#E2E8F0] dark:border-white/10 bg-white dark:bg-[#081A3A] shadow-md">
              <img
                src={workspaceHero}
                alt="Developer workspace with laptop, coffee mug, and clean desktop"
                className="w-full h-full object-cover object-center rounded-[20px]"
                loading="eager"
              />
            </div>
          </motion.div>

        </div>
      </section>

      {/* ======================================================== */}
      {/* 2. WHY PREPNOVA (Replaces Campus Card - 4 Feature Cards)  */}
      {/* ======================================================== */}
      <section id="why-prepnova" className="w-full max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 py-14 lg:py-22 border-t border-[#E2E8F0] dark:border-white/10 scroll-mt-20">
        
        {/* Section Heading */}
        <div className="text-center max-w-2xl mx-auto mb-12 sm:mb-14">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 dark:bg-blue-950/60 text-[#2563EB] dark:text-[#38BDF8] text-xs font-bold uppercase tracking-wider mb-3 border border-blue-100 dark:border-blue-900/40">
            Why PrepNova
          </span>
          <h2 className="text-3xl lg:text-[36px] font-bold text-[#0F172A] dark:text-white tracking-tight mb-3">
            Engineered for modern interview success
          </h2>
          <p className="text-[16px] text-[#64748B] dark:text-[#94A3B8] leading-relaxed">
            Everything you need to master technical depth, communication, and ATS benchmarks.
          </p>
        </div>

        {/* 2x2 Feature Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8">
          {whyPrepNovaFeatures.map((card, idx) => {
            const Icon = card.icon;
            return (
              <div 
                key={idx}
                className="bg-white dark:bg-[#081A3A] border border-[#E2E8F0] dark:border-white/10 rounded-[20px] p-7 sm:p-8 shadow-[0_2px_8px_rgba(15,23,42,0.04)] hover:-translate-y-1 hover:shadow-[0_12px_24px_rgba(15,23,42,0.08)] transition-all duration-200 flex flex-col justify-between"
              >
                <div>
                  <div className={`w-12 h-12 rounded-[14px] ${card.badgeColor} flex items-center justify-center mb-5 shrink-0`}>
                    <Icon className="w-6 h-6" />
                  </div>
                  <h3 className="text-xl lg:text-[24px] font-bold text-[#0F172A] dark:text-white tracking-tight mb-2">
                    {card.title}
                  </h3>
                  <p className="text-[16px] text-[#64748B] dark:text-[#94A3B8] leading-relaxed font-normal">
                    {card.description}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* ======================================================== */}
      {/* 3. HOW IT WORKS                                         */}
      {/* ======================================================== */}
      <section id="how-it-works" className="w-full max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 py-14 lg:py-22 border-t border-[#E2E8F0] dark:border-white/10 scroll-mt-20">
        
        {/* Section Heading */}
        <div className="text-center max-w-2xl mx-auto mb-12 sm:mb-14">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 dark:bg-blue-950/60 text-[#2563EB] dark:text-[#38BDF8] text-xs font-bold uppercase tracking-wider mb-3 border border-blue-100 dark:border-blue-900/40">
            How It Works
          </span>
          <h2 className="text-3xl lg:text-[36px] font-bold text-[#0F172A] dark:text-white tracking-tight mb-3">
            Three simple steps to interview readiness
          </h2>
          <p className="text-[16px] text-[#64748B] dark:text-[#94A3B8] leading-relaxed">
            From resume upload to personalized feedback in minutes.
          </p>
        </div>

        {/* Horizontal Steps with Connecting Line */}
        <div className="relative">
          {/* Subtle horizontal connecting bar on desktop */}
          <div className="hidden md:block absolute top-[52px] left-[15%] right-[15%] h-[2px] bg-[#E2E8F0] dark:bg-white/10 -z-0" />

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8 relative z-10">
            {steps.map((step, idx) => (
              <div 
                key={idx}
                className="bg-white dark:bg-[#081A3A] border border-[#E2E8F0] dark:border-white/10 rounded-[20px] p-7 sm:p-8 shadow-[0_2px_8px_rgba(15,23,42,0.04)] hover:-translate-y-1 transition-all duration-200 flex flex-col items-start"
              >
                {/* Circular Numbered Icon */}
                <div className="w-12 h-12 rounded-full bg-blue-50 dark:bg-blue-950/80 text-[#2563EB] dark:text-[#38BDF8] border-2 border-white dark:border-[#081A3A] shadow-xs flex items-center justify-center font-bold text-[18px] mb-5 shrink-0 ring-4 ring-[#EFF6FF] dark:ring-white/5">
                  {step.number}
                </div>
                
                <h3 className="text-xl lg:text-[22px] font-bold text-[#0F172A] dark:text-white tracking-tight mb-2">
                  {step.title}
                </h3>
                <p className="text-[15px] sm:text-[16px] text-[#64748B] dark:text-[#94A3B8] leading-relaxed font-normal">
                  {step.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ======================================================== */}
      {/* 4. INTERVIEW CATEGORIES (6 Cards - No Buttons)          */}
      {/* ======================================================== */}
      <section id="categories" className="w-full max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 pt-14 pb-16 lg:pt-22 lg:pb-20 border-t border-[#E2E8F0] dark:border-white/10 scroll-mt-20">
        
        {/* Section Heading */}
        <div className="text-center max-w-2xl mx-auto mb-12 sm:mb-14">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 dark:bg-blue-950/60 text-[#2563EB] dark:text-[#38BDF8] text-xs font-bold uppercase tracking-wider mb-3 border border-blue-100 dark:border-blue-900/40">
            Interview Categories
          </span>
          <h2 className="text-3xl lg:text-[36px] font-bold text-[#0F172A] dark:text-white tracking-tight mb-3">
            Tailored for every interview stage
          </h2>
          <p className="text-[16px] text-[#64748B] dark:text-[#94A3B8] leading-relaxed">
            Practice focused interview formats designed to mirror real hiring evaluation rubrics.
          </p>
        </div>

        {/* 6 Grid Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {categories.map((cat, idx) => {
            const Icon = cat.icon;
            return (
              <div 
                key={idx}
                className="bg-white dark:bg-[#081A3A] border border-[#E2E8F0] dark:border-white/10 rounded-[20px] p-7 shadow-[0_2px_8px_rgba(15,23,42,0.04)] hover:-translate-y-1 hover:border-[#2563EB]/40 dark:hover:border-blue-500/40 transition-all duration-200 flex flex-col justify-between"
              >
                <div>
                  {/* Gradient Icon Badge */}
                  <div className={`w-11 h-11 rounded-[12px] bg-gradient-to-br ${cat.gradient} text-white flex items-center justify-center mb-5 shadow-xs`}>
                    <Icon className="w-5 h-5" />
                  </div>

                  {/* Title */}
                  <h3 className="text-lg lg:text-[20px] font-bold text-[#0F172A] dark:text-white tracking-tight mb-2">
                    {cat.title}
                  </h3>

                  {/* One-Line Description */}
                  <p className="text-[15px] text-[#64748B] dark:text-[#94A3B8] leading-relaxed font-normal">
                    {cat.description}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* ======================================================== */}
      {/* WATCH DEMO MODAL                                         */}
      {/* ======================================================== */}
      <AnimatePresence>
        {showDemoModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white dark:bg-[#081A3A] rounded-[24px] border border-[#E2E8F0] dark:border-white/10 shadow-2xl max-w-2xl w-full p-6 sm:p-8 relative overflow-hidden"
            >
              <button
                onClick={() => setShowDemoModal(false)}
                className="absolute top-5 right-5 p-2 rounded-full hover:bg-slate-100 dark:hover:bg-white/10 text-[#64748B] hover:text-[#0F172A] dark:hover:text-white transition-colors cursor-pointer"
                aria-label="Close demo"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-[#2563EB] dark:text-[#38BDF8] flex items-center justify-center">
                  <Play className="w-5 h-5 fill-current" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-[#0F172A] dark:text-white">PrepNova Product Walkthrough</h3>
                  <p className="text-xs text-[#64748B] dark:text-[#94A3B8]">Simulating a real technical interview session</p>
                </div>
              </div>

              <div className="aspect-video bg-slate-950 rounded-2xl flex flex-col items-center justify-center text-center p-6 text-white my-6 relative overflow-hidden">
                <div className="w-16 h-16 rounded-full bg-[#2563EB] flex items-center justify-center mb-4 shadow-lg shadow-[#2563EB]/40 animate-pulse">
                  <Play className="w-7 h-7 fill-current ml-1 text-white" />
                </div>
                <h4 className="text-lg font-bold mb-1">Live Adaptive Mock Interview Preview</h4>
                <p className="text-xs text-slate-400 max-w-md">
                  Real-time question adaptation, speech scoring, and ATS resume verification in action.
                </p>
              </div>

              <div className="flex items-center justify-between pt-2">
                <span className="text-xs text-[#64748B] dark:text-[#94A3B8] font-medium flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" /> Free to practice now
                </span>
                <Link
                  to="/signup"
                  onClick={() => setShowDemoModal(false)}
                  className="px-6 py-2.5 bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-sm font-semibold rounded-xl shadow-xs transition-all flex items-center gap-2"
                >
                  <span>Get Started Free</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
