import React from 'react';
import { Menu, Sun, Moon } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import ProfileDropdown from './ProfileDropdown';

export default function WorkspaceNavbar({ title = 'Dashboard', onOpenMenu, actions }) {
  const { isDark, toggleTheme } = useTheme();
  const { user } = useAuth();
  const navigate = useNavigate();

  return (
    <header className="h-[72px] bg-white dark:bg-[#081A3A] border-b border-[#E5E7EB] dark:border-white/[0.08] px-4 sm:px-8 flex items-center justify-between sticky top-0 z-30 shrink-0 transition-colors duration-200">
      
      {/* Left: Mobile Menu Toggle + Title */}
      <div className="flex items-center gap-3 min-w-0">
        <button
          type="button"
          onClick={onOpenMenu}
          className="p-2 -ml-2 rounded-xl text-[#64748B] hover:text-[#111827] hover:bg-[#EFF6FF] dark:text-[#94A3B8] dark:hover:text-[#F8FAFC] dark:hover:bg-[#102449] md:hidden transition-colors cursor-pointer"
          aria-label="Open navigation menu"
        >
          <Menu className="w-5 h-5" />
        </button>
        
        <h1 className="text-lg sm:text-xl font-extrabold text-[#111827] dark:text-[#F8FAFC] tracking-tight truncate">
          {title}
        </h1>
      </div>

      {/* Right side items: Theme Toggle, User Avatar (16px gap) */}
      <div className="flex items-center gap-4 shrink-0">
        
        {/* Optional Page-Specific Actions (e.g., Export button on History) */}
        {actions && (
          <div className="hidden sm:flex items-center mr-1">
            {actions}
          </div>
        )}

        {/* Theme Toggle Button */}
        <button
          type="button"
          onClick={toggleTheme}
          className="w-10 h-10 rounded-full bg-[#F1F5F9] dark:bg-[#102449] border border-[#E5E7EB] dark:border-white/[0.08] hover:bg-[#EFF6FF] dark:hover:bg-[#163060] text-[#111827] dark:text-[#94A3B8] hover:text-[#2563EB] dark:hover:text-[#F8FAFC] flex items-center justify-center transition-all duration-150 cursor-pointer shadow-2xs"
          title={`Switch to ${isDark ? 'Light' : 'Dark'} mode`}
          aria-label="Toggle theme"
        >
          {isDark ? (
            <Sun className="w-4 h-4 text-amber-400" />
          ) : (
            <Moon className="w-4 h-4 text-slate-700" />
          )}
        </button>

        {/* User Avatar & Dropdown */}
        <ProfileDropdown />

      </div>
    </header>
  );
}
