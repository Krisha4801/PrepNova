import React, { useState, useRef, useMemo } from 'react';
import { motion } from 'framer-motion';
import { 
  Users, 
  Code2, 
  FolderGit2,
  Cpu,
  Puzzle,
  Lightbulb,
  ArrowLeft, 
  ArrowRight, 
  Mic, 
  FileText, 
  Search, 
  X, 
  Check,
  Upload,
  Lock,
  ChevronDown
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import WorkspaceLayout from '../components/layout/WorkspaceLayout';

export default function CustomizeInterviewPage() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [isSubmitting, setIsSubmitting] = useState(false);

  // Stored role from Step 1 or fallback
  const targetRole = localStorage.getItem('prepnova_role') || user?.preferredRole || 'Frontend Developer';

  // Resume status from localStorage
  const [uploadedResumeName, setUploadedResumeName] = useState(() => {
    return localStorage.getItem('prepnova_resume_name') || 
      (localStorage.getItem('prepNova_resume') ? 'Verified Resume' : '');
  });
  const resumeFileInputRef = useRef(null);
  const hasResume = Boolean(uploadedResumeName);

  // Section 1: 6 Interview Types (multi-select)
  const [interviewTypes, setInterviewTypes] = useState(() => {
    try {
      const stored = localStorage.getItem('prepnova_interview_types');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed.technical !== undefined || parsed.hr !== undefined || parsed.project !== undefined) {
          return {
            technical: parsed.technical ?? true,
            hr: parsed.hr ?? true,
            project: (parsed.project && hasResume) ? true : false,
            skill: parsed.skill ?? false,
            logic: parsed.logic ?? false,
            scenario: parsed.scenario ?? false
          };
        }
      }
    } catch (e) {
      console.error(e);
    }
    return {
      technical: true,
      hr: false,
      project: false,
      skill: false,
      logic: false,
      scenario: true
    };
  });

  // Section 2: Difficulty ('easy' | 'medium' | 'hard')
  const [difficulty, setDifficulty] = useState('medium');

  // Section 3: Focus Areas / Categorized Skill Library
  const skillCategories = useMemo(() => [
    {
      id: 'frontend',
      name: 'Frontend',
      skills: ['React', 'Next.js', 'JavaScript', 'TypeScript', 'HTML', 'CSS', 'Tailwind', 'Redux', 'Vue', 'Angular']
    },
    {
      id: 'backend',
      name: 'Backend',
      skills: ['Node.js', 'Java', 'Spring Boot', 'Python', 'Express', '.NET', 'C#', 'Go', 'PHP']
    },
    {
      id: 'database',
      name: 'Database',
      skills: ['SQL', 'PostgreSQL', 'MySQL', 'MongoDB', 'Redis', 'Firebase', 'Prisma']
    },
    {
      id: 'cloud_devops',
      name: 'Cloud & DevOps',
      skills: ['AWS', 'Azure', 'Docker', 'Kubernetes', 'CI/CD', 'Git', 'Linux', 'Nginx']
    },
    {
      id: 'data_structures',
      name: 'Data Structures',
      skills: ['DSA', 'Algorithms', 'OOP', 'DBMS', 'OS', 'Networking', 'System Design']
    },
    {
      id: 'ai_data',
      name: 'AI & Data',
      skills: ['Machine Learning', 'GenAI', 'OpenAI API', 'LangChain', 'Vector DB', 'Prompt Engineering']
    },
    {
      id: 'product_mgmt',
      name: 'Product & Management',
      skills: ['Leadership', 'Product Management', 'Project Management', 'Agile', 'Scrum', 'Jira', 'Stakeholder Management', 'Roadmapping']
    },
    {
      id: 'soft_skills',
      name: 'Soft Skills',
      skills: ['Communication', 'Problem Solving', 'Critical Thinking', 'Time Management', 'Teamwork', 'Decision Making', 'Negotiation']
    }
  ], []);

  const [focusAreas, setFocusAreas] = useState(['React', 'DSA', 'SQL']);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [customCategorySkills, setCustomCategorySkills] = useState({});

  const categoryOptions = [
    { id: 'all', label: 'All Categories' },
    { id: 'frontend', label: 'Frontend' },
    { id: 'backend', label: 'Backend' },
    { id: 'database', label: 'Database' },
    { id: 'cloud_devops', label: 'Cloud & DevOps' },
    { id: 'data_structures', label: 'Data Structures' },
    { id: 'ai_data', label: 'AI & Data' },
    { id: 'product_mgmt', label: 'Product & Management' },
    { id: 'soft_skills', label: 'Soft Skills' },
  ];

  const categoryPlaceholders = {
    all: 'Search React, Leadership, AWS...',
    frontend: 'Search frontend skills...',
    backend: 'Search backend skills...',
    database: 'Search database skills...',
    cloud_devops: 'Search cloud & devops skills...',
    data_structures: 'Search data structures skills...',
    ai_data: 'Search AI & data skills...',
    product_mgmt: 'Search product & management skills...',
    soft_skills: 'Search soft skills...'
  };

  const shouldShowCategories = selectedCategory !== 'all' || searchQuery.trim().length >= 2;

  // Category-scoped and query-scoped skill filtering
  const matchingCategories = useMemo(() => {
    if (!shouldShowCategories) return [];
    const q = searchQuery.toLowerCase().trim();

    const pool = (selectedCategory === 'all'
      ? skillCategories
      : skillCategories.filter(cat => cat.id === selectedCategory)
    ).map(cat => {
      const extra = customCategorySkills[cat.id] || [];
      const combined = [...cat.skills];
      extra.forEach(item => {
        if (!combined.includes(item)) combined.push(item);
      });
      return { ...cat, skills: combined };
    });

    if (!q) {
      return pool;
    }

    return pool
      .map(cat => {
        const catNameMatches = cat.name.toLowerCase().includes(q);
        const matchedSkills = catNameMatches 
          ? cat.skills 
          : cat.skills.filter(s => s.toLowerCase().includes(q));

        return {
          ...cat,
          skills: matchedSkills
        };
      })
      .filter(cat => cat.skills.length > 0);
  }, [shouldShowCategories, searchQuery, selectedCategory, skillCategories, customCategorySkills]);

  // Section 4: Response Format ('voice' | 'text') - Voice is default
  const [interviewFormat, setInterviewFormat] = useState('voice');

  // Handle direct resume upload to unlock project interview
  const handleDirectResumeUpload = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setUploadedResumeName(file.name);
      localStorage.setItem('prepnova_resume_name', file.name);
      localStorage.setItem('prepNova_resume', JSON.stringify({
        fileName: file.name,
        atsScore: 82,
        uploadedAt: new Date().toISOString()
      }));
      setInterviewTypes(prev => ({ ...prev, project: true }));
    }
  };

  // Toggle Interview Type (ensure at least 1 remains active)
  const toggleInterviewType = (typeKey) => {
    if (typeKey === 'project' && !hasResume) {
      resumeFileInputRef.current?.click();
      return;
    }

    setInterviewTypes(prev => {
      const activeCount = Object.values(prev).filter(Boolean).length;
      if (prev[typeKey] && activeCount === 1) {
        return prev;
      }
      return { ...prev, [typeKey]: !prev[typeKey] };
    });
  };

  // Toggle Skill Chip
  const toggleChip = (chip) => {
    if (focusAreas.includes(chip)) {
      setFocusAreas(focusAreas.filter(c => c !== chip));
    } else {
      setFocusAreas([...focusAreas, chip]);
    }
  };

  // Add custom skill if searched and not exists
  const handleAddCustomSkill = (e) => {
    if (e.key === 'Enter' && searchQuery.trim()) {
      e.preventDefault();
      const trimmed = searchQuery.trim();
      if (!focusAreas.includes(trimmed)) {
        setFocusAreas(prev => [...prev, trimmed]);
      }
      if (selectedCategory !== 'all') {
        setCustomCategorySkills(prev => ({
          ...prev,
          [selectedCategory]: [...(prev[selectedCategory] || []), trimmed]
        }));
      }
      setSearchQuery('');
    }
  };

  // Active types summary formatted with '+'
  const activeTypesFormatted = useMemo(() => {
    const active = [];
    if (interviewTypes.technical) active.push('Technical');
    if (interviewTypes.scenario) active.push('Scenario');
    if (interviewTypes.hr) active.push('HR');
    if (interviewTypes.project) active.push('Project');
    if (interviewTypes.skill) active.push('Skill');
    if (interviewTypes.logic) active.push('Logic');
    return active.length > 0 ? active.join(' + ') : 'Technical';
  }, [interviewTypes]);

  // Skills formatted with '•'
  const skillsFormatted = useMemo(() => {
    if (focusAreas.length === 0) return 'General';
    return focusAreas.slice(0, 3).join(' • ') + (focusAreas.length > 3 ? ` +${focusAreas.length - 3}` : '');
  }, [focusAreas]);

  // Dynamic question count & estimated time calculation
  const activeTypesCount = useMemo(() => {
    return Object.values(interviewTypes).filter(Boolean).length;
  }, [interviewTypes]);

  const autoQuestionCount = useMemo(() => {
    return Math.min(18, Math.max(10, 8 + activeTypesCount * 2));
  }, [activeTypesCount]);

  const estimatedTimeText = useMemo(() => {
    if (activeTypesCount <= 1) return '18–22 minutes';
    if (activeTypesCount === 2) return '22–28 minutes';
    return '28–35 minutes';
  }, [activeTypesCount]);

  // 6 Interview Cards Configuration (2 cols × 3 rows)
  const interviewCards = [
    {
      id: 'technical',
      title: 'Technical Interview',
      description: 'Coding, DSA, DBMS, OS, Networking & System Design',
      badge: 'Core Technical',
      requiresResume: false,
      icon: Code2,
      circleBg: 'bg-blue-50 dark:bg-blue-950/60 text-[#2563EB] dark:text-[#38BDF8]'
    },
    {
      id: 'hr',
      title: 'HR Interview',
      description: 'Behavioral, strengths, weaknesses & culture fit',
      badge: 'Behavioral',
      requiresResume: false,
      icon: Users,
      circleBg: 'bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400'
    },
    {
      id: 'project',
      title: 'Project-Based Interview',
      description: 'Questions generated from uploaded resume projects',
      badge: hasResume ? 'Resume Verified' : 'Resume Required',
      requiresResume: true,
      icon: FolderGit2,
      circleBg: 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400'
    },
    {
      id: 'skill',
      title: 'Skill-Based Interview',
      description: 'Choose technologies like React, Java, SQL, Node',
      badge: 'Skill Focus',
      requiresResume: false,
      icon: Cpu,
      circleBg: 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400'
    },
    {
      id: 'logic',
      title: 'Logic & Puzzle Round',
      description: 'Aptitude, reasoning, analytical puzzles',
      badge: 'No Resume',
      requiresResume: false,
      icon: Puzzle,
      circleBg: 'bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400'
    },
    {
      id: 'scenario',
      title: 'Scenario-Based Interview',
      description: 'Real workplace situations & decision making',
      badge: 'Situational',
      requiresResume: false,
      icon: Lightbulb,
      circleBg: 'bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400'
    }
  ];

  // Difficulty segmented pill options
  const difficultyOptions = [
    { id: 'easy', label: 'Easy', dotClass: 'bg-emerald-500' },
    { id: 'medium', label: 'Medium', dotClass: 'bg-[#2563EB]' },
    { id: 'hard', label: 'Hard', dotClass: 'bg-rose-500' }
  ];

  // Navigation Handlers
  const handleBack = () => {
    navigate('/start-interview');
  };

  const handleNext = async () => {
    setIsSubmitting(true);

    try {
      localStorage.setItem('prepnova_difficulty', difficulty);
      localStorage.setItem('prepnova_question_count', autoQuestionCount.toString());
      localStorage.setItem('prepnova_format', interviewFormat);
      localStorage.setItem('prepnova_focus_areas', JSON.stringify(focusAreas));
      localStorage.setItem('prepnova_interview_types', JSON.stringify(interviewTypes));
      localStorage.setItem('prepnova_role', targetRole);

      // Route directly based on response format (voice or text)
      const targetRoute = interviewFormat === 'text' ? '/interview/text' : '/interview/voice';
      navigate(targetRoute, {
        state: {
          interviewTypes,
          difficulty,
          focusSkills: focusAreas,
          hasResume,
          targetRole,
          format: interviewFormat,
          questionCount: autoQuestionCount
        }
      });
    } catch (err) {
      console.error('Failed to save customization:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <WorkspaceLayout title="Customize Interview" maxWidth="max-w-[1000px]" contentClassName="!pt-6 !pb-12 !px-6 sm:!px-10 !space-y-0">
      {/* Hidden file input for direct resume upload */}
      <input
        type="file"
        ref={resumeFileInputRef}
        onChange={handleDirectResumeUpload}
        accept=".pdf,.doc,.docx"
        className="hidden"
      />

      <div className="w-full">
        {/* ======================================================== */}
        {/* CONFIGURATION SECTIONS                                   */}
        {/* ======================================================== */}
        <div className="w-full space-y-6">
            
            {/* 1. Interview Rounds Selection Tiles (160px) */}
            <div>
              <div className="mb-4">
                <h2 className="text-[22px] font-semibold text-[#0F172A] dark:text-[#F8FAFC] tracking-tight">
                  Interview Rounds
                </h2>
                <p className="text-[14px] text-[#64748B] dark:text-[#94A3B8] mt-1">
                  Select one or more rounds to evaluate in this interview session.
                </p>
              </div>

              {/* 2 columns × 3 rows selection tiles */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {interviewCards.map((card) => {
                  const isSelected = Boolean(interviewTypes[card.id]);
                  const isLocked = card.requiresResume && !hasResume;
                  const IconComp = card.icon;

                  return (
                    <motion.div
                      key={card.id}
                      whileHover={!isLocked ? { y: -2 } : {}}
                      transition={{ duration: 0.18 }}
                      onClick={() => toggleInterviewType(card.id)}
                      className={`group relative h-[160px] p-5 rounded-[18px] border transition-all duration-180 flex flex-col justify-between cursor-pointer select-none ${
                        isLocked
                          ? 'bg-slate-50/80 dark:bg-[#0D1627]/60 border-dashed border-[#CBD5E1] dark:border-[#334155]'
                          : isSelected
                          ? 'bg-blue-50/[0.35] dark:bg-[#0B1A3A]/40 border-[#2563EB] dark:border-[#3B82F6] shadow-xs'
                          : 'bg-white dark:bg-[#0F172A] border-[#E7ECF3] dark:border-[#1E293B] hover:border-slate-300 dark:hover:border-slate-600 shadow-2xs'
                      }`}
                    >
                      {/* Top Row: Soft colored circle icon + checkmark */}
                      <div className="flex items-center justify-between">
                        <div className={`w-11 h-11 rounded-full flex items-center justify-center shrink-0 transition-transform ${card.circleBg}`}>
                          <IconComp className="w-5 h-5" />
                        </div>

                        {/* Checkmark or Lock */}
                        {isLocked ? (
                          <div className="flex items-center gap-1 text-xs text-[#94A3B8]">
                            <Lock className="w-4 h-4" />
                          </div>
                        ) : (
                          <div className={`w-5 h-5 rounded-full flex items-center justify-center transition-all ${
                            isSelected
                              ? 'bg-[#2563EB] text-white shadow-2xs'
                              : 'border border-slate-300 dark:border-slate-600 opacity-0 group-hover:opacity-70'
                          }`}>
                            <Check className="w-3 h-3 stroke-[3]" />
                          </div>
                        )}
                      </div>

                      {/* Middle: Title & Description */}
                      <div>
                        <h3 className={`text-[18px] font-semibold tracking-tight leading-snug ${
                          isLocked ? 'text-[#64748B] dark:text-[#94A3B8]' : 'text-[#0F172A] dark:text-[#F8FAFC]'
                        }`}>
                          {card.title}
                        </h3>
                        <p className="text-[14px] text-[#64748B] dark:text-[#94A3B8] leading-relaxed line-clamp-2 mt-1">
                          {card.description}
                        </p>
                      </div>

                      {/* Bottom: Pill tag */}
                      <div className="flex items-center justify-between">
                        <span className={`text-[12px] font-medium px-2.5 py-0.5 rounded-full inline-block ${
                          isSelected
                            ? 'bg-blue-100/70 dark:bg-blue-900/40 text-[#2563EB] dark:text-[#38BDF8]'
                            : 'bg-slate-100 dark:bg-[#1E293B] text-[#64748B] dark:text-[#94A3B8]'
                        }`}>
                          {card.badge}
                        </span>

                        {isLocked && (
                          <span className="text-xs text-amber-600 dark:text-amber-400 font-medium underline">
                            Upload resume
                          </span>
                        )}
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </div>

            {/* 2. Difficulty (52px Segmented Control) */}
            <div>
              <div className="mb-3">
                <h2 className="text-[22px] font-semibold text-[#0F172A] dark:text-[#F8FAFC] tracking-tight">
                  Difficulty
                </h2>
              </div>

              <div className="grid grid-cols-3 p-1.5 bg-slate-100/80 dark:bg-[#1E293B]/70 rounded-[16px] border border-[#E7ECF3] dark:border-[#1E293B] h-[52px]">
                {difficultyOptions.map((opt) => {
                  const isSelected = difficulty === opt.id;
                  return (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => setDifficulty(opt.id)}
                      className={`h-full rounded-xl text-[15px] font-medium flex items-center justify-center gap-2 transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-white dark:bg-[#0F172A] text-[#2563EB] dark:text-[#38BDF8] shadow-sm font-semibold'
                          : 'text-[#64748B] dark:text-[#94A3B8] hover:text-[#0F172A] dark:hover:text-[#F8FAFC]'
                      }`}
                    >
                      <span className={`w-2 h-2 rounded-full ${isSelected ? 'bg-[#2563EB]' : opt.dotClass}`} />
                      <span>{opt.label}</span>
                    </button>
                  );
                })}
              </div>

              <p className="text-[14px] text-[#64748B] dark:text-[#94A3B8] mt-2.5">
                Most interviews use Medium difficulty.
              </p>
            </div>

            {/* 3. Focus Skills (Categorized Skill Library) */}
            <div className="space-y-4">
              {/* Section Header */}
              <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2">
                <div>
                  <h2 className="text-[22px] font-semibold text-[#0F172A] dark:text-[#F8FAFC] tracking-tight">
                    Focus Skills
                  </h2>
                  <p className="text-[14px] text-[#64748B] dark:text-[#94A3B8] mt-0.5">
                    Choose the technologies and professional competencies you want the interviewer to evaluate.
                  </p>
                </div>
                <span className="text-[14px] font-medium text-[#64748B] dark:text-[#94A3B8] shrink-0">
                  {focusAreas.length} Selected
                </span>
              </div>

              {/* Single Clean Search Bar with Category Dropdown */}
              <div className="search-container relative flex items-center w-full h-[56px] px-4 rounded-[16px] bg-[#FFFFFF] dark:bg-[#0F172A] border border-[#D1D5DB] dark:border-[#334155] gap-3 transition-all duration-150">
                {/* 1. 🔍 Search icon */}
                <Search className="w-5 h-5 text-[#9CA3AF] shrink-0 pointer-events-none" />

                {/* 2. Category dropdown (All Categories) */}
                <div className="relative w-[150px] shrink-0 h-full flex items-center">
                  <select
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    style={{ border: 'none', outline: 'none', boxShadow: 'none', background: 'transparent' }}
                    className="search-category-select w-full h-full bg-transparent text-[14px] font-medium text-[#0F172A] dark:text-[#F8FAFC] pr-6 appearance-none cursor-pointer focus:outline-none truncate"
                    aria-label="Filter skills by category"
                  >
                    {categoryOptions.map((opt) => (
                      <option key={opt.id} value={opt.id} className="bg-white dark:bg-[#0F172A] text-[#0F172A] dark:text-[#F8FAFC]">
                        {opt.label}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="w-4 h-4 text-[#9CA3AF] absolute right-1 pointer-events-none" />
                </div>

                {/* 3. Thin vertical divider */}
                <div className="h-5 w-[1px] bg-[#E5E7EB] dark:bg-[#334155] shrink-0" />

                {/* 4. Search input (flex-grow) */}
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={handleAddCustomSkill}
                  placeholder={categoryPlaceholders[selectedCategory] || 'Search React, Leadership, AWS...'}
                  style={{ border: 'none', outline: 'none', boxShadow: 'none', background: 'transparent' }}
                  className="search-input flex-1 h-full bg-transparent text-[15px] text-[#0F172A] dark:text-[#F8FAFC] placeholder:text-[#9CA3AF] focus:outline-none min-w-0"
                />

                {/* 5. Right: Clear button (if text) & Small Enter button */}
                <div className="flex items-center gap-2 shrink-0">
                  {searchQuery && (
                    <button
                      type="button"
                      onClick={() => setSearchQuery('')}
                      className="text-[#9CA3AF] hover:text-[#0F172A] dark:hover:text-[#F8FAFC] p-1 cursor-pointer transition-colors"
                      title="Clear search"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => {
                      if (searchQuery.trim()) {
                        const trimmed = searchQuery.trim();
                        if (!focusAreas.includes(trimmed)) {
                          setFocusAreas(prev => [...prev, trimmed]);
                        }
                        if (selectedCategory !== 'all') {
                          setCustomCategorySkills(prev => ({
                            ...prev,
                            [selectedCategory]: [...(prev[selectedCategory] || []), trimmed]
                          }));
                        }
                        setSearchQuery('');
                      }
                    }}
                    className="inline-flex items-center justify-center h-[28px] px-2.5 rounded-lg bg-[#F3F4F6] hover:bg-[#E5E7EB] dark:bg-[#1E293B] dark:hover:bg-[#334155] text-[12px] font-medium text-[#64748B] dark:text-[#94A3B8] transition-colors cursor-pointer select-none tracking-tight shrink-0"
                  >
                    Enter ↵
                  </button>
                </div>
              </div>

              {/* Selected Skills Area (Always visible even when categories are hidden) */}
              {focusAreas.length > 0 && (
                <div className="p-4 rounded-[16px] bg-slate-50/70 dark:bg-[#1E293B]/40 border border-[#E5E7EB] dark:border-[#1E293B] space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[13px] font-semibold text-[#0F172A] dark:text-[#F8FAFC]">
                      Selected Skills ({focusAreas.length})
                    </span>
                    <button
                      type="button"
                      onClick={() => setFocusAreas([])}
                      className="text-[12px] font-medium text-[#64748B] hover:text-rose-600 dark:text-[#94A3B8] dark:hover:text-rose-400 transition-colors cursor-pointer"
                    >
                      Clear all
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {focusAreas.map((skill) => (
                      <span
                        key={skill}
                        className="h-[36px] px-[14px] rounded-full bg-[#2563EB] text-white text-[14px] font-medium inline-flex items-center gap-1.5 shadow-xs select-none"
                      >
                        <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                        <span>{skill}</span>
                        <button
                          type="button"
                          onClick={() => toggleChip(skill)}
                          className="hover:bg-blue-700/80 rounded-full p-0.5 ml-0.5 transition-colors cursor-pointer"
                          aria-label={`Remove ${skill}`}
                        >
                          <X className="w-3.5 h-3.5 stroke-[2.5]" />
                        </button>
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Dynamic Search Results: Rendered when category selected or query typed */}
              {shouldShowCategories && (
                <div className="space-y-4 pt-1">
                  {matchingCategories.map((cat) => {
                    const selectedInCatCount = cat.skills.filter(s => focusAreas.includes(s)).length;

                    return (
                      <div
                        key={cat.id}
                        className="p-4 rounded-[16px] bg-white dark:bg-[#0F172A] border border-[#E5E7EB] dark:border-[#1E293B] shadow-2xs transition-all duration-150 animate-in fade-in slide-in-from-top-1 duration-150"
                      >
                        <div className="flex items-center gap-2.5 mb-3">
                          <span className="text-[15px] font-semibold text-[#0F172A] dark:text-[#F8FAFC]">
                            {cat.name}
                          </span>
                          <span className="text-[12px] font-medium text-[#64748B] dark:text-[#94A3B8] px-2 py-0.5 rounded-full bg-slate-100 dark:bg-[#1E293B]">
                            {cat.skills.length}
                          </span>
                          {selectedInCatCount > 0 && (
                            <span className="text-[11px] font-semibold text-[#2563EB] dark:text-[#38BDF8] px-2 py-0.5 rounded-full bg-blue-50 dark:bg-blue-950/60 border border-blue-100 dark:border-blue-900/50">
                              {selectedInCatCount} selected
                            </span>
                          )}
                        </div>

                        <div className="flex flex-wrap gap-2">
                          {cat.skills.map((chip) => {
                            const isSelected = focusAreas.includes(chip);
                            return (
                              <button
                                key={chip}
                                type="button"
                                onClick={() => toggleChip(chip)}
                                className={`h-[36px] px-[14px] rounded-full text-[14px] font-medium inline-flex items-center gap-1.5 transition-all duration-150 active:scale-[0.98] cursor-pointer ${
                                  isSelected
                                    ? 'bg-[#2563EB] text-white shadow-xs'
                                    : 'bg-white dark:bg-[#0F172A] border border-[#E5E7EB] dark:border-[#1E293B] text-[#0F172A] dark:text-[#CBD5E1] hover:border-slate-300 dark:hover:border-slate-600 hover:shadow-xs'
                                }`}
                              >
                                {isSelected && <Check className="w-3.5 h-3.5 text-white stroke-[2.5]" />}
                                <span>{chip}</span>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}

                  {matchingCategories.length === 0 && (
                    <div className="py-8 px-4 text-center rounded-[16px] border border-dashed border-[#E5E7EB] dark:border-[#1E293B] bg-slate-50/50 dark:bg-[#0B1528]/50 flex flex-col items-center justify-center animate-in fade-in duration-150">
                      <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-[#1E293B] flex items-center justify-center text-[#94A3B8] mb-2.5">
                        <Search className="w-5 h-5" />
                      </div>
                      <p className="text-[15px] font-semibold text-[#0F172A] dark:text-[#F8FAFC]">
                        No matching skills found
                      </p>
                      <p className="text-[13px] text-[#64748B] dark:text-[#94A3B8] mt-1">
                        Press <kbd className="px-1.5 py-0.5 rounded bg-white dark:bg-[#1E293B] border border-[#E2E8F0] dark:border-[#334155] font-sans font-medium text-[#0F172A] dark:text-[#F8FAFC]">Enter ↵</kbd> to create a custom skill "{searchQuery}"
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* 4. Response Format (Compact 44px toggle) */}
            <div>
              <div className="mb-3">
                <h2 className="text-[22px] font-semibold text-[#0F172A] dark:text-[#F8FAFC] tracking-tight">
                  Response Format
                </h2>
              </div>

              <div className="inline-flex p-1 bg-slate-100/80 dark:bg-[#1E293B]/70 rounded-xl border border-[#E7ECF3] dark:border-[#1E293B] h-[44px]">
                <button
                  type="button"
                  onClick={() => setInterviewFormat('voice')}
                  className={`px-5 h-full rounded-lg text-sm font-semibold flex items-center gap-2 transition-all cursor-pointer ${
                    interviewFormat === 'voice'
                      ? 'bg-white dark:bg-[#0F172A] text-[#2563EB] dark:text-[#38BDF8] shadow-sm'
                      : 'text-[#64748B] dark:text-[#94A3B8] hover:text-[#0F172A] dark:hover:text-[#F8FAFC]'
                  }`}
                >
                  <span>🎙 Voice</span>
                </button>

                <button
                  type="button"
                  onClick={() => setInterviewFormat('text')}
                  className={`px-5 h-full rounded-lg text-sm font-semibold flex items-center gap-2 transition-all cursor-pointer ${
                    interviewFormat === 'text'
                      ? 'bg-white dark:bg-[#0F172A] text-[#2563EB] dark:text-[#38BDF8] shadow-sm'
                      : 'text-[#64748B] dark:text-[#94A3B8] hover:text-[#0F172A] dark:hover:text-[#F8FAFC]'
                  }`}
                >
                  <span>💬 Text</span>
                </button>
              </div>
            </div>

          {/* ====================================================== */}
          {/* BOTTOM ACTION BUTTONS                                   */}
          {/* ====================================================== */}
          <div className="pt-6 border-t border-[#E7ECF3] dark:border-[#1E293B] flex items-center justify-between gap-4">
            <button
              type="button"
              onClick={handleBack}
              className="px-6 h-12 rounded-xl text-sm font-semibold text-[#64748B] dark:text-[#94A3B8] hover:text-[#0F172A] dark:hover:text-[#F8FAFC] border border-[#E7ECF3] dark:border-[#1E293B] hover:border-slate-300 dark:hover:border-slate-600 bg-white dark:bg-[#0F172A] transition-colors cursor-pointer"
            >
              Back
            </button>

            <button
              type="button"
              onClick={handleNext}
              disabled={isSubmitting}
              className="px-8 h-12 rounded-xl bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-[15px] font-semibold shadow-xs transition-colors duration-180 flex items-center gap-2 cursor-pointer disabled:opacity-50 active:scale-[0.99]"
            >
              <span>{isSubmitting ? 'Starting...' : 'Start Mock Interview →'}</span>
            </button>
          </div>

        </div>
      </div>
    </WorkspaceLayout>
  );
}


