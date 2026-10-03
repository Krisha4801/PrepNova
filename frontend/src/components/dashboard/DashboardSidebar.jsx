import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  LayoutDashboard, 
  Play, 
  FileText,
  BarChart3,
  User, 
  Settings, 
  X,
  Sparkles,
  History as HistoryIcon
} from 'lucide-react';
import { cn } from '../../lib/utils';

export const sidebarMenuItems = [
  { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
  { name: 'Start Interview', path: '/start-interview', icon: Play },
  { name: 'Resume & ATS', path: '/resume-ats', icon: FileText },
  { name: 'Interview History', path: '/history', icon: HistoryIcon },
  { name: 'Analytics', path: '/progress', icon: BarChart3 },
  { name: 'Profile', path: '/profile', icon: User },
  { name: 'Settings', path: '/settings', icon: Settings },
];

export default function DashboardSidebar({ mobileOpen, setMobileOpen }) {
  const location = useLocation();

  const isItemActive = (item) => {
    if (item.path === '/dashboard') return location.pathname === '/dashboard';
    if (item.path === '/start-interview' || item.path === '/setup') {
      return (
        location.pathname === '/start-interview' ||
        location.pathname === '/setup' || 
        location.pathname === '/role-job' || 
        location.pathname === '/role' ||
        location.pathname === '/customize' || 
        location.pathname === '/review'
      );
    }
    if (item.path === '/resume-ats') {
      return (
        location.pathname === '/resume-ats' ||
        location.pathname === '/resume' ||
        location.pathname === '/ats'
      );
    }
    if (item.path === '/history') {
      return location.pathname === '/history';
    }
    if (item.path === '/progress') {
      return location.pathname === '/progress';
    }
    return location.pathname === item.path;
  };

  const renderNavLinks = (isMobile = false) => (
    <nav className="flex flex-col gap-1 px-3.5 py-5 overflow-y-auto flex-1 select-none">
      <div className="px-3 pb-2 text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
        Workspace
      </div>
      {sidebarMenuItems.map((item) => {
        const active = isItemActive(item);
        const IconComponent = item.icon;

        return (
          <Link
            key={item.name}
            to={item.path}
            onClick={() => isMobile && setMobileOpen(false)}
            className={cn(
              "group relative flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs sm:text-sm font-medium transition-all duration-150",
              active 
                ? "bg-indigo-50 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300 font-semibold" 
                : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100/80 dark:hover:bg-slate-800/60"
            )}
            title={item.name}
          >
            {active && (
              <motion.div
                layoutId={isMobile ? "mobileActivePill" : "desktopActivePill"}
                className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-5 bg-indigo-600 dark:bg-indigo-400 rounded-r-full"
                transition={{ type: "spring", stiffness: 350, damping: 30 }}
              />
            )}

            <IconComponent 
              className={cn(
                "w-4 h-4 shrink-0 transition-colors",
                active 
                  ? "text-indigo-600 dark:text-indigo-400" 
                  : "text-slate-400 group-hover:text-slate-600 dark:text-slate-500 dark:group-hover:text-slate-300"
              )} 
            />

            <span className="truncate">{item.name}</span>
          </Link>
        );
      })}
    </nav>
  );

  return (
    <>
      {/* 1. DESKTOP SIDEBAR */}
      <aside className="hidden md:flex flex-col w-[260px] h-screen fixed left-0 top-0 bg-white dark:bg-[#0B132B] border-r border-slate-200/80 dark:border-slate-800 z-40 select-none overflow-hidden transition-colors duration-150">
        {/* Top: PrepNova Logo */}
        <div className="h-16 flex items-center px-6 border-b border-slate-200/80 dark:border-slate-800 shrink-0">
          <Link to="/" className="flex items-center gap-2.5 group">
            <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white font-bold text-base shadow-xs shrink-0 group-hover:bg-indigo-500 transition-colors">
              P
            </div>
            <div className="flex flex-col">
              <span className="text-base font-bold text-slate-900 dark:text-white tracking-tight leading-none">PrepNova</span>
              <span className="text-[10px] font-medium text-slate-400 dark:text-slate-500 mt-1">Interview Platform</span>
            </div>
          </Link>
        </div>

        {/* Navigation Items */}
        {renderNavLinks(false)}

        {/* Bottom Pinned Controls */}
        <div className="p-4 border-t border-slate-200/80 dark:border-slate-800 mt-auto flex flex-col shrink-0">
          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900/80 border border-slate-200/80 dark:border-slate-800 text-xs">
            <div className="flex items-center gap-1.5 font-semibold text-slate-900 dark:text-slate-200 mb-1">
              <Sparkles className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
              <span>Prep Workspace</span>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-normal mb-2.5">
              Launch targeted questions for your dream tech stack.
            </p>
            <Link 
              to="/start-interview"
              className="inline-flex items-center gap-1 text-[11px] font-semibold text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300"
            >
              <span>Start session</span>
              <span>→</span>
            </Link>
          </div>
        </div>
      </aside>

      {/* 2. MOBILE DRAWER SIDEBAR */}
      <AnimatePresence>
        {mobileOpen && (
          <div className="md:hidden fixed inset-0 z-50 flex">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileOpen(false)}
              className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs"
            />

            {/* Sliding Drawer */}
            <motion.div
              initial={{ x: -260 }}
              animate={{ x: 0 }}
              exit={{ x: -260 }}
              transition={{ type: "spring", stiffness: 320, damping: 32 }}
              className="relative w-[260px] bg-white dark:bg-[#0B132B] border-r border-slate-200 dark:border-slate-800 h-full shadow-2xl flex flex-col z-10"
            >
              <div className="h-16 flex items-center justify-between px-6 border-b border-slate-200 dark:border-slate-800 shrink-0">
                <Link to="/" onClick={() => setMobileOpen(false)} className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white font-bold text-base shadow-xs">
                    P
                  </div>
                  <span className="text-base font-bold text-slate-900 dark:text-white tracking-tight">PrepNova</span>
                </Link>
                <button
                  type="button"
                  onClick={() => setMobileOpen(false)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
                  aria-label="Close menu"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {renderNavLinks(true)}

              <div className="p-4 border-t border-slate-200 dark:border-slate-800 mt-auto">
                <p className="text-[11px] text-slate-400 text-center font-medium">PrepNova Candidate Studio</p>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
