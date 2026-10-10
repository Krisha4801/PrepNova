import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import WorkspaceLayout from '../components/layout/WorkspaceLayout';
import HistoryTable from '../components/history/HistoryTable';
import { getInterviewHistoryApi } from '../lib/api';

export default function History() {
  const navigate = useNavigate();
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    async function loadHistory() {
      try {
        const res = await getInterviewHistoryApi(1, 50);
        if (isMounted && res.sessions) {
          const mapped = res.sessions.map((s, idx) => ({
            id: s.sessionId || s.id || `session-${idx}`,
            sessionId: s.sessionId || s.id,
            role: s.targetRole || s.role || 'Software Engineer',
            domain: `${s.interviewMode || 'Technical'} • ${s.questionsAnswered || 0} Questions`,
            date: s.completedAt ? new Date(s.completedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'Recent',
            difficulty: s.difficultyLevel || s.difficulty || 'Intermediate',
            score: s.finalScore ? Math.round(s.finalScore * 10) : null,
            status: s.status === 'completed' ? 'Completed' : (s.status === 'in_progress' ? 'In Progress' : s.status),
            duration: s.duration || `${s.questionsAnswered * 2 || 12}m 00s`,
            questions: s.questionsAnswered || s.totalQuestions || 6,
            pdfUrl: `/api/interview/${s.sessionId || s.id}/pdf`,
          }));
          setSessions(mapped);
        }
      } catch (err) {
        console.warn("Failed to fetch interview history from server:", err);
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    loadHistory();
    return () => { isMounted = false; };
  }, []);

  const handleViewReport = (report) => {
    const sid = report.sessionId || report.id;
    if (sid) {
      navigate(`/results/${sid}`, {
        state: {
          sessionId: sid,
          role: report.role || 'Software Engineer',
          finalScore: (report.score || 82) / 10,
          atsScore: report.score || 82,
          duration: report.duration || '18m 32s',
          questionsAnswered: report.questions || 6,
          totalQuestions: report.questions || 6
        }
      });
    } else {
      navigate('/results', {
        state: {
          role: report.role || 'Software Engineer',
          finalScore: (report.score || 82) / 10,
          atsScore: report.score || 82,
          duration: report.duration || '18m 32s',
          questionsAnswered: report.questions || 6,
          totalQuestions: report.questions || 6
        }
      });
    }
  };

  const handleExportHistory = () => {
    const headers = ['Role', 'Domain/Details', 'Date', 'Difficulty', 'Score (%)', 'Status'];
    const rows = sessions.length > 0 
      ? sessions.map(s => [s.role, s.domain, s.date, s.difficulty, s.score || 'N/A', s.status])
      : [
          ['Senior Distributed Systems Engineer', 'Technical Architecture', '14 Oct 2026', 'Hard', '94', 'Completed'],
          ['Full Stack Engineer (React + Node)', 'Product Engineering', '11 Oct 2026', 'Medium', '88', 'Completed']
        ];

    const csvContent = [headers.join(','), ...rows.map(e => `"${e.join('","')}"`)].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `PrepNova_Interview_History_${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <WorkspaceLayout title="Interview History">
      
      {/* Top Header section */}
      <div className="pb-2 border-b border-[#E5E7EB] dark:border-[#334155]/60">
        <h2 className="text-2xl sm:text-3xl font-extrabold text-[#0F172A] dark:text-[#F8FAFC] tracking-tight">
          Interview History
        </h2>
        <p className="text-sm sm:text-base text-[#64748B] dark:text-[#94A3B8] mt-1">
          Review previous mock interviews, performance scores, and download PDF reports.
        </p>
      </div>

      {/* Controls & Table Container */}
      <HistoryTable 
        initialReports={sessions} 
        isLoading={loading}
        onViewReport={handleViewReport} 
        onExport={handleExportHistory}
      />

    </WorkspaceLayout>
  );
}

