import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { PlayCircle, Clock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function ContinueSession() {
  const [session, setSession] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchSession = async () => {
      const sessionId = localStorage.getItem("prepnova_session_id");
      if (!sessionId) {
        setIsLoading(false);
        return;
      }

      try {
        const token = localStorage.getItem("prepNova_token");
        const res = await fetch(`http://localhost:5000/api/session/${sessionId}`, {
          headers: {
            ...(token && { Authorization: `Bearer ${token}` })
          }
        });
        const data = await res.json();
        if (data.success && data.session.status === "active") {
          setSession(data.session);
        }
      } catch (err) {
        console.error("Failed to fetch session", err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchSession();
  }, []);

  const handleContinue = () => {
    const sessionId = localStorage.getItem("prepnova_session_id");
    if (!sessionId) {
      // Typically use a toast library here, relying on alert for simplicity if none exists
      alert("No active session found");
      return;
    }
    
    // Navigate directly to interview screen
    if (typeof window.startInterviewFromReact === 'function') {
      window.startInterviewFromReact({ sessionId });
    } else {
      navigate(`/interview/${sessionId}`);
    }
  };

  if (isLoading || !session) return null;

  const currentQuestion = session.currentQuestion || 1;
  const totalQuestions = session.totalQuestions || 20;
  const progressPercent = (currentQuestion / totalQuestions) * 100;
  
  return (
    <div className="w-full max-w-7xl mx-auto px-6 lg:px-8 mt-12 z-20 relative">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full bg-white rounded-3xl p-6 md:p-8 shadow-sm hover:shadow-md border border-[#E2E8F0] flex flex-col md:flex-row items-center justify-between gap-8 transition-shadow duration-300"
      >
        <div className="flex-1 w-full flex flex-col justify-center">
          <div className="flex items-center gap-3 mb-3">
            <span className="px-3 py-1 bg-[#EEF2FF] text-[#5B4DFF] text-xs font-bold uppercase tracking-wider rounded-full">
              Resume Interview
            </span>
            <span className="flex items-center gap-1.5 text-xs font-semibold text-[#64748B]">
              <Clock className="w-4 h-4" />
              Active Session
            </span>
          </div>
          
          <h3 className="text-2xl font-[800] text-[#0F172A] mb-4 tracking-tight">{session.role || "Interview"}</h3>
          
          <div className="w-full max-w-md">
            <div className="flex justify-between items-end mb-2">
              <span className="text-sm font-semibold text-[#64748B]">Question {currentQuestion} of {totalQuestions}</span>
              <span className="text-sm font-bold text-[#5B4DFF]">{Math.round(progressPercent)}%</span>
            </div>
            <div className="w-full h-2 bg-[#F8FAFC] rounded-full overflow-hidden border border-[#E2E8F0]">
              <motion.div 
                initial={{ width: 0 }}
                animate={{ width: `${progressPercent}%` }}
                transition={{ duration: 1, ease: "easeOut" }}
                className="h-full bg-gradient-to-r from-[#5B4DFF] to-[#7C6CFF] rounded-full"
              />
            </div>
          </div>
        </div>
        
        <button 
          onClick={handleContinue}
          className="w-full md:w-auto px-8 py-4 bg-[#5B4DFF] text-white font-bold rounded-xl shadow-md hover:shadow-lg hover:-translate-y-1 hover:shadow-[#5B4DFF]/30 transition-all duration-250 flex items-center justify-center gap-2 group shrink-0"
        >
          <PlayCircle className="w-5 h-5 group-hover:scale-110 transition-transform duration-200" />
          Continue Session
        </button>
      </motion.div>
    </div>
  );
}
