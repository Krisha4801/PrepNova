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
  Sparkles
} from 'lucide-react';
import { cn } from '../../lib/utils';

export const sidebarMenuItems = [
  { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
  { name: 'Start Interview', path: '/start-interview', icon: Play },
  { name: 'Resume & ATS', path: '/resume-ats', icon: FileText },
  { name: 'Performance Analytics', path: '/progress', icon: BarChart3 },
  { name: 'Profile', path: '/profile', icon: User },
  { name: 'Settings', path: '/settings', icon: Settings },
];

export default function DashboardSidebar({ mobileOpen, setMobileOpen }) {
  const location = useLocation();

  // Active item determination
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
    if (item.path === '/progress') {
      return location.pathname === '/progress';
    }
    return location.pathname === item.path;
  };

  const renderNavLinks = (isMobile = false) => (
    <nav className="sidebar no-scrollbar flex flex-col gap-1.5 px-3 py-4 overflow-y-auto flex-1 select-none">
      {sidebarMenuItems.map((item) => {
        const active = isItemActive(item);
        const IconComponent = item.icon;

        return (
          <Link
            key={item.name}
            to={item.path}
            onClick={() => isMobile && setMobileOpen(false)}
            className={cn(
              "group relative flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all duration-150",
              active 
                ? "bg-[#DBEAFE] text-[#2563EB] dark:bg-[#102449] dark:text-[#38BDF8] shadow-xs" 
                : "text-[#111827] hover:text-[#2563EB] hover:bg-[#EFF6FF] dark:text-[#94A3B8] dark:hover:text-[#F8FAFC] dark:hover:bg-[#102449]/60"
            )}
            title={item.name}
          >
            {active && (
              <motion.div
                layoutId={isMobile ? "mobileActivePill" : "desktopActivePill"}
                className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-5 bg-[#2563EB] rounded-r-full"
                transition={{ type: "spring", stiffness: 350, damping: 30 }}
              />
            )}

            <IconComponent 
              className={cn(
                "w-4 h-4 shrink-0 transition-colors",
                active 
                  ? "text-[#2563EB] dark:text-[#38BDF8]" 
                  : "text-[#64748B] dark:text-[#94A3B8] group-hover:text-[#2563EB] dark:group-hover:text-[#F8FAFC]"
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
      {/* 1. DESKTOP SIDEBAR (w-[280px] h-screen fixed left-0 top-0, Light: #FFFFFF, Dark: #03112D) */}
      <aside className="sidebar no-scrollbar hidden md:flex flex-col w-[280px] h-screen fixed left-0 top-0 bg-white dark:bg-[#03112D] border-r border-[#E5E7EB] dark:border-white/[0.08] z-40 select-none overflow-hidden transition-all duration-200">
        
        {/* Top: PrepNova Logo */}
        <div className="h-[72px] flex items-center px-6 border-b border-[#E5E7EB] dark:border-white/[0.08] shrink-0">
          <Link to="/" className="flex items-center gap-2.5 group">
            <div className="w-8 h-8 rounded-lg bg-[#2563EB] flex items-center justify-center text-white font-bold text-base shadow-xs shrink-0 group-hover:scale-105 transition-transform">
              P
            </div>
            <div className="flex flex-col">
              <span className="text-xl font-[800] text-[#111827] dark:text-[#F8FAFC] tracking-tight leading-none">PrepNova</span>
              <span className="text-[9px] font-extrabold text-[#2563EB] dark:text-[#38BDF8] tracking-wider uppercase mt-1">AI MOCK INTERVIEW</span>
            </div>
          </Link>
        </div>

        {/* Navigation Items (Centered vertically / Scrollable flex-1) */}
        {renderNavLinks(false)}

        {/* Bottom Pinned Controls (using mt-auto) - Only Free Account Promo Card */}
        <div className="p-3 border-t border-[#E5E7EB] dark:border-white/[0.08] mt-auto flex flex-col shrink-0 bg-white dark:bg-[#03112D]">
          {/* Free Account Card (Light card in light mode, #081A3A in dark mode) */}
          <div className="p-3.5 rounded-xl bg-[#F1F5F9] dark:bg-[#081A3A] border border-[#E5E7EB] dark:border-white/[0.08] text-xs transition-colors">
            <div className="flex items-center gap-1.5 font-bold text-[#111827] dark:text-[#F8FAFC] mb-1">
              <Sparkles className="w-3.5 h-3.5 text-[#2563EB] dark:text-[#38BDF8]" />
              <span>Free Account</span>
            </div>
            <p className="text-[11px] text-[#64748B] dark:text-[#94A3B8] leading-tight mb-2.5">
              Ready for your next mock interview.
            </p>
            <Link 
              to="/start-interview"
              className="text-[11px] font-semibold text-[#2563EB] dark:text-[#38BDF8] hover:underline flex items-center gap-1"
            >
              <span>Start Practice</span>
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
              className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs"
            />

            {/* Sliding Drawer */}
            <motion.div
              initial={{ x: -280 }}
              animate={{ x: 0 }}
              exit={{ x: -280 }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              className="sidebar no-scrollbar relative w-64 bg-white dark:bg-[#03112D] border-r border-[#E5E7EB] dark:border-white/[0.08] h-full shadow-2xl flex flex-col z-10"
            >
              {/* Header with Close Button */}
              <div className="h-[72px] flex items-center justify-between px-6 border-b border-[#E5E7EB] dark:border-white/[0.08] shrink-0">
                <Link to="/" onClick={() => setMobileOpen(false)} className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-[#2563EB] flex items-center justify-center text-white font-bold text-base shadow-xs">
                    P
                  </div>
                  <span className="text-xl font-[800] text-[#111827] dark:text-[#F8FAFC] tracking-tight">PrepNova</span>
                </Link>
                <button
                  type="button"
                  onClick={() => setMobileOpen(false)}
                  className="p-1.5 rounded-lg text-[#64748B] dark:text-[#94A3B8] hover:text-[#111827] dark:hover:text-white hover:bg-[#EFF6FF] dark:hover:bg-[#111F38]"
                  aria-label="Close menu"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Menu Items */}
              {renderNavLinks(true)}

              {/* Bottom Info & Pinned Controls */}
              <div className="p-4 border-t border-[#E5E7EB] dark:border-white/[0.08] mt-auto flex flex-col gap-2.5 shrink-0 bg-white dark:bg-[#03112D]">
                <div className="p-3.5 rounded-xl bg-[#F1F5F9] dark:bg-[#081A3A] border border-[#E5E7EB] dark:border-white/[0.08] text-xs transition-colors">
                  <div className="flex items-center gap-1.5 font-bold text-[#111827] dark:text-[#F8FAFC] mb-1">
                    <Sparkles className="w-3.5 h-3.5 text-[#2563EB] dark:text-[#38BDF8]" />
                    <span>Free Account</span>
                  </div>
                  <p className="text-[11px] text-[#64748B] dark:text-[#94A3B8] leading-tight mb-2.5">
                    Ready for your next mock interview.
                  </p>
                  <Link 
                    to="/start-interview"
                    onClick={() => setMobileOpen(false)}
                    className="text-[11px] font-semibold text-[#2563EB] dark:text-[#38BDF8] hover:underline flex items-center gap-1"
                  >
                    <span>Start Practice</span>
                    <span>→</span>
                  </Link>
                </div>
                <p className="text-[11px] text-[#64748B] dark:text-[#94A3B8] text-center">PrepNova Interview Suite</p>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}

