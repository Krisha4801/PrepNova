import React, { useState, useMemo } from 'react';
import { 
  Code2, 
  Users, 
  Layers, 
  Cpu, 
  ArrowLeft, 
  ArrowRight, 
  ChevronRight, 
  Check, 
  Sparkles, 
  Sliders, 
  Clock,
  Mic,
  FileText
} from 'lucide-react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import WorkspaceLayout from '../components/layout/WorkspaceLayout';
import SectionSelector from '../components/interview/setup/SectionSelector';
import { INTERVIEW_SECTIONS_LIBRARY } from '../constants/sections';
import { getRecommendedSections } from '../lib/sectionRecommender';

export default function CustomizeInterviewPage() {
  const navigate = useNavigate();
  const location = useLocation();

  const mode = location.state?.mode || localStorage.getItem('prepnova_session_mode') || 'role';
  const roleRequiredModes = ['role', 'resume_role', 'role_jd', 'resume_jd_role'];
  const isRoleMode = roleRequiredModes.includes(mode);
  const targetRole = isRoleMode ? (location.state?.role || localStorage.getItem('prepnova_role') || '') : '';
  const resumeId = location.state?.resumeId || localStorage.getItem('prepnova_resume_id') || '';
  const jdId = location.state?.jdId || localStorage.getItem('prepnova_jd_id') || '';

  // Practice Mode: Complete Interview vs Selected Sections
  const [practiceMode, setPracticeMode] = useState(() => {
    return location.state?.practiceMode || localStorage.getItem('prepnova_practice_mode') || 'complete';
  });

  // Section Selection State (for Selected Sections practice mode)
  const [selectedSections, setSelectedSections] = useState(() => {
    try {
      const saved = location.state?.selectedSections || localStorage.getItem('prepnova_selected_sections');
      if (saved) return typeof saved === 'string' ? JSON.parse(saved) : saved;
    } catch (e) { /* ignore */ }
    return [];
  });
  const [sectionError, setSectionError] = useState('');

  // Section 1: Types
  const [types, setTypes] = useState({
    technical: true,
    systemDesign: false,
    behavioral: false,
    scenarios: true
  });

  // Section 2: Difficulty
  const [difficulty, setDifficulty] = useState('intermediate');

  // Section 3: Question Count Mode (per applicable section)
  const [questionCount, setQuestionCount] = useState(() => {
    return localStorage.getItem('prepnova_question_count') || '6';
  });

  // Section 4: Mode
  const [interviewMode, setInterviewMode] = useState('Text');

  // Section 5: Dynamically derived skills from uploaded Resume and JD
  const availableSkills = useMemo(() => {
    const list = new Set();

    // 1. Extract from Resume (if present in state or localStorage)
    try {
      const resumeRaw = location.state?.resumeDoc || localStorage.getItem('prepnova_resume_doc');
      const resumeObj = typeof resumeRaw === 'string' ? JSON.parse(resumeRaw) : resumeRaw;
      const skillsObj = resumeObj?.parsedData?.skills || resumeObj?.skills;
      if (skillsObj) {
        if (Array.isArray(skillsObj)) {
          skillsObj.forEach(s => list.add(String(s)));
        } else if (typeof skillsObj === 'object') {
          Object.values(skillsObj).forEach(val => {
            if (Array.isArray(val)) val.forEach(s => list.add(String(s)));
            else if (typeof val === 'string') list.add(val);
          });
        }
      }
    } catch (e) { /* ignore */ }

    // 2. Extract from Job Description (if present)
    try {
      const jdRaw = location.state?.jdDoc || localStorage.getItem('prepnova_jd_doc');
      const jdObj = typeof jdRaw === 'string' ? JSON.parse(jdRaw) : jdRaw;
      const jdSkills = jdObj?.parsedData?.required_skills || jdObj?.parsedData?.skills;
      if (Array.isArray(jdSkills)) {
        jdSkills.forEach(s => list.add(String(s)));
      }
    } catch (e) { /* ignore */ }

    if (list.size > 0) {
      return Array.from(list).slice(0, 16);
    }

    // 3. Fallback skills tailored to selected role domain (instead of generic web dev)
    const roleLower = String(targetRole || '').toLowerCase();
    if (roleLower.includes('python') || roleLower.includes('data') || roleLower.includes('ai') || roleLower.includes('ml')) {
      return ['Python', 'SQL & Databases', 'Pandas & NumPy', 'Machine Learning', 'Data Pipelines', 'FastAPI', 'Docker', 'Statistical Analysis'];
    }
    if (roleLower.includes('backend') || roleLower.includes('cloud') || roleLower.includes('devops')) {
      return ['System Architecture', 'Node.js / Express', 'Microservices', 'REST & gRPC APIs', 'Docker & Kubernetes', 'PostgreSQL / SQL', 'Redis & Caching', 'CI/CD Pipelines'];
    }
    if (roleLower.includes('qa') || roleLower.includes('test')) {
      return ['Automated Testing', 'Jest / Cypress', 'API Testing', 'Performance Benchmarking', 'Test-Driven Development (TDD)', 'Bug Tracking & Lifecycle'];
    }
    if (roleLower.includes('product') || roleLower.includes('manager')) {
      return ['Product Strategy', 'Roadmapping', 'Agile & Scrum', 'User Story Mapping', 'Data-Driven Decision Making', 'Cross-Functional Leadership'];
    }
    return [
      'JavaScript (ES6+)', 'React.js', 'TypeScript', 'Node.js', 'REST APIs', 
      'System Architecture', 'SQL & Databases', 'Testing / Jest', 'Git & CI/CD', 
      'State Management', 'Docker / Containers', 'Performance & Caching'
    ];
  }, [targetRole, location.state]);

  const [selectedSkills, setSelectedSkills] = useState(() => {
    return availableSkills.slice(0, Math.min(4, availableSkills.length));
  });

  const toggleSkill = (skill) => {
    if (selectedSkills.includes(skill)) {
      setSelectedSkills(selectedSkills.filter(s => s !== skill));
    } else {
      setSelectedSkills([...selectedSkills, skill]);
    }
  };

  const handleToggleSection = (section) => {
    const secId = typeof section === 'string' ? section : section.id;
    const exists = selectedSections.some((s) => (typeof s === 'string' ? s : s.id) === secId);
    if (exists) {
      setSelectedSections(selectedSections.filter((s) => (typeof s === 'string' ? s : s.id) !== secId));
    } else {
      setSelectedSections([...selectedSections, section]);
    }
    if (sectionError) setSectionError('');
  };

  const handleRemoveSection = (sectionId) => {
    setSelectedSections(selectedSections.filter((s) => (typeof s === 'string' ? s : s.id) !== sectionId));
  };

  const handleAddCustomSection = (customSection) => {
    setSelectedSections([...selectedSections, customSection]);
    if (sectionError) setSectionError('');
  };

  const handleSelectAll = () => {
    setSelectedSections([...INTERVIEW_SECTIONS_LIBRARY]);
    if (sectionError) setSectionError('');
  };

  const handleClearAll = () => {
    setSelectedSections([]);
  };

  // Intelligent Section Recommendations based on Role, Resume, and JD
  const recommendations = useMemo(() => {
    let resumeDoc = null;
    let jdDoc = null;
    try {
      const rRaw = location.state?.resumeDoc || localStorage.getItem('prepnova_resume_doc');
      if (rRaw) resumeDoc = typeof rRaw === 'string' ? JSON.parse(rRaw) : rRaw;
    } catch (_) {}
    try {
      const jRaw = location.state?.jdDoc || localStorage.getItem('prepnova_jd_doc');
      if (jRaw) jdDoc = typeof jRaw === 'string' ? JSON.parse(jRaw) : jRaw;
    } catch (_) {}

    return getRecommendedSections({
      role: targetRole,
      resumeDoc,
      jdDoc
    });
  }, [targetRole, location.state]);

  const handleApplyRecommended = () => {
    if (!recommendations?.recommendedSections?.length) return;
    const currentCustom = selectedSections.filter((s) => s.isCustom);
    const combined = [...recommendations.recommendedSections, ...currentCustom];
    const uniqueMap = new Map();
    combined.forEach((s) => uniqueMap.set(s.id, s));
    setSelectedSections(Array.from(uniqueMap.values()));
    if (sectionError) setSectionError('');
  };

  const handleContinue = () => {
    if (practiceMode === 'selected_sections' && (!selectedSections || selectedSections.length === 0)) {
      setSectionError('Please select at least one topic section or add a custom topic to begin.');
      return;
    }

    localStorage.setItem('prepnova_practice_mode', practiceMode);
    localStorage.setItem('prepnova_selected_sections', JSON.stringify(selectedSections));
    localStorage.setItem('prepnova_difficulty', difficulty);
    localStorage.setItem('prepnova_question_count', String(questionCount));
    localStorage.setItem('prepnova_mode', interviewMode);
    localStorage.setItem('prepnova_skills', JSON.stringify(selectedSkills));
    if (isRoleMode && targetRole) {
      localStorage.setItem('prepnova_role', targetRole);
    } else {
      localStorage.removeItem('prepnova_role');
    }

    navigate('/review', {
      state: {
        role: isRoleMode ? targetRole : '',
        difficulty,
        questionCount,
        interviewMode,
        selectedSkills,
        types,
        resumeId,
        jdId,
        practiceMode,
        selectedSections,
        mode
      }
    });
  };

  return (
    <WorkspaceLayout title="Customize Parameters">
      <div className="max-w-3xl mx-auto space-y-7">
        
        {/* Step Progression Bar */}
        <div className="flex items-center justify-between px-2 text-xs font-semibold text-slate-400">
          <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400">
            <span className="w-5 h-5 rounded-full bg-indigo-600 text-white flex items-center justify-center text-[11px]"><Check className="w-3 h-3" /></span>
            <span>Source & Role Setup</span>
          </div>
          <ChevronRight className="w-4 h-4 text-slate-300 dark:text-slate-700" />
          <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400">
            <span className="w-5 h-5 rounded-full bg-indigo-600 text-white flex items-center justify-center text-[11px]">2</span>
            <span>Interview Parameters</span>
          </div>
          <ChevronRight className="w-4 h-4 text-slate-300 dark:text-slate-700" />
          <div className="flex items-center gap-2 text-slate-400">
            <span className="w-5 h-5 rounded-full bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400 flex items-center justify-center text-[11px]">3</span>
            <span>Review & Launch</span>
          </div>
        </div>

        {/* Main Parameters Card */}
        <div className="panel-card space-y-7">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider mb-1">
              {isRoleMode ? (
                <span>Target Role: {targetRole || 'Custom Role'}</span>
              ) : mode === 'resume' ? (
                <span>Context: Resume-Driven Interview</span>
              ) : mode === 'jd' ? (
                <span>Context: Job Description Interview</span>
              ) : mode === 'resume_jd' ? (
                <span>Context: Resume + Job Description Match</span>
              ) : (
                <span>General Practice</span>
              )}
            </div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">
              Session Configuration
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
              Adjust difficulty tiers, question volume, and focus technical competencies.
            </p>
          </div>

          {/* Practice Mode Selection */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                Interview Practice Mode
              </label>
              <span className="text-[11px] font-semibold text-indigo-600 dark:text-indigo-400">
                {practiceMode === 'complete' ? 'Comprehensive Assessment' : 'Section Practice'}
              </span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setPracticeMode('complete')}
                className={`p-4 rounded-xl border text-left transition-all cursor-pointer ${
                  practiceMode === 'complete'
                    ? 'border-indigo-600 bg-indigo-50/50 dark:bg-indigo-950/40 ring-2 ring-indigo-500/20 shadow-xs'
                    : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                      practiceMode === 'complete'
                        ? 'bg-indigo-600 text-white'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                    }`}>
                      <Layers className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="text-sm font-bold text-slate-900 dark:text-white block">Complete Interview</span>
                      <span className="text-[10px] text-indigo-600 dark:text-indigo-400 font-semibold">All-Round Assessment</span>
                    </div>
                  </div>
                  {practiceMode === 'complete' && <Check className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />}
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-2.5 leading-snug">
                  Comprehensive mock interview spanning self-introduction, project deep dive, core technical skills, system design scenarios, and behavioral competencies.
                </p>
              </button>

              <button
                type="button"
                onClick={() => setPracticeMode('selected_sections')}
                className={`p-4 rounded-xl border text-left transition-all cursor-pointer ${
                  practiceMode === 'selected_sections'
                    ? 'border-indigo-600 bg-indigo-50/50 dark:bg-indigo-950/40 ring-2 ring-indigo-500/20 shadow-xs'
                    : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                      practiceMode === 'selected_sections'
                        ? 'bg-indigo-600 text-white'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                    }`}>
                      <Sparkles className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="text-sm font-bold text-slate-900 dark:text-white block">Selected Sections</span>
                      <span className="text-[10px] text-purple-600 dark:text-purple-400 font-semibold">Targeted Topic Focus</span>
                    </div>
                  </div>
                  {practiceMode === 'selected_sections' && <Check className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />}
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-2.5 leading-snug">
                  Target specific technical competencies or custom topics. Questions are generated exclusively from your chosen sections with section-wise analytics.
                </p>
              </button>
            </div>
          </div>

          {/* Section Selection Library (when Selected Sections mode is active) */}
          {practiceMode === 'selected_sections' && (
            <div className="space-y-2">
              <SectionSelector
                selectedSections={selectedSections}
                onToggleSection={handleToggleSection}
                onRemoveSection={handleRemoveSection}
                onAddCustomSection={handleAddCustomSection}
                onSelectAll={handleSelectAll}
                onClearAll={handleClearAll}
                recommendations={recommendations}
                onApplyRecommended={handleApplyRecommended}
              />
              {sectionError && (
                <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 text-xs text-rose-700 dark:text-rose-300 font-medium">
                  {sectionError}
                </div>
              )}
            </div>
          )}

          {/* Difficulty Tier Selection */}
          <div className="space-y-2.5">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
              Difficulty Tier
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {[
                { id: 'beginner', title: 'Beginner', desc: 'Core syntax, fundamental concepts, basic APIs.' },
                { id: 'intermediate', title: 'Intermediate', desc: 'Real-world problem solving, state & lifecycle.' },
                { id: 'advanced', title: 'Advanced', desc: 'Distributed scale, performance optimization & edge cases.' }
              ].map((lvl) => {
                const isSelected = difficulty === lvl.id;
                return (
                  <button
                    key={lvl.id}
                    type="button"
                    onClick={() => setDifficulty(lvl.id)}
                    className={`p-4 rounded-xl border text-left transition-all cursor-pointer ${
                      isSelected
                        ? 'border-indigo-600 bg-indigo-50/50 dark:bg-indigo-950/40 ring-2 ring-indigo-500/20'
                        : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-bold text-slate-900 dark:text-white">{lvl.title}</span>
                      {isSelected && <Check className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />}
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 leading-snug">{lvl.desc}</p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Question Count & Interaction Mode */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                  Questions Per Section
                </label>
                <span className="text-[11px] font-semibold text-indigo-600 dark:text-indigo-400">
                  {String(questionCount).toLowerCase() === 'dynamic' ? 'AI Dynamic' : `${questionCount} / sec`}
                </span>
              </div>
              <div className="grid grid-cols-4 gap-2">
                {[
                  { id: '3', label: '3' },
                  { id: '6', label: '6' },
                  { id: '10', label: '10' },
                  { id: 'dynamic', label: 'Dynamic' }
                ].map((opt) => (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => setQuestionCount(opt.id)}
                    className={`py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                      String(questionCount).toLowerCase() === opt.id
                        ? 'border-indigo-600 bg-indigo-600 text-white shadow-xs'
                        : 'border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-tight">
                {String(questionCount).toLowerCase() === 'dynamic'
                  ? 'AI calibrates primary question depth and count for each section individually.'
                  : `Generates ${questionCount} primary questions for each applicable interview section.`}
              </p>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                Interaction Input
              </label>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { id: 'Text', title: 'Text Editor', icon: FileText },
                  { id: 'Voice', title: 'Voice Dictation', icon: Mic }
                ].map((mode) => {
                  const Icon = mode.icon;
                  const isSelected = interviewMode === mode.id;
                  return (
                    <button
                      key={mode.id}
                      type="button"
                      onClick={() => setInterviewMode(mode.id)}
                      className={`py-2 px-3 rounded-xl text-xs font-bold border flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                        isSelected
                          ? 'border-indigo-600 bg-indigo-600 text-white shadow-xs'
                          : 'border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
                      }`}
                    >
                      <Icon className="w-3.5 h-3.5" />
                      <span>{mode.title}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Competency Focus Chips */}
          <div className="space-y-2.5 pt-2 border-t border-slate-100 dark:border-slate-800">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                Focus Competencies
              </label>
              <span className="text-[11px] text-slate-400">
                {selectedSkills.length} selected
              </span>
            </div>
            <div className="flex flex-wrap gap-2">
              {availableSkills.map((skill) => {
                const isSelected = selectedSkills.includes(skill);
                return (
                  <button
                    key={skill}
                    type="button"
                    onClick={() => toggleSkill(skill)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-medium border transition-all cursor-pointer ${
                      isSelected
                        ? 'border-indigo-600 bg-indigo-50 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300 font-semibold'
                        : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
                    }`}
                  >
                    {isSelected ? '✓ ' : '+ '}{skill}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Action Navigation */}
          <div className="flex items-center justify-between pt-4 border-t border-slate-100 dark:border-slate-800">
            <Link
              to="/start-interview"
              className="btn-secondary text-xs"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back: Setup</span>
            </Link>

            <button
              type="button"
              onClick={handleContinue}
              className="btn-primary"
            >
              <span>Next: Review & Launch</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>

      </div>
    </WorkspaceLayout>
  );
}
