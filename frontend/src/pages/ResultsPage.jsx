import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, useLocation, Link } from 'react-router-dom';
import { 
  CheckCircle2, 
  Download, 
  RotateCcw, 
  TrendingUp, 
  Clock, 
  Sparkles, 
  ArrowRight, 
  ChevronRight, 
  LayoutDashboard, 
  ShieldCheck, 
  BookOpen, 
  Check, 
  Target,
  AlertTriangle,
  FileText
} from 'lucide-react';
import WorkspaceLayout from '../components/layout/WorkspaceLayout';
import { getInterviewReportApi, getStoredToken } from '../lib/api';

export default function ResultsPage() {
  const navigate = useNavigate();
  const { sessionId: paramSessionId } = useParams();
  const location = useLocation();

  const stateData = location.state || {};
  const sessionId = paramSessionId || stateData.sessionId || localStorage.getItem('prepnova_session_id') || '';
  
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(Boolean(sessionId));

  useEffect(() => {
    let isMounted = true;
    async function loadReport() {
      if (!sessionId || sessionId === 'session-completed') {
        setLoading(false);
        return;
      }
      try {
        const res = await getInterviewReportApi(sessionId);
        if (isMounted && res.session) {
          setReport(res.session);
        }
      } catch (err) {
        console.warn("Could not fetch remote interview report:", err);
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    loadReport();
    return () => { isMounted = false; };
  }, [sessionId]);

  const role = report?.targetRole || stateData.role || localStorage.getItem('prepnova_role') || 'Software Engineer';
  const difficulty = report?.difficultyLevel || stateData.difficulty || localStorage.getItem('prepnova_difficulty') || 'Intermediate';

  const rawScore = report?.finalScore !== undefined ? report.finalScore : (stateData.finalScore !== undefined ? stateData.finalScore : 8.2);
  const overallScore = Math.round(Number(rawScore) * 10);
  const durationText = report?.duration || stateData.duration || '12m 40s';
  const questionsCount = report?.questionsAnswered || stateData.questionsAnswered || stateData.totalQuestions || 6;
  const totalQuestions = report?.totalQuestions || stateData.totalQuestions || 6;

  const categoryScores = report?.categoryScores || stateData.categoryScores || {
    relevance: 8.5,
    correctness: 8.5,
    completeness: 8.0,
    clarity: 8.0,
    depth: 7.8
  };

  const strengths = report?.strengths?.length ? report.strengths : [
    'Accurately identified core technical definitions and architectural primitives.',
    'Demonstrated concise, professional communication when addressing prompt questions.',
    'Structured responses with clear context and rationale.'
  ];

  const weaknesses = report?.weaknesses?.length ? report.weaknesses : [
    'Elaborate further on scaling bottlenecks and memory/runtime tradeoffs.',
    'Provide concrete production examples or quantifiable metrics in answers.',
    'Review edge cases and error handling mechanisms during code design questions.'
  ];

  const getRatingLabel = (score) => {
    if (score >= 85) return 'Interview Ready';
    if (score >= 70) return 'Solid Foundation';
    if (score >= 50) return 'Needs Targeted Practice';
    return 'Review Fundamentals';
  };

  const handleDownloadReport = async () => {
    if (sessionId && sessionId !== 'session-completed') {
      const token = getStoredToken();
      const pdfUrl = `http://localhost:5000/api/interview/${encodeURIComponent(sessionId)}/pdf`;
      try {
        const resp = await fetch(pdfUrl, {
          headers: { ...(token && { Authorization: `Bearer ${token}` }) }
        });
        if (resp.ok) {
          const blob = await resp.blob();
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `PrepNova_Report_${role.replace(/\s+/g, '_')}_${Date.now()}.html`;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          URL.revokeObjectURL(url);
          return;
        }
      } catch (e) {
        console.warn("PDF download error:", e);
      }
    }

    const content = `PrepNova Mock Interview Report
Role: ${role}
Difficulty: ${difficulty}
Overall Score: ${overallScore}% (${getRatingLabel(overallScore)})
Duration: ${durationText}
Questions Answered: ${questionsCount}/${totalQuestions}

Category Scores:
- Correctness: ${Math.round((categoryScores.correctness || 8) * 10)}%
- Clarity: ${Math.round((categoryScores.clarity || 8) * 10)}%
- Technical Depth: ${Math.round((categoryScores.depth || 8) * 10)}%
`;
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `PrepNova_Report_${role.replace(/\s+/g, '_')}_${Date.now()}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };


  return (
    <WorkspaceLayout title="Interview Scorecard">
      <div className="max-w-4xl mx-auto space-y-7">
        
        {/* Top Summary Card */}
        <div className="panel-card bg-gradient-to-br from-slate-900 via-[#0B132B] to-indigo-950 text-white border-slate-800 p-6 sm:p-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
            <div className="space-y-2">
              <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-indigo-900/60 border border-indigo-700/50 text-indigo-300 text-xs font-semibold">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Evaluation Complete</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
                {role} Scorecard
              </h2>
              <p className="text-xs sm:text-sm text-slate-300">
                Tier: <span className="capitalize font-semibold">{difficulty}</span> • Duration: <span className="font-mono">{durationText}</span> • {questionsCount}/{totalQuestions} questions completed
              </p>
            </div>

            {/* Big Score Badge */}
            <div className="flex flex-col items-center sm:items-end shrink-0">
              <div className="px-5 py-3 rounded-2xl bg-indigo-600/90 border border-indigo-400/40 text-center">
                <span className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">{overallScore}%</span>
                <span className="block text-[11px] font-bold text-indigo-100 uppercase tracking-wider mt-0.5">
                  {getRatingLabel(overallScore)}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Category Breakdown Metrics */}
        <div className="panel-card space-y-5">
          <h3 className="text-base font-bold text-slate-900 dark:text-white">
            Rubric Category Breakdown
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800 space-y-2">
              <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">Technical Correctness</span>
              <div className="flex items-baseline justify-between">
                <span className="text-2xl font-extrabold text-slate-900 dark:text-white">
                  {Math.round((categoryScores.correctness || 8.5) * 10)}%
                </span>
                <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                  {categoryScores.correctness >= 7 ? 'Passing' : 'Review Needed'}
                </span>
              </div>
              <div className="w-full bg-slate-200 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
                <div 
                  className="bg-emerald-500 h-full rounded-full" 
                  style={{ width: `${Math.round((categoryScores.correctness || 8.5) * 10)}%` }} 
                />
              </div>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800 space-y-2">
              <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">Communication Clarity</span>
              <div className="flex items-baseline justify-between">
                <span className="text-2xl font-extrabold text-slate-900 dark:text-white">
                  {Math.round((categoryScores.clarity || 8.0) * 10)}%
                </span>
                <span className="text-xs font-semibold text-indigo-600 dark:text-indigo-400">
                  {categoryScores.clarity >= 7 ? 'Structured' : 'Needs Structure'}
                </span>
              </div>
              <div className="w-full bg-slate-200 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
                <div 
                  className="bg-indigo-600 h-full rounded-full" 
                  style={{ width: `${Math.round((categoryScores.clarity || 8.0) * 10)}%` }} 
                />
              </div>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800 space-y-2">
              <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">Technical Depth</span>
              <div className="flex items-baseline justify-between">
                <span className="text-2xl font-extrabold text-slate-900 dark:text-white">
                  {Math.round((categoryScores.depth || 7.8) * 10)}%
                </span>
                <span className="text-xs font-semibold text-blue-600 dark:text-blue-400">
                  {categoryScores.depth >= 7 ? 'Detailed' : 'Add Tradeoffs'}
                </span>
              </div>
              <div className="w-full bg-slate-200 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
                <div 
                  className="bg-blue-600 h-full rounded-full" 
                  style={{ width: `${Math.round((categoryScores.depth || 7.8) * 10)}%` }} 
                />
              </div>
            </div>
          </div>
        </div>

        {/* Strengths and Next Practice Action Items */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div className="panel-card space-y-3">
            <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-bold text-sm">
              <CheckCircle2 className="w-4 h-4" />
              <span>Key Strengths</span>
            </div>
            <ul className="space-y-2 text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              {strengths.map((str, idx) => (
                <li key={idx} className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0 mt-1.5" />
                  <span>{str}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="panel-card space-y-3">
            <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400 font-bold text-sm">
              <AlertTriangle className="w-4 h-4" />
              <span>Focus Improvement Areas</span>
            </div>
            <ul className="space-y-2 text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              {weaknesses.map((weak, idx) => (
                <li key={idx} className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0 mt-1.5" />
                  <span>{weak}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>


        {/* Action Row */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-2">
          <Link
            to="/dashboard"
            className="btn-secondary text-xs text-center"
          >
            <LayoutDashboard className="w-4 h-4" />
            <span>Return to Dashboard</span>
          </Link>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handleDownloadReport}
              className="btn-secondary text-xs flex-1 sm:flex-initial"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download Report</span>
            </button>

            <Link
              to="/start-interview"
              className="btn-primary text-xs flex-1 sm:flex-initial text-center"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Start New Mock</span>
            </Link>
          </div>
        </div>

      </div>
    </WorkspaceLayout>
  );
}
