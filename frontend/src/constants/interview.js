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
  FINAL_SCORE: 8.2,
  RATING: 8,
});

export const INITIAL_QUESTION_TEXT = 'Loading your first interview question...';

/** Question shown when the backend cannot be reached. */
export const buildFallbackQuestion = (role) =>
  `Explain the core architectural principles and state lifecycle in ${role}.`;
