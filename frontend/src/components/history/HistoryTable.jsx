import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Search, 
  ChevronRight, 
  ChevronLeft, 
  FileText, 
  Inbox, 
  X, 
  Play, 
  Download,
  Filter
} from 'lucide-react';

export default function HistoryTable({ 
  initialReports = [
    { 
      id: 1, 
      role: 'Frontend Developer', 
      domain: 'Web Architecture • React & Performance', 
      date: '14 Oct 2026', 
      difficulty: 'Intermediate', 
      score: 88, 
      status: 'Completed',
      duration: '24m 10s',
      questions: 6
    },
    { 
      id: 2, 
      role: 'Full Stack Engineer', 
      domain: 'Node.js & Distributed APIs', 
      date: '11 Oct 2026', 
      difficulty: 'Advanced', 
      score: 92, 
      status: 'Completed',
      duration: '31m 45s',
      questions: 6
    },
    { 
      id: 3, 
      role: 'Backend Go / Cloud Systems', 
      domain: 'Microservices & Caching', 
      date: '07 Oct 2026', 
      difficulty: 'Advanced', 
      score: null, 
      status: 'In Progress',
      duration: '12m 18s',
      questions: 3
    },
    { 
      id: 4, 
      role: 'Product & System Design', 
      domain: 'Technical Architecture & Scale', 
      date: '03 Oct 2026', 
      difficulty: 'Intermediate', 
      score: 85, 
      status: 'Completed',
      duration: '28m 30s',
      questions: 6
    }
  ],
  onViewReport,
  onExport 
}) {
  const [searchTerm, setSearchTerm] = useState('');
  const [difficultyFilter, setDifficultyFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');

  const filteredReports = useMemo(() => {
    return initialReports.filter((item) => {
      const matchesSearch = item.role.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.domain.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesDifficulty = difficultyFilter === 'All' || item.difficulty.toLowerCase() === difficultyFilter.toLowerCase();
      const matchesStatus = statusFilter === 'All' || item.status.toLowerCase() === statusFilter.toLowerCase();

      return matchesSearch && matchesDifficulty && matchesStatus;
    });
  }, [initialReports, searchTerm, difficultyFilter, statusFilter]);

  return (
    <div className="panel-card p-5 sm:p-7 space-y-5">
      {/* Controls Bar: Search + Filters + Export */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-slate-100 dark:border-slate-800">
        {/* Search */}
        <div className="relative flex-1 max-w-sm">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search roles or competencies..."
            className="input-field pl-9 h-9 text-xs"
          />
        </div>

        {/* Filters */}
        <div className="flex items-center gap-2">
          <select
            value={difficultyFilter}
            onChange={(e) => setDifficultyFilter(e.target.value)}
            className="input-field h-9 text-xs py-1 px-2.5 w-auto cursor-pointer"
          >
            <option value="All">All Tiers</option>
            <option value="Beginner">Beginner</option>
            <option value="Intermediate">Intermediate</option>
            <option value="Advanced">Advanced</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="input-field h-9 text-xs py-1 px-2.5 w-auto cursor-pointer"
          >
            <option value="All">All Statuses</option>
            <option value="Completed">Completed</option>
            <option value="In Progress">In Progress</option>
          </select>

          {onExport && (
            <button
              type="button"
              onClick={onExport}
              className="btn-secondary h-9 text-xs px-3"
              title="Export to CSV"
            >
              <Download className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Export</span>
            </button>
          )}
        </div>
      </div>

      {/* Table Container */}
      <div className="overflow-x-auto">
        {filteredReports.length > 0 ? (
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-100 dark:border-slate-800 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                <th className="pb-3 pl-2">Role & Discipline</th>
                <th className="pb-3">Date</th>
                <th className="pb-3">Difficulty</th>
                <th className="pb-3">Duration</th>
                <th className="pb-3">Score</th>
                <th className="pb-3">Status</th>
                <th className="pb-3 pr-2 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
              {filteredReports.map((report) => (
                <tr key={report.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-850/50 transition-colors">
                  <td className="py-3.5 pl-2">
                    <span className="font-bold text-slate-900 dark:text-slate-100 block">{report.role}</span>
                    <span className="text-[11px] text-slate-400">{report.domain}</span>
                  </td>
                  <td className="py-3.5 text-slate-500 dark:text-slate-400">{report.date}</td>
                  <td className="py-3.5">
                    <span className="badge-neutral text-[11px] capitalize">{report.difficulty}</span>
                  </td>
                  <td className="py-3.5 font-mono text-slate-600 dark:text-slate-300">{report.duration}</td>
                  <td className="py-3.5">
                    {report.score ? (
                      <span className="font-bold text-indigo-600 dark:text-indigo-400">{report.score}%</span>
                    ) : (
                      <span className="text-slate-400">—</span>
                    )}
                  </td>
                  <td className="py-3.5">
                    {report.status === 'Completed' ? (
                      <span className="badge-success text-[11px]">Completed</span>
                    ) : (
                      <span className="badge-neutral text-[11px]">In Progress</span>
                    )}
                  </td>
                  <td className="py-3.5 pr-2 text-right">
                    <button
                      type="button"
                      onClick={() => onViewReport(report)}
                      className="btn-ghost text-xs px-2.5 py-1"
                    >
                      <span>View</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="py-12 text-center flex flex-col items-center">
            <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-400 flex items-center justify-center mb-2.5">
              <Inbox className="w-5 h-5" />
            </div>
            <p className="text-xs font-bold text-slate-700 dark:text-slate-300">No mock sessions found</p>
            <p className="text-[11px] text-slate-400 mt-0.5">Try adjusting your search query or filters.</p>
          </div>
        )}
      </div>
    </div>
  );
}
