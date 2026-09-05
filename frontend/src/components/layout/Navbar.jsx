import React, { useState, useEffect } from 'react';
import { Menu, X, Sun, Moon } from 'lucide-react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../../lib/utils';
import ProfileDropdown from './ProfileDropdown';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';

export default function Navbar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeNav, setActiveNav] = useState('Why PrepNova');

  // Authenticated nav links for logged-in candidates
  const authNavLinks = [
    { name: 'Dashboard', path: '/dashboard' },
    { name: 'History', path: '/history' },
    { name: 'Progress', path: '/progress' },
  ];

  // Public landing nav links for before login
  const publicNavLinks = [
    { name: 'Why PrepNova', target: 'why-prepnova' },
    { name: 'How It Works', target: 'how-it-works' },
    { name: 'Categories', target: 'categories' },
  ];

  const handlePublicNavClick = (link) => {
    setActiveNav(link.name);
    setMobileMenuOpen(false);

    if (link.path) {
      navigate(link.path);
      return;
    }

    if (location.pathname !== '/') {
      navigate(`/#${link.target}`);
      return;
    }

    const element = document.getElementById(link.target);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  // -------------------------------------------------------------
  // 1. PUBLIC NAVBAR (BEFORE LOGIN)
  // -------------------------------------------------------------
  if (!user) {
    return (
      <nav className="sticky top-0 z-50 w-full h-[72px] bg-white dark:bg-[#081A3A] border-b border-[#E5E7EB] dark:border-white/[0.08] flex items-center font-sans transition-colors duration-200">
        <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 w-full flex justify-between items-center h-full">
          
          {/* Left: PrepNova Logo + Small purple pill */}
          <div className="flex items-center gap-3">
            <Link to="/" className="flex items-center gap-2.5 group shrink-0">
              <div className="w-8 h-8 rounded-lg bg-[#2563EB] flex items-center justify-center text-white font-bold text-base group-hover:opacity-95 transition-opacity shadow-xs">
                P
              </div>
              <span className="text-xl font-[800] text-[#111827] dark:text-[#F8FAFC] tracking-tight">PrepNova</span>
            </Link>
            <span className="hidden sm:inline-flex items-center px-2.5 py-0.5 rounded-full bg-blue-50 dark:bg-[#102449] text-[10px] font-extrabold text-[#2563EB] dark:text-[#38BDF8] uppercase tracking-wider border border-blue-100 dark:border-white/10">
              AI MOCK INTERVIEW
            </span>
          </div>

          {/* Center Navigation (Desktop): Features, How it Works, For Students, Resources */}
          <div className="hidden md:flex items-center gap-8 h-full">
            {publicNavLinks.map((link) => {
              const isSelected = activeNav === link.name;

              return (
                <button
                  key={link.name}
                  type="button"
                  onClick={() => handlePublicNavClick(link)}
                  className={cn(
                    "relative h-full flex items-center text-sm font-semibold transition-colors px-1 cursor-pointer",
                    isSelected ? "text-[#2563EB] dark:text-[#38BDF8]" : "text-[#64748B] dark:text-[#94A3B8] hover:text-[#111827] dark:hover:text-[#F8FAFC]"
                  )}
                >
                  <span>{link.name}</span>
                  {isSelected && (
                    <motion.div
                      layoutId="public-navbar-underline"
                      className="absolute bottom-0 left-0 w-full h-[2px] bg-[#2563EB] dark:bg-[#38BDF8] rounded-t-full"
                      transition={{ type: "spring", stiffness: 380, damping: 30 }}
                    />
                  )}
                </button>
              );
            })}
          </div>

          {/* Right: Theme Toggle, Login & Sign Up Buttons */}
          <div className="flex items-center gap-2.5 sm:gap-3 shrink-0">
            {/* Theme Toggle Button */}
            <button
              type="button"
              onClick={toggleTheme}
              className="w-9 h-9 rounded-lg border border-[#E5E7EB] dark:border-white/[0.08] hover:bg-slate-50 dark:hover:bg-[#102449] flex items-center justify-center text-[#64748B] hover:text-[#111827] dark:text-[#94A3B8] dark:hover:text-[#F8FAFC] transition-colors cursor-pointer"
              title={isDark ? "Switch to light mode" : "Switch to dark mode"}
              aria-label="Toggle theme"
            >
              {isDark ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-700" />}
            </button>

            {/* Login button (desktop/tablet) */}
            <Link
              to="/login"
              className="hidden sm:flex h-[40px] px-[20px] rounded-[10px] bg-white dark:bg-[#102449] hover:bg-slate-50 dark:hover:bg-[#163060] border border-[#E5E7EB] dark:border-white/[0.08] text-[#111827] dark:text-[#F8FAFC] text-sm font-semibold items-center justify-center transition-all duration-150"
            >
              Login
            </Link>

            {/* Sign Up button (desktop/tablet) */}
            <Link
              to="/signup"
              className="hidden sm:flex h-[40px] px-[20px] rounded-[10px] bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-sm font-semibold items-center justify-center shadow-xs transition-all duration-150"
            >
              Sign Up
            </Link>

            {/* Mobile Hamburger Button */}
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="sm:hidden w-9 h-9 flex items-center justify-center text-[#64748B] hover:text-[#111827] dark:text-[#94A3B8] dark:hover:text-[#F8FAFC] rounded-lg border border-[#E5E7EB] dark:border-white/[0.08]"
              aria-label="Toggle navigation menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>

        </div>

        {/* Mobile Drawer (Public) */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="md:hidden absolute top-[72px] left-0 w-full bg-white dark:bg-[#081A3A] border-b border-[#E5E7EB] dark:border-white/[0.08] shadow-lg px-6 py-5 flex flex-col gap-3 z-40 overflow-hidden"
            >
              {publicNavLinks.map((link) => {
                const isSelected = activeNav === link.name;
                return (
                  <button
                    key={link.name}
                    type="button"
                    onClick={() => handlePublicNavClick(link)}
                    className={cn(
                      "w-full text-left py-2 text-sm font-semibold transition-colors flex items-center justify-between",
                      isSelected ? "text-[#2563EB] dark:text-[#38BDF8]" : "text-[#64748B] dark:text-[#94A3B8] hover:text-[#111827] dark:hover:text-[#F8FAFC]"
                    )}
                  >
                    <span>{link.name}</span>
                    {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-[#2563EB] dark:bg-[#38BDF8]" />}
                  </button>
                );
              })}

              <div className="pt-4 border-t border-[#E5E7EB] dark:border-white/[0.08] flex flex-col gap-2.5 mt-2">
                <Link
                  to="/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="w-full h-[40px] px-[20px] rounded-[10px] bg-white dark:bg-[#102449] border border-[#E5E7EB] dark:border-white/[0.08] text-[#111827] dark:text-[#F8FAFC] text-sm font-semibold flex items-center justify-center"
                >
                  Login
                </Link>
                <Link
                  to="/signup"
                  onClick={() => setMobileMenuOpen(false)}
                  className="w-full h-[40px] px-[20px] rounded-[10px] bg-[#2563EB] text-white text-sm font-semibold flex items-center justify-center shadow-xs"
                >
                  Sign Up
                </Link>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </nav>
    );
  }

  // -------------------------------------------------------------
  // 2. AUTHENTICATED NAVBAR (FOR LOGGED-IN USERS)
  // Preserves Dashboard, History, Resources, Progress, search, bell, and avatar
  // -------------------------------------------------------------
  return (
    <nav className="sticky top-0 z-50 w-full h-[72px] bg-white dark:bg-[#081A3A] border-b border-[#E5E7EB] dark:border-white/[0.08] flex items-center font-sans transition-colors duration-200">
      <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 w-full flex justify-between items-center h-full">
        
        {/* Left: PrepNova Logo + Small pill */}
        <div className="flex items-center gap-3">
          <Link to="/" className="flex items-center gap-2.5 group shrink-0">
            <div className="w-8 h-8 rounded-lg bg-[#2563EB] flex items-center justify-center text-white font-bold text-base group-hover:opacity-95 transition-opacity shadow-xs">
              P
            </div>
            <span className="text-xl font-[800] text-[#111827] dark:text-[#F8FAFC] tracking-tight">PrepNova</span>
          </Link>
          <span className="hidden sm:inline-flex items-center px-2.5 py-0.5 rounded-full bg-blue-50 dark:bg-[#102449] text-[10px] font-extrabold text-[#2563EB] dark:text-[#38BDF8] uppercase tracking-wider border border-blue-100 dark:border-white/10">
            AI MOCK INTERVIEW
          </span>
        </div>
        
        {/* Center: Navigation Links (Desktop) */}
        <div className="hidden md:flex items-center gap-8 h-full">
          {authNavLinks.map((link) => {
            const isActive = location.pathname.startsWith(link.path);

            return (
              <Link
                key={link.name}
                to={link.path}
                className={cn(
                  "relative h-full flex items-center text-sm font-semibold transition-colors px-1",
                  isActive ? "text-[#2563EB] dark:text-[#38BDF8]" : "text-[#64748B] dark:text-[#94A3B8] hover:text-[#111827] dark:hover:text-[#F8FAFC]"
                )}
              >
                {link.name}
                {isActive && (
                  <motion.div
                    layoutId="auth-navbar-underline"
                    className="absolute bottom-0 left-0 w-full h-[2px] bg-[#2563EB] dark:bg-[#38BDF8] rounded-t-full"
                    transition={{ type: "spring", stiffness: 380, damping: 30 }}
                  />
                )}
              </Link>
            );
          })}
        </div>

        {/* Right: Theme Toggle, Profile Avatar */}
        <div className="flex items-center gap-4 shrink-0">

          {/* Theme Toggle Button */}
          <button
            type="button"
            onClick={toggleTheme}
            className="w-9 h-9 flex items-center justify-center text-[#64748B] hover:text-[#111827] dark:text-[#94A3B8] dark:hover:text-[#F8FAFC] hover:bg-slate-100 dark:hover:bg-[#102449] rounded-full transition-colors border border-transparent hover:border-[#E5E7EB] dark:hover:border-white/[0.08]"
            title={`Switch to ${isDark ? 'Light' : 'Dark'} mode`}
            aria-label="Toggle theme"
          >
            {isDark ? (
              <Sun className="w-5 h-5 text-amber-400 hover:rotate-45 transition-transform duration-200" />
            ) : (
              <Moon className="w-5 h-5 text-slate-700 hover:-rotate-12 transition-transform duration-200" />
            )}
          </button>

          {/* Profile Dropdown */}
          <ProfileDropdown />

          {/* Mobile Menu Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden w-9 h-9 flex items-center justify-center text-[#64748B] hover:text-[#0F172A] rounded-lg border border-[#E5E7EB]"
            aria-label="Toggle navigation menu"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>

      </div>

      {/* Mobile Drawer Menu (Authenticated) */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden absolute top-[72px] left-0 w-full bg-white border-b border-[#E5E7EB] shadow-lg px-6 py-4 flex flex-col gap-2 z-40 overflow-hidden"
          >
            {authNavLinks.map((link) => {
              const isActive = location.pathname.startsWith(link.path);

              return (
                <Link
                  key={link.name}
                  to={link.path}
                  onClick={() => setMobileMenuOpen(false)}
                  className={cn(
                    "px-4 py-2.5 rounded-xl text-sm font-semibold transition-colors flex items-center justify-between",
                    isActive ? "bg-[#F3E8FF] text-[#7C3AED]" : "text-[#64748B] hover:bg-slate-50 hover:text-[#0F172A]"
                  )}
                >
                  <span>{link.name}</span>
                  {isActive && <div className="w-1.5 h-1.5 rounded-full bg-[#7C3AED]" />}
                </Link>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}
