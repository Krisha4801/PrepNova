import { useLocation } from 'react-router-dom';
import { INTERVIEW_DEFAULTS, STORAGE_KEYS } from '../constants/interview';

/**
 * Resolves the interview configuration.
 * Route state (set by the setup pages) wins, then localStorage, then defaults.
 *
 * @returns {{ role: string, difficulty: string, totalQuestions: number, firstQuestion?: string, resumeId?: string, jdId?: string }}
 */
export default function useInterviewConfig() {
  const { state } = useLocation();

  return {
    role: state?.role || localStorage.getItem(STORAGE_KEYS.ROLE) || INTERVIEW_DEFAULTS.ROLE,
    difficulty:
      state?.difficulty ||
      localStorage.getItem(STORAGE_KEYS.DIFFICULTY) ||
      INTERVIEW_DEFAULTS.DIFFICULTY,
    totalQuestions:
      state?.questionCount ||
      Number(localStorage.getItem('prepnova_question_count')) ||
      INTERVIEW_DEFAULTS.QUESTION_COUNT,
    firstQuestion: state?.firstQuestion || null,
    resumeId: state?.resumeId || localStorage.getItem('prepnova_resume_id') || null,
    jdId: state?.jdId || localStorage.getItem('prepnova_jd_id') || null,
  };
}
