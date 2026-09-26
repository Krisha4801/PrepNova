import React, { useState, useEffect } from 'react';
import { 
  Check, 
  ChevronRight, 
  Shield, 
  Lock, 
  Download, 
  Trash2, 
  FileText,
  AlertTriangle,
  Loader2,
  Sliders,
  Sparkles,
  Eye,
  EyeOff,
  X
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import WorkspaceLayout from '../components/layout/WorkspaceLayout';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';

export default function SettingsPage() {
  const navigate = useNavigate();
  const { theme, setTheme, isDark, toggleTheme } = useTheme();
  const { user, logout } = useAuth();

  // State Management
  const [timeZone, setTimeZone] = useState('Asia/Kolkata (IST)');
  const [interviewMode, setInterviewMode] = useState('Voice');
  const [difficulty, setDifficulty] = useState('Medium');
  const [duration, setDuration] = useState('25 min');

  // UX Feedback states
  const [isSaving, setIsSaving] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('Preferences updated successfully');
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  // Privacy & Security states
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false
  });
  const [passwordErrors, setPasswordErrors] = useState({});

  const validatePassword = () => {
    const errors = {};
    if (!passwordForm.currentPassword.trim()) {
      errors.currentPassword = 'Enter your current password';
    }
    if (!passwordForm.newPassword) {
      errors.newPassword = 'Enter a new password';
    } else {
      if (passwordForm.newPassword.length < 8) {
        errors.newPassword = 'Must be at least 8 characters';
      } else if (!/[A-Z]/.test(passwordForm.newPassword)) {
        errors.newPassword = 'Must contain at least one uppercase letter';
      } else if (!/[0-9]/.test(passwordForm.newPassword)) {
        errors.newPassword = 'Must contain at least one number';
      }
    }
    if (!passwordForm.confirmPassword) {
      errors.confirmPassword = 'Confirm your new password';
    } else if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      errors.confirmPassword = 'Passwords do not match';
    }
    return errors;
  };

  const handleUpdatePassword = (e) => {
    e.preventDefault();
    const errors = validatePassword();
    if (Object.keys(errors).length > 0) {
      setPasswordErrors(errors);
      return;
    }
    setIsUpdatingPassword(true);
    setTimeout(() => {
      setIsUpdatingPassword(false);
      setShowPasswordModal(false);
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
      setPasswordErrors({});
      setToastMessage('Password updated successfully');
      setShowToast(true);
      setTimeout(() => setShowToast(false), 3000);
    }, 700);
  };

  const handleDownloadData = () => {
    if (isExporting) return;
    setIsExporting(true);
    setTimeout(() => {
      try {
        const exportData = {
          user: {
            name: user?.name || 'Candidate',
            email: user?.email || '',
            university: user?.university || 'DAU',
            role: user?.preferredRole || 'Software Engineer',
            joinedAt: user?.joinedAt || new Date().toISOString()
          },
          exportedAt: new Date().toISOString(),
          settings: {
            timeZone,
            interviewMode,
            difficulty,
            duration
          },
          interviewHistory: JSON.parse(localStorage.getItem('prepNova_history') || '[]'),
          resumeData: JSON.parse(localStorage.getItem('prepNova_resume') || '{}'),
          savedSkills: JSON.parse(localStorage.getItem('prepnova_saved_skills') || '[]'),
          customInterviews: JSON.parse(localStorage.getItem('prepnova_custom_config') || '{}')
        };

        const jsonString = `data:text/json;charset=utf-8,${encodeURIComponent(
          JSON.stringify(exportData, null, 2)
        )}`;
        const downloadAnchor = document.createElement('a');
        downloadAnchor.setAttribute('href', jsonString);
        downloadAnchor.setAttribute(
          'download',
          `prepnova_user_data_${new Date().toISOString().slice(0, 10)}.json`
        );
        document.body.appendChild(downloadAnchor);
        downloadAnchor.click();
        downloadAnchor.remove();
      } catch (err) {
        console.error('Data export error', err);
      } finally {
        setIsExporting(false);
        setToastMessage('Your data export is ready.');
        setShowToast(true);
        setTimeout(() => setShowToast(false), 3500);
      }
    }, 1000);
  };

  const handleThemeChange = (newTheme) => {
    setTheme(newTheme.toLowerCase());
  };

  const handleSave = () => {
    setIsSaving(true);
    setTimeout(() => {
      setIsSaving(false);
      setToastMessage('Preferences updated successfully');
      setShowToast(true);
      setTimeout(() => setShowToast(false), 3000);
    }, 600);
  };

  const handleCancel = () => {
    setTheme(isDark ? 'Dark' : 'Light');
    setInterviewMode('Voice');
    setDifficulty('Medium');
    setDuration('25 min');
  };

  const handlePermanentDelete = () => {
    setShowDeleteModal(false);
    localStorage.clear();
    if (logout) logout();
    navigate('/login');
  };

  return (
    <WorkspaceLayout title="Settings" maxWidth="max-w-[1120px]">
      
      {/* Success Toast */}
      <div 
        className={`fixed bottom-6 right-6 z-50 bg-[#0F172A] dark:bg-[#1E293B] text-white px-5 py-3 rounded-xl shadow-xl border border-transparent dark:border-[#334155] flex items-center gap-2.5 text-xs sm:text-sm font-semibold transition-all duration-200 ${
          showToast ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 pointer-events-none'
        }`}
      >
        <Check className="w-4 h-4 text-emerald-400" />
        <span>{toastMessage}</span>
      </div>

      <div className="space-y-5">
        
        {/* Header */}
        <div className="pb-2 border-b border-[#E5E7EB] dark:border-[#334155]/60">
          <h2 className="text-2xl sm:text-[26px] font-bold text-[#0F172A] dark:text-[#F8FAFC] tracking-tight leading-[1.4]">
            Settings
          </h2>
          <p className="text-[13px] font-normal text-[#64748B] dark:text-[#94A3B8] mt-1 leading-[1.4]">
            Manage your account preferences and interview experience.
          </p>
        </div>

        {/* SECTION 1 — PREFERENCES */}
        <div className="bg-white dark:bg-[#081A3A] rounded-[18px] border border-[#E5E7EB] dark:border-white/10 p-6 shadow-[0_2px_8px_rgba(15,23,42,0.04)] space-y-5 transition-all duration-180">
          <div className="border-b border-[#E5E7EB] dark:border-white/10 pb-4">
            <div className="flex items-center gap-2">
              <Sparkles className="w-[18px] h-[18px] text-[#2563EB]" />
              <h3 className="text-[22px] font-bold text-[#0F172A] dark:text-[#F8FAFC] leading-[1.4]">
                General Preferences
              </h3>
            </div>
            <p className="text-[13px] font-normal text-[#64748B] dark:text-[#94A3B8] mt-1 leading-[1.4]">
              Workspace appearance, theme modes, and regional time settings.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Theme Dropdown */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-[#64748B] dark:text-[#94A3B8]">
                Theme Appearance
              </label>
              <select
                value={isDark ? 'Dark' : 'Light'}
                onChange={(e) => handleThemeChange(e.target.value)}
                className="w-full h-[56px] px-4 rounded-[14px] border border-[#E5E7EB] dark:border-blue-500/20 bg-white dark:bg-[#102449] text-sm font-medium text-[#111827] dark:text-white focus:border-[#2563EB] dark:focus:border-blue-400 focus:ring-2 focus:ring-[#2563EB]/15 outline-hidden transition-all cursor-pointer"
              >
                <option value="Light" className="bg-white dark:bg-[#102449] text-[#111827] dark:text-white">Light</option>
                <option value="Dark" className="bg-white dark:bg-[#102449] text-[#111827] dark:text-white">Dark</option>
              </select>
            </div>

            {/* Time Zone */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-[#64748B] dark:text-[#94A3B8]">
                Time Zone
              </label>
              <input
                type="text"
                value={timeZone}
                readOnly
                className="w-full h-[56px] px-4 rounded-[14px] border border-[#E5E7EB] dark:border-blue-500/20 bg-slate-50 dark:bg-[#0F2347] text-sm font-medium text-[#0F172A] dark:text-white cursor-not-allowed outline-hidden select-none"
              />
            </div>
          </div>
        </div>

        {/* SECTION 2 — INTERVIEW PREFERENCES */}
        <div className="bg-white dark:bg-[#081A3A] rounded-[18px] border border-[#E5E7EB] dark:border-white/10 p-6 shadow-[0_2px_8px_rgba(15,23,42,0.04)] space-y-5 transition-all duration-180">
          <div className="border-b border-[#E5E7EB] dark:border-white/10 pb-4">
            <div className="flex items-center gap-2">
              <Sliders className="w-[18px] h-[18px] text-[#2563EB]" />
              <h3 className="text-[22px] font-bold text-[#0F172A] dark:text-[#F8FAFC] leading-[1.4]">
                Interview Preferences
              </h3>
            </div>
            <p className="text-[13px] font-normal text-[#64748B] dark:text-[#94A3B8] mt-1 leading-[1.4]">
              Customize default format, difficulty levels, and session lengths for mock interviews.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
            {/* Left Column: Mode & Duration */}
            <div className="space-y-6">
              {/* Default Interview Mode */}
              <div className="space-y-2">
                <label className="text-xs font-semibold text-[#64748B] dark:text-[#94A3B8]">
                  Default Interview Mode
                </label>
                <div className="p-1.5 bg-slate-100 dark:bg-[#0F2347] rounded-[14px] grid grid-cols-2 gap-1.5 border border-[#E5E7EB] dark:border-blue-500/20">
                  {['Voice', 'Text'].map((mode) => {
                    const isSelected = interviewMode === mode;
                    return (
                      <button
                        key={mode}
                        type="button"
                        onClick={() => setInterviewMode(mode)}
                        className={`h-[42px] rounded-xl text-xs sm:text-sm font-semibold transition-all duration-180 cursor-pointer flex items-center justify-center gap-1.5 ${
                          isSelected
                            ? 'bg-white dark:bg-[#2563EB] text-[#2563EB] dark:text-white shadow-2xs font-bold'
                            : 'text-[#64748B] dark:text-[#94A3B8] hover:text-[#0F172A] dark:hover:text-white'
                        }`}
                      >
                        {mode === 'Voice' ? '🎙️ Voice (selected)' : '✍️ Text'}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Default Duration */}
              <div className="space-y-2">
                <label className="text-xs font-semibold text-[#64748B] dark:text-[#94A3B8]">
                  Default Duration
                </label>
                <select
                  value={duration}
                  onChange={(e) => setDuration(e.target.value)}
                  className="w-full h-[56px] px-4 rounded-[14px] border border-[#E5E7EB] dark:border-blue-500/20 bg-slate-50 dark:bg-[#0F2347] text-sm font-medium text-[#0F172A] dark:text-white focus:border-[#2563EB] dark:focus:border-blue-400 focus:ring-2 focus:ring-[#2563EB]/15 outline-hidden transition-all cursor-pointer"
                >
                  <option value="15 min" className="bg-white dark:bg-[#0F2347]">15 min</option>
                  <option value="25 min" className="bg-white dark:bg-[#0F2347]">25 min (selected)</option>
                  <option value="40 min" className="bg-white dark:bg-[#0F2347]">40 min</option>
                </select>
              </div>
            </div>

            {/* Right Column: Default Difficulty */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-[#64748B] dark:text-[#94A3B8]">
                Default Difficulty
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {[
                  { level: 'Easy', desc: 'Fundamentals & core concepts' },
                  { level: 'Medium', desc: 'Standard industry scenarios' },
                  { level: 'Hard', desc: 'Complex edge cases & scale' }
                ].map((item) => {
                  const isSelected = difficulty === item.level;
                  return (
                    <div
                      key={item.level}
                      onClick={() => setDifficulty(item.level)}
                      className={`p-4 rounded-[14px] border cursor-pointer transition-all duration-180 flex flex-col justify-between min-h-[120px] ${
                        isSelected
                          ? 'border-[#2563EB] dark:border-blue-400 bg-blue-50/50 dark:bg-[#0F2347] ring-1 ring-[#2563EB] dark:ring-blue-400'
                          : 'border-[#E5E7EB] dark:border-blue-500/20 bg-slate-50 dark:bg-[#0F2347]/60 hover:border-slate-300 dark:hover:border-blue-400/40'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className={`font-bold text-sm ${isSelected ? 'text-[#2563EB] dark:text-white' : 'text-[#0F172A] dark:text-[#F8FAFC]'}`}>
                          {item.level}
                        </span>
                        <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                          isSelected ? 'border-[#2563EB] bg-[#2563EB]' : 'border-[#CBD5E1] dark:border-[#475569] bg-white dark:bg-[#081A3A]'
                        }`}>
                          {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                        </div>
                      </div>
                      <p className="text-[11px] text-[#64748B] dark:text-[#94A3B8] leading-tight">
                        {item.desc}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* SECTION 3 — PRIVACY & SECURITY */}
        <div className="bg-white dark:bg-[#081A3A] rounded-[18px] border border-[#E5E7EB] dark:border-white/10 p-6 shadow-[0_2px_8px_rgba(15,23,42,0.04)] space-y-5 transition-all duration-180">
          <div className="border-b border-[#E5E7EB] dark:border-white/10 pb-4">
            <div className="flex items-center gap-2">
              <Shield className="w-[18px] h-[18px] text-[#2563EB]" />
              <h3 className="text-[22px] font-bold text-[#0F172A] dark:text-[#F8FAFC] leading-[1.4]">
                Privacy & Security
              </h3>
            </div>
            <p className="text-[13px] font-normal text-[#64748B] dark:text-[#94A3B8] mt-1 leading-[1.4]">
              Manage your account security and export your personal interview data.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Card 1 — Change Password */}
            <div 
              onClick={() => {
                setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
                setPasswordErrors({});
                setShowPasswordModal(true);
              }}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
                  setPasswordErrors({});
                  setShowPasswordModal(true);
                }
              }}
              className="group h-[116px] p-5 rounded-[16px] bg-white dark:bg-[#0F2347] border border-[#E5E7EB] dark:border-white/10 hover:border-[#2563EB] dark:hover:border-[#3B82F6] hover:-translate-y-[2px] hover:shadow-xs transition-all duration-200 ease-in-out cursor-pointer flex items-center select-none"
            >
              <div className="flex items-center gap-3.5 w-full">
                <div className="w-11 h-11 rounded-full bg-blue-50 dark:bg-blue-950/60 text-[#2563EB] dark:text-[#38BDF8] flex items-center justify-center shrink-0 transition-transform group-hover:scale-105 duration-200">
                  <Lock className="w-[18px] h-[18px]" />
                </div>
                <div className="min-w-0 flex-1">
                  <h4 className="text-[16px] font-semibold text-[#0F172A] dark:text-[#F8FAFC] group-hover:text-[#2563EB] dark:group-hover:text-[#38BDF8] transition-colors leading-[1.4]">
                    Change Password
                  </h4>
                  <p className="text-[13px] font-normal text-[#64748B] dark:text-[#94A3B8] leading-[1.4] mt-0.5">
                    Update your login password securely.
                  </p>
                </div>
              </div>
            </div>

            {/* Card 2 — Download My Data */}
            <div 
              onClick={handleDownloadData}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  handleDownloadData();
                }
              }}
              className="group h-[116px] p-5 rounded-[16px] bg-white dark:bg-[#0F2347] border border-[#E5E7EB] dark:border-white/10 hover:border-[#2563EB] dark:hover:border-[#3B82F6] hover:-translate-y-[2px] hover:shadow-xs transition-all duration-200 ease-in-out cursor-pointer flex items-center select-none"
            >
              <div className="flex items-center gap-3.5 w-full">
                <div className="w-11 h-11 rounded-full bg-blue-50 dark:bg-blue-950/60 text-[#2563EB] dark:text-[#38BDF8] flex items-center justify-center shrink-0 transition-transform group-hover:scale-105 duration-200">
                  {isExporting ? (
                    <Loader2 className="w-[18px] h-[18px] animate-spin" />
                  ) : (
                    <Download className="w-[18px] h-[18px]" />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <h4 className="text-[16px] font-semibold text-[#0F172A] dark:text-[#F8FAFC] group-hover:text-[#2563EB] dark:group-hover:text-[#38BDF8] transition-colors leading-[1.4]">
                    Download My Data
                  </h4>
                  <p className="text-[13px] font-normal text-[#64748B] dark:text-[#94A3B8] leading-[1.4] mt-0.5">
                    {isExporting ? 'Preparing your download...' : 'Export your interview history and profile data.'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* DELETE ACCOUNT (Minimal, Clean Linear Style) */}
        <div className="p-5 sm:p-6 rounded-[18px] bg-[#FEF2F2] dark:bg-red-950/20 border border-[#FCA5A5] dark:border-red-900/40 flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-all">
          <div className="flex items-start gap-3.5">
            <div className="w-9 h-9 rounded-full bg-red-100/80 dark:bg-red-900/40 text-[#DC2626] flex items-center justify-center shrink-0 mt-0.5">
              <Trash2 className="w-[18px] h-[18px]" />
            </div>
            <div>
              <h3 className="text-[16px] font-semibold text-[#0F172A] dark:text-[#F8FAFC] leading-[1.4]">
                Delete Account
              </h3>
              <p className="text-[13px] font-normal text-[#64748B] dark:text-[#94A3B8] leading-[1.4] mt-0.5">
                Permanently delete your PrepNova account, interview history, ATS reports, and all saved data.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setShowDeleteModal(true)}
            className="h-[36px] px-3.5 rounded-[10px] border border-[#DC2626] text-[#DC2626] hover:bg-[#DC2626] hover:text-white text-[14px] font-medium transition-colors cursor-pointer shrink-0 self-start sm:self-auto flex items-center justify-center whitespace-nowrap"
          >
            Delete Account
          </button>
        </div>

        {/* BOTTOM ACTION BAR */}
        <div className="pt-2 border-t border-[#E5E7EB] dark:border-white/10 flex flex-col sm:flex-row items-center justify-end gap-3">
          <button
            type="button"
            onClick={handleCancel}
            disabled={isSaving}
            className="w-full sm:w-auto px-5 h-[40px] rounded-[10px] border border-[#E5E7EB] dark:border-white/10 text-[14px] font-medium text-[#64748B] dark:text-[#94A3B8] hover:text-[#0F172A] dark:hover:text-white hover:bg-slate-50 dark:hover:bg-white/5 transition-all cursor-pointer text-center"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={handleSave}
            disabled={isSaving}
            className="w-full sm:w-auto px-6 h-[40px] rounded-[10px] bg-[#2563EB] hover:bg-blue-700 text-white text-[14px] font-medium shadow-xs transition-all cursor-pointer flex items-center justify-center gap-2"
          >
            {isSaving ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Saving Changes...</span>
              </>
            ) : (
              <span>Save Changes</span>
            )}
          </button>
        </div>

      </div>

      {/* Delete Account Modal Dialog */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div 
            className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity duration-180" 
            onClick={() => setShowDeleteModal(false)}
          />
          <div className="relative bg-white dark:bg-[#081A3A] rounded-[18px] border border-[#E5E7EB] dark:border-white/10 p-6 max-w-md w-full shadow-2xl z-10 animate-in fade-in zoom-in-95 duration-180">
            <div className="w-10 h-10 rounded-full bg-red-50 dark:bg-red-950/50 text-[#DC2626] flex items-center justify-center mb-3.5">
              <AlertTriangle className="w-5 h-5" />
            </div>

            <h3 className="text-[16px] font-semibold text-[#0F172A] dark:text-[#F8FAFC] mb-1.5 leading-[1.4]">
              Delete your account?
            </h3>
            <p className="text-[13px] font-normal text-[#64748B] dark:text-[#94A3B8] leading-[1.4] mb-5">
              This will permanently remove your profile, interview history, ATS evaluations, practice progress, and saved data. This action cannot be undone.
            </p>

            <div className="flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setShowDeleteModal(false)}
                className="h-[36px] px-4 rounded-[10px] text-[14px] font-medium text-[#64748B] dark:text-[#94A3B8] hover:text-[#0F172A] dark:hover:text-[#F8FAFC] hover:bg-slate-100 dark:hover:bg-white/5 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handlePermanentDelete}
                className="h-[36px] px-4 rounded-[10px] bg-[#DC2626] hover:bg-red-700 text-[14px] font-medium text-white transition-all shadow-xs cursor-pointer"
              >
                Delete Permanently
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Change Password Modal Dialog */}
      {showPasswordModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div 
            className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity duration-180" 
            onClick={() => {
              if (!isUpdatingPassword) setShowPasswordModal(false);
            }}
          />

          <div className="relative bg-white dark:bg-[#081A3A] border border-[#E5E7EB] dark:border-white/10 rounded-[18px] p-6 max-w-md w-full shadow-2xl z-10 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-blue-50 dark:bg-blue-950/60 text-[#2563EB] dark:text-[#38BDF8] flex items-center justify-center shrink-0">
                  <Lock className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-[16px] font-semibold text-[#0F172A] dark:text-[#F8FAFC] leading-[1.4]">
                    Change Password
                  </h3>
                  <p className="text-[13px] font-normal text-[#64748B] dark:text-[#94A3B8] leading-[1.4]">
                    Ensure your account stays protected.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowPasswordModal(false)}
                className="text-[#64748B] dark:text-[#94A3B8] hover:text-[#0F172A] dark:hover:text-white p-1 rounded-lg transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleUpdatePassword} className="space-y-3.5">
              {/* Current Password */}
              <div>
                <label className="block text-[12px] font-medium text-[#0F172A] dark:text-[#F8FAFC] mb-1 leading-[1.4]">
                  Current Password
                </label>
                <div className="relative">
                  <input
                    type={showPasswords.current ? "text" : "password"}
                    value={passwordForm.currentPassword}
                    onChange={(e) => {
                      setPasswordForm(prev => ({ ...prev, currentPassword: e.target.value }));
                      if (passwordErrors.currentPassword) {
                        setPasswordErrors(prev => ({ ...prev, currentPassword: null }));
                      }
                    }}
                    placeholder="Enter current password"
                    className="w-full h-10 px-3 pr-9 rounded-[10px] border border-[#E5E7EB] dark:border-white/10 bg-slate-50/50 dark:bg-[#0F2347] text-[13px] text-[#0F172A] dark:text-[#F8FAFC] placeholder:text-[#94A3B8] focus:border-[#2563EB] focus:outline-none transition-colors"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPasswords(prev => ({ ...prev, current: !prev.current }))}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#94A3B8] hover:text-[#0F172A] dark:hover:text-white transition-colors"
                    tabIndex={-1}
                  >
                    {showPasswords.current ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </div>
                {passwordErrors.currentPassword && (
                  <p className="text-[12px] text-rose-500 mt-0.5 font-normal">{passwordErrors.currentPassword}</p>
                )}
              </div>

              {/* New Password */}
              <div>
                <label className="block text-[12px] font-medium text-[#0F172A] dark:text-[#F8FAFC] mb-1 leading-[1.4]">
                  New Password
                </label>
                <div className="relative">
                  <input
                    type={showPasswords.new ? "text" : "password"}
                    value={passwordForm.newPassword}
                    onChange={(e) => {
                      setPasswordForm(prev => ({ ...prev, newPassword: e.target.value }));
                      if (passwordErrors.newPassword) {
                        setPasswordErrors(prev => ({ ...prev, newPassword: null }));
                      }
                    }}
                    placeholder="Enter new password"
                    className="w-full h-10 px-3 pr-9 rounded-[10px] border border-[#E5E7EB] dark:border-white/10 bg-slate-50/50 dark:bg-[#0F2347] text-[13px] text-[#0F172A] dark:text-[#F8FAFC] placeholder:text-[#94A3B8] focus:border-[#2563EB] focus:outline-none transition-colors"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPasswords(prev => ({ ...prev, new: !prev.new }))}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#94A3B8] hover:text-[#0F172A] dark:hover:text-white transition-colors"
                    tabIndex={-1}
                  >
                    {showPasswords.new ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </div>
                {passwordErrors.newPassword && (
                  <p className="text-[12px] text-rose-500 mt-0.5 font-normal">{passwordErrors.newPassword}</p>
                )}

                {/* Validation checklist */}
                <div className="mt-2 p-2 rounded-lg bg-slate-50 dark:bg-[#0F2347] border border-slate-100 dark:border-white/5 space-y-0.5">
                  <p className="text-[11px] font-medium text-[#64748B] dark:text-[#94A3B8]">
                    Requirements:
                  </p>
                  <div className="grid grid-cols-2 gap-x-2 gap-y-0.5 text-[11px]">
                    <span className={`inline-flex items-center gap-1 ${passwordForm.newPassword.length >= 8 ? 'text-emerald-600 dark:text-emerald-400 font-medium' : 'text-[#64748B] dark:text-[#94A3B8]'}`}>
                      <Check className={`w-3 h-3 ${passwordForm.newPassword.length >= 8 ? 'stroke-[2.5]' : 'opacity-40'}`} />
                      8+ characters
                    </span>
                    <span className={`inline-flex items-center gap-1 ${/[A-Z]/.test(passwordForm.newPassword) ? 'text-emerald-600 dark:text-emerald-400 font-medium' : 'text-[#64748B] dark:text-[#94A3B8]'}`}>
                      <Check className={`w-3 h-3 ${/[A-Z]/.test(passwordForm.newPassword) ? 'stroke-[2.5]' : 'opacity-40'}`} />
                      One uppercase
                    </span>
                    <span className={`inline-flex items-center gap-1 ${/[0-9]/.test(passwordForm.newPassword) ? 'text-emerald-600 dark:text-emerald-400 font-medium' : 'text-[#64748B] dark:text-[#94A3B8]'}`}>
                      <Check className={`w-3 h-3 ${/[0-9]/.test(passwordForm.newPassword) ? 'stroke-[2.5]' : 'opacity-40'}`} />
                      One number
                    </span>
                    <span className={`inline-flex items-center gap-1 ${Boolean(passwordForm.confirmPassword) && passwordForm.newPassword === passwordForm.confirmPassword ? 'text-emerald-600 dark:text-emerald-400 font-medium' : 'text-[#64748B] dark:text-[#94A3B8]'}`}>
                      <Check className={`w-3 h-3 ${Boolean(passwordForm.confirmPassword) && passwordForm.newPassword === passwordForm.confirmPassword ? 'stroke-[2.5]' : 'opacity-40'}`} />
                      Passwords match
                    </span>
                  </div>
                </div>
              </div>

              {/* Confirm New Password */}
              <div>
                <label className="block text-[12px] font-medium text-[#0F172A] dark:text-[#F8FAFC] mb-1 leading-[1.4]">
                  Confirm New Password
                </label>
                <div className="relative">
                  <input
                    type={showPasswords.confirm ? "text" : "password"}
                    value={passwordForm.confirmPassword}
                    onChange={(e) => {
                      setPasswordForm(prev => ({ ...prev, confirmPassword: e.target.value }));
                      if (passwordErrors.confirmPassword) {
                        setPasswordErrors(prev => ({ ...prev, confirmPassword: null }));
                      }
                    }}
                    placeholder="Re-enter new password"
                    className="w-full h-10 px-3 pr-9 rounded-[10px] border border-[#E5E7EB] dark:border-white/10 bg-slate-50/50 dark:bg-[#0F2347] text-[13px] text-[#0F172A] dark:text-[#F8FAFC] placeholder:text-[#94A3B8] focus:border-[#2563EB] focus:outline-none transition-colors"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPasswords(prev => ({ ...prev, confirm: !prev.confirm }))}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#94A3B8] hover:text-[#0F172A] dark:hover:text-white transition-colors"
                    tabIndex={-1}
                  >
                    {showPasswords.confirm ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </div>
                {passwordErrors.confirmPassword && (
                  <p className="text-[12px] text-rose-500 mt-0.5 font-normal">{passwordErrors.confirmPassword}</p>
                )}
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end gap-2.5 pt-2.5 border-t border-[#E5E7EB] dark:border-white/10">
                <button
                  type="button"
                  onClick={() => setShowPasswordModal(false)}
                  disabled={isUpdatingPassword}
                  className="h-[36px] px-3.5 rounded-[10px] border border-[#E5E7EB] dark:border-white/10 text-[14px] font-medium text-[#64748B] dark:text-[#94A3B8] hover:text-[#0F172A] dark:hover:text-white hover:bg-slate-50 dark:hover:bg-white/5 transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isUpdatingPassword}
                  className="h-[36px] px-4 rounded-[10px] bg-[#2563EB] hover:bg-blue-700 text-white text-[14px] font-medium shadow-xs transition-all cursor-pointer flex items-center gap-2"
                >
                  {isUpdatingPassword ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Updating...</span>
                    </>
                  ) : (
                    <span>Update Password</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </WorkspaceLayout>
  );
}
