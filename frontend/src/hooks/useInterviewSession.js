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
 * @param {string} [options.userName]
 * @param {(data: object, snapshot: object) => void} options.onComplete
 */
export default function useInterviewSession({
  role,
  difficulty,
  totalQuestions,
  initialSessionId,
  userName,
  onComplete,
}) {
  const [sessionId, setSessionId] = useState(
    initialSessionId || localStorage.getItem(STORAGE_KEYS.SESSION_ID) || ''
  );
  const [currentQuestionIdx, setCurrentQuestionIdx] = useState(1);
  const [questionText, setQuestionText] = useState(INITIAL_QUESTION_TEXT);
  const [lastEvaluation, setLastEvaluation] = useState(null);
  const [loading, setLoading] = useState(false);

  // Start a session whenever the role or difficulty changes.
  useEffect(() => {
    let isMounted = true;

    const initSession = async () => {
      setLoading(true);
      try {
        const data = await interviewApi.startInterview({
          name: userName || 'Candidate',
          role,
          level: difficulty.toLowerCase(),
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
    // userName is only read at start-up, as before.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [role, difficulty]);

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
