import React, { useState, useEffect } from 'react';
import { 
  Sparkles, 
  Award, 
  TrendingUp, 
  Target, 
  CheckCircle2, 
  Layers, 
  BookOpen,
  ArrowRight,
  Clock,
  Play,
  RotateCcw,
  BarChart3,
  ShieldCheck,
  AlertCircle
} from 'lucide-react';
import { Link } from 'react-router-dom';
import WorkspaceLayout from '../components/layout/WorkspaceLayout';
import { getDashboardAnalyticsApi } from '../lib/api';

export default function Progress() {
  const [loading, setLoading] = useState(true);
  const [analytics, setAnalytics] = useState(null);
  const [fetchError, setFetchError] = useState(null);

  useEffect(() => {
    let isMounted = true;

    async function loadAnalytics() {
      try {
        setLoading(true);
        setFetchError(null);
        const res = await getDashboardAnalyticsApi();
        if (isMounted) {
          if (res && res.analytics) {
            setAnalytics(res.analytics);
          } else {
            setAnalytics(null);
          }
        }
      } catch (err) {
        console.warn("Failed to load interview analytics:", err);
        if (isMounted) {
          setFetchError(err.message || "Failed to load performance analytics");
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    loadAnalytics();
    return () => {
      isMounted = false;
    };
  }, []);

  const totalInterviews = analytics?.totalInterviews || analytics?.completedInterviews || 0;
  const averageBenchmark = typeof analytics?.averageBenchmark === 'number'
    ? analytics.averageBenchmark
    : (analytics?.averageScore ? Math.round(analytics.averageScore * 10) : 0);

  const readinessRating = analytics?.readinessRating || 
    (averageBenchmark >= 80 ? 'Interview Ready' : (averageBenchmark >= 65 ? 'Proficient' : 'Developing'));

  const competencies = analytics?.competencies || [];
  const recommendations = analytics?.recommendations || [];
  const categoryAverages = analytics?.categoryAverages || {};
  const topStrengths = analytics?.topStrengths || [];
  const topImprovementAreas = analytics?.topImprovementAreas || [];

  return (
    <WorkspaceLayout title="Performance Analytics">
      <div className="max-w-4xl mx-auto space-y-7">
        
        {/* Loading Skeleton */}
        {loading && (
          <div className="space-y-6 animate-pulse">
            <div className="h-44 rounded-2xl bg-slate-200 dark:bg-slate-800" />
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-20 rounded-xl bg-slate-200 dark:bg-slate-800" />
              ))}
            </div>
            <div className="h-64 rounded-2xl bg-slate-200 dark:bg-slate-800" />
          </div>
        )}

        {/* Error State */}
        {!loading && fetchError && (
          <div className="p-4 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 flex items-center justify-between text-xs sm:text-sm">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{fetchError}</span>
            </div>
            <button 
              onClick={() => window.location.reload()} 
              className="inline-flex items-center gap-1 font-semibold underline hover:no-underline"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Retry</span>
            </button>
          </div>
        )}

        {/* Empty State: No Mock Interviews Completed Yet */}
        {!loading && !fetchError && totalInterviews === 0 && (
          <div className="panel-card text-center py-12 px-6 sm:px-12 space-y-5">
            <div className="w-14 h-14 mx-auto rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center border border-indigo-100 dark:border-indigo-800/50">
              <BarChart3 className="w-7 h-7" />
            </div>
            <div className="space-y-2 max-w-lg mx-auto">
              <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white">
                No Interview Analytics Yet
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
                Take your first AI mock interview or complete targeted section practice to generate your competency radar, rubric scores, and personalized practice recommendations.
              </p>
            </div>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
              <Link to="/start-interview" className="btn-primary w-full sm:w-auto">
                <Play className="w-4 h-4 fill-white" />
                <span>Start Mock Interview</span>
              </Link>
              <Link to="/customize" className="btn-secondary w-full sm:w-auto">
                <Layers className="w-4 h-4" />
                <span>Practice by Section</span>
              </Link>
            </div>
          </div>
        )}

        {/* Dynamic Analytics View */}
        {!loading && !fetchError && totalInterviews > 0 && (
          <>
            {/* Header Summary Banner */}
            <div className="panel-card bg-gradient-to-br from-slate-900 via-[#0B132B] to-indigo-950 text-white border-slate-800 p-6 sm:p-8">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
                <div className="space-y-2 max-w-xl">
                  <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-indigo-900/60 border border-indigo-700/50 text-indigo-300 text-xs font-semibold">
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Candidate Competency Radar</span>
                  </div>
                  <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
                    Technical Mastery & Readiness
                  </h2>
                  <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                    Aggregated skill metrics derived from {totalInterviews} completed mock session{totalInterviews > 1 ? 's' : ''} and {analytics?.totalQuestionsAnswered || 0} evaluated questions.
                  </p>
                </div>

                <div className="flex flex-col items-center sm:items-end shrink-0">
                  <div className="px-5 py-3 rounded-2xl bg-indigo-600/90 border border-indigo-400/40 text-center min-w-[130px]">
                    <span className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
                      {averageBenchmark}%
                    </span>
                    <span className="block text-[11px] font-bold text-indigo-100 uppercase tracking-wider mt-0.5">
                      Avg Benchmark
                    </span>
                    <span className="inline-block mt-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-white/20 text-white">
                      {readinessRating}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Metrics Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="panel-card p-4 space-y-1">
                <div className="flex items-center gap-1.5 text-slate-400 text-xs font-semibold">
                  <CheckCircle2 className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                  <span>Completed</span>
                </div>
                <div className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white">
                  {totalInterviews}
                </div>
                <p className="text-[11px] text-slate-400">Mock sessions</p>
              </div>

              <div className="panel-card p-4 space-y-1">
                <div className="flex items-center gap-1.5 text-slate-400 text-xs font-semibold">
                  <Target className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                  <span>Evaluated</span>
                </div>
                <div className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white">
                  {analytics?.totalQuestionsAnswered || 0}
                </div>
                <p className="text-[11px] text-slate-400">Total questions</p>
              </div>

              <div className="panel-card p-4 space-y-1">
                <div className="flex items-center gap-1.5 text-slate-400 text-xs font-semibold">
                  <Award className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                  <span>Peak Score</span>
                </div>
                <div className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white">
                  {analytics?.highestScore ? `${analytics.highestScore}%` : `${averageBenchmark}%`}
                </div>
                <p className="text-[11px] text-slate-400">Highest mock</p>
              </div>

              <div className="panel-card p-4 space-y-1">
                <div className="flex items-center gap-1.5 text-slate-400 text-xs font-semibold">
                  <Clock className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                  <span>Practice Time</span>
                </div>
                <div className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white">
                  {analytics?.totalDurationMinutes ? `${analytics.totalDurationMinutes}m` : `${totalInterviews * 12}m`}
                </div>
                <p className="text-[11px] text-slate-400">Time invested</p>
              </div>
            </div>

            {/* Competency Mastery Meters */}
            <div className="panel-card space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">
                    Skill & Domain Proficiency
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    Performance ratings aggregated across your practiced technical topics.
                  </p>
                </div>
                <Link
                  to="/customize"
                  className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline"
                >
                  <span>Practice more topics</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>

              <div className="space-y-4">
                {competencies.map((comp) => {
                  const levelBadgeClass = comp.score >= 80 
                    ? 'badge-success' 
                    : (comp.score >= 65 ? 'badge-primary' : 'bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-200/60 dark:border-amber-800/50');

                  const barFillColor = comp.score >= 80 
                    ? 'bg-emerald-600' 
                    : (comp.score >= 65 ? 'bg-indigo-600' : 'bg-amber-500');

                  return (
                    <div 
                      key={comp.name} 
                      className="space-y-1.5 p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800"
                    >
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-bold text-slate-900 dark:text-slate-100">{comp.name}</span>
                        <div className="flex items-center gap-2">
                          <span className={`${levelBadgeClass} text-[10px] px-2 py-0.5 rounded-full font-semibold border`}>
                            {comp.level}
                          </span>
                          <span className="font-extrabold text-slate-900 dark:text-slate-100">{comp.score}%</span>
                        </div>
                      </div>
                      <div className="w-full bg-slate-200 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                        <div 
                          className={`${barFillColor} h-full rounded-full transition-all duration-500`} 
                          style={{ width: `${comp.score}%` }} 
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* 5-Dimension Rubric Pillar Breakdown */}
            <div className="panel-card space-y-4">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Core Evaluation Rubric Dimensions
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  5-dimensional assessment breakdown graded by the AI evaluation engine.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {[
                  { key: 'correctness', label: 'Technical Correctness', desc: 'Accuracy against technical ground truth', score: Math.round(Number(categoryAverages.correctness || 0) * 10) },
                  { key: 'clarity', label: 'Communication & Clarity', desc: 'STAR structure, conciseness, and articulation', score: Math.round(Number(categoryAverages.clarity || 0) * 10) },
                  { key: 'depth', label: 'System Depth & Nuance', desc: 'Trade-offs, scaling limits, and edge cases', score: Math.round(Number(categoryAverages.depth || 0) * 10) },
                  { key: 'relevance', label: 'Answer Relevance', desc: 'Directly addressing the interviewer question', score: Math.round(Number(categoryAverages.relevance || 0) * 10) },
                  { key: 'completeness', label: 'Solution Completeness', desc: 'Addressing all core facets and constraints', score: Math.round(Number(categoryAverages.completeness || 0) * 10) }
                ].map((dim) => {
                  const ratingLabel = dim.score >= 80 ? 'Mastered' : (dim.score >= 65 ? 'Proficient' : 'Needs Practice');
                  const barColor = dim.score >= 80 ? 'bg-emerald-600' : (dim.score >= 65 ? 'bg-indigo-600' : 'bg-amber-500');

                  return (
                    <div key={dim.key} className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800 space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-bold text-slate-900 dark:text-slate-100">{dim.label}</span>
                        <span className="font-extrabold text-slate-900 dark:text-white">{dim.score}%</span>
                      </div>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-snug">
                        {dim.desc}
                      </p>
                      <div className="w-full bg-slate-200 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
                        <div 
                          className={`${barColor} h-full rounded-full transition-all duration-500`}
                          style={{ width: `${dim.score}%` }} 
                        />
                      </div>
                      <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                        {ratingLabel}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Recommendations Card */}
            {recommendations.length > 0 && (
              <div className="panel-card space-y-3">
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Recommended Practice Actions
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Target these focus areas in your next mock sessions to raise your readiness rating.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                  {recommendations.map((rec, idx) => (
                    <div 
                      key={idx}
                      className="p-3.5 rounded-xl bg-indigo-50/60 dark:bg-indigo-950/40 border border-indigo-100 dark:border-indigo-900/40 flex flex-col justify-between space-y-2"
                    >
                      <div className="space-y-1">
                        <span className="text-xs font-bold text-indigo-900 dark:text-indigo-200 block">
                          {rec.title}
                        </span>
                        <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed">
                          {rec.description}
                        </p>
                      </div>
                      <div className="pt-2">
                        <Link
                          to={rec.actionUrl || "/customize"}
                          className="inline-flex items-center gap-1 text-[11px] font-semibold text-indigo-600 dark:text-indigo-400 hover:underline"
                        >
                          <span>Practice this topic</span>
                          <ArrowRight className="w-3 h-3" />
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Verified Strengths & Growth Areas */}
            {(topStrengths.length > 0 || topImprovementAreas.length > 0) && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {topStrengths.length > 0 && (
                  <div className="panel-card space-y-3">
                    <div className="flex items-center gap-2">
                      <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                      <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                        Key Evaluated Strengths
                      </h4>
                    </div>
                    <ul className="space-y-1.5">
                      {topStrengths.slice(0, 4).map((str, idx) => (
                        <li key={idx} className="text-xs text-slate-600 dark:text-slate-300 flex items-start gap-2">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
                          <span>{str}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {topImprovementAreas.length > 0 && (
                  <div className="panel-card space-y-3">
                    <div className="flex items-center gap-2">
                      <Target className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                      <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                        Target Growth Areas
                      </h4>
                    </div>
                    <ul className="space-y-1.5">
                      {topImprovementAreas.slice(0, 4).map((area, idx) => (
                        <li key={idx} className="text-xs text-slate-600 dark:text-slate-300 flex items-start gap-2">
                          <ArrowRight className="w-3.5 h-3.5 text-indigo-500 shrink-0 mt-0.5" />
                          <span>{area}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}

          </>
        )}

      </div>
    </WorkspaceLayout>
  );
}
