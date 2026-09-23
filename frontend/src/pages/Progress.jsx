import React, { useState } from 'react';
import { 
  Sparkles, 
  Award, 
  LineChart,
  Trophy,
  Flame,
  AlertTriangle
} from 'lucide-react';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  Tooltip, 
  ResponsiveContainer 
} from 'recharts';
import WorkspaceLayout from '../components/layout/WorkspaceLayout';

import ProgressRing from '../components/progress/ProgressRing';

export default function Progress() {
  const [completedInterviews, setCompletedInterviews] = useState(14); // Toggle this to test empty state

  const emptyStateCondition = completedInterviews < 5;

  const weeklyAtsData = [
    { label: 'W1', score: 68, avg: 65, interviews: 2 },
    { label: 'W2', score: 72, avg: 67, interviews: 3 },
    { label: 'W3', score: 70, avg: 69, interviews: 1 },
    { label: 'W4', score: 78, avg: 72, interviews: 4 },
    { label: 'W5', score: 82, avg: 75, interviews: 2 },
    { label: 'W6', score: 86, avg: 78, interviews: 5 },
    { label: 'W7', score: 84, avg: 80, interviews: 3 },
    { label: 'W8', score: 91, avg: 82, interviews: 6 },
    { label: 'W9', score: 89, avg: 83, interviews: 4 },
    { label: 'W10', score: 94, avg: 85, interviews: 7 }
  ];

  const chartData = weeklyAtsData;



  const CustomChartTooltip = ({ active, payload, label, suffix = "%", valuePrefix="Score" }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-[#0F172A] border border-[#334155] text-white px-3.5 py-2 rounded-xl text-xs shadow-lg">
          <p className="font-bold text-slate-300">{label}</p>
          <p className="text-[#38BDF8] font-black text-sm mt-0.5">
            {valuePrefix}: {payload[0].value}{suffix}
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <WorkspaceLayout 
      title="Analytics"
      actions={
        <button
          onClick={() => setCompletedInterviews(prev => prev < 5 ? 14 : 3)}
          className="px-3 py-1.5 bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-300 transition-colors rounded-lg text-xs font-semibold"
        >
          Toggle Empty State
        </button>
      }
    >
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-[#E5E7EB] dark:border-[#334155]/60 mb-6">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 dark:bg-[#1E293B] text-[#2563EB] dark:text-[#38BDF8] text-[11px] font-bold uppercase tracking-wider mb-2 border border-blue-100 dark:border-blue-900/50">
            <Sparkles className="w-3.5 h-3.5" />
            Performance Growth
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-[#0F172A] dark:text-[#F8FAFC] tracking-tight">
            Your Progress
          </h2>
          <p className="text-sm sm:text-base text-[#64748B] dark:text-[#94A3B8] mt-1">
            Track your ATS score trajectory, question completion rate, and preparation consistency.
          </p>
        </div>
      </div>

      {emptyStateCondition ? (
        <div className="w-full flex flex-col items-center justify-center py-12 px-4">
          <div className="max-w-2xl w-full bg-white dark:bg-[#0F172A] rounded-[24px] p-8 sm:p-12 border border-[#E5E7EB] dark:border-[#334155] shadow-sm text-center">
            
            <div className="w-20 h-20 rounded-2xl bg-blue-50 dark:bg-blue-950/50 flex items-center justify-center mx-auto mb-6 border border-blue-100 dark:border-blue-900/50">
              <LineChart className="w-10 h-10 text-[#2563EB] dark:text-[#38BDF8]" />
            </div>
            
            <h2 className="text-2xl sm:text-3xl font-extrabold text-[#0F172A] dark:text-[#F8FAFC] tracking-tight mb-3">
              Not enough interview data yet
            </h2>
            
            <p className="text-sm sm:text-base text-[#64748B] dark:text-[#94A3B8] max-w-md mx-auto leading-relaxed mb-8">
              Complete at least <strong className="text-[#0F172A] dark:text-white">5 mock interviews</strong> to unlock personalized performance analytics, skill trends, interview heatmaps, and category insights.
            </p>

            {/* Progress Tracker */}
            <div className="w-full max-w-md mx-auto mb-8 text-left">
              <div className="flex justify-between items-end mb-2">
                <span className="text-sm font-bold text-[#0F172A] dark:text-[#F8FAFC]">
                  {completedInterviews} / 5 Interviews Completed
                </span>
                <span className="text-xs font-semibold text-[#2563EB] dark:text-[#38BDF8]">
                  {Math.round((completedInterviews / 5) * 100)}%
                </span>
              </div>
              <div className="h-3 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden mb-4 border border-slate-200 dark:border-slate-700">
                <div 
                  className="h-full bg-[#2563EB] transition-all duration-1000 ease-out rounded-full" 
                  style={{ width: `${(completedInterviews / 5) * 100}%` }}
                />
              </div>
              
              {/* Milestones */}
              <div className="flex justify-between gap-2">
                {[1, 2, 3, 4, 5].map(num => (
                  <div 
                    key={num} 
                    className={`flex-1 py-1.5 rounded-lg text-center text-[10px] sm:text-xs font-bold border transition-colors ${
                      completedInterviews >= num 
                        ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800/40'
                        : 'bg-slate-50 dark:bg-[#1E293B] text-slate-400 dark:text-slate-500 border-slate-200 dark:border-slate-700'
                    }`}
                  >
                    {completedInterviews >= num ? `Int ${num} ✓` : `Int ${num}`}
                  </div>
                ))}
              </div>
            </div>

            <button className="px-8 py-3.5 bg-[#2563EB] hover:bg-blue-700 text-white font-bold rounded-xl shadow-xs transition-colors mb-4 cursor-pointer">
              Start New Mock Interview
            </button>
            
            <p className="text-xs text-slate-400 dark:text-slate-500">
              Your analytics become more accurate as you complete more interviews.
            </p>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          
          {/* Performance Summary Card */}
          <div className="bg-white dark:bg-[#0F172A] rounded-[20px] p-6 border border-[#E5E7EB] dark:border-[#334155] shadow-xs flex flex-col gap-6">
            
            {/* Top Row */}
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-lg font-bold text-[#0F172A] dark:text-[#F8FAFC]">Performance Summary</h3>
                <p className="text-[13px] text-[#64748B] dark:text-[#94A3B8] mt-0.5">Based on your recent mock interviews</p>
              </div>
              <div className="flex items-center gap-2 text-[13px] font-medium text-[#64748B] dark:text-[#94A3B8]">
                <span className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/40 text-[11px] font-bold">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  Live
                </span>
                <span>Updated: Today</span>
              </div>
            </div>

            {/* Middle Row (3 equal columns) */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-2 pb-6 border-b border-[#E5E7EB] dark:border-[#334155]/60">
              {/* Col 1 */}
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center border border-emerald-100 dark:border-emerald-900/40">
                    <Trophy className="w-4 h-4" />
                  </div>
                  <span className="text-[14px] font-bold text-[#0F172A] dark:text-[#F8FAFC]">Best Interview Type</span>
                </div>
                <div className="mt-3">
                  <h4 className="text-[18px] font-bold text-[#0F172A] dark:text-[#F8FAFC]">Technical Interview</h4>
                  <p className="text-[14px] font-semibold text-[#64748B] dark:text-[#94A3B8] mt-0.5">94% Average</p>
                  <div className="flex flex-wrap items-center gap-2 mt-2">
                    <span className="text-[12px] font-bold text-[#0F172A] dark:text-[#F8FAFC] bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded">Top 5% performer</span>
                    <span className="text-[12px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded">+4% trend</span>
                  </div>
                </div>
              </div>

              {/* Col 2 */}
              <div className="border-t md:border-t-0 md:border-l border-[#E5E7EB] dark:border-[#334155]/60 pt-4 md:pt-0 md:pl-6">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-8 h-8 rounded-lg bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 flex items-center justify-center border border-rose-100 dark:border-rose-900/40">
                    <AlertTriangle className="w-4 h-4" />
                  </div>
                  <span className="text-[14px] font-bold text-[#0F172A] dark:text-[#F8FAFC]">Weakest Area</span>
                </div>
                <div className="mt-3">
                  <h4 className="text-[18px] font-bold text-[#0F172A] dark:text-[#F8FAFC]">HR Interview</h4>
                  <p className="text-[14px] font-semibold text-[#64748B] dark:text-[#94A3B8] mt-0.5">82% Score</p>
                  <div className="mt-2 text-[12px] font-bold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 px-2 py-1 rounded inline-block">
                    Needs STAR communication improvement
                  </div>
                </div>
              </div>

              {/* Col 3 */}
              <div className="border-t md:border-t-0 md:border-l border-[#E5E7EB] dark:border-[#334155]/60 pt-4 md:pt-0 md:pl-6">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-8 h-8 rounded-lg bg-orange-50 dark:bg-orange-950/40 text-orange-500 dark:text-orange-400 flex items-center justify-center border border-orange-100 dark:border-orange-900/40">
                    <Flame className="w-4 h-4" />
                  </div>
                  <span className="text-[14px] font-bold text-[#0F172A] dark:text-[#F8FAFC]">Current Streak</span>
                </div>
                <div className="mt-3">
                  <h4 className="text-[18px] font-bold text-[#0F172A] dark:text-[#F8FAFC]">4 Days</h4>
                  <p className="text-[14px] font-semibold text-[#64748B] dark:text-[#94A3B8] mt-0.5">+1 from last week</p>
                  <div className="mt-2 flex items-center justify-between text-[12px] font-bold">
                    <span className="text-[#0F172A] dark:text-[#F8FAFC]">Consistency Level: Excellent</span>
                  </div>
                  <div className="h-1.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full mt-2 overflow-hidden">
                    <div className="h-full bg-[#2563EB] w-4/5 rounded-full" />
                  </div>
                </div>
              </div>
            </div>

            {/* Bottom Row (Small Circular Progress Rings) */}
            <div className="flex flex-wrap items-center justify-around md:justify-start gap-8 md:gap-12 pt-2">
              <div className="flex items-center gap-4">
                <ProgressRing radius={36} stroke={6} progress={94} color="#2563EB" />
                <div>
                  <div className="text-[13px] font-bold text-[#0F172A] dark:text-[#F8FAFC]">Technical</div>
                  <div className="text-[12px] font-medium text-[#64748B] dark:text-[#94A3B8]">Overall score</div>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <ProgressRing radius={36} stroke={6} progress={88} color="#10B981" />
                <div>
                  <div className="text-[13px] font-bold text-[#0F172A] dark:text-[#F8FAFC]">HR Comm.</div>
                  <div className="text-[12px] font-medium text-[#64748B] dark:text-[#94A3B8]">Overall score</div>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <ProgressRing radius={36} stroke={6} progress={82} color="#F59E0B" />
                <div>
                  <div className="text-[13px] font-bold text-[#0F172A] dark:text-[#F8FAFC]">Problem Solving</div>
                  <div className="text-[12px] font-medium text-[#64748B] dark:text-[#94A3B8]">Overall score</div>
                </div>
              </div>
            </div>

          </div>

          {/* THIRD ROW: Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            
            {/* Chart 1: Interview History Trend */}
            <div className="bg-white dark:bg-[#0F172A] rounded-[20px] p-6 border border-[#E5E7EB] dark:border-[#334155] shadow-sm">
              <div className="mb-6">
                <h3 className="text-lg font-bold text-[#0F172A] dark:text-[#F8FAFC]">Interview Volume</h3>
                <p className="text-xs text-[#64748B] dark:text-[#94A3B8] mt-0.5">
                  Number of mock interviews completed per week
                </p>
              </div>
              <div className="w-full h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorInterviews" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10B981" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{ fill: '#64748B', fontSize: 11, fontWeight: 600 }} dy={8} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748B', fontSize: 11 }} />
                    <Tooltip content={<CustomChartTooltip suffix="" valuePrefix="Interviews" />} />
                    <Area type="monotone" dataKey="interviews" stroke="#10B981" strokeWidth={3} fillOpacity={1} fill="url(#colorInterviews)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Chart 2: Score Progression */}
            <div className="bg-white dark:bg-[#0F172A] rounded-[20px] p-6 border border-[#E5E7EB] dark:border-[#334155] shadow-sm">
              <div className="mb-6">
                <h3 className="text-lg font-bold text-[#0F172A] dark:text-[#F8FAFC]">Score Progression</h3>
                <p className="text-xs text-[#64748B] dark:text-[#94A3B8] mt-0.5">
                  Average performance score trend over time
                </p>
              </div>
              <div className="w-full h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorScore2" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#2563EB" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#2563EB" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{ fill: '#64748B', fontSize: 11, fontWeight: 600 }} dy={8} />
                    <YAxis domain={[50, 100]} axisLine={false} tickLine={false} tick={{ fill: '#64748B', fontSize: 11 }} />
                    <Tooltip content={<CustomChartTooltip suffix="%" valuePrefix="Score" />} />
                    <Area type="monotone" dataKey="score" stroke="#2563EB" strokeWidth={3} fillOpacity={1} fill="url(#colorScore2)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

          </div>
        </div>
      )}

    </WorkspaceLayout>
  );
}
