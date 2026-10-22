import { useEffect, useState } from 'react';
import { INITIAL_QUESTION_TEXT, STORAGE_KEYS, buildFallbackQuestion } from '../constants/interview';
import * as interviewApi from '../lib/interviewApi';

/**
 * Owns the server-side interview session: starting it, submitting answers,
 * skipping questions and ending it.
 *
 * `onComplete(data, snapshot)` is called when the interview finishes (the
 * server reports `completed`, or the user ends it). `snapshot` holds the
 * `sessionId` and `currentQuestionIdx` at that moment.
 *
 * @param {object} options
 * @param {string} options.role
 * @param {string} options.difficulty
 * @param {number} options.totalQuestions
 * @param {string} [options.initialSessionId] session id from the route
 * @param {string} [options.initialQuestion] pre-started question text
 * @param {string} [options.resumeId]
 * @param {string} [options.jdId]
 * @param {string} [options.userName]
 * @param {(data: object, snapshot: object) => void} options.onComplete
 */
export default function useInterviewSession({
  role,
  difficulty,
  totalQuestions,
  initialSessionId,
  initialQuestion,
  resumeId,
  jdId,
  userName,
  onComplete,
}) {
  const [sessionId, setSessionId] = useState(
    initialSessionId || localStorage.getItem(STORAGE_KEYS.SESSION_ID) || ''
  );
  const [currentQuestionIdx, setCurrentQuestionIdx] = useState(1);
  const [questionText, setQuestionText] = useState(initialQuestion || INITIAL_QUESTION_TEXT);
  const [lastEvaluation, setLastEvaluation] = useState(null);
  const [loading, setLoading] = useState(false);

  // Start a session whenever the role or difficulty changes, unless already initialized
  useEffect(() => {
    let isMounted = true;

    // If session was already launched with a pre-generated question (e.g. from Review page)
    if (initialQuestion && initialSessionId) {
      setSessionId(initialSessionId);
      setQuestionText(initialQuestion);
      return;
    }

    const initSession = async () => {
      setLoading(true);
      try {
        const data = await interviewApi.startInterview({
          name: userName || 'Candidate',
          role,
          level: difficulty.toLowerCase(),
          resumeId,
          jdId,
          maxQuestions: totalQuestions,
        });
        if (!isMounted) return;

        if (data.sessionId) {
          setSessionId(data.sessionId);
          localStorage.setItem(STORAGE_KEYS.SESSION_ID, data.sessionId);
        }
        if (data.question) setQuestionText(data.question);
        if (data.progress?.current) setCurrentQuestionIdx(data.progress.current);
      } catch (_) {
        if (isMounted) setQuestionText(buildFallbackQuestion(role));
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    initSession();
    return () => { isMounted = false; };
  }, [role, difficulty, initialSessionId, initialQuestion, resumeId, jdId, totalQuestions, userName]);

  const advanceLocally = () =>
    setCurrentQuestionIdx((prev) => Math.min(totalQuestions, prev + 1));

  /** Runs a skip/answer request and applies the server's next-turn payload. */
  const runTurn = async (request) => {
    setLoading(true);
    try {
      const data = await request();

      if (data.completed) {
        onComplete(data, { sessionId, currentQuestionIdx });
        return;
      }
      if (data.question) setQuestionText(data.question);
      if (data.evaluation) setLastEvaluation(data.evaluation);
      if (data.progress?.current) setCurrentQuestionIdx(data.progress.current);
    } catch (_) {
      // Backend unavailable: keep the UI moving.
      advanceLocally();
    } finally {
      setLoading(false);
    }
  };

  const skipQuestion = () => runTurn(() => interviewApi.skipQuestion(sessionId));

  const submitAnswer = (answer) => runTurn(() => interviewApi.submitAnswer(sessionId, answer));

  const endInterview = async () => {
    if (sessionId) {
      try {
        await interviewApi.endSession(sessionId);
      } catch (_) {
        // Ending is best-effort; the report is shown either way.
      }
    }
    onComplete({}, { sessionId, currentQuestionIdx });
  };

  return {
    sessionId,
    currentQuestionIdx,
    questionText,
    lastEvaluation,
    loading,
    skipQuestion,
    submitAnswer,
    endInterview,
  };
}
