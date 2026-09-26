import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, useLocation, Link } from 'react-router-dom';
import { 
  CheckCircle2, 
  Download, 
  RotateCcw, 
  Award, 
  TrendingUp, 
  Zap, 
  Clock, 
  HelpCircle, 
  AlertTriangle, 
  Sparkles, 
  ArrowRight, 
  ChevronRight, 
  LayoutDashboard, 
  ShieldCheck, 
  Volume2, 
  BookOpen, 
  Check, 
  Target
} from 'lucide-react';

export default function ResultsPage() {
  const navigate = useNavigate();
  const { sessionId: paramSessionId } = useParams();
  const location = useLocation();

  // Retrieve session data from route state or localStorage
  const stateData = location.state || {};
  const sessionId = paramSessionId || stateData.sessionId || localStorage.getItem('prepnova_session_id') || 'session-prev';
  const role = stateData.role || localStorage.getItem('prepnova_role') || 'Software Engineer';
  const difficulty = stateData.difficulty || localStorage.getItem('prepnova_difficulty') || 'Medium';

  // Overall Score (default 82% from spec, dynamic if passed)
  const overallScore = stateData.finalScore ? Math.round(stateData.finalScore * 10) : 82;
  const atsScore = stateData.atsScore || 82;
  const durationText = stateData.duration || '18m 32s';
  const questionsCount = stateData.questionsAnswered || 6;
  const totalQuestions = stateData.totalQuestions || 6;

  // Active Tab state
  const [activeTab, setActiveTab] = useState('feedback'); // 'feedback' | 'questions' | 'strengths' | 'improve'

  // Animation trigger on mount
  const [animated, setAnimated] = useState(false);
  useEffect(() => {
    const timer = setTimeout(() => setAnimated(true), 80);
    return () => clearTimeout(timer);
  }, []);

  // Performance Rating Label
  const getRatingLabel = (score) => {
    if (score >= 85) return 'Excellent Performance';
    if (score >= 75) return 'Good Performance';
    if (score >= 60) return 'Needs Targeted Practice';
    return 'Needs Fundamentals';
  };

  // Score Breakdown (spec: HR Communication 80%, Technical 85%, Domain Knowledge 78%, Problem Solving 79%)
  const scoreBreakdown = [
    { label: 'HR Communication', score: stateData.categoryScores?.clarity ? Math.round(stateData.categoryScores.clarity * 10) : 80, color: 'bg-[#2563EB]' },
    { label: 'Technical', score: stateData.categoryScores?.correctness ? Math.round(stateData.categoryScores.correctness * 10) : 85, color: 'bg-[#16A34A]' },
    { label: 'Domain Knowledge', score: stateData.categoryScores?.depth ? Math.round(stateData.categoryScores.depth * 10) : 78, color: 'bg-[#3B82F6]' },
    { label: 'Problem Solving', score: stateData.categoryScores?.problemSolving || 79, color: 'bg-[#6366F1]' }
  ];

  // Questions and Detailed Feedback
  const questionsFeedback = [
    {
      id: 1,
      question: 'Tell me about yourself and your background in software engineering.',
      score: 8,
      maxScore: 10,
      feedback: 'Good structure and clarity. You highlighted your key skills well. Try to make it more concise with a tighter summary of past impact.',
      strengths: ['Clear timeline and progression', 'Strong articulation of primary tech stack'],
      improvements: ['Keep the intro strictly under 90 seconds']
    },
    {
      id: 2,
      question: 'Describe a challenging project you worked on and how you handled unexpected technical obstacles.',
      score: 9,
      maxScore: 10,
      feedback: 'Excellent use of the STAR method. You clearly defined the context, the bottleneck, and the scalable solution implemented.',
      strengths: ['Effective STAR methodology', 'Quantified results and latency drop'],
      improvements: ['Mention team collaboration and code review steps']
    },
    {
      id: 3,
      question: 'How do you design a scalable microservices architecture to handle sudden traffic spikes?',
      score: 7,
      maxScore: 10,
      feedback: 'Solid foundational concepts mentioned (load balancers, autoscaling, caching). Could go deeper into database connection pooling and circuit breakers.',
      strengths: ['Identified Redis caching layer', 'Good grasp of horizontal scaling'],
      improvements: ['Detail fallback mechanisms when third-party services degrade']
    },
    {
      id: 4,
      question: 'How do you prioritize competing deadlines and balance technical debt against business needs?',
      score: 8,
      maxScore: 10,
      feedback: 'Demonstrated strong product empathy and maturity. Showed how refactoring tasks can be incrementally baked into sprint cycles.',
      strengths: ['Clear prioritization matrix', 'Business ROI awareness'],
      improvements: ['Mention tracking technical debt via metrics and sprint points']
    }
  ];

  // Strengths List (spec: Excellent Communication, Strong Technical Knowledge, Clear STAR Structure, Confident Delivery)
  const strengthsList = [
    {
      title: 'Excellent Communication',
      description: 'Articulated complex technical concepts cleanly without excessive jargon or stuttering.',
      icon: Zap
    },
    {
      title: 'Strong Technical Knowledge',
      description: 'Solid command of modern architecture, database fundamentals, and performance optimization.',
      icon: Award
    },
    {
      title: 'Clear STAR Structure',
      description: 'Organized narrative responses effectively using Situation, Task, Action, and Result.',
      icon: CheckCircle2
    },
    {
      title: 'Confident Delivery',
      description: 'Paced answers steadily with consistent vocal projection and minimal hesitation.',
      icon: ShieldCheck
    }
  ];

  // Areas to Improve List (spec: Add more quantified achievements, Improve technical depth, Reduce filler words, Give shorter introductions)
  const areasToImproveList = [
    {
      title: 'Add more quantified achievements',
      description: 'Incorporate specific metrics (e.g. 40% latency reduction, $12k server savings) to substantiate impact.',
      tag: 'Impact'
    },
    {
      title: 'Improve technical depth',
      description: 'When asked about architecture, explain low-level trade-offs (e.g., CAP theorem, read vs write consistency).',
      tag: 'Depth'
    },
    {
      title: 'Reduce filler words',
      description: 'Watch out for occasional "um" and "like" transitions when thinking through complex multi-part questions.',
      tag: 'Delivery'
    },
    {
      title: 'Give shorter introductions',
      description: 'Aim to conclude your biographical intro in under 75 seconds to leave more runway for core questions.',
      tag: 'Brevity'
    }
  ];

  // Performance Insights (spec: Speaking Speed 136 WPM, Confidence High, ATS Readiness 82%)
  const performanceInsights = [
    {
      label: 'Speaking Speed',
      value: '136 WPM',
      sublabel: 'Optimal conversational pace',
      icon: Volume2,
      bgColor: 'bg-blue-50',
      iconColor: 'text-[#2563EB]'
    },
    {
      label: 'Confidence',
      value: 'High',
      sublabel: 'Calm, steady voice tone',
      icon: TrendingUp,
      bgColor: 'bg-emerald-50',
      iconColor: 'text-[#16A34A]'
    },
    {
      label: 'ATS Readiness',
      value: `${atsScore}%`,
      sublabel: 'Resume keyword alignment',
      icon: Target,
      bgColor: 'bg-purple-50',
      iconColor: 'text-purple-600'
    }
  ];

  // Handlers
  const handleDownloadReport = () => {
    // Generate clean text/markdown report for user download
    const reportContent = `PrepNova Mock Interview Report
Role: ${role}
Date: ${new Date().toLocaleDateString()}
Overall Score: ${overallScore}% (${getRatingLabel(overallScore)})
ATS Equivalent: ${atsScore}/100
Duration: ${durationText}
Questions Answered: ${questionsCount} of ${totalQuestions}

Score Breakdown:
- HR Communication: 80%
- Technical: 85%
- Domain Knowledge: 78%
- Problem Solving: 79%

Key Strengths:
- Excellent Communication
- Strong Technical Knowledge
- Clear STAR Structure
- Confident Delivery

Areas to Improve:
- Add more quantified achievements
- Improve technical depth
- Reduce filler words
- Give shorter introductions
`;
    const blob = new Blob([reportContent], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `PrepNova_Interview_Report_${role.replace(/\s+/g, '_')}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handlePracticeAgain = () => {
    navigate('/start-interview');
  };

  const handleBackToDashboard = () => {
    navigate('/dashboard');
  };

  // Circular progress ring calculation
  const radius = 70;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (overallScore / 100) * circumference;

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-[#0F172A] font-sans antialiased selection:bg-[#2563EB]/15 selection:text-[#2563EB] py-8 sm:py-12 px-4 sm:px-6 lg:px-8">
      
      {/* Container: Max width 1200px */}
      <div className="max-w-[1200px] mx-auto space-y-8">
        
        {/* ====================================================== */}
        {/* HEADER SECTION                                         */}
        {/* ====================================================== */}
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-2">
          <div className="flex items-start gap-4">
            {/* Success Illustration Check Circle */}
            <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-emerald-50 border border-emerald-200/60 text-[#16A34A] flex items-center justify-center shrink-0 shadow-sm">
              <CheckCircle2 className="w-8 h-8 sm:w-9 sm:h-9" />
            </div>

            <div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 text-[#2563EB] text-xs font-semibold mb-2">
                <Sparkles className="w-3.5 h-3.5" />
                <span>{role} Mock Session</span>
              </div>
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-[#0F172A] tracking-tight">
                Interview Completed 🎉
              </h1>
              <p className="text-sm sm:text-base text-[#64748B] mt-1">
                Here's your personalized performance analysis and actionable feedback.
              </p>
            </div>
          </div>

          {/* Top-Right Action Buttons */}
          <div className="flex items-center gap-3 shrink-0">
            <button
              type="button"
              onClick={handleDownloadReport}
              className="px-4 py-2.5 bg-white border border-[#E5E7EB] hover:bg-slate-50 text-[#0F172A] text-sm font-semibold rounded-xl shadow-2xs transition-all duration-180 flex items-center gap-2 hover:-translate-y-0.5 active:translate-y-0 cursor-pointer"
            >
              <Download className="w-4 h-4 text-[#64748B]" />
              <span>Download Report</span>
            </button>

            <button
              type="button"
              onClick={handlePracticeAgain}
              className="px-5 py-2.5 bg-[#2563EB] hover:bg-blue-700 text-white text-sm font-semibold rounded-xl shadow-sm shadow-[#2563EB]/25 transition-all duration-180 flex items-center gap-2 hover:-translate-y-0.5 active:translate-y-0 cursor-pointer"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Practice Again</span>
            </button>
          </div>
        </header>

        {/* ====================================================== */}
        {/* TOP SCORE SECTION (Two-Column Layout)                  */}
        {/* ====================================================== */}
        <section className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* Left Card: Overall Score */}
          <div className="lg:col-span-5 bg-white rounded-[20px] border border-[#E5E7EB] p-6 sm:p-8 shadow-xs flex flex-col items-center justify-between text-center transition-all duration-180 hover:shadow-sm">
            <div className="w-full text-left pb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-[#64748B]">
                Overall Score
              </span>
            </div>

            {/* Circular Progress Ring */}
            <div className="relative my-4 flex items-center justify-center">
              <svg className="w-44 h-44 -rotate-90 transform" viewBox="0 0 160 160">
                {/* Background Ring */}
                <circle
                  cx="80"
                  cy="80"
                  r={radius}
                  stroke="#F1F5F9"
                  strokeWidth="12"
                  fill="transparent"
                />
                {/* Animated Score Ring */}
                <circle
                  cx="80"
                  cy="80"
                  r={radius}
                  stroke="#2563EB"
                  strokeWidth="12"
                  strokeDasharray={circumference}
                  strokeDashoffset={animated ? strokeDashoffset : circumference}
                  strokeLinecap="round"
                  fill="transparent"
                  className="transition-all duration-1000 ease-out"
                />
              </svg>

              {/* Center Text */}
              <div className="absolute flex flex-col items-center justify-center">
                <span className="text-4xl sm:text-5xl font-extrabold text-[#0F172A] tracking-tight">
                  {overallScore}%
                </span>
                <span className="text-xs font-semibold text-[#16A34A] mt-0.5 px-2 py-0.5 bg-emerald-50 rounded-full">
                  {getRatingLabel(overallScore)}
                </span>
              </div>
            </div>

            {/* Below Stats: ATS Equivalent, Duration, Questions */}
            <div className="w-full grid grid-cols-3 gap-2 pt-6 border-t border-[#E5E7EB] text-center">
              <div className="p-2">
                <div className="text-xs text-[#64748B]">ATS Equivalent</div>
                <div className="text-lg font-bold text-[#0F172A] mt-0.5">{atsScore}</div>
              </div>
              <div className="p-2 border-x border-[#E5E7EB]">
                <div className="text-xs text-[#64748B]">Duration</div>
                <div className="text-lg font-bold text-[#0F172A] mt-0.5">{durationText}</div>
              </div>
              <div className="p-2">
                <div className="text-xs text-[#64748B]">Questions</div>
                <div className="text-lg font-bold text-[#0F172A] mt-0.5">{questionsCount}/{totalQuestions}</div>
              </div>
            </div>
          </div>

          {/* Right Card: Score Breakdown */}
          <div className="lg:col-span-7 bg-white rounded-[20px] border border-[#E5E7EB] p-6 sm:p-8 shadow-xs flex flex-col justify-between transition-all duration-180 hover:shadow-sm">
            <div>
              <div className="flex items-center justify-between pb-4 border-b border-[#E5E7EB]">
                <h3 className="font-bold text-base sm:text-lg text-[#0F172A]">
                  Score Breakdown
                </h3>
                <span className="text-xs text-[#64748B]">
                  Evaluated across 4 key competencies
                </span>
              </div>

              {/* Four Animated Progress Bars */}
              <div className="space-y-6 pt-6">
                {scoreBreakdown.map((item, idx) => (
                  <div key={idx} className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-semibold text-[#0F172A]">{item.label}</span>
                      <span className="font-bold text-[#0F172A]">{item.score}%</span>
                    </div>

                    <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden">
                      <div 
                        className={`h-full ${item.color} rounded-full transition-all duration-1000 ease-out`}
                        style={{ width: animated ? `${item.score}%` : '0%' }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-[#E5E7EB] flex items-center justify-between text-xs text-[#64748B]">
              <span>Passing benchmark: 70%</span>
              <span className="text-[#16A34A] font-semibold flex items-center gap-1">
                <Check className="w-3.5 h-3.5" /> All criteria met
              </span>
            </div>
          </div>

        </section>

        {/* ====================================================== */}
        {/* PERFORMANCE INSIGHTS (Three Statistic Cards)           */}
        {/* ====================================================== */}
        <section className="grid grid-cols-1 sm:grid-cols-3 gap-5">
          {performanceInsights.map((insight, idx) => {
            const Icon = insight.icon;
            return (
              <div 
                key={idx}
                className="bg-white rounded-[20px] border border-[#E5E7EB] p-5 shadow-xs flex items-center gap-4 transition-all duration-180 hover:-translate-y-0.5 hover:shadow-sm"
              >
                <div className={`w-12 h-12 rounded-2xl ${insight.bgColor} ${insight.iconColor} flex items-center justify-center shrink-0`}>
                  <Icon className="w-6 h-6" />
                </div>
                <div>
                  <div className="text-xs text-[#64748B] font-medium">{insight.label}</div>
                  <div className="text-xl font-extrabold text-[#0F172A] leading-tight mt-0.5">{insight.value}</div>
                  <div className="text-[11px] text-[#64748B] mt-0.5">{insight.sublabel}</div>
                </div>
              </div>
            );
          })}
        </section>

        {/* ====================================================== */}
        {/* DETAILED FEEDBACK TABS & LIST                          */}
        {/* ====================================================== */}
        <section className="bg-white rounded-[20px] border border-[#E5E7EB] shadow-xs overflow-hidden transition-all duration-180">
          
          {/* Tab Navigation Header */}
          <div className="border-b border-[#E5E7EB] px-6 sm:px-8 pt-4 flex items-center gap-6 overflow-x-auto">
            {[
              { id: 'feedback', label: 'Detailed Feedback' },
              { id: 'questions', label: 'All Questions' },
              { id: 'strengths', label: 'Strengths' },
              { id: 'improve', label: 'Areas to Improve' }
            ].map(tab => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`pb-4 text-sm font-semibold relative transition-colors duration-180 whitespace-nowrap cursor-pointer ${
                  activeTab === tab.id ? 'text-[#2563EB]' : 'text-[#64748B] hover:text-[#0F172A]'
                }`}
              >
                <span>{tab.label}</span>
                {activeTab === tab.id && (
                  <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#2563EB] rounded-full transition-all duration-180" />
                )}
              </button>
            ))}
          </div>

          {/* Tab Content Area */}
          <div className="p-6 sm:p-8">
            
            {/* TAB 1 & 2: Detailed Feedback / All Questions */}
            {(activeTab === 'feedback' || activeTab === 'questions') && (
              <div className="space-y-5">
                {questionsFeedback.map((item, idx) => {
                  // Border color: Green on high (>=8), Orange on medium (>=6), Red on low (<6)
                  const borderAccent = item.score >= 8 
                    ? 'border-emerald-200 bg-emerald-50/20' 
                    : item.score >= 6 
                      ? 'border-amber-200 bg-amber-50/20' 
                      : 'border-red-200 bg-red-50/20';

                  const badgeColor = item.score >= 8 
                    ? 'bg-emerald-50 text-[#16A34A] border-emerald-200' 
                    : item.score >= 6 
                      ? 'bg-amber-50 text-[#F59E0B] border-amber-200' 
                      : 'bg-red-50 text-[#EF4444] border-red-200';

                  return (
                    <div 
                      key={item.id}
                      className={`p-5 sm:p-6 rounded-2xl border ${borderAccent} bg-white shadow-2xs transition-all duration-180 hover:shadow-sm`}
                    >
                      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 mb-3">
                        <div className="flex items-baseline gap-2.5">
                          <span className="text-xs font-bold uppercase tracking-wider text-[#2563EB] bg-blue-50 px-2.5 py-1 rounded-lg shrink-0">
                            Q{item.id}
                          </span>
                          <h4 className="font-semibold text-base sm:text-lg text-[#0F172A] leading-snug">
                            {item.question}
                          </h4>
                        </div>

                        {/* Score Badge */}
                        <div className={`px-3 py-1 rounded-full text-xs font-bold border shrink-0 ${badgeColor}`}>
                          {item.score}/{item.maxScore}
                        </div>
                      </div>

                      <p className="text-sm text-[#0F172A]/90 leading-relaxed pl-0 sm:pl-10">
                        {item.feedback}
                      </p>

                      {/* Strengths & Improvements chips */}
                      <div className="mt-4 pt-3 border-t border-slate-100 flex flex-wrap gap-2 pl-0 sm:pl-10">
                        {item.strengths.map((str, sIdx) => (
                          <span key={sIdx} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-800 text-xs font-medium">
                            <Check className="w-3 h-3 text-[#16A34A]" />
                            <span>{str}</span>
                          </span>
                        ))}
                        {item.improvements.map((imp, iIdx) => (
                          <span key={iIdx} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-amber-50 text-amber-800 text-xs font-medium">
                            <AlertTriangle className="w-3 h-3 text-[#F59E0B]" />
                            <span>{imp}</span>
                          </span>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* TAB 3: Strengths Tab */}
            {activeTab === 'strengths' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                {strengthsList.map((str, idx) => {
                  const Icon = str.icon;
                  return (
                    <div 
                      key={idx}
                      className="p-5 rounded-2xl bg-white border border-[#E5E7EB] shadow-2xs flex items-start gap-4 transition-all duration-180 hover:-translate-y-0.5 hover:shadow-sm"
                    >
                      <div className="w-10 h-10 rounded-xl bg-emerald-50 text-[#16A34A] flex items-center justify-center shrink-0">
                        <Icon className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="font-bold text-sm text-[#0F172A]">{str.title}</h4>
                        <p className="text-xs text-[#64748B] mt-1 leading-relaxed">{str.description}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* TAB 4: Areas to Improve */}
            {activeTab === 'improve' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                {areasToImproveList.map((item, idx) => (
                  <div 
                    key={idx}
                    className="p-5 rounded-2xl bg-white border border-[#E5E7EB] shadow-2xs flex items-start gap-4 transition-all duration-180 hover:-translate-y-0.5 hover:shadow-sm"
                  >
                    <div className="w-10 h-10 rounded-xl bg-amber-50 text-[#F59E0B] flex items-center justify-center shrink-0">
                      <AlertTriangle className="w-5 h-5" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <h4 className="font-bold text-sm text-[#0F172A]">{item.title}</h4>
                        <span className="text-[10px] font-semibold uppercase px-2 py-0.5 rounded-full bg-slate-100 text-[#64748B]">
                          {item.tag}
                        </span>
                      </div>
                      <p className="text-xs text-[#64748B] mt-1 leading-relaxed">{item.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}

          </div>
        </section>

        {/* ====================================================== */}
        {/* BOTTOM CTA: Keep Improving 🚀                          */}
        {/* ====================================================== */}
        <section className="bg-white rounded-[20px] border border-[#E5E7EB] p-8 sm:p-10 text-center shadow-xs transition-all duration-180">
          <div className="max-w-xl mx-auto space-y-4">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-[#0F172A] tracking-tight">
              Keep Improving 🚀
            </h2>
            <p className="text-sm text-[#64748B]">
              Target your areas of improvement with another personalized practice round or review your overall trajectory on the dashboard.
            </p>

            <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
              <button
                type="button"
                onClick={handlePracticeAgain}
                className="w-full sm:w-auto px-6 py-3 bg-[#2563EB] hover:bg-blue-700 text-white text-sm font-semibold rounded-xl shadow-sm shadow-[#2563EB]/25 transition-all duration-180 flex items-center justify-center gap-2 hover:-translate-y-0.5 active:translate-y-0 cursor-pointer"
              >
                <RotateCcw className="w-4 h-4" />
                <span>Practice Another Interview</span>
              </button>

              <button
                type="button"
                onClick={handleBackToDashboard}
                className="w-full sm:w-auto px-6 py-3 bg-white border border-[#E5E7EB] hover:bg-slate-50 text-[#0F172A] text-sm font-semibold rounded-xl shadow-2xs transition-all duration-180 flex items-center justify-center gap-2 hover:-translate-y-0.5 active:translate-y-0 cursor-pointer"
              >
                <LayoutDashboard className="w-4 h-4 text-[#64748B]" />
                <span>Back to Dashboard</span>
              </button>
            </div>
          </div>
        </section>

      </div>
    </div>
  );
}
