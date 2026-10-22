/**
 * Shared constants for the live interview flow.
 * Keeping storage keys and defaults in one place avoids typos and makes
 * the values easy to change later.
 */

export const STORAGE_KEYS = Object.freeze({
  ROLE: 'prepnova_role',
  DIFFICULTY: 'prepnova_difficulty',
  SESSION_ID: 'prepnova_session_id',
});

export const INTERVIEW_DEFAULTS = Object.freeze({
  ROLE: 'Frontend Developer',
  DIFFICULTY: 'Intermediate',
  QUESTION_COUNT: 6,
  FINAL_SCORE: 0,
  RATING: 0,
});

export const INITIAL_QUESTION_TEXT = 'Loading your first interview question...';

export const QUESTION_COUNT_MODES = Object.freeze({
  THREE: '3',
  SIX: '6',
  TEN: '10',
  DYNAMIC: 'dynamic',
});

export const QUESTION_COUNT_OPTIONS = Object.freeze([
  { id: '3', label: '3 / section', count: 3, description: '3 primary questions per section' },
  { id: '6', label: '6 / section', count: 6, description: '6 primary questions per section' },
  { id: '10', label: '10 / section', count: 10, description: '10 primary questions per section' },
  { id: 'dynamic', label: 'Dynamic', count: 'dynamic', description: 'AI determines suitable count per section' },
]);

/** Question shown when the backend cannot be reached. */
export const buildFallbackQuestion = (role) =>
  `Explain the core architectural principles and state lifecycle in ${role}.`;

