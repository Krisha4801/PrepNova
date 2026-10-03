import React from 'react';
import { Menu, Sun, Moon } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import ProfileDropdown from './ProfileDropdown';

export default function WorkspaceNavbar({ title = 'Workspace', onOpenMenu, actions }) {
  const { isDark, toggleTheme } = useTheme();

  return (
    <header className="h-16 bg-white dark:bg-[#0F172A] border-b border-slate-200/80 dark:border-slate-800 px-4 sm:px-8 flex items-center justify-between sticky top-0 z-30 shrink-0 transition-colors duration-150">
      {/* Left: Mobile Menu Toggle + Breadcrumb Title */}
      <div className="flex items-center gap-3 min-w-0">
        <button
          type="button"
          onClick={onOpenMenu}
          className="p-2 -ml-2 rounded-xl text-slate-500 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-400 dark:hover:text-slate-100 dark:hover:bg-slate-800 md:hidden transition-colors cursor-pointer"
          aria-label="Open navigation menu"
        >
          <Menu className="w-5 h-5" />
        </button>
        
        <h1 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white tracking-tight truncate">
          {title}
        </h1>
      </div>

      {/* Right side items */}
      <div className="flex items-center gap-3 shrink-0">
        {actions && (
          <div className="hidden sm:flex items-center mr-1">
            {actions}
          </div>
        )}

        {/* Theme Toggle Button */}
        <button
          type="button"
          onClick={toggleTheme}
          className="w-9 h-9 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700/80 text-slate-600 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 flex items-center justify-center transition-all duration-150 cursor-pointer shadow-2xs"
          title={`Switch to ${isDark ? 'Light' : 'Dark'} mode`}
          aria-label="Toggle theme"
        >
          {isDark ? (
            <Sun className="w-4 h-4 text-amber-400" />
          ) : (
            <Moon className="w-4 h-4 text-slate-600" />
          )}
        </button>

        {/* User Profile Dropdown */}
        <ProfileDropdown />
      </div>
    </header>
  );
}
