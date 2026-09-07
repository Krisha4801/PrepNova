import React from 'react';
import { motion } from 'framer-motion';
import { Upload, Briefcase, Bot, FileText, ArrowRight } from 'lucide-react';

export default function HowItWorks() {
  const steps = [
    {
      num: 1,
      title: "Upload Resume",
      desc: "Upload your PDF or DOCX resume",
      icon: Upload,
      bg: "bg-[#EEF2FF]",
      color: "text-[#5B4DFF]"
    },
    {
      num: 2,
      title: "Choose Role",
      desc: "Select role and difficulty level",
      icon: Briefcase,
      bg: "bg-purple-50",
      color: "text-[#7C6CFF]"
    },
    {
      num: 3,
      title: "AI Interview",
      desc: "Adaptive questions & real-time audio",
      icon: Bot,
      bg: "bg-indigo-50",
      color: "text-[#5B4DFF]"
    },
    {
      num: 4,
      title: "ATS Report",
      desc: "Detailed score & instant feedback",
      icon: FileText,
      bg: "bg-emerald-50",
      color: "text-emerald-600"
    }
  ];

  return (
    <section className="bg-[#F8FAFC] w-full py-12 md:py-16 border-y border-[#E7EAF3]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="text-center mb-10 md:mb-12">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#EEF2FF] text-[#5B4DFF] text-xs font-bold uppercase tracking-wider mb-3">
            Workflow
          </div>
          <h2 className="text-3xl md:text-4xl font-[800] text-[#0F172A] tracking-tight mb-3">
            How PrepNova Works
          </h2>
          <p className="text-base md:text-lg text-[#64748B] max-w-xl mx-auto">
            Complete your AI mock interview in four streamlined steps.
          </p>
        </div>

        {/* 4 Connected Cards */}
        <div className="relative">
          {/* Dashed Connector Line (Desktop) */}
          <div className="hidden lg:block absolute top-1/2 left-[12%] right-[12%] h-[2px] border-t-2 border-dashed border-[#7C6CFF]/30 -translate-y-1/2 z-0 pointer-events-none" />
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 relative z-10">
            {steps.map((step, idx) => {
              const Icon = step.icon;
              return (
                <motion.div 
                  key={step.num}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-40px" }}
                  transition={{ duration: 0.4, delay: idx * 0.1 }}
                  whileHover={{ y: -6 }}
                  className="group flex flex-col items-center text-center bg-white rounded-[24px] p-6 sm:p-7 border border-[#E7EAF3] shadow-soft hover:shadow-xl hover:border-[#5B4DFF]/40 transition-all duration-300 relative"
                >
                  {/* Step Number Badge */}
                  <div className="absolute -top-3.5 -left-3.5 w-8 h-8 rounded-full bg-gradient-to-tr from-[#5B4DFF] to-[#7C6CFF] text-white flex items-center justify-center font-bold text-xs shadow-md shadow-[#5B4DFF]/25">
                    {step.num}
                  </div>
                  
                  {/* Icon */}
                  <div className={`w-14 h-14 rounded-2xl ${step.bg} ${step.color} flex items-center justify-center mb-5 group-hover:scale-105 transition-transform duration-300 shadow-2xs`}>
                    <Icon className="w-7 h-7" />
                  </div>
                  
                  <h3 className="text-lg font-bold text-[#0F172A] mb-2">{step.title}</h3>
                  <p className="text-[#64748B] text-xs sm:text-sm leading-relaxed">{step.desc}</p>
                  
                  {/* Mobile Flow Arrow */}
                  {idx < steps.length - 1 && (
                    <div className="lg:hidden mt-4 text-[#5B4DFF]/40">
                      <ArrowRight className="w-5 h-5 rotate-90 md:rotate-0 md:hidden" />
                    </div>
                  )}
                </motion.div>
              );
            })}
          </div>
        </div>

      </div>
    </section>
  );
}
