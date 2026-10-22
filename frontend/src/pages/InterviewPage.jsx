import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import useInterviewConfig from '../hooks/useInterviewConfig';
import useInterviewSession from '../hooks/useInterviewSession';
import useInterviewTimer from '../hooks/useInterviewTimer';
import useSpeechRecognition from '../hooks/useSpeechRecognition';
import { INTERVIEW_DEFAULTS } from '../constants/interview';
import { formatTimer } from '../lib/interviewFormat';
import { toggleSpeech } from '../lib/speech';
import LiveInterviewHeader from '../components/interview/live/LiveInterviewHeader';
import LiveProgressRibbon from '../components/interview/live/LiveProgressRibbon';
import QuestionPanel from '../components/interview/live/QuestionPanel';
import EvaluationBanner from '../components/interview/live/EvaluationBanner';
import AnswerComposer from '../components/interview/live/AnswerComposer';
import EndInterviewModal from '../components/interview/live/EndInterviewModal';

/**
 * Live interview screen. State and server calls live in hooks; this page
 * only wires them to the presentational components.
 */
export default function InterviewPage() {
  const navigate = useNavigate();
  const { sessionId: paramSessionId } = useParams();
  const { user } = useAuth();

  const { role, difficulty, totalQuestions, firstQuestion, resumeId, jdId } = useInterviewConfig();
  const secondsElapsed = useInterviewTimer();

  const [textAnswer, setTextAnswer] = useState('');
  const [showEndModal, setShowEndModal] = useState(false);
  const [actionError, setActionError] = useState('');

  const { isRecording, toggleRecording } = useSpeechRecognition(setTextAnswer);

  const finishInterview = (data, { sessionId, currentQuestionIdx }) => {
    navigate(`/results/${sessionId}`, {
      state: {
        sessionId,
        role,
        difficulty,
        finalScore: data?.finalScore ?? null,
        categoryScores: data?.categoryScores ?? null,
        duration: formatTimer(secondsElapsed),
        questionsAnswered: currentQuestionIdx,
        totalQuestions,
      },
    });
  };

  const {
    currentQuestionIdx,
    questionText,
    lastEvaluation,
    loading,
    actionError: sessionActionError,
    skipQuestion,
    submitAnswer,
    endInterview,
  } = useInterviewSession({
    role,
    difficulty,
    totalQuestions,
    initialSessionId: paramSessionId,
    initialQuestion: firstQuestion,
    resumeId,
    jdId,
    userName: user?.name,
    onComplete: finishInterview,
  });

  React.useEffect(() => setActionError(sessionActionError), [sessionActionError]);

  const handleSkip = async () => {
    if (await skipQuestion()) setTextAnswer('');
  };

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    const answer = textAnswer.trim();
    if (!answer) return;

    if (await submitAnswer(answer)) setTextAnswer('');
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#090D16] text-slate-900 dark:text-slate-100 flex flex-col font-sans antialiased transition-colors duration-150">
      <LiveInterviewHeader
        role={role}
        difficulty={difficulty}
        elapsed={formatTimer(secondsElapsed)}
        onEndClick={() => setShowEndModal(true)}
      />

      <LiveProgressRibbon current={currentQuestionIdx} total={totalQuestions} />

      <main className="flex-1 max-w-4xl w-full mx-auto p-4 sm:p-8 flex flex-col justify-between space-y-6">
        <div className="space-y-4">
          <QuestionPanel
            current={currentQuestionIdx}
            total={totalQuestions}
            difficulty={difficulty}
            questionText={questionText}
            loading={loading}
            onSpeak={() => toggleSpeech(questionText)}
          />
          {lastEvaluation && <EvaluationBanner evaluation={lastEvaluation} />}
          {actionError && <p role="alert" className="text-sm text-rose-600">{actionError}</p>}
        </div>

        <AnswerComposer
          value={textAnswer}
          onChange={setTextAnswer}
          onSubmit={handleSubmit}
          onSkip={handleSkip}
          loading={loading}
          isRecording={isRecording}
          onToggleRecording={toggleRecording}
        />
      </main>

      {showEndModal && (
        <EndInterviewModal
          answered={currentQuestionIdx - 1}
          total={totalQuestions}
          onCancel={() => setShowEndModal(false)}
          onConfirm={endInterview}
        />
      )}
    </div>
  );
}
