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

export default function CustomizeInterviewPage() {
  const navigate = useNavigate();
  const location = useLocation();

  const targetRole = location.state?.role || localStorage.getItem('prepnova_role') || 'Frontend Developer';

  // Section 1: Types
  const [types, setTypes] = useState({
    technical: true,
    systemDesign: false,
    behavioral: false,
    scenarios: true
  });

  // Section 2: Difficulty
  const [difficulty, setDifficulty] = useState('intermediate');

  // Section 3: Question Count
  const [questionCount, setQuestionCount] = useState(6);

  // Section 4: Mode
  const [interviewMode, setInterviewMode] = useState('Text');

  // Section 5: Selected Skills
  const availableSkills = useMemo(() => [
    'JavaScript (ES6+)', 'React.js', 'Node.js', 'TypeScript', 'REST APIs', 
    'System Architecture', 'SQL & Databases', 'Testing / Jest', 'Git & CI/CD', 
    'State Management', 'Docker / Containers', 'Performance & Caching'
  ], []);

  const [selectedSkills, setSelectedSkills] = useState(['React.js', 'JavaScript (ES6+)', 'REST APIs']);

  const toggleSkill = (skill) => {
    if (selectedSkills.includes(skill)) {
      setSelectedSkills(selectedSkills.filter(s => s !== skill));
    } else {
      setSelectedSkills([...selectedSkills, skill]);
    }
  };

  const handleContinue = () => {
    localStorage.setItem('prepnova_difficulty', difficulty);
    localStorage.setItem('prepnova_question_count', String(questionCount));
    localStorage.setItem('prepnova_mode', interviewMode);

    navigate('/review', {
      state: {
        role: targetRole,
        difficulty,
        questionCount,
        interviewMode,
        selectedSkills,
        types
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
            <span>Role & Discipline</span>
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
              <span>Target: {targetRole}</span>
            </div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">
              Session Configuration
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
              Adjust difficulty tiers, question volume, and focus technical competencies.
            </p>
          </div>

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
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                Question Count
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[3, 6, 10].map((count) => (
                  <button
                    key={count}
                    type="button"
                    onClick={() => setQuestionCount(count)}
                    className={`py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                      questionCount === count
                        ? 'border-indigo-600 bg-indigo-600 text-white shadow-xs'
                        : 'border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
                    }`}
                  >
                    {count} Questions
                  </button>
                ))}
              </div>
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
              to="/role-job"
              className="btn-secondary text-xs"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back: Role</span>
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
