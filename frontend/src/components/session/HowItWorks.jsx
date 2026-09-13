import React from 'react';
import { motion } from 'framer-motion';
import { Upload, Briefcase, Bot, FileText, ArrowRight } from 'lucide-react';

export default function HowItWorks() {
  const steps = [
    {
      num: 1,
      title: "Upload Resume",
      desc: "Upload PDF/DOCX",
      icon: <Upload className="w-6 h-6 text-[#5B4DFF]" />
    },
    {
      num: 2,
      title: "Choose Role",
      desc: "Role + Difficulty",
      icon: <Briefcase className="w-6 h-6 text-[#5B4DFF]" />
    },
    {
      num: 3,
      title: "AI Interview",
      desc: "Adaptive technical questions",
      icon: <Bot className="w-6 h-6 text-[#5B4DFF]" />
    },
    {
      num: 4,
      title: "ATS Report",
      desc: "Feedback + score + insights",
      icon: <FileText className="w-6 h-6 text-[#5B4DFF]" />
    }
  ];

  return (
    <section className="bg-[#F5F3FF] w-full py-12 md:py-16">
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        
        <div className="text-center mb-8">
          <h2 className="text-3xl md:text-4xl font-[800] text-[#0F172A] tracking-tight mb-3">How PrepNova Works</h2>
          <p className="text-base md:text-lg text-[#64748B]">Complete your AI interview in four simple steps</p>
        </div>

        <div className="relative">
          {/* Connecting Dashed Line (Desktop) */}
          <div className="hidden lg:block absolute top-1/2 left-[10%] right-[10%] h-[2px] border-t-2 border-dashed border-[#7C6CFF]/30 -translate-y-1/2 z-0" />
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 md:gap-12 lg:gap-6 relative z-10">
            {steps.map((step, idx) => (
              <motion.div 
                key={step.num}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-50px" }}
                transition={{ duration: 0.5, delay: idx * 0.15 }}
                className="group flex flex-col items-center text-center bg-white rounded-3xl p-8 border border-[#E2E8F0] shadow-sm hover:shadow-xl hover:border-[#5B4DFF] hover:-translate-y-1.5 transition-all duration-250 cursor-default relative"
              >
                {/* Step Number Badge */}
                <div className="absolute -top-4 -left-4 w-8 h-8 rounded-full bg-[#5B4DFF] text-white flex items-center justify-center font-bold text-sm shadow-md">
                  {step.num}
                </div>
                
                <div className="w-16 h-16 rounded-2xl bg-[#EEF2FF] flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-250">
                  {step.icon}
                </div>
                
                <h3 className="text-xl font-bold text-[#0F172A] mb-2">{step.title}</h3>
                <p className="text-[#64748B] text-sm font-medium">{step.desc}</p>
                
                {/* Mobile Connector Arrow */}
                {idx < steps.length - 1 && (
                  <div className="lg:hidden mt-6 text-[#7C6CFF]/40">
                    <ArrowRight className="w-6 h-6 rotate-90 md:rotate-0 md:hidden" />
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        </div>

      </div>
    </section>
  );
}
