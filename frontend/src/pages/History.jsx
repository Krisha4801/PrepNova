import React from 'react';
import { useNavigate } from 'react-router-dom';
import WorkspaceLayout from '../components/layout/WorkspaceLayout';
import HistoryTable from '../components/history/HistoryTable';

export default function History() {
  const navigate = useNavigate();

  const handleViewReport = (report) => {
    navigate('/results', {
      state: {
        role: report.role || 'Software Engineer',
        finalScore: (report.ats || 82) / 10,
        atsScore: report.ats || 82,
        duration: report.duration || '18m 32s',
        questionsAnswered: report.questions || 6,
        totalQuestions: report.questions || 6
      }
    });
  };

  const handleExportHistory = () => {
    const headers = ['Role', 'Company/Details', 'Date', 'Difficulty', 'ATS Score', 'Status'];
    const rows = [
      ['Senior Distributed Systems Engineer', 'Google • Technical Architecture', '14 Oct 2026', 'Hard', '94', 'Completed'],
      ['Full Stack Engineer (React + Node)', 'Stripe • Product Engineering', '11 Oct 2026', 'Medium', '88', 'Completed'],
      ['Backend Go / Cloud Infrastructure', 'AWS • Microservices & Caching', '07 Oct 2026', 'Hard', 'N/A', 'In Progress'],
      ['Engineering Manager (Behavioral)', 'Meta • Leadership & Culture', '03 Oct 2026', 'Medium', '91', 'Completed'],
      ['Frontend Architecture Lead', 'Vercel • Web Performance & Next.js', '29 Sep 2026', 'Hard', '85', 'Completed'],
      ['Database & Data Platform Engineer', 'Databricks • Distributed SQL', '24 Sep 2026', 'Medium', 'N/A', 'In Progress'],
      ['Staff Software Engineer', 'Linear • Core Platform', '18 Sep 2026', 'Hard', '96', 'Completed'],
      ['HR & Cultural Alignment', 'PrepNova • People & Culture', '12 Sep 2026', 'Easy', '84', 'Completed']
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
          Review previous mock interviews and ATS reports.
        </p>
      </div>

      {/* Controls & Table Container */}
      <HistoryTable 
        onViewReport={handleViewReport} 
        onExport={handleExportHistory}
      />

    </WorkspaceLayout>
  );
}
