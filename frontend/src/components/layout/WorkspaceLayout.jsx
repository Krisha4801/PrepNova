import React, { useState } from 'react';
import DashboardSidebar from '../dashboard/DashboardSidebar';
import WorkspaceNavbar from './WorkspaceNavbar';

export default function WorkspaceLayout({ 
  title = 'Dashboard', 
  children, 
  actions, 
  maxWidth = 'max-w-[1200px]',
  contentClassName = ''
}) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[#F6F8FC] dark:bg-[#020817] text-[#111827] dark:text-[#F8FAFC] font-sans antialiased selection:bg-[#2563EB]/15 selection:text-[#2563EB] transition-colors duration-200">
      
      {/* 1. Global Fixed Sidebar (100vh full height, w-[280px], #081225) */}
      <DashboardSidebar 
        mobileOpen={mobileOpen} 
        setMobileOpen={setMobileOpen} 
      />

      {/* 2. Main Content Wrapper (Desktop offset by 280px / md:pl-[280px]) */}
      <div className="md:pl-[280px] flex flex-col min-h-screen min-w-0">
        
        {/* Shared Top Navbar (72px fixed height) */}
        <WorkspaceNavbar 
          title={title} 
          onOpenMenu={() => setMobileOpen(true)} 
          actions={actions}
        />

        {/* Global Page Content Container with Consistent Spacing */}
        <main className={`flex-1 w-full ${maxWidth} mx-auto px-4 sm:px-8 py-8 space-y-8 ${contentClassName}`}>
          {children}
        </main>
      </div>

    </div>
  );
}
