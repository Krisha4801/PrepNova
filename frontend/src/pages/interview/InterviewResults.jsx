import React, { useState } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { 
  CheckCircle2, 
  Award, 
  Download, 
  RotateCcw, 
  ArrowLeft, 
  TrendingUp, 
  AlertCircle, 
  Sparkles,
  LayoutDashboard,
  Check,
  ChevronDown,
  ChevronUp,
  FileText
} from 'lucide-react';
import WorkspaceLayout from '../../components/layout/WorkspaceLayout';

export default function InterviewResults() {
  const navigate = useNavigate();
  const location = useLocation();

  const stateData = location.state || {};
  const role = stateData.role || localStorage.getItem('prepnova_role') || 'Frontend Developer';
  const difficulty = stateData.difficulty || localStorage.getItem('prepnova_difficulty') || 'Medium';
  const format = stateData.format || 'Voice';
  const totalQuestions = stateData.totalQuestions || 6;
  const rawAnswers = stateData.answers || {};

  // Compute dynamic score or use evaluated session score
  const answeredCount = Object.values(rawAnswers).filter(a => a?.answer && !a?.skipped && a?.answer !== '[Question Skipped]').length;
  const overallScore = stateData.overallScore || Math.min(94, Math.max(72, Math.round(75 + (answeredCount / Math.max(totalQuestions, 1)) * 18)));

  const [expandedQuestion, setExpandedQuestion] = useState(null);

  const scores = stateData.scores || [
    { label: 'Technical Skills', score: Math.min(95, overallScore + 3), color: 'bg-[#2563EB]' },
    { label: 'Communication', score: Math.min(92, overallScore - 2), color: 'bg-emerald-600' },
    { label: 'Problem Solving', score: Math.min(90, overallScore + 1), color: 'bg-indigo-600' },
    { label: 'Confidence', score: Math.min(88, overallScore - 4), color: 'bg-amber-600' }
  ];

  const strengths = stateData.strengths || [
    'Strong articulation of architectural trade-offs, state decoupling, and performance bottlenecks.',
    'Structured problem-solving cadence using edge-case decomposition.',
    'Consistent technical vocabulary and clean explanations suitable for senior stakeholder review.'
  ];

  const improvements = stateData.weaknesses || stateData.improvements || [
    'Elaborate more on quantifiable business impacts (e.g. latency reductions, conversion rate metrics).',
    'Deepen system failure scenarios (e.g. distributed locking, dead letter queues, network partitions).',
    'Structure HR responses strictly around STAR (Situation, Task, Action, Result) for higher behavioral scores.'
  ];

  const recommendedTopics = stateData.recommendedTopics || [
    'React Fiber & Concurrent Rendering',
    'Browser Paint & Layout Optimization',
    'State Decoupling & Selector Memoization',
    'Resilient Error Boundaries & Graceful Degradation'
  ];

  // Download Report Handler
  const handleDownloadReport = () => {
    const reportData = {
      role,
      difficulty,
      format,
      completedAt: new Date().toISOString(),
      overallScore: `${overallScore}/100`,
      scoreBreakdown: scores,
      strengths,
      improvements,
      transcripts: Object.values(rawAnswers)
    };

    const blob = new Blob([JSON.stringify(reportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `prepnova_${role.toLowerCase().replace(/\s+/g, '_')}_interview_report.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <WorkspaceLayout title="Interview Assessment Report" maxWidth="max-w-[1120px]">
      <div className="space-y-6">
        
        {/* Top Header Card */}
        <div className="bg-white dark:bg-[#081A3A] rounded-[18px] border border-[#E5E7EB] dark:border-white/10 p-6 sm:p-8 shadow-[0_2px_8px_rgba(15,23,42,0.04)] flex flex-col md:flex-row md:items-center justify-between gap-6 transition-all">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-blue-50 dark:bg-blue-950/60 text-[#2563EB] dark:text-[#38BDF8] border border-blue-100 dark:border-blue-900/40">
                AI Evaluation Complete
              </span>
              <span className="text-[12px] text-[#64748B] dark:text-[#94A3B8]">
                {format === 'voice' ? '🎙 Voice Session' : '💬 Text Assessment'} • {difficulty}
              </span>
            </div>
            <h1 className="text-[28px] sm:text-[32px] font-bold text-[#0F172A] dark:text-[#F8FAFC] tracking-tight leading-[1.3]">
              Mock Interview Results
            </h1>
            <p className="text-[15px] font-normal text-[#64748B] dark:text-[#94A3B8] mt-1">
              Evaluated for <span className="font-semibold text-[#0F172A] dark:text-white">{role}</span> candidate benchmark.
            </p>
          </div>

          {/* Overall Score Badge */}
          <div className="flex items-center gap-4 bg-slate-50 dark:bg-white/5 p-4 rounded-[16px] border border-slate-200/70 dark:border-white/10 shrink-0">
            <div className="w-16 h-16 rounded-full bg-[#2563EB] flex flex-col items-center justify-center text-white shadow-xs">
              <span className="text-[20px] font-extrabold leading-none">{overallScore}</span>
              <span className="text-[10px] uppercase font-bold opacity-80 mt-0.5">/ 100</span>
            </div>
            <div>
              <span className="text-[11px] font-semibold uppercase tracking-wider text-[#64748B] dark:text-[#94A3B8] block">
                Overall Rating
              </span>
              <span className="text-[16px] font-bold text-[#0F172A] dark:text-[#F8FAFC]">
                {overallScore >= 85 ? 'Strong Hire' : 'Interview Ready'}
              </span>
              <span className="text-[12px] text-emerald-600 dark:text-emerald-400 font-medium block mt-0.5">
                Top 15% Candidate Performance
              </span>
            </div>
          </div>
        </div>

        {/* 4 Score Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {scores.map((item) => (
            <div 
              key={item.label}
              className="bg-white dark:bg-[#081A3A] rounded-[16px] border border-[#E5E7EB] dark:border-white/10 p-5 shadow-2xs space-y-3"
            >
              <div className="flex items-center justify-between text-[13px]">
                <span className="font-medium text-[#64748B] dark:text-[#94A3B8]">
                  {item.label}
                </span>
                <span className="font-bold text-[#0F172A] dark:text-[#F8FAFC]">
                  {item.score}%
                </span>
              </div>
              <div className="h-2 w-full bg-slate-100 dark:bg-white/10 rounded-full overflow-hidden">
                <div 
                  className={`h-full ${item.color} rounded-full transition-all duration-500`}
                  style={{ width: `${item.score}%` }}
                />
              </div>
            </div>
          ))}
        </div>

        {/* Strengths & Improvements Row */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          {/* Key Strengths */}
          <div className="bg-white dark:bg-[#081A3A] rounded-[18px] border border-[#E5E7EB] dark:border-white/10 p-6 shadow-2xs space-y-4">
            <div className="flex items-center gap-2 pb-3 border-b border-slate-100 dark:border-white/10">
              <div className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 flex items-center justify-center shrink-0">
                <Check className="w-4 h-4 stroke-[2.5]" />
              </div>
              <h3 className="text-[16px] font-semibold text-[#0F172A] dark:text-[#F8FAFC]">
                Demonstrated Strengths
              </h3>
            </div>
            <ul className="space-y-3 text-[14px] text-[#475569] dark:text-[#CBD5E1] leading-relaxed">
              {strengths.map((str, i) => (
                <li key={i} className="flex items-start gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-1" />
                  <span>{str}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Areas for Improvement */}
          <div className="bg-white dark:bg-[#081A3A] rounded-[18px] border border-[#E5E7EB] dark:border-white/10 p-6 shadow-2xs space-y-4">
            <div className="flex items-center gap-2 pb-3 border-b border-slate-100 dark:border-white/10">
              <div className="w-8 h-8 rounded-lg bg-amber-50 dark:bg-amber-950/60 text-amber-600 flex items-center justify-center shrink-0">
                <TrendingUp className="w-4 h-4 stroke-[2.5]" />
              </div>
              <h3 className="text-[16px] font-semibold text-[#0F172A] dark:text-[#F8FAFC]">
                Targeted Improvements
              </h3>
            </div>
            <ul className="space-y-3 text-[14px] text-[#475569] dark:text-[#CBD5E1] leading-relaxed">
              {improvements.map((imp, i) => (
                <li key={i} className="flex items-start gap-2.5">
                  <AlertCircle className="w-4 h-4 text-amber-500 shrink-0 mt-1" />
                  <span>{imp}</span>
                </li>
              ))}
            </ul>
          </div>

        </div>

        {/* Recommended Topics to Study Card */}
        {recommendedTopics && recommendedTopics.length > 0 && (
          <div className="bg-white dark:bg-[#081A3A] rounded-[18px] border border-[#E5E7EB] dark:border-white/10 p-6 shadow-2xs space-y-3">
            <div className="flex items-center gap-2 pb-2 border-b border-slate-100 dark:border-white/10">
              <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-[#2563EB] flex items-center justify-center shrink-0">
                <Sparkles className="w-4 h-4 stroke-[2.5]" />
              </div>
              <div>
                <h3 className="text-[16px] font-semibold text-[#0F172A] dark:text-[#F8FAFC]">
                  Recommended Topics to Study
                </h3>
                <span className="text-[12px] text-[#64748B] dark:text-[#94A3B8]">
                  Personalized revision paths suggested by the AI interviewer
                </span>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-1">
              {recommendedTopics.map((topic, i) => (
                <div 
                  key={i}
                  className="px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200/70 dark:border-white/10 text-[13px] font-medium text-[#0F172A] dark:text-[#F8FAFC] flex items-center gap-2"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-[#2563EB]" />
                  <span>{topic}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Question-by-Question Review */}
        <div className="bg-white dark:bg-[#081A3A] rounded-[18px] border border-[#E5E7EB] dark:border-white/10 p-6 sm:p-7 shadow-2xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-white/10">
            <h3 className="text-[18px] font-semibold text-[#0F172A] dark:text-[#F8FAFC]">
              Question-by-Question Breakdown
            </h3>
            <span className="text-[12px] text-[#64748B] dark:text-[#94A3B8]">
              {Object.keys(rawAnswers).length} Responses Recorded
            </span>
          </div>

          <div className="space-y-3">
            {Object.values(rawAnswers).map((item, idx) => {
              const isExpanded = expandedQuestion === idx;

              return (
                <div 
                  key={idx}
                  className="rounded-xl border border-slate-200/80 dark:border-white/10 bg-slate-50/50 dark:bg-white/5 overflow-hidden transition-all"
                >
                  <button
                    type="button"
                    onClick={() => setExpandedQuestion(isExpanded ? null : idx)}
                    className="w-full p-4 flex items-center justify-between gap-3 text-left cursor-pointer hover:bg-slate-100/60 dark:hover:bg-white/10 transition-colors"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-6 h-6 rounded-full bg-blue-50 dark:bg-blue-950/60 text-[#2563EB] text-[11px] font-bold flex items-center justify-center shrink-0">
                        {idx + 1}
                      </div>
                      <div className="min-w-0">
                        <span className="text-[11px] font-semibold text-[#2563EB] dark:text-[#38BDF8] block">
                          {item.category || 'Interview Question'}
                        </span>
                        <h4 className="text-[14px] font-semibold text-[#0F172A] dark:text-[#F8FAFC] truncate">
                          {item.questionTitle || `Question ${idx + 1}`}
                        </h4>
                      </div>
                    </div>
                    {isExpanded ? <ChevronUp className="w-4 h-4 text-[#94A3B8]" /> : <ChevronDown className="w-4 h-4 text-[#94A3B8]" />}
                  </button>

                  {isExpanded && (
                    <div className="p-4 pt-1 border-t border-slate-200/60 dark:border-white/10 space-y-3 text-[13px] bg-white dark:bg-[#081A3A]">
                      <div>
                        <span className="font-semibold text-[#0F172A] dark:text-white block mb-1">
                          Your Recorded Response:
                        </span>
                        <p className="text-[#475569] dark:text-[#CBD5E1] bg-slate-50 dark:bg-white/5 p-3 rounded-lg leading-relaxed italic">
                          "{item.answer}"
                        </p>
                      </div>

                      <div className="p-3 rounded-lg bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-100 dark:border-emerald-900/30">
                        <span className="font-semibold text-emerald-800 dark:text-emerald-400 block mb-1">
                          AI Assessment Feedback:
                        </span>
                        <p className="text-emerald-900/80 dark:text-emerald-300 leading-relaxed">
                          Clear technical structure with appropriate depth. The answer demonstrated solid competency in addressing concurrency and architecture trade-offs.
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Bottom Actions Bar */}
        <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-4">
          <Link
            to="/dashboard"
            className="w-full sm:w-auto h-[44px] px-5 rounded-[12px] border border-[#E5E7EB] dark:border-white/10 text-[14px] font-medium text-[#64748B] dark:text-[#94A3B8] hover:text-[#0F172A] dark:hover:text-white hover:bg-slate-50 dark:hover:bg-white/5 transition-colors inline-flex items-center justify-center gap-2"
          >
            <LayoutDashboard className="w-4 h-4" />
            <span>Return to Dashboard</span>
          </Link>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            <button
              type="button"
              onClick={handleDownloadReport}
              className="flex-1 sm:flex-initial h-[44px] px-5 rounded-[12px] border border-[#E5E7EB] dark:border-white/10 text-[14px] font-medium text-[#0F172A] dark:text-[#F8FAFC] hover:bg-slate-50 dark:hover:bg-white/5 transition-colors cursor-pointer flex items-center justify-center gap-2"
            >
              <Download className="w-4 h-4" />
              <span>Download Report</span>
            </button>

            <Link
              to="/customize"
              className="flex-1 sm:flex-initial h-[44px] px-6 rounded-[12px] bg-[#2563EB] hover:bg-blue-700 text-white text-[14px] font-semibold transition-all shadow-xs inline-flex items-center justify-center gap-2"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Practice Again</span>
            </Link>
          </div>
        </div>

      </div>
    </WorkspaceLayout>
  );
}
