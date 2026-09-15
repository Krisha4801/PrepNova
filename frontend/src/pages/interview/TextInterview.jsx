import React, { useState, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  ArrowLeft, 
  ArrowRight, 
  Save, 
  FileCheck
} from 'lucide-react';
import InterviewHeader from '../../components/interview/InterviewHeader';
import ProgressBar from '../../components/interview/ProgressBar';
import QuestionCard from '../../components/interview/QuestionCard';
import TextEditor from '../../components/interview/TextEditor';
import { generateInterviewQuestions } from '../../data/mockQuestions';

export default function TextInterview() {
  const navigate = useNavigate();
  const location = useLocation();

  // Retrieve configuration from route state or localStorage
  const stateData = location.state || {};
  const role = stateData.targetRole || localStorage.getItem('prepnova_role') || 'Frontend Developer';
  const difficulty = stateData.difficulty || localStorage.getItem('prepnova_difficulty') || 'Medium';
  const focusSkills = useMemo(() => {
    return stateData.focusSkills || JSON.parse(localStorage.getItem('prepnova_focus_areas') || '["React", "DSA", "SQL"]');
  }, [stateData.focusSkills]);
  const interviewTypes = useMemo(() => {
    return stateData.interviewTypes || JSON.parse(localStorage.getItem('prepnova_interview_types') || '{"technical": true, "hr": true}');
  }, [stateData.interviewTypes]);
  const questionCount = Number(stateData.questionCount) || Number(localStorage.getItem('prepnova_question_count')) || 6;

  // Generate dynamic questions
  const questions = useMemo(() => {
    return generateInterviewQuestions({
      targetRole: role,
      interviewTypes,
      difficulty,
      focusSkills,
      questionCount
    });
  }, [role, interviewTypes, difficulty, focusSkills, questionCount]);

  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const currentQuestion = questions[currentIndex];
  const currentAnswerText = answers[currentQuestion?.id]?.answer || '';

  const answeredCount = Object.values(answers).filter(a => a?.answer?.trim()?.length > 0).length;

  const handleAnswerChange = (text) => {
    setAnswers(prev => ({
      ...prev,
      [currentQuestion.id]: {
        ...(prev[currentQuestion.id] || {}),
        questionId: currentQuestion.id,
        questionTitle: currentQuestion.title,
        category: currentQuestion.category,
        answer: text,
        updatedAt: new Date().toISOString()
      }
    }));
  };

  const handleSaveDraft = (text) => {
    handleAnswerChange(text);
  };

  const handleNext = () => {
    if (currentIndex + 1 < questions.length) {
      setCurrentIndex(prev => prev + 1);
    } else {
      finishInterview();
    }
  };

  const handlePrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex(prev => prev - 1);
    }
  };

  const finishInterview = () => {
    setIsSubmitting(true);
    setTimeout(() => {
      navigate('/interview/results', {
        state: {
          role,
          difficulty,
          focusSkills,
          format: 'text',
          totalQuestions: questions.length,
          questionsAnswered: answeredCount,
          answers,
          completedAt: new Date().toISOString()
        }
      });
    }, 600);
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-[#060D1A] flex flex-col font-sans transition-colors duration-150">
      
      {/* Top Navigation */}
      <InterviewHeader
        targetRole={role}
        difficulty={difficulty}
        format="text"
        onExit={() => navigate('/customize')}
      />

      {/* Main Full-Width Content Stage */}
      <main className="flex-1 max-w-4xl w-full mx-auto px-4 sm:px-6 py-6 sm:py-8 flex flex-col justify-between space-y-6">
        
        {/* Progress Bar */}
        <div className="w-full">
          <ProgressBar
            current={currentIndex + 1}
            total={questions.length}
            category={currentQuestion?.category}
          />
        </div>

        {/* Center: Question Card & Rich Editor */}
        <div className="space-y-6">
          <QuestionCard
            question={currentQuestion}
            showHints={true}
          />

          <TextEditor
            value={currentAnswerText}
            onChange={handleAnswerChange}
            onSubmit={handleNext}
            onSaveDraft={handleSaveDraft}
            placeholder={`Write your answer for Question ${currentIndex + 1}...`}
          />

          {/* Action Bar */}
          <div className="flex items-center justify-between gap-3 pt-2">
            <button
              type="button"
              onClick={handlePrevious}
              disabled={currentIndex === 0}
              className="h-[44px] px-4 rounded-[12px] border border-[#E5E7EB] dark:border-white/10 text-[14px] font-medium text-[#64748B] dark:text-[#94A3B8] hover:text-[#0F172A] dark:hover:text-white hover:bg-slate-50 dark:hover:bg-white/5 transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Previous</span>
            </button>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => handleSaveDraft(currentAnswerText)}
                className="hidden sm:inline-flex h-[44px] px-4 rounded-[12px] border border-[#E5E7EB] dark:border-white/10 text-[14px] font-medium text-[#64748B] dark:text-[#94A3B8] hover:text-[#0F172A] dark:hover:text-white hover:bg-slate-50 dark:hover:bg-white/5 transition-colors cursor-pointer items-center gap-1.5"
              >
                <Save className="w-4 h-4" />
                <span>Save Draft</span>
              </button>

              <button
                type="button"
                onClick={handleNext}
                disabled={isSubmitting}
                className="h-[44px] px-6 rounded-[12px] bg-[#2563EB] hover:bg-blue-700 text-white text-[14px] font-semibold transition-all cursor-pointer shadow-xs flex items-center gap-2"
              >
                {currentIndex + 1 < questions.length ? (
                  <>
                    <span>Next Question</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                ) : (
                  <>
                    <span>Submit & Finish</span>
                    <FileCheck className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

      </main>
    </div>
  );
}
