import { useLocation } from 'react-router-dom';
import { INTERVIEW_DEFAULTS, STORAGE_KEYS } from '../constants/interview';

/**
 * Resolves the interview configuration.
 * Route state (set by the setup pages) wins, then localStorage, then defaults.
 *
 * @returns {{ role: string, difficulty: string, totalQuestions: number }}
 */
export default function useInterviewConfig() {
  const { state } = useLocation();

  return {
    role: state?.role || localStorage.getItem(STORAGE_KEYS.ROLE) || INTERVIEW_DEFAULTS.ROLE,
    difficulty:
      state?.difficulty ||
      localStorage.getItem(STORAGE_KEYS.DIFFICULTY) ||
      INTERVIEW_DEFAULTS.DIFFICULTY,
    totalQuestions: state?.questionCount || INTERVIEW_DEFAULTS.QUESTION_COUNT,
  };
}
