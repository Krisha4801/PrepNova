import React, { useState, useRef } from 'react';
import { 
  Briefcase, 
  Building2, 
  Layers, 
  UploadCloud, 
  FileText, 
  Check, 
  ArrowRight, 
  Sparkles, 
  AlertCircle, 
  CheckCircle2, 
  X, 
  ChevronRight,
  Target
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import WorkspaceLayout from '../components/layout/WorkspaceLayout';
import { useAuth } from '../context/AuthContext';

export default function RoleJobPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const fileInputRef = useRef(null);

  const [activeTab, setActiveTab] = useState('select-role'); // 'select-role' | 'upload-jd'

  // Form State
  const [selectedRole, setSelectedRole] = useState(user?.targetRole || 'Frontend Developer');
  const [industry, setIndustry] = useState('Technology');
  const [experienceLevel, setExperienceLevel] = useState('Mid-Level (3–5 years)');
  const [jobDescription, setJobDescription] = useState('');
  const [jdFile, setJdFile] = useState(null);
  const [error, setError] = useState(null);

  // Popular Roles Chips
  const popularRoles = [
    'Software Engineer',
    'Frontend Developer',
    'Backend Developer',
    'Full Stack Engineer',
    'DevOps Engineer',
    'Data Engineer',
    'Product Manager',
    'QA Engineer'
  ];

  const allRoles = [
    'Frontend Developer',
    'Backend Developer',
    'Full Stack Engineer',
    'Software Engineer',
    'React Developer',
    'Node.js Developer',
    'Python Developer',
    'Java Developer',
    'DevOps Engineer',
    'Cloud Architect',
    'Data Analyst',
    'Data Engineer',
    'Machine Learning Engineer',
    'Product Manager',
    'QA Automation Engineer',
    'Engineering Manager',
    'HR & Behavioral'
  ];

  const industries = [
    'Technology & SaaS',
    'Fintech & Banking',
    'Healthcare & Biotech',
    'E-Commerce & Retail',
    'Enterprise Software',
    'Consulting Services'
  ];

  const experienceLevels = [
    'Fresher / Entry (0–1 years)',
    'Junior (1–3 years)',
    'Mid-Level (3–5 years)',
    'Senior (5+ years)',
    'Lead / Staff (8+ years)'
  ];

  const handleContinue = (e) => {
    e.preventDefault();
    setError(null);

    if (!selectedRole.trim()) {
      setError('Please select or specify a target role.');
      return;
    }

    // Persist configuration
    localStorage.setItem('prepnova_role', selectedRole.trim());
    localStorage.setItem('prepnova_industry', industry);
    localStorage.setItem('prepnova_experience', experienceLevel);
    if (jobDescription.trim()) {
      localStorage.setItem('prepnova_jd_text', jobDescription.trim());
    }

    navigate('/customize', {
      state: {
        role: selectedRole.trim(),
        industry,
        experienceLevel,
        jobDescription: jobDescription.trim() || undefined
      }
    });
  };

  return (
    <WorkspaceLayout title="Configure Interview">
      <div className="max-w-3xl mx-auto space-y-7">
        
        {/* Step Progression Bar */}
        <div className="flex items-center justify-between px-2 text-xs font-semibold text-slate-400">
          <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400">
            <span className="w-5 h-5 rounded-full bg-indigo-600 text-white flex items-center justify-center text-[11px]">1</span>
            <span>Role & Discipline</span>
          </div>
          <ChevronRight className="w-4 h-4 text-slate-300 dark:text-slate-700" />
          <div className="flex items-center gap-2 text-slate-400">
            <span className="w-5 h-5 rounded-full bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400 flex items-center justify-center text-[11px]">2</span>
            <span>Interview Parameters</span>
          </div>
          <ChevronRight className="w-4 h-4 text-slate-300 dark:text-slate-700" />
          <div className="flex items-center gap-2 text-slate-400">
            <span className="w-5 h-5 rounded-full bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400 flex items-center justify-center text-[11px]">3</span>
            <span>Review & Launch</span>
          </div>
        </div>

        {/* Main Card */}
        <div className="panel-card space-y-6">
          <div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">
              Select Your Target Role
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
              Choose the technical domain or role you want to practice for today.
            </p>
          </div>

          {error && (
            <div className="p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 text-rose-700 dark:text-rose-300 rounded-xl text-xs font-medium flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Quick Select Role Chips */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
              Popular Disciplines
            </label>
            <div className="flex flex-wrap gap-2">
              {popularRoles.map((roleItem) => {
                const isSelected = selectedRole.toLowerCase() === roleItem.toLowerCase();
                return (
                  <button
                    key={roleItem}
                    type="button"
                    onClick={() => setSelectedRole(roleItem)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-indigo-600 text-white shadow-xs'
                        : 'bg-slate-100 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                    }`}
                  >
                    {roleItem}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Dropdown / Custom Role Input */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                Target Role
              </label>
              <select
                value={selectedRole}
                onChange={(e) => setSelectedRole(e.target.value)}
                className="input-field cursor-pointer"
              >
                {allRoles.map((r) => (
                  <option key={r} value={r}>{r}</option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                Experience Tier
              </label>
              <select
                value={experienceLevel}
                onChange={(e) => setExperienceLevel(e.target.value)}
                className="input-field cursor-pointer"
              >
                {experienceLevels.map((lvl) => (
                  <option key={lvl} value={lvl}>{lvl}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
              Industry Vertical
            </label>
            <select
              value={industry}
              onChange={(e) => setIndustry(e.target.value)}
              className="input-field cursor-pointer"
            >
              {industries.map((ind) => (
                <option key={ind} value={ind}>{ind}</option>
              ))}
            </select>
          </div>

          {/* Optional Job Description Paste */}
          <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                Job Description <span className="text-slate-400 lowercase font-normal">(optional)</span>
              </label>
              <span className="text-[11px] text-slate-400">
                {jobDescription.length} characters
              </span>
            </div>
            <textarea
              rows={4}
              value={jobDescription}
              onChange={(e) => setJobDescription(e.target.value)}
              placeholder="Paste specific job requirements or tech stack bullets to tailor questions..."
              className="input-field resize-none leading-relaxed"
            />
          </div>

          {/* Action Row */}
          <div className="flex items-center justify-between pt-4 border-t border-slate-100 dark:border-slate-800">
            <Link
              to="/dashboard"
              className="btn-secondary text-xs"
            >
              Cancel
            </Link>

            <button
              type="button"
              onClick={handleContinue}
              className="btn-primary"
            >
              <span>Next: Customize Parameters</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>

      </div>
    </WorkspaceLayout>
  );
}
