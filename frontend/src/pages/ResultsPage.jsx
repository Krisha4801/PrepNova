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
  Target,
  AlertTriangle,
  FileText,
  UserCheck,
  RefreshCw,
  Loader2,
  Check
} from 'lucide-react';
import WorkspaceLayout from '../components/layout/WorkspaceLayout';
import { getInterviewReportApi, retryInterviewReportApi, getStoredToken } from '../lib/api';

export default function ResultsPage() {
  const navigate = useNavigate();
  const { sessionId: paramSessionId } = useParams();
  const location = useLocation();

  const stateData = location.state || {};
  const sessionId = paramSessionId || stateData.sessionId || localStorage.getItem('prepnova_session_id') || '';
  
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(Boolean(sessionId));
  const [retrying, setRetrying] = useState(false);
  const [retryError, setRetryError] = useState(null);

  const loadReport = async () => {
    if (!sessionId || sessionId === 'session-completed') {
      setLoading(false);
      return null;
    }
    try {
      const res = await getInterviewReportApi(sessionId);
      const sessionObj = res?.session || (res?.sessionId ? res : null);
      if (sessionObj) {
        setReport(sessionObj);
        return sessionObj;
      }
    } catch (err) {
      console.warn("Could not fetch remote interview report:", err);
    } finally {
      setLoading(false);
    }
    return null;
  };

  useEffect(() => {
    let isMounted = true;
    let pollInterval = null;
    let attempts = 0;
    const maxAttempts = 30; // Poll for up to 60s

    const checkAndPoll = async () => {
      const initialReport = await loadReport();
      if (!isMounted) return;

      const isStillRunning =
        !initialReport?.finalReport &&
        (initialReport?.reportStatus === 'running' ||
          initialReport?.reportStatus === 'not_started' ||
          initialReport?.status === 'evaluating' ||
          !initialReport);

      if (isStillRunning) {
        pollInterval = setInterval(async () => {
          attempts += 1;
          if (!isMounted) return;
          const updated = await loadReport();
          if (
            updated?.finalReport ||
            updated?.reportStatus === 'completed' ||
            updated?.reportStatus === 'failed' ||
            attempts >= maxAttempts
          ) {
            clearInterval(pollInterval);
          }
        }, 2000);
      }
    };

    checkAndPoll();

    return () => {
      isMounted = false;
      if (pollInterval) clearInterval(pollInterval);
    };
  }, [sessionId]);

  const handleRetryEvaluation = async () => {
    if (!sessionId) return;
    setRetrying(true);
    setRetryError(null);
    try {
      const res = await retryInterviewReportApi(sessionId);
      if (res.finalReport || res.report) {
        await loadReport();
      }
    } catch (err) {
      setRetryError(err.message || 'Evaluation retry failed. Please try again.');
    } finally {
      setRetrying(false);
    }
  };

  const role = report?.targetRole || stateData.role || localStorage.getItem('prepnova_role') || 'Software Engineer';
  const difficulty = report?.difficultyLevel || stateData.difficulty || localStorage.getItem('prepnova_difficulty') || 'Intermediate';

  const rawScore = typeof report?.finalScore === 'number'
    ? report.finalScore
    : (typeof stateData.finalScore === 'number' ? stateData.finalScore : 0);
  const overallScore = Math.max(0, Math.min(100, Math.round(Number(rawScore) * 10)));
  const durationText = report?.duration || stateData.duration || '00:00';
  const totalQuestions = report?.totalQuestions || stateData.totalQuestions || 3;
  const rawQuestionsCount = report?.questionsAnswered ?? stateData.questionsAnswered ?? totalQuestions;
  const questionsCount = Math.min(rawQuestionsCount, totalQuestions);

  const getDimScore = (val) => (typeof val === 'number' ? val : 0);

  const categoryScores = {
    relevance: getDimScore(report?.categoryScores?.relevance ?? stateData.categoryScores?.relevance),
    correctness: getDimScore(report?.categoryScores?.correctness ?? stateData.categoryScores?.correctness),
    completeness: getDimScore(report?.categoryScores?.completeness ?? stateData.categoryScores?.completeness),
    clarity: getDimScore(report?.categoryScores?.clarity ?? stateData.categoryScores?.clarity),
    depth: getDimScore(report?.categoryScores?.depth ?? stateData.categoryScores?.depth),
  };

  const introEvaluation = report?.introEvaluation || null;
  const sectionSummaries = report?.sectionSummaries || {};

  const strengths = report?.strengths?.length
    ? report.strengths
    : (overallScore > 0
        ? ['Demonstrated engagement with prompt topics during the interview.']
        : ['No substantive answers provided during this session to assess strengths.']);

  const weaknesses = report?.weaknesses?.length
    ? report.weaknesses
    : (overallScore > 0
        ? ['Elaborate further on scaling bottlenecks and concrete metrics in answers.']
        : ['Questions were skipped or left unanswered. Practice attempting each question with concrete examples.']);

  const preparationPlan = report?.preparationPlan?.length
    ? report.preparationPlan
    : (overallScore > 0
        ? [
            `Practice articulating architectural trade-offs using quantifiable metrics for ${role}.`,
            'Structure problem-solving responses using the Definition -> Mechanism -> Trade-off pattern.',
            'Review edge cases, error boundary patterns, and recovery mechanisms.'
          ]
        : [
            `Review core technical fundamentals for ${role}.`,
            'Practice answering mock questions aloud without skipping.',
            'Structure responses using key architectural primitives and trade-offs.'
          ]);

  const getRatingLabel = (score) => {
    if (score >= 85) return 'Interview Ready';
    if (score >= 70) return 'Solid Foundation';
    if (score >= 50) return 'Needs Targeted Practice';
    if (score > 0) return 'Review Fundamentals';
    return 'Incomplete Assessment';
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
Questions Completed: ${questionsCount}/${totalQuestions}

Category Scores:
- Correctness: ${Math.round((categoryScores.correctness || 8) * 10)}%
- Clarity: ${Math.round((categoryScores.clarity || 8) * 10)}%
- Technical Depth: ${Math.round((categoryScores.depth || 8) * 10)}%
- Relevance: ${Math.round((categoryScores.relevance || 8) * 10)}%
- Completeness: ${Math.round((categoryScores.completeness || 8) * 10)}%

Preparation Plan:
${preparationPlan.map((p, i) => `${i + 1}. ${p}`).join('\n')}
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

  const isEvaluationFailed = report?.reportStatus === 'failed' || report?.status === 'evaluation_failed';
  const isEvaluating = report?.reportStatus === 'running' || report?.status === 'evaluating';

  return (
    <WorkspaceLayout title="Interview Scorecard">
      <div className="max-w-4xl mx-auto space-y-7">
        
        {/* If report is still processing or failed */}
        {isEvaluating && (
          <div className="p-4 rounded-2xl bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-900/60 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <Loader2 className="w-5 h-5 text-indigo-600 animate-spin shrink-0" />
              <div>
                <h4 className="text-sm font-bold text-slate-900 dark:text-white">Generating Complete Report</h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Your transcript has been saved. The AI engine is evaluating your answers.</p>
              </div>
            </div>
            <button
              type="button"
              onClick={loadReport}
              className="btn-secondary text-xs px-3 py-1.5"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Refresh</span>
            </button>
          </div>
        )}

        {isEvaluationFailed && (
          <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/60 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />
              <div>
                <h4 className="text-sm font-bold text-slate-900 dark:text-white">Report Generation Pending</h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Your interview transcript is safely preserved. Click below to retry generating your report.</p>
              </div>
            </div>
            <button
              type="button"
              disabled={retrying}
              onClick={handleRetryEvaluation}
              className="btn-primary text-xs px-3 py-1.5 bg-amber-600 hover:bg-amber-700"
            >
              {retrying ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
              <span>{retrying ? 'Evaluating...' : 'Retry Report'}</span>
            </button>
          </div>
        )}

        {/* Top Summary Card */}
        <div className="panel-card bg-gradient-to-br from-slate-900 via-[#0B132B] to-indigo-950 text-white border-slate-800 p-6 sm:p-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
            <div className="space-y-2">
              <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-indigo-900/60 border border-indigo-700/50 text-indigo-300 text-xs font-semibold">
                {isEvaluating && !report?.finalReport ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Evaluating Answers...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Evaluation Complete</span>
                  </>
                )}
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

        {/* Candidate Opening Self-Introduction Review */}
        {introEvaluation && (
          <div className="panel-card space-y-4 border-indigo-200/80 dark:border-indigo-900/50">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-indigo-100 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                  <UserCheck className="w-4 h-4" />
                </div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Opening Self-Introduction Assessment
                </h3>
              </div>
              <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-indigo-50 dark:bg-indigo-950/80 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800">
                Score: {Math.round(introEvaluation.score * 10)}%
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800">
                <span className="font-bold text-slate-500 uppercase tracking-wider block mb-1">Structure & Pacing</span>
                <p className="text-slate-700 dark:text-slate-300">{introEvaluation.structure}</p>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800">
                <span className="font-bold text-slate-500 uppercase tracking-wider block mb-1">Role Relevance</span>
                <p className="text-slate-700 dark:text-slate-300">{introEvaluation.role_relevance || introEvaluation.roleRelevance}</p>
              </div>
            </div>

            {introEvaluation.sample_improved_answer && (
              <div className="p-4 rounded-xl bg-indigo-50/60 dark:bg-indigo-950/30 border border-indigo-100 dark:border-indigo-900/40 text-xs space-y-1.5">
                <span className="font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider block">
                  Exemplar Improved Structure
                </span>
                <p className="text-slate-700 dark:text-slate-300 italic leading-relaxed">
                  "{introEvaluation.sample_improved_answer}"
                </p>
              </div>
            )}
          </div>
        )}

        {/* 5-Category Breakdown Metrics */}
        <div className="panel-card space-y-5">
          <h3 className="text-base font-bold text-slate-900 dark:text-white">
            5-Dimension Rubric Evaluation
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800 space-y-2">
              <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">Technical Correctness</span>
              <div className="flex items-baseline justify-between">
                <span className="text-2xl font-extrabold text-slate-900 dark:text-white">
                  {Math.round(categoryScores.correctness * 10)}%
                </span>
                <span className={`text-xs font-semibold ${categoryScores.correctness >= 7 ? 'text-emerald-600 dark:text-emerald-400' : (categoryScores.correctness > 0 ? 'text-amber-600 dark:text-amber-400' : 'text-slate-500 dark:text-slate-400')}`}>
                  {categoryScores.correctness >= 7 ? 'Accurate' : (categoryScores.correctness > 0 ? 'Review Needed' : 'Not Assessed')}
                </span>
              </div>
              <div className="w-full bg-slate-200 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
                <div 
                  className="bg-emerald-500 h-full rounded-full transition-all duration-500" 
                  style={{ width: `${Math.round(categoryScores.correctness * 10)}%` }} 
                />
              </div>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800 space-y-2">
              <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">Communication Clarity</span>
              <div className="flex items-baseline justify-between">
                <span className="text-2xl font-extrabold text-slate-900 dark:text-white">
                  {Math.round(categoryScores.clarity * 10)}%
                </span>
                <span className={`text-xs font-semibold ${categoryScores.clarity >= 7 ? 'text-indigo-600 dark:text-indigo-400' : (categoryScores.clarity > 0 ? 'text-amber-600 dark:text-amber-400' : 'text-slate-500 dark:text-slate-400')}`}>
                  {categoryScores.clarity >= 7 ? 'Structured' : (categoryScores.clarity > 0 ? 'Needs Structure' : 'Not Assessed')}
                </span>
              </div>
              <div className="w-full bg-slate-200 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
                <div 
                  className="bg-indigo-600 h-full rounded-full transition-all duration-500" 
                  style={{ width: `${Math.round(categoryScores.clarity * 10)}%` }} 
                />
              </div>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800 space-y-2">
              <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">Technical Depth</span>
              <div className="flex items-baseline justify-between">
                <span className="text-2xl font-extrabold text-slate-900 dark:text-white">
                  {Math.round(categoryScores.depth * 10)}%
                </span>
                <span className={`text-xs font-semibold ${categoryScores.depth >= 7 ? 'text-blue-600 dark:text-blue-400' : (categoryScores.depth > 0 ? 'text-amber-600 dark:text-amber-400' : 'text-slate-500 dark:text-slate-400')}`}>
                  {categoryScores.depth >= 7 ? 'Detailed' : (categoryScores.depth > 0 ? 'Add Trade-offs' : 'Not Assessed')}
                </span>
              </div>
              <div className="w-full bg-slate-200 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
                <div 
                  className="bg-blue-600 h-full rounded-full transition-all duration-500" 
                  style={{ width: `${Math.round(categoryScores.depth * 10)}%` }} 
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
              <span>Key Strengths Observed</span>
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

        {/* Personalized Preparation Action Plan */}
        <div className="panel-card space-y-4">
          <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400 font-bold text-sm">
            <Target className="w-4 h-4" />
            <span>Targeted Preparation Action Plan</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            {preparationPlan.map((item, idx) => (
              <div 
                key={idx}
                className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800 flex items-start gap-3"
              >
                <span className="w-5 h-5 rounded-full bg-indigo-100 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">
                  {idx + 1}
                </span>
                <span className="text-slate-700 dark:text-slate-300 leading-relaxed">{item}</span>
              </div>
            ))}
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
