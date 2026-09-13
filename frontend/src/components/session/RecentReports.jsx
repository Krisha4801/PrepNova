import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { ChevronRight, FileText, Search } from 'lucide-react';
import { cn } from '../../lib/utils';

export default function RecentReports({ hideHeader = false }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState('All');

  const allReports = [
    { id: 1, role: 'Senior Frontend Developer', date: 'Oct 12, 2026', ats: 84, difficulty: 'Medium', status: 'Completed' },
    { id: 2, role: 'Full Stack Engineer', date: 'Oct 10, 2026', ats: 72, difficulty: 'Hard', status: 'Completed' },
    { id: 3, role: 'React Developer', date: 'Oct 05, 2026', ats: 91, difficulty: 'Easy', status: 'Completed' },
    { id: 4, role: 'Software Engineer II', date: 'Oct 01, 2026', ats: null, difficulty: 'Medium', status: 'In Progress' },
    { id: 5, role: 'Frontend Architect', date: 'Sep 28, 2026', ats: 78, difficulty: 'Hard', status: 'Completed' },
    { id: 6, role: 'Node Developer', date: 'Sep 25, 2026', ats: null, difficulty: 'Medium', status: 'In Progress' },
  ];

  const filteredReports = allReports.filter(report => {
    const matchesSearch = report.role.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = filter === 'All' || report.status === filter;
    return matchesSearch && matchesFilter;
  });

  return (
    <div className="w-full">
      {!hideHeader && (
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-3xl font-extrabold text-heading tracking-tight">Recent Reports</h2>
            <p className="text-body mt-1">Review your past performance and feedback.</p>
          </div>
          <button className="hidden sm:flex items-center gap-1 text-primary font-semibold hover:text-indigo-700 transition-colors group">
            View All <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </button>
        </div>
      )}

      {/* Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div className="relative w-full md:max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input 
            type="text" 
            placeholder="Search roles..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-border bg-white text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
          />
        </div>
        <div className="flex items-center gap-2 overflow-x-auto pb-2 md:pb-0 hide-scrollbar">
          {['All', 'Completed', 'In Progress'].map(opt => (
            <button
              key={opt}
              onClick={() => setFilter(opt)}
              className={cn(
                "px-4 py-2 rounded-full text-sm font-semibold transition-colors whitespace-nowrap",
                filter === opt 
                  ? "bg-primary text-white" 
                  : "bg-white text-body border border-border hover:bg-gray-50"
              )}
            >
              {opt}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-[24px] border border-border shadow-soft overflow-hidden">
        <div className="overflow-x-auto max-h-[500px]">
          <table className="w-full text-left border-collapse relative">
            <thead className="sticky top-0 z-10 bg-gray-50/95 backdrop-blur-sm border-b border-border">
              <tr>
                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Role</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Date</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Difficulty</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">ATS Score</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider text-right">Status</th>
              </tr>
            </thead>
            <tbody>
              {filteredReports.length > 0 ? filteredReports.map((report, idx) => (
                <motion.tr 
                  initial={{ opacity: 0, y: 10 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: idx * 0.05 }}
                  key={report.id}
                  className="border-b border-border last:border-0 hover:bg-gray-50 transition-colors cursor-pointer group"
                >
                  <td className="px-6 py-5">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
                        <FileText className="w-4 h-4" />
                      </div>
                      <span className="font-bold text-heading group-hover:text-primary transition-colors whitespace-nowrap">{report.role}</span>
                    </div>
                  </td>
                  <td className="px-6 py-5 text-sm font-medium text-body whitespace-nowrap">{report.date}</td>
                  <td className="px-6 py-5 whitespace-nowrap">
                    <span className={cn(
                      "px-2.5 py-1 text-xs font-bold uppercase tracking-wider rounded-md",
                      report.difficulty === 'Easy' ? "bg-green-100 text-green-700" :
                      report.difficulty === 'Medium' ? "bg-purple-100 text-purple-700" :
                      "bg-red-100 text-red-700"
                    )}>
                      {report.difficulty}
                    </span>
                  </td>
                  <td className="px-6 py-5 whitespace-nowrap">
                    {report.ats ? (
                      <span className="font-bold text-heading">{report.ats}<span className="text-body font-normal text-xs">/100</span></span>
                    ) : (
                      <span className="text-gray-400 text-sm">—</span>
                    )}
                  </td>
                  <td className="px-6 py-5 text-right whitespace-nowrap">
                    <span className={cn(
                      "inline-flex items-center gap-1.5 text-sm font-semibold",
                      report.status === 'Completed' ? "text-green-600" : "text-amber-500"
                    )}>
                      <span className={cn("w-1.5 h-1.5 rounded-full", report.status === 'Completed' ? "bg-green-500" : "bg-amber-500")} />
                      {report.status}
                    </span>
                  </td>
                </motion.tr>
              )) : (
                <tr>
                  <td colSpan="5" className="px-6 py-12 text-center text-body">
                    No reports found matching your criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
      
      {!hideHeader && (
        <button className="w-full mt-4 sm:hidden py-4 rounded-xl border border-border text-heading font-semibold hover:bg-gray-50 flex items-center justify-center gap-2">
          View All Reports <ChevronRight className="w-4 h-4" />
        </button>
      )}
    </div>
  );
}
