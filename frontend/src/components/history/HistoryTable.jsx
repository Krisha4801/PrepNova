import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Search, 
  ChevronRight, 
  ChevronLeft, 
  FileText, 
  Inbox, 
  X,
  PlayCircle,
  Download
} from 'lucide-react';

export default function HistoryTable({ 
  initialReports = [
    { 
      id: 1, 
      role: 'Senior Distributed Systems Engineer', 
      company: 'Google • Technical Architecture', 
      date: '14 Oct 2026', 
      difficulty: 'Hard', 
      ats: 94, 
      status: 'Completed',
      duration: '32m 10s',
      questions: 6
    },
    { 
      id: 2, 
      role: 'Full Stack Engineer (React + Node)', 
      company: 'Stripe • Product Engineering', 
      date: '11 Oct 2026', 
      difficulty: 'Medium', 
      ats: 88, 
      status: 'Completed',
      duration: '24m 45s',
      questions: 6
    },
    { 
      id: 3, 
      role: 'Backend Go / Cloud Infrastructure', 
      company: 'AWS • Microservices & Caching', 
      date: '07 Oct 2026', 
      difficulty: 'Hard', 
      ats: null, 
      status: 'In Progress',
      duration: '12m 18s',
      questions: 3
    },
    { 
      id: 4, 
      role: 'Engineering Manager (Behavioral)', 
      company: 'Meta • Leadership & Culture', 
      date: '03 Oct 2026', 
      difficulty: 'Medium', 
      ats: 91, 
      status: 'Completed',
      duration: '28m 30s',
      questions: 6
    },
    { 
      id: 5, 
      role: 'Frontend Architecture Lead', 
      company: 'Vercel • Web Performance & Next.js', 
      date: '29 Sep 2026', 
      difficulty: 'Hard', 
      ats: 85, 
      status: 'Completed',
      duration: '26m 12s',
      questions: 6
    },
    { 
      id: 6, 
      role: 'Database & Data Platform Engineer', 
      company: 'Databricks • Distributed SQL', 
      date: '24 Sep 2026', 
      difficulty: 'Medium', 
      ats: null, 
      status: 'In Progress',
      duration: '09m 40s',
      questions: 2
    },
    { 
      id: 7, 
      role: 'Staff Software Engineer', 
      company: 'Linear • Core Platform', 
      date: '18 Sep 2026', 
      difficulty: 'Hard', 
      ats: 96, 
      status: 'Completed',
      duration: '35m 05s',
      questions: 6
    },
    { 
      id: 8, 
      role: 'HR & Cultural Alignment', 
      company: 'PrepNova • People & Culture', 
      date: '12 Sep 2026', 
      difficulty: 'Easy', 
      ats: 84, 
      status: 'Completed',
      duration: '18m 20s',
      questions: 6
    }
  ],
  onViewReport,
  onExport
}) {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState('All'); // All | Completed | In Progress
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 6;

  // Filter & Search Logic
  const filteredReports = useMemo(() => {
    return initialReports.filter(report => {
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch = 
        !q || 
        report.role.toLowerCase().includes(q) || 
        (report.company && report.company.toLowerCase().includes(q));
      
      const matchesFilter = 
        filter === 'All' || 
        report.status.toLowerCase() === filter.toLowerCase();

      return matchesSearch && matchesFilter;
    });
  }, [initialReports, searchQuery, filter]);

  // Reset to page 1 on search or filter change
  const handleFilterChange = (newFilter) => {
    setFilter(newFilter);
    setCurrentPage(1);
  };

  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
    setCurrentPage(1);
  };

  // Pagination Slice
  const totalPages = Math.max(1, Math.ceil(filteredReports.length / itemsPerPage));
  const paginatedReports = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredReports.slice(start, start + itemsPerPage);
  }, [filteredReports, currentPage, itemsPerPage]);

  // Difficulty Badges
  const renderDifficultyBadge = (difficulty) => {
    const d = (difficulty || '').toLowerCase();
    if (d === 'easy') {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 dark:bg-emerald-950/40 text-[#16A34A] dark:text-emerald-400 border border-emerald-200/60 dark:border-emerald-800/40">
          Easy
        </span>
      );
    }
    if (d === 'hard') {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-red-50 dark:bg-red-950/40 text-[#EF4444] dark:text-red-400 border border-red-200/60 dark:border-red-800/40">
          Hard
        </span>
      );
    }
    return (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-purple-50 dark:bg-purple-950/40 text-[#7C3AED] dark:text-purple-400 border border-purple-200/60 dark:border-purple-800/40">
        Medium
      </span>
    );
  };

  // Status Badges
  const renderStatusBadge = (status) => {
    const isCompleted = (status || '').toLowerCase() === 'completed';
    if (isCompleted) {
      return (
        <div className="flex items-center gap-1.5 text-xs font-semibold text-[#16A34A] dark:text-emerald-400">
          <span className="w-2 h-2 rounded-full bg-[#16A34A] dark:bg-emerald-400" />
          <span>Completed</span>
        </div>
      );
    }
    return (
      <div className="flex items-center gap-1.5 text-xs font-semibold text-[#F59E0B] dark:text-amber-400">
        <span className="w-2 h-2 rounded-full bg-[#F59E0B] dark:bg-amber-400 animate-pulse" />
        <span>In Progress</span>
      </div>
    );
  };

  const handleRowClick = (report) => {
    if (onViewReport) {
      onViewReport(report);
    } else {
      navigate('/results', { state: report });
    }
  };

  return (
    <div className="w-full space-y-4">
      
      {/* ======================================================== */}
      {/* ======================================================== */}
      {/* TOP CONTROLS: Search Bar (Full Width) + Filters & Export */}
      {/* ======================================================== */}
      <div className="flex flex-col gap-3.5">
        
        {/* Full-width Search Bar (100% of container) */}
        <div className="relative w-full">
          <Search className="absolute left-[20px] top-1/2 -translate-y-1/2 w-5 h-5 text-[#64748B] dark:text-[#94A3B8] pointer-events-none z-10" />
          <input 
            type="text" 
            placeholder="Search role or company..."
            value={searchQuery}
            onChange={handleSearchChange}
            style={{ paddingLeft: '52px' }}
            className="history-search-input w-full h-[56px] pl-[52px] pr-12 rounded-[16px] border border-[#E2E8F0] dark:border-[#334155] bg-white dark:bg-[#0F172A] text-sm sm:text-base text-[#0F172A] dark:text-[#F8FAFC] placeholder:text-[#64748B] dark:placeholder:text-[#94A3B8] focus:outline-none focus:border-[#2563EB] focus:ring-4 focus:ring-[#2563EB]/15 transition-all duration-180 shadow-2xs"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => { setSearchQuery(''); setCurrentPage(1); }}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-[#64748B] dark:text-[#94A3B8] hover:text-[#0F172A] dark:hover:text-[#F8FAFC] p-1.5 rounded-lg cursor-pointer transition-colors"
              aria-label="Clear search"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Filter Pills + Export Button */}
        <div className="flex flex-wrap items-center justify-between gap-2.5">
          <div className="flex items-center gap-1.5 p-1 bg-slate-100 dark:bg-[#102449] rounded-xl border border-transparent dark:border-white/[0.08]">
            {['All', 'Completed', 'In Progress'].map(tab => {
              const isActive = filter === tab;
              return (
                <button
                  key={tab}
                  type="button"
                  onClick={() => handleFilterChange(tab)}
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all duration-180 cursor-pointer ${
                    isActive 
                      ? 'bg-white dark:bg-[#2563EB] text-[#0F172A] dark:text-white shadow-2xs font-bold' 
                      : 'text-[#64748B] dark:text-[#8CA3C7] hover:text-[#0F172A] dark:hover:text-[#F8FAFC]'
                  }`}
                >
                  {tab}
                </button>
              );
            })}
          </div>

          {onExport && (
            <button
              type="button"
              onClick={onExport}
              className="px-4 py-2 bg-white dark:bg-[#0F2347] border border-[#E5E7EB] dark:border-white/[0.08] hover:bg-slate-50 dark:hover:bg-[#102449] text-[#0F172A] dark:text-[#F8FAFC] text-xs sm:text-sm font-semibold rounded-xl shadow-2xs transition-all duration-180 flex items-center gap-2 cursor-pointer"
            >
              <Download className="w-4 h-4 text-[#64748B] dark:text-[#8CA3C7]" />
              <span>Export</span>
            </button>
          )}
        </div>
      </div>

      {/* ======================================================== */}
      {/* HISTORY TABLE CARD (Single rounded card with 20px radius) */}
      {/* ======================================================== */}
      <div className="bg-white dark:bg-[#0F172A] rounded-[20px] border border-[#E5E7EB] dark:border-[#334155] shadow-xs overflow-hidden transition-all duration-180">
        
        {/* DESKTOP TABLE VIEW */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#F8FAFC] dark:bg-[#111827] border-b border-[#E5E7EB] dark:border-[#334155] text-[11px] font-bold text-[#64748B] dark:text-[#94A3B8] uppercase tracking-wider">
                <th className="px-6 py-4">Role</th>
                <th className="px-6 py-4">Date</th>
                <th className="px-6 py-4">Difficulty</th>
                <th className="px-6 py-4">ATS Score</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E5E7EB] dark:divide-[#334155] text-sm">
              {paginatedReports.length > 0 ? (
                paginatedReports.map((report) => (
                  <tr 
                    key={report.id}
                    onClick={() => handleRowClick(report)}
                    className="hover:bg-blue-50/40 dark:hover:bg-[#1E293B]/70 cursor-pointer transition-colors duration-180 group"
                  >
                    {/* Role Column */}
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3.5">
                        <div className="w-9 h-9 rounded-xl bg-blue-50 dark:bg-blue-950/40 text-[#2563EB] dark:text-[#38BDF8] flex items-center justify-center shrink-0 border border-blue-100 dark:border-blue-900/40 group-hover:scale-105 transition-transform duration-180">
                          <FileText className="w-4 h-4" />
                        </div>
                        <div className="min-w-0 max-w-xs xl:max-w-sm">
                          <div className="font-bold text-sm text-[#0F172A] dark:text-[#F8FAFC] truncate group-hover:text-[#2563EB] dark:group-hover:text-[#38BDF8] transition-colors duration-180">
                            {report.role}
                          </div>
                          {report.company && (
                            <div className="text-xs text-[#64748B] dark:text-[#94A3B8] truncate mt-0.5">
                              {report.company}
                            </div>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* Date Column */}
                    <td className="px-6 py-4 text-xs font-medium text-[#64748B] dark:text-[#94A3B8] whitespace-nowrap">
                      {report.date}
                    </td>

                    {/* Difficulty Column */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      {renderDifficultyBadge(report.difficulty)}
                    </td>

                    {/* ATS Score Column */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      {report.ats !== null && report.status === 'Completed' ? (
                        <div className="text-sm font-extrabold text-[#0F172A] dark:text-[#F8FAFC]">
                          {report.ats}
                          <span className="text-xs font-normal text-[#64748B] dark:text-[#94A3B8]">/100</span>
                        </div>
                      ) : (
                        <span className="text-[#64748B] dark:text-[#94A3B8] text-sm font-semibold">—</span>
                      )}
                    </td>

                    {/* Status Column */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      {renderStatusBadge(report.status)}
                    </td>

                    {/* Action Arrow */}
                    <td className="px-6 py-4 text-right whitespace-nowrap">
                      <div className="inline-flex items-center justify-center w-8 h-8 rounded-lg text-[#64748B] dark:text-[#94A3B8] group-hover:text-[#2563EB] dark:group-hover:text-[#38BDF8] group-hover:bg-slate-50 dark:group-hover:bg-[#1E293B] transition-all duration-180">
                        <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform duration-180" />
                      </div>
                    </td>
                  </tr>
                ))
              ) : null}
            </tbody>
          </table>
        </div>

        {/* MOBILE STACKED CARDS VIEW */}
        <div className="block md:hidden divide-y divide-[#E5E7EB] dark:divide-[#334155]">
          {paginatedReports.length > 0 ? (
            paginatedReports.map((report) => (
              <div
                key={report.id}
                onClick={() => handleRowClick(report)}
                className="p-4 sm:p-5 flex items-center justify-between gap-3 hover:bg-slate-50 dark:hover:bg-[#1E293B]/70 transition-colors duration-180 cursor-pointer"
              >
                <div className="flex items-start gap-3 min-w-0">
                  <div className="w-9 h-9 rounded-xl bg-blue-50 dark:bg-blue-950/40 text-[#2563EB] dark:text-[#38BDF8] flex items-center justify-center shrink-0 border border-blue-100 dark:border-blue-900/40 mt-0.5">
                    <FileText className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <h4 className="font-bold text-sm text-[#0F172A] dark:text-[#F8FAFC] truncate">
                      {report.role}
                    </h4>
                    {report.company && (
                      <p className="text-xs text-[#64748B] dark:text-[#94A3B8] truncate mt-0.5">
                        {report.company}
                      </p>
                    )}
                    <div className="flex items-center gap-2 mt-2 flex-wrap text-xs">
                      <span className="text-[#64748B] dark:text-[#94A3B8]">{report.date}</span>
                      <span className="text-[#334155]">•</span>
                      {renderDifficultyBadge(report.difficulty)}
                      <span className="text-[#334155]">•</span>
                      {renderStatusBadge(report.status)}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  <div className="text-right">
                    <div className="text-[10px] uppercase font-bold text-[#64748B] dark:text-[#94A3B8]">ATS</div>
                    <div className="font-extrabold text-sm text-[#0F172A] dark:text-[#F8FAFC]">
                      {report.ats !== null && report.status === 'Completed' ? `${report.ats}/100` : '—'}
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-[#64748B] dark:text-[#94A3B8]" />
                </div>
              </div>
            ))
          ) : null}
        </div>

        {/* EMPTY STATE */}
        {filteredReports.length === 0 && (
          <div className="py-16 px-6 text-center flex flex-col items-center justify-center">
            <div className="w-16 h-16 rounded-2xl bg-slate-50 dark:bg-[#1E293B] border border-[#E5E7EB] dark:border-[#334155] text-[#64748B] dark:text-[#94A3B8] flex items-center justify-center mb-4 shadow-2xs">
              <Inbox className="w-8 h-8 text-[#94A3B8]" />
            </div>

            <h3 className="text-lg font-bold text-[#0F172A] dark:text-[#F8FAFC] mb-1">
              No interviews found
            </h3>
            <p className="text-sm text-[#64748B] dark:text-[#94A3B8] max-w-sm mb-6">
              Try adjusting your search query or filter pills to find past sessions.
            </p>

            <button
              type="button"
              onClick={() => navigate('/setup')}
              className="px-5 py-2.5 bg-[#2563EB] hover:bg-blue-700 text-white text-sm font-semibold rounded-xl shadow-xs transition-all duration-180 flex items-center gap-2 cursor-pointer"
            >
              <PlayCircle className="w-4 h-4" />
              <span>Start Interview</span>
            </button>
          </div>
        )}

        {/* PAGINATION BAR */}
        {filteredReports.length > 0 && (
          <div className="p-4 sm:p-5 border-t border-[#E5E7EB] dark:border-[#334155] flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs sm:text-sm text-[#64748B] dark:text-[#94A3B8]">
            <div>
              Showing <span className="font-semibold text-[#0F172A] dark:text-[#F8FAFC]">{(currentPage - 1) * itemsPerPage + 1}</span> to <span className="font-semibold text-[#0F172A] dark:text-[#F8FAFC]">{Math.min(currentPage * itemsPerPage, filteredReports.length)}</span> of <span className="font-semibold text-[#0F172A] dark:text-[#F8FAFC]">{filteredReports.length}</span> interviews
            </div>

            <div className="flex items-center gap-1.5 self-end sm:self-auto">
              <button
                type="button"
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="px-3 py-1.5 rounded-lg border border-[#E5E7EB] dark:border-[#334155] bg-white dark:bg-[#1E293B] text-xs font-semibold text-[#0F172A] dark:text-[#F8FAFC] hover:bg-slate-50 dark:hover:bg-[#283548] disabled:opacity-40 disabled:pointer-events-none transition-all duration-180 flex items-center gap-1 cursor-pointer"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
                <span>Previous</span>
              </button>

              {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                <button
                  key={page}
                  type="button"
                  onClick={() => setCurrentPage(page)}
                  className={`w-8 h-8 rounded-lg text-xs font-bold transition-all duration-180 cursor-pointer ${
                    currentPage === page
                      ? 'bg-[#2563EB] text-white shadow-2xs'
                      : 'bg-white dark:bg-[#1E293B] border border-[#E5E7EB] dark:border-[#334155] text-[#64748B] dark:text-[#94A3B8] hover:text-[#0F172A] dark:hover:text-[#F8FAFC] hover:bg-slate-50 dark:hover:bg-[#283548]'
                  }`}
                >
                  {page}
                </button>
              ))}

              <button
                type="button"
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="px-3 py-1.5 rounded-lg border border-[#E5E7EB] dark:border-[#334155] bg-white dark:bg-[#1E293B] text-xs font-semibold text-[#0F172A] dark:text-[#F8FAFC] hover:bg-slate-50 dark:hover:bg-[#283548] disabled:opacity-40 disabled:pointer-events-none transition-all duration-180 flex items-center gap-1 cursor-pointer"
              >
                <span>Next</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}

      </div>

    </div>
  );
}
