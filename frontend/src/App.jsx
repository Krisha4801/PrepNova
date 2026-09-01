import React from 'react';
import { BrowserRouter, Routes, Route, Outlet, useLocation } from 'react-router-dom';
import Navbar from './components/layout/Navbar';
import Footer from './components/layout/Footer';
import SessionSetup from './pages/SessionSetup';
import LandingPage from './pages/LandingPage';
import Dashboard from './pages/Dashboard';
import History from './pages/History';
import Progress from './pages/Progress';
import ProfilePage from './pages/ProfilePage';
import SettingsPage from './pages/SettingsPage';
import LoginPage from './pages/LoginPage';
import SignupPage from './pages/SignupPage';
import InterviewPage from './pages/InterviewPage';
import ResumeAnalysisPage from './pages/ResumeAnalysisPage';
import RoleJobPage from './pages/RoleJobPage';
import CustomizeInterviewPage from './pages/CustomizeInterviewPage';
import ReviewInterviewPage from './pages/ReviewInterviewPage';
import ResultsPage from './pages/ResultsPage';
import VoiceInterview from './pages/interview/VoiceInterview';
import TextInterview from './pages/interview/TextInterview';
import InterviewResults from './pages/interview/InterviewResults';
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import ProtectedRoute from './components/layout/ProtectedRoute';

function Layout() {
  const location = useLocation();
  const isHome = location.pathname === '/';
  const isWorkspace = 
    location.pathname === '/dashboard' || 
    location.pathname === '/resume-ats' || 
    location.pathname === '/resume' || 
    location.pathname === '/ats' ||
    location.pathname === '/setup' ||
    location.pathname === '/start-interview' ||
    location.pathname === '/role-job' ||
    location.pathname === '/role' ||
    location.pathname === '/customize' ||
    location.pathname === '/review' ||
    location.pathname === '/history' ||
    location.pathname === '/progress' ||
    location.pathname.startsWith('/interview') ||
    location.pathname.startsWith('/results') ||
    location.pathname === '/profile' ||
    location.pathname === '/settings';

  if (isWorkspace) {
    return <Outlet />;
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#F8FAFC] dark:bg-[#060D1A] transition-colors duration-150">
      <Navbar />
      <main className={`flex-1 w-full ${isHome ? '' : 'pb-8'}`}>
        {isHome ? (
          <Outlet />
        ) : (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <Outlet />
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            {/* Public Routes without Layout */}
            <Route path="/login" element={<LoginPage />} />
            <Route path="/signup" element={<SignupPage />} />

            {/* Routes with Layout */}
            <Route path="/" element={<Layout />}>
              <Route index element={<LandingPage />} />
              
              {/* Protected Routes (Authenticated Users Only) */}
              <Route element={<ProtectedRoute />}>
                <Route path="setup" element={<SessionSetup />} />
                <Route path="start-interview" element={<SessionSetup />} />
                <Route path="role-job" element={<RoleJobPage />} />
                <Route path="role" element={<RoleJobPage />} />
                <Route path="customize" element={<CustomizeInterviewPage />} />
                <Route path="review" element={<ReviewInterviewPage />} />
                <Route path="interview" element={<InterviewPage />} />
                <Route path="interview/voice" element={<VoiceInterview />} />
                <Route path="interview/text" element={<TextInterview />} />
                <Route path="interview/:sessionId" element={<InterviewPage />} />
                <Route path="interview/results" element={<InterviewResults />} />
                <Route path="interview/:sessionId/results" element={<InterviewResults />} />
                <Route path="results" element={<ResultsPage />} />
                <Route path="results/:sessionId" element={<ResultsPage />} />
                <Route path="dashboard" element={<Dashboard />} />
                <Route path="resume-ats" element={<ResumeAnalysisPage />} />
                <Route path="resume" element={<ResumeAnalysisPage />} />
                <Route path="ats" element={<ResumeAnalysisPage />} />
                <Route path="history" element={<History />} />
                <Route path="progress" element={<Progress />} />
                <Route path="profile" element={<ProfilePage />} />
                <Route path="settings" element={<SettingsPage />} />
              </Route>
            </Route>
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  );
}
