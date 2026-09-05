import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { NavLink, useNavigate } from 'react-router-dom';
import { Settings, LogOut } from 'lucide-react';
import { cn } from '../../lib/utils';
import { useAuth } from '../../context/AuthContext';

export default function ProfileDropdown() {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  // Close on click outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Close on Escape key
  useEffect(() => {
    function handleKeyDown(event) {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  const closeDropdown = () => setIsOpen(false);

  const handleLogout = () => {
    closeDropdown();
    logout();
    navigate('/login');
  };

  if (!user) return null;

  const initial = user?.name 
    ? user.name.charAt(0).toUpperCase() 
    : (user?.email ? user.email.charAt(0).toUpperCase() : 'U');

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Trigger */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        aria-haspopup="true"
        aria-expanded={isOpen}
        className={cn(
          "w-9 h-9 rounded-full flex items-center justify-center text-white font-bold text-sm transition-all focus:outline-none focus:ring-2 focus:ring-[#2563EB]/40 shadow-xs",
          isOpen ? "bg-[#1D4ED8] ring-2 ring-[#2563EB]" : "bg-[#2563EB] hover:bg-[#1D4ED8]"
        )}
        title={user.name || 'Account'}
      >
        <span>{initial}</span>
      </button>

      {/* Dropdown Menu */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.98 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="absolute right-0 mt-3 w-[300px] bg-white dark:bg-[#081A3A] rounded-2xl border border-[#E5E7EB] dark:border-white/[0.08] shadow-xl z-50 p-4"
          >
            {/* User Profile Section */}
            <div className="flex items-center gap-3 px-2 pb-4 border-b border-[#E5E7EB] dark:border-white/[0.08] mb-3">
              <div className="w-12 h-12 rounded-full bg-[#2563EB] text-white flex items-center justify-center shrink-0 font-bold text-lg shadow-xs">
                <span>{initial}</span>
              </div>
              <div className="flex flex-col truncate">
                <span className="font-bold text-[#111827] dark:text-[#F8FAFC] text-sm truncate">{user.name || 'Candidate'}</span>
                <span className="text-xs font-medium text-[#64748B] dark:text-[#94A3B8] truncate">{user.email}</span>
              </div>
            </div>

            {/* Navigation Items */}
            <div className="flex flex-col gap-1 mb-3 border-b border-[#E5E7EB] dark:border-white/[0.08] pb-3">
              <NavLink
                to="/settings"
                onClick={closeDropdown}
                className={({ isActive }) => cn(
                  "flex items-center gap-3 px-3 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-colors",
                  isActive 
                    ? "bg-[#DBEAFE] dark:bg-[#102449] text-[#2563EB] dark:text-[#38BDF8]" 
                    : "text-[#111827] dark:text-[#F8FAFC] hover:bg-[#EFF6FF] dark:hover:bg-[#102449]/60"
                )}
              >
                <Settings className="w-4 h-4 text-[#64748B] dark:text-[#94A3B8]" />
                <span>Settings</span>
              </NavLink>
            </div>

            {/* Bottom Section */}
            <div className="flex flex-col gap-1">
              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs sm:text-sm font-semibold text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 hover:text-red-700 transition-colors group text-left cursor-pointer"
              >
                <LogOut className="w-4 h-4 text-red-500 group-hover:text-red-600 transition-colors" />
                <span>Logout</span>
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
