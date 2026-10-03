import React from 'react';
import { 
  Sparkles, 
  Award, 
  LineChart as ChartIcon, 
  TrendingUp, 
  Target, 
  CheckCircle2, 
  Layers, 
  BookOpen,
  ArrowRight
} from 'lucide-react';
import { Link } from 'react-router-dom';
import WorkspaceLayout from '../components/layout/WorkspaceLayout';

export default function Progress() {
  const competencies = [
    { name: 'Core JavaScript & Web Architecture', score: 86, level: 'Advanced', color: 'bg-indigo-600' },
    { name: 'React Component Design & State Lifecycle', score: 82, level: 'Proficient', color: 'bg-indigo-600' },
    { name: 'REST API & Backend Integration', score: 78, level: 'Proficient', color: 'bg-indigo-600' },
    { name: 'System Scaling & Trade-offs', score: 72, level: 'Developing', color: 'bg-indigo-600' },
    { name: 'Behavioral & Communication Framework', score: 84, level: 'Proficient', color: 'bg-indigo-600' }
  ];

  return (
    <WorkspaceLayout title="Performance Analytics">
      <div className="max-w-4xl mx-auto space-y-7">
        
        {/* Header Summary */}
        <div className="panel-card bg-gradient-to-br from-slate-900 via-[#0B132B] to-indigo-950 text-white border-slate-800 p-6 sm:p-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
            <div className="space-y-2 max-w-xl">
              <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-indigo-900/60 border border-indigo-700/50 text-indigo-300 text-xs font-semibold">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Competency Radar</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
                Technical Mastery & Readiness
              </h2>
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                Aggregated skill metrics derived from completed mock interview evaluations and rubric correctness scores.
              </p>
            </div>

            <div className="flex flex-col items-center sm:items-end shrink-0">
              <div className="px-5 py-3 rounded-2xl bg-indigo-600/90 border border-indigo-400/40 text-center">
                <span className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">84%</span>
                <span className="block text-[11px] font-bold text-indigo-100 uppercase tracking-wider mt-0.5">
                  Avg Benchmark
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Competency Mastery Meters */}
        <div className="panel-card space-y-6">
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              Skill & Domain Proficiency
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Performance ratings broken down by technical category.
            </p>
          </div>

          <div className="space-y-4">
            {competencies.map((comp) => (
              <div key={comp.name} className="space-y-1.5 p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-slate-900 dark:text-slate-100">{comp.name}</span>
                  <div className="flex items-center gap-2">
                    <span className="badge-neutral text-[10px]">{comp.level}</span>
                    <span className="font-extrabold text-slate-900 dark:text-slate-100">{comp.score}%</span>
                  </div>
                </div>
                <div className="w-full bg-slate-200 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                  <div 
                    className="bg-indigo-600 h-full rounded-full transition-all duration-500" 
                    style={{ width: `${comp.score}%` }} 
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recommendations Card */}
        <div className="panel-card space-y-3">
          <h3 className="text-base font-bold text-slate-900 dark:text-white">
            Recommended Practice Actions
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Target these focus areas in your next mock sessions to raise your readiness rating.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
            <div className="p-3.5 rounded-xl bg-indigo-50/60 dark:bg-indigo-950/40 border border-indigo-100 dark:border-indigo-900/40 space-y-1">
              <span className="text-xs font-bold text-indigo-900 dark:text-indigo-200 block">
                Practice System Scaling
              </span>
              <p className="text-[11px] text-slate-600 dark:text-slate-400">
                Focus on caching strategies (Redis), message queues, and load balancing tradeoffs.
              </p>
            </div>

            <div className="p-3.5 rounded-xl bg-indigo-50/60 dark:bg-indigo-950/40 border border-indigo-100 dark:border-indigo-900/40 space-y-1">
              <span className="text-xs font-bold text-indigo-900 dark:text-indigo-200 block">
                Quantify Project Impacts
              </span>
              <p className="text-[11px] text-slate-600 dark:text-slate-400">
                Include latency reductions, concurrency numbers, and business metrics in STAR responses.
              </p>
            </div>
          </div>
        </div>

      </div>
    </WorkspaceLayout>
  );
}
