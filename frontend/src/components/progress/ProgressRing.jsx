import React from 'react';
import { motion } from 'framer-motion';

export default function ProgressRing({ 
  radius = 40, 
  stroke = 7, 
  progress = 75, 
  color = "#5B4DFF", 
  bgColor = "#E7EAF3",
  label,
  valueText
}) {
  const normalizedRadius = radius - stroke * 2;
  const circumference = normalizedRadius * 2 * Math.PI;
  const strokeDashoffset = circumference - (progress / 100) * circumference;

  return (
    <div className="flex flex-col items-center justify-center">
      <div className="relative flex items-center justify-center">
        <svg
          height={radius * 2}
          width={radius * 2}
          className="transform -rotate-90"
        >
          {/* Background circle */}
          <circle
            stroke={bgColor}
            fill="transparent"
            strokeWidth={stroke}
            r={normalizedRadius}
            cx={radius}
            cy={radius}
          />
          {/* Animated Progress circle */}
          <motion.circle
            stroke={color}
            fill="transparent"
            strokeWidth={stroke}
            strokeDasharray={`${circumference} ${circumference}`}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset }}
            transition={{ duration: 1, ease: "easeOut" }}
            strokeLinecap="round"
            r={normalizedRadius}
            cx={radius}
            cy={radius}
          />
        </svg>

        {/* Center content */}
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
          <span className="text-sm font-black text-[#0F172A] leading-none">
            {valueText !== undefined ? valueText : `${Math.round(progress)}%`}
          </span>
        </div>
      </div>

      {label && (
        <span className="text-xs font-semibold text-[#64748B] mt-2 text-center">
          {label}
        </span>
      )}
    </div>
  );
}
