import React, { useMemo, useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  Play, 
  FileText, 
  Sparkles, 
  ArrowRight, 
  Clock, 
  CheckCircle2, 
  TrendingUp, 
  Layers, 
  Award, 
  BookOpen,
  ChevronRight,
  Plus
} from 'lucide-react';
import WorkspaceLayout from '../components/layout/WorkspaceLayout';
import { useAuth } from '../context/AuthContext';

export default function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  // Greeting name and time of day
  const userName = user?.name ? user.name.split(' ')[0] : 'Candidate';
  const greeting = useMemo(() => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  }, []);

  // Retrieve any stored local mock session or recent attempts
  const [recentSessions, setRecentSessions] = useState([]);
  const [activeRole, setActiveRole] = useState(user?.targetRole || 'Frontend Developer');

  useEffect(() => {
    const storedRole = localStorage.getItem('prepnova_role');
    if (storedRole) setActiveRole(storedRole);

    const storedSessions = localStorage.getItem('prepnova_session_history');
    if (storedSessions) {
      try {
        setRecentSessions(JSON.parse(storedSessions));
      } catch (e) {
        setRecentSessions([]);
      }
    }
  }, []);

  return (
    <WorkspaceLayout title="Dashboard">
      <div className="space-y-7">
        
        {/* ================================================== */}
        {/* 1. HERO WELCOME & QUICK LAUNCH BANNER              */}
        {/* ================================================== */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-900 via-[#0B132B] to-indigo-950 p-6 sm:p-8 text-white border border-slate-800 shadow-sm">
          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="max-w-xl">
              <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-indigo-900/60 border border-indigo-700/50 text-indigo-300 text-xs font-semibold mb-3.5">
                <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                <span>Candidate Preparation Studio</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white leading-tight">
                {greeting}, {userName}.
              </h2>
              <p className="text-slate-300 text-sm sm:text-base mt-2 leading-relaxed">
                Ready to practice your next technical interview? Choose your role, set difficulty, and get scored evaluations.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 shrink-0">
              <Link
                to="/start-interview"
                className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm transition-all shadow-xs"
              >
                <Play className="w-4 h-4 fill-white" />
                <span>Start New Mock</span>
              </Link>
              <Link
                to="/resume-ats"
                className="inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700 text-slate-200 font-semibold text-sm transition-all"
              >
                <FileText className="w-4 h-4 text-indigo-400" />
                <span>Analyze Resume</span>
              </Link>
            </div>
          </div>
        </div>

        {/* ================================================== */}
        {/* 2. THREE CORE ACTION WORKFLOW CARDS                */}
        {/* ================================================== */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {/* Action 1: Role-Specific Simulation */}
          <div className="panel-card flex flex-col justify-between hover:border-indigo-300 dark:hover:border-indigo-800 transition-colors">
            <div>
              <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold mb-4 border border-indigo-100 dark:border-indigo-800/50">
                <Layers className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">Technical Interview</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1.5 leading-relaxed">
                Practice 6 adaptive questions covering code architecture, core concepts, and tradeoffs.
              </p>
            </div>
            <Link
              to="/role-job"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline mt-4 pt-3 border-t border-slate-100 dark:border-slate-800"
            >
              <span>Choose Role & Difficulty</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {/* Action 2: Resume & ATS Check */}
          <div className="panel-card flex flex-col justify-between hover:border-indigo-300 dark:hover:border-indigo-800 transition-colors">
            <div>
              <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold mb-4 border border-emerald-100 dark:border-emerald-800/50">
                <FileText className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">ATS Resume Parsing</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1.5 leading-relaxed">
                Inspect keyword relevance, chronological layout compliance, and quantifiable bullet points.
              </p>
            </div>
            <Link
              to="/resume-ats"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:underline mt-4 pt-3 border-t border-slate-100 dark:border-slate-800"
            >
              <span>Upload PDF / DOCX</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {/* Action 3: Session History & Metrics */}
          <div className="panel-card flex flex-col justify-between hover:border-indigo-300 dark:hover:border-indigo-800 transition-colors">
            <div>
              <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold mb-4 border border-blue-100 dark:border-blue-800/50">
                <TrendingUp className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">Performance Insights</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1.5 leading-relaxed">
                Track strengths, improvement areas, and category ratings across your mock sessions.
              </p>
            </div>
            <Link
              to="/history"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline mt-4 pt-3 border-t border-slate-100 dark:border-slate-800"
            >
              <span>View Past Results</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>

        {/* ================================================== */}
        {/* 3. CURRENT CANDIDATE PROFILE & TARGET TRACK        */}
        {/* ================================================== */}
        <div className="panel-card">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800">
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">Active Preparation Track</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Target discipline and settings currently configured for mock question generation.
              </p>
            </div>
            <Link
              to="/profile"
              className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline"
            >
              <span>Edit profile settings</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4">
            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/60 dark:border-slate-800">
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">Target Role</span>
              <span className="text-sm font-bold text-slate-900 dark:text-slate-100 mt-1 block">
                {user?.targetRole || activeRole || 'Software Engineer'}
              </span>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/60 dark:border-slate-800">
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">Account Type</span>
              <span className="text-sm font-bold text-slate-900 dark:text-slate-100 mt-1 block capitalize">
                {user?.role === 'admin' ? 'Administrator' : 'Standard Candidate'}
              </span>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/60 dark:border-slate-800">
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">Organization</span>
              <span className="text-sm font-bold text-slate-900 dark:text-slate-100 mt-1 block">
                {user?.organization || user?.university || 'Independent Candidate'}
              </span>
            </div>
          </div>
        </div>

        {/* ================================================== */}
        {/* 4. RECENT SESSIONS & EMPTY STATE                   */}
        {/* ================================================== */}
        <div className="panel-card">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">Recent Interview Sessions</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Completed live interviews in your workspace.
              </p>
            </div>
            <Link
              to="/history"
              className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline"
            >
              View all history
            </Link>
          </div>

          {recentSessions.length > 0 ? (
            <div className="divide-y divide-slate-100 dark:divide-slate-800 pt-1">
              {recentSessions.map((session, idx) => (
                <div key={idx} className="py-3.5 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
                      <Play className="w-3.5 h-3.5" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs sm:text-sm font-semibold text-slate-900 dark:text-slate-100 truncate">{session.role}</p>
                      <p className="text-[11px] text-slate-400 mt-0.5">{session.date || 'Recent'} • {session.difficulty}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <span className="badge-primary">{session.score || 'Completed'}</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-10 text-center flex flex-col items-center">
              <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800/80 text-slate-400 flex items-center justify-center mb-3">
                <BookOpen className="w-5 h-5" />
              </div>
              <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200">No mock sessions started yet</h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mt-1 leading-relaxed">
                Launch your first interactive mock interview to test your technical fundamentals and receive detailed rubric evaluations.
              </p>
              <Link
                to="/start-interview"
                className="btn-primary mt-4 text-xs h-9 px-4"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Launch First Mock Session</span>
              </Link>
            </div>
          )}
        </div>

      </div>
    </WorkspaceLayout>
  );
}
