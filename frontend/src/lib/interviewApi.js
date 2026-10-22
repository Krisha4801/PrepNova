/**
 * API client for the live interview endpoints.
 *
 * Endpoint URLs and the auth token come from the shared client in `./api`.
 * Every function resolves with the parsed JSON body and rejects with an
 * Error (carrying `status`) when the server responds with a non-2xx status.
 */
import { API_ENDPOINTS, getStoredToken } from './api';

async function request(url, { method = 'POST', body } = {}) {
  const token = getStoredToken();
  const headers = {
    ...(body !== undefined && { 'Content-Type': 'application/json' }),
    ...(token && { Authorization: `Bearer ${token}` }),
  };

  const response = await fetch(url, {
    method,
    headers,
    ...(body !== undefined && { body: JSON.stringify(body) }),
  });

  if (!response.ok) {
    const error = new Error(`Request failed with status ${response.status}`);
    error.status = response.status;
    throw error;
  }

  return response.json();
}

/** Starts a new interview session and returns the first question. */
export const startInterview = (payload) =>
  request(API_ENDPOINTS.INTERVIEW_START, { body: payload });

/** Skips the current question. */
export const skipQuestion = (sessionId) =>
  request(API_ENDPOINTS.INTERVIEW_SKIP, { body: { sessionId } });

/** Submits an answer and returns the evaluation plus the next question. */
export const submitAnswer = (sessionId, answer) =>
  request(API_ENDPOINTS.INTERVIEW_FOLLOWUP, { body: { sessionId, answer } });

/** Ends (deletes) a session on the server. */
export const endSession = (sessionId) =>
  request(API_ENDPOINTS.INTERVIEW_END(sessionId), { method: 'DELETE' });

/** Fetches the active in-progress session question and progress for reload recovery. */
export const getActiveSession = (sessionId) =>
  request(API_ENDPOINTS.INTERVIEW_ACTIVE(sessionId), { method: 'GET' });

/** Fetches the saved report if a turn request failed after session completion. */
export const getInterviewReport = (sessionId) =>
  request(API_ENDPOINTS.INTERVIEW_REPORT(sessionId), { method: 'GET' });
