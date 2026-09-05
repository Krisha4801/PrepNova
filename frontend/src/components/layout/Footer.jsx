import React from 'react';

export default function Footer() {
  return (
    <footer className="w-full border-t border-[#E2E8F0] dark:border-white/10 bg-white dark:bg-[#081A3A] py-8">
      <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-4">
        <p className="text-sm font-semibold text-body">
          PrepNova © 2026
        </p>
        <div className="flex items-center gap-6">
          <a href="#" className="text-sm font-semibold text-body hover:text-primary transition-colors">Resources</a>
          <a href="#" className="text-sm font-semibold text-body hover:text-primary transition-colors">Privacy</a>
          <a href="#" className="text-sm font-semibold text-body hover:text-primary transition-colors">GitHub</a>
        </div>
      </div>
    </footer>
  );
}
