import React, { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { 
  Play, 
  Award, 
  TrendingUp, 
  Clock, 
  CheckCircle2 
} from 'lucide-react';
import WorkspaceLayout from '../components/layout/WorkspaceLayout';
import { useAuth } from '../context/AuthContext';
import StatCard from '../components/dashboard/StatCard';
import GoalTracker from '../components/dashboard/GoalTracker';
import ActivityTable from '../components/dashboard/ActivityTable';

export default function Dashboard() {
  const { user } = useAuth();
  
  // Greeting name and time of day
  const userName = user?.name ? user.name.split(' ')[0] : 'Varunee';
  const greeting = useMemo(() => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 18) return 'Good Afternoon';
    return 'Good Evening';
  }, []);

  // Stats data
  const stats = [
    {
      label: 'Completed Interviews',
      value: '12',
      trend: '+3 this week',
      trendPositive: true,
      icon: Award
    },
    {
      label: 'Average Score',
      value: '84%',
      trend: '+6% vs last month',
      trendPositive: true,
      icon: TrendingUp
    },
    {
      label: 'Practice Time',
      value: '14.5h',
      trend: '2.5 hrs this week',
      trendPositive: true,
      icon: Clock
    },
    {
      label: 'Readiness Score',
      value: '88%',
      trend: 'Interview Ready',
      trendPositive: true,
      icon: CheckCircle2
    }
  ];


  // Recent Activities
  const recentActivities = [
    {
      id: 1,
      role: 'Frontend Engineer',
      score: 88,
      difficulty: 'Medium',
      date: 'Yesterday',
      status: 'Completed',
      link: '/history'
    },
    {
      id: 2,
      role: 'Full Stack Engineer',
      score: 92,
      difficulty: 'Hard',
      date: '3 days ago',
      status: 'Completed',
      link: '/history'
    },
    {
      id: 3,
      role: 'Backend Systems Engineer',
      score: 79,
      difficulty: 'Hard',
      date: '18 Sep 2026',
      status: 'Completed',
      link: '/history'
    },
    {
      id: 4,
      role: 'System Design Mock',
      score: 85,
      difficulty: 'Medium',
      date: '14 Sep 2026',
      status: 'Completed',
      link: '/history'
    }
  ];

  return (
    <WorkspaceLayout title="Dashboard" maxWidth="max-w-[1280px]">
      
      {/* ======================================================== */}
      {/* 1. TOP ROW: GREETING & PRIMARY CTA                       */}
      {/* ======================================================== */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#E5E7EB] dark:border-[#1E293B]">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-[#0F172A] dark:text-[#F8FAFC] tracking-tight">
            {greeting}, {userName} 👋
          </h1>
          <p className="text-xs sm:text-sm text-[#64748B] dark:text-[#94A3B8] mt-1">
            Ready for your next interview session.
          </p>
        </div>

        {/* Primary button: Only one CTA */}
        <Link
          to="/setup"
          className="h-11 px-5 rounded-[12px] bg-[#2563EB] hover:bg-blue-700 active:scale-[0.98] text-white font-semibold text-xs sm:text-sm shadow-xs transition-all flex items-center justify-center gap-2 self-start sm:self-auto shrink-0 cursor-pointer"
        >
          <Play className="w-4 h-4 fill-current" />
          <span>Start Practice</span>
        </Link>
      </div>

      {/* ======================================================== */}
      {/* 2. STATS ROW (4 Compact Cards)                          */}
      {/* ======================================================== */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
        {stats.map((s) => (
          <StatCard
            key={s.label}
            label={s.label}
            value={s.value}
            trend={s.trend}
            trendPositive={s.trendPositive}
            icon={s.icon}
          />
        ))}
      </div>

      {/* ======================================================== */}
      {/* 3. MAIN CONTENT: 12-COLUMN RESPONSIVE GRID (8 / 4 SPLIT) */}
      {/* ======================================================== */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Left Column (8 columns on lg) */}
        <div className="lg:col-span-8 space-y-6">
          {/* Recent Activity Table */}
          <ActivityTable activities={recentActivities} />
        </div>

        {/* Right Column (4 columns on lg) - Sticky Sidebar */}
        <div className="lg:col-span-4 space-y-5 lg:sticky lg:top-6">
          {/* Goal Tracker */}
          <GoalTracker
            initialGoal="Software Engineer (L4)"
            completed={3}
            total={10}
          />
        </div>

      </div>

    </WorkspaceLayout>
  );
}
