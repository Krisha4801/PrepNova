import React, { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../../lib/utils';

export default function JobDescription({ value, onChange }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="w-full bg-[#F8FAFC] rounded-xl border border-border overflow-hidden">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-100/50 transition-colors focus:outline-none"
      >
        <span className="text-lg font-bold text-heading">Job Description <span className="text-sm font-normal text-body ml-2">(Optional)</span></span>
        <div className={cn(
          "w-8 h-8 rounded-full flex items-center justify-center transition-transform duration-300",
          isOpen ? "bg-primary/10 text-primary rotate-180" : "bg-gray-100 text-gray-500"
        )}>
          <ChevronDown className="w-5 h-5" />
        </div>
      </button>

      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
          >
            <div className="px-8 pb-8 pt-2 border-t border-border/50">
              <p className="text-sm text-body mb-4">
                Providing a job description helps our AI tailor the questions to the specific requirements and responsibilities of the role you are targeting.
              </p>
              <textarea
                value={value}
                onChange={(e) => onChange(e.target.value)}
                placeholder="Paste the company job description to personalize interview questions..."
                className="w-full h-40 px-4 py-3 rounded-xl border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-heading placeholder:text-gray-400 resize-none"
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
