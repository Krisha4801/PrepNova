import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  Camera, 
  FileText, 
  CheckCircle2, 
  Award, 
  TrendingUp, 
  Check, 
  Download, 
  ExternalLink,
  GraduationCap,
  User
} from 'lucide-react';
import WorkspaceLayout from '../components/layout/WorkspaceLayout';
import { useAuth } from '../context/AuthContext';

export default function ProfilePage() {
  const { user } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [showToast, setShowToast] = useState(false);

  // Dynamic user data bindings from login session
  const initialData = {
    fullName: user?.name || '',
    email: user?.email || '',
    phone: user?.phone || '',
    university: user?.university || '',
    department: user?.department || '',
    semester: user?.semester || '',
    location: user?.location || '',
    targetRole: user?.preferredRole || 'Software Engineer',
    preferredInterview: user?.preferredInterview || 'HR + Technical',
    experience: user?.experience || 'Fresher'
  };

  const [formData, setFormData] = useState(initialData);


  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSave = () => {
    setIsEditing(false);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 3000);
  };

  const handleCancel = () => {
    setFormData({
      fullName: user?.name || '',
      email: user?.email || '',
      phone: user?.phone || '',
      university: user?.university || '',
      department: user?.department || '',
      semester: user?.semester || '',
      location: user?.location || '',
      targetRole: user?.preferredRole || 'Software Engineer',
      preferredInterview: user?.preferredInterview || 'HR + Technical',
      experience: user?.experience || 'Fresher'
    });
    setIsEditing(false);
  };

  const userInitial = (user?.name ? user.name[0] : (user?.email ? user.email[0] : 'U')).toUpperCase();
  const displayName = formData.fullName || user?.name || 'Not added';
  const displayEmail = formData.email || user?.email || 'Not added';
  const displayPhone = formData.phone || user?.phone || 'Not added';
  const displayUniversity = formData.university || user?.university || 'Not added';
  const displayDepartment = formData.department || user?.department || 'Not added';
  const displaySemester = formData.semester || user?.semester || 'Not added';
  const displayLocation = formData.location || user?.location || 'Not added';

  return (
    <WorkspaceLayout title="Profile">
      
      {/* Success Toast */}
      <div 
        className={`fixed bottom-6 right-6 z-50 bg-[#0F172A] dark:bg-[#1E293B] text-white px-5 py-3 rounded-xl shadow-xl border border-transparent dark:border-[#334155] flex items-center gap-2.5 text-xs sm:text-sm font-semibold transition-all duration-200 ${
          showToast ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 pointer-events-none'
        }`}
      >
        <Check className="w-4 h-4 text-emerald-400" />
        <span>Profile changes saved successfully</span>
      </div>

      <div className="space-y-6">
        
        {/* ================================================== */}
        {/* 1. HERO PROFILE CARD (Full Width)                  */}
        {/* ================================================== */}
        <div className="bg-white dark:bg-[#0F172A] rounded-[20px] border border-[#E5E7EB] dark:border-[#334155] p-5 sm:px-6 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-all">
          <div className="flex items-center gap-4 min-w-0">
            {/* Avatar (64px) with dynamic initial */}
            <div className="relative shrink-0">
              <div className="w-16 h-16 rounded-full bg-[#2563EB] text-white text-2xl font-extrabold flex items-center justify-center shadow-xs select-none">
                {userInitial}
              </div>
              <button 
                type="button"
                onClick={() => setIsEditing(true)}
                className="w-5 h-5 rounded-full bg-white dark:bg-[#1E293B] border border-[#E5E7EB] dark:border-[#334155] text-[#64748B] dark:text-[#94A3B8] hover:text-[#2563EB] dark:hover:text-[#38BDF8] flex items-center justify-center shadow-xs absolute -bottom-0.5 -right-0.5 transition-all cursor-pointer"
                title="Change Avatar"
              >
                <Camera className="w-3 h-3" />
              </button>
            </div>

            {/* Name, Subtitle, and University Badge */}
            <div className="min-w-0 flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
              <div>
                <h2 className="text-lg sm:text-xl font-extrabold text-[#0F172A] dark:text-[#F8FAFC] tracking-tight truncate leading-tight">
                  {displayName}
                </h2>
                <p className="text-xs text-[#64748B] dark:text-[#94A3B8] truncate mt-0.5">
                  {displayEmail}
                </p>
              </div>
              
              {/* University Badge */}
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-slate-100 dark:bg-[#1E293B] text-slate-700 dark:text-[#94A3B8] border border-slate-200 dark:border-[#334155] shrink-0 self-start sm:self-center">
                <GraduationCap className="w-3.5 h-3.5 text-[#2563EB]" />
                <span>{displayUniversity}</span>
              </span>
            </div>
          </div>

          {/* Action Button Aligned Right */}
          <div className="flex items-center gap-2.5 shrink-0 self-end sm:self-auto">
            {isEditing ? (
              <>
                <button
                  type="button"
                  onClick={handleCancel}
                  className="px-4 py-2 rounded-[14px] border border-[#E5E7EB] dark:border-[#334155] text-xs font-semibold text-[#64748B] dark:text-[#94A3B8] hover:text-[#0F172A] dark:hover:text-[#F8FAFC] hover:bg-slate-50 dark:hover:bg-[#1E293B] transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSave}
                  className="px-4 py-2 rounded-[14px] bg-[#2563EB] hover:bg-blue-700 text-white text-xs font-semibold shadow-xs transition-all cursor-pointer"
                >
                  Save Changes
                </button>
              </>
            ) : (
              <button
                type="button"
                onClick={() => setIsEditing(true)}
                className="px-5 py-2.5 rounded-[14px] bg-[#2563EB] hover:bg-blue-700 text-white text-xs sm:text-sm font-semibold shadow-xs transition-all cursor-pointer"
              >
                Edit Profile
              </button>
            )}
          </div>
        </div>

        {/* ================================================== */}
        {/* 2. STATISTICS ROW (3 Cards, 88px Height)           */}
        {/* ================================================== */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Completed Interviews */}
          <div className="h-[88px] p-5 rounded-[20px] border border-[#E5E7EB] dark:border-[#334155] bg-white dark:bg-[#111827] shadow-2xs flex items-center justify-between transition-all hover:border-[#2563EB]/40">
            <div>
              <span className="text-xs font-semibold text-[#64748B] dark:text-[#94A3B8] block mb-1">
                Completed Interviews
              </span>
              <span className="text-2xl font-extrabold text-[#0F172A] dark:text-[#F8FAFC] leading-none">
                12
              </span>
            </div>
            <div className="w-11 h-11 rounded-xl bg-blue-50 dark:bg-blue-950/70 border border-blue-100 dark:border-blue-900/40 text-[#2563EB] dark:text-[#38BDF8] flex items-center justify-center shrink-0 shadow-2xs">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </div>

          {/* Average Score */}
          <div className="h-[88px] p-5 rounded-[20px] border border-[#E5E7EB] dark:border-[#334155] bg-white dark:bg-[#111827] shadow-2xs flex items-center justify-between transition-all hover:border-purple-500/40">
            <div>
              <span className="text-xs font-semibold text-[#64748B] dark:text-[#94A3B8] block mb-1">
                Average Score
              </span>
              <span className="text-2xl font-extrabold text-[#0F172A] dark:text-[#F8FAFC] leading-none">
                82%
              </span>
            </div>
            <div className="w-11 h-11 rounded-xl bg-purple-50 dark:bg-purple-950/70 border border-purple-100 dark:border-purple-900/40 text-[#7C3AED] dark:text-[#A78BFA] flex items-center justify-center shrink-0 shadow-2xs">
              <Award className="w-5 h-5" />
            </div>
          </div>

          {/* ATS Score */}
          <div className="h-[88px] p-5 rounded-[20px] border border-[#E5E7EB] dark:border-[#334155] bg-white dark:bg-[#111827] shadow-2xs flex items-center justify-between transition-all hover:border-emerald-500/40 sm:col-span-2 lg:col-span-1">
            <div>
              <span className="text-xs font-semibold text-[#64748B] dark:text-[#94A3B8] block mb-1">
                ATS Score
              </span>
              <span className="text-2xl font-extrabold text-[#0F172A] dark:text-[#F8FAFC] leading-none">
                78%
              </span>
            </div>
            <div className="w-11 h-11 rounded-xl bg-emerald-50 dark:bg-emerald-950/70 border border-emerald-100 dark:border-emerald-900/40 text-[#16A34A] dark:text-[#34D399] flex items-center justify-center shrink-0 shadow-2xs">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
        </div>

        {/* ================================================== */}
        {/* 3. TWO-COLUMN INFORMATION SECTION                  */}
        {/* ================================================== */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* Left Card: Personal Info (6 Cols) */}
          <div className="lg:col-span-6 col-span-12 bg-white dark:bg-[#0F172A] rounded-[20px] border border-[#E5E7EB] dark:border-[#334155] p-6 shadow-2xs flex flex-col justify-between transition-all">
            <div>
              <div className="flex items-center gap-2 pb-4 border-b border-[#E5E7EB] dark:border-[#334155] mb-4">
                <User className="w-4 h-4 text-[#2563EB]" />
                <h3 className="text-sm font-bold uppercase tracking-wider text-[#0F172A] dark:text-[#F8FAFC]">
                  Personal Info
                </h3>
              </div>

              <div className="space-y-3.5">
                {/* Full Name */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 py-1 border-b border-slate-100 dark:border-slate-800/60 pb-3">
                  <span className="text-xs font-semibold text-[#64748B] dark:text-[#94A3B8]">Full Name</span>
                  {isEditing ? (
                    <input
                      type="text"
                      name="fullName"
                      value={formData.fullName}
                      onChange={handleInputChange}
                      placeholder="Enter full name"
                      className="h-10 px-3.5 rounded-xl border border-[#2563EB] bg-white dark:bg-[#1E293B] text-sm text-[#0F172A] dark:text-[#F8FAFC] outline-hidden sm:w-60"
                    />
                  ) : (
                    <span className="text-sm font-semibold text-[#0F172A] dark:text-[#F8FAFC]">{displayName}</span>
                  )}
                </div>

                {/* Email */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 py-1 border-b border-slate-100 dark:border-slate-800/60 pb-3">
                  <span className="text-xs font-semibold text-[#64748B] dark:text-[#94A3B8]">Email Address</span>
                  {isEditing ? (
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      placeholder="Enter email"
                      className="h-10 px-3.5 rounded-xl border border-[#2563EB] bg-white dark:bg-[#1E293B] text-sm text-[#0F172A] dark:text-[#F8FAFC] outline-hidden sm:w-60"
                    />
                  ) : (
                    <span className="text-sm font-semibold text-[#0F172A] dark:text-[#F8FAFC]">{displayEmail}</span>
                  )}
                </div>

                {/* Phone */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 py-1 border-b border-slate-100 dark:border-slate-800/60 pb-3">
                  <span className="text-xs font-semibold text-[#64748B] dark:text-[#94A3B8]">Phone Number</span>
                  {isEditing ? (
                    <input
                      type="text"
                      name="phone"
                      value={formData.phone}
                      onChange={handleInputChange}
                      placeholder="e.g. +91 9876543210"
                      className="h-10 px-3.5 rounded-xl border border-[#2563EB] bg-white dark:bg-[#1E293B] text-sm text-[#0F172A] dark:text-[#F8FAFC] outline-hidden sm:w-60"
                    />
                  ) : (
                    <span className="text-sm font-semibold text-[#0F172A] dark:text-[#F8FAFC]">{displayPhone}</span>
                  )}
                </div>

                {/* Location */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 py-1">
                  <span className="text-xs font-semibold text-[#64748B] dark:text-[#94A3B8]">Location</span>
                  {isEditing ? (
                    <input
                      type="text"
                      name="location"
                      value={formData.location}
                      onChange={handleInputChange}
                      placeholder="e.g. Ahmedabad, Gujarat"
                      className="h-10 px-3.5 rounded-xl border border-[#2563EB] bg-white dark:bg-[#1E293B] text-sm text-[#0F172A] dark:text-[#F8FAFC] outline-hidden sm:w-60"
                    />
                  ) : (
                    <span className="text-sm font-semibold text-[#0F172A] dark:text-[#F8FAFC]">{displayLocation}</span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Right Card: Academic Info (6 Cols) */}
          <div className="lg:col-span-6 col-span-12 bg-white dark:bg-[#0F172A] rounded-[20px] border border-[#E5E7EB] dark:border-[#334155] p-6 shadow-2xs flex flex-col justify-between transition-all">
            <div>
              <div className="flex items-center gap-2 pb-4 border-b border-[#E5E7EB] dark:border-[#334155] mb-4">
                <GraduationCap className="w-4 h-4 text-[#2563EB]" />
                <h3 className="text-sm font-bold uppercase tracking-wider text-[#0F172A] dark:text-[#F8FAFC]">
                  Academic Info
                </h3>
              </div>

              <div className="space-y-3.5">
                {/* University */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 py-1 border-b border-slate-100 dark:border-slate-800/60 pb-3">
                  <span className="text-xs font-semibold text-[#64748B] dark:text-[#94A3B8]">University</span>
                  {isEditing ? (
                    <input
                      type="text"
                      name="university"
                      value={formData.university}
                      onChange={handleInputChange}
                      placeholder="e.g. DAU"
                      className="h-10 px-3.5 rounded-xl border border-[#2563EB] bg-white dark:bg-[#1E293B] text-sm text-[#0F172A] dark:text-[#F8FAFC] outline-hidden sm:w-60"
                    />
                  ) : (
                    <span className="text-sm font-semibold text-[#0F172A] dark:text-[#F8FAFC]">{displayUniversity}</span>
                  )}
                </div>

                {/* Department */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 py-1 border-b border-slate-100 dark:border-slate-800/60 pb-3">
                  <span className="text-xs font-semibold text-[#64748B] dark:text-[#94A3B8]">Department</span>
                  {isEditing ? (
                    <input
                      type="text"
                      name="department"
                      value={formData.department}
                      onChange={handleInputChange}
                      placeholder="e.g. IMCA / Computer Science"
                      className="h-10 px-3.5 rounded-xl border border-[#2563EB] bg-white dark:bg-[#1E293B] text-sm text-[#0F172A] dark:text-[#F8FAFC] outline-hidden sm:w-60"
                    />
                  ) : (
                    <span className="text-sm font-semibold text-[#0F172A] dark:text-[#F8FAFC]">{displayDepartment}</span>
                  )}
                </div>

                {/* Semester */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 py-1 border-b border-slate-100 dark:border-slate-800/60 pb-3">
                  <span className="text-xs font-semibold text-[#64748B] dark:text-[#94A3B8]">Semester</span>
                  {isEditing ? (
                    <input
                      type="text"
                      name="semester"
                      value={formData.semester}
                      onChange={handleInputChange}
                      placeholder="e.g. 5th Semester"
                      className="h-10 px-3.5 rounded-xl border border-[#2563EB] bg-white dark:bg-[#1E293B] text-sm text-[#0F172A] dark:text-[#F8FAFC] outline-hidden sm:w-60"
                    />
                  ) : (
                    <span className="text-sm font-semibold text-[#0F172A] dark:text-[#F8FAFC]">{displaySemester}</span>
                  )}
                </div>

                {/* Experience */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 py-1">
                  <span className="text-xs font-semibold text-[#64748B] dark:text-[#94A3B8]">Experience Level</span>
                  {isEditing ? (
                    <input
                      type="text"
                      name="experience"
                      value={formData.experience}
                      onChange={handleInputChange}
                      placeholder="e.g. Fresher / 1-2 Years"
                      className="h-10 px-3.5 rounded-xl border border-[#2563EB] bg-white dark:bg-[#1E293B] text-sm text-[#0F172A] dark:text-[#F8FAFC] outline-hidden sm:w-60"
                    />
                  ) : (
                    <span className="text-sm font-semibold text-[#0F172A] dark:text-[#F8FAFC]">{formData.experience || 'Not added'}</span>
                  )}
                </div>
              </div>
            </div>
          </div>

        </div>

        {/* ================================================== */}
        {/* 4. RESUME CARD                                     */}
        {/* ================================================== */}
        <div className="bg-white dark:bg-[#0F172A] rounded-[20px] border border-[#E5E7EB] dark:border-[#334155] p-5 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-all">
          <div className="flex items-center gap-3.5 min-w-0">
            <div className="w-11 h-11 rounded-full bg-rose-50 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400 border border-rose-100 dark:border-rose-900/40 flex items-center justify-center shrink-0 shadow-2xs">
              <FileText className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-bold text-sm sm:text-base text-[#0F172A] dark:text-[#F8FAFC] truncate">
                  {user?.name ? `${user.name.replace(/\s+/g, '_')}_Resume.pdf` : 'Candidate_Resume.pdf'}
                </span>
                <span className="hidden sm:inline-flex px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/40 uppercase tracking-wider">
                  Parsed
                </span>
              </div>
              <p className="text-xs text-[#64748B] dark:text-[#94A3B8] mt-0.5">
                Uploaded on Oct 12, 2026 • ATS Score: 78%
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 shrink-0 self-end sm:self-auto w-full sm:w-auto">
            <Link
              to="/resume-ats"
              className="flex-1 sm:flex-initial px-4 py-2 rounded-[14px] border border-[#E5E7EB] dark:border-[#334155] bg-transparent text-xs sm:text-sm font-semibold text-[#0F172A] dark:text-[#F8FAFC] hover:bg-slate-50 dark:hover:bg-[#1E293B] transition-colors text-center inline-flex items-center justify-center gap-1.5"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>View Resume</span>
            </Link>
            <Link
              to="/resume-ats"
              className="flex-1 sm:flex-initial px-4 py-2 rounded-[14px] bg-[#2563EB] hover:bg-blue-700 text-white text-xs sm:text-sm font-semibold shadow-2xs transition-colors text-center inline-flex items-center justify-center gap-1.5"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Replace Resume</span>
            </Link>
          </div>
        </div>

      </div>

    </WorkspaceLayout>
  );
}
