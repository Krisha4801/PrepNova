import React, { useState } from 'react';
import DashboardSidebar from '../dashboard/DashboardSidebar';
import WorkspaceNavbar from './WorkspaceNavbar';

export default function WorkspaceLayout({ 
  title = 'Workspace', 
  children, 
  actions, 
  maxWidth = 'max-w-[1140px]',
  contentClassName = ''
}) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#090D16] text-slate-900 dark:text-slate-100 font-sans antialiased transition-colors duration-150">
      {/* 1. Global Fixed Sidebar (w-[260px]) */}
      <DashboardSidebar 
        mobileOpen={mobileOpen} 
        setMobileOpen={setMobileOpen} 
      />

      {/* 2. Main Content Wrapper */}
      <div className="md:pl-[260px] flex flex-col min-h-screen min-w-0">
        <WorkspaceNavbar 
          title={title} 
          onOpenMenu={() => setMobileOpen(true)} 
          actions={actions}
        />

        <main className={`flex-1 w-full ${maxWidth} mx-auto px-4 sm:px-8 py-8 space-y-7 ${contentClassName}`}>
          {children}
        </main>
      </div>
    </div>
  );
}
