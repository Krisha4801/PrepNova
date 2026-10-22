/**
 * Centralized API & Authentication Client for PrepNova Frontend
 */

const API_BASE_URL = window.PREPNOVA_API_BASE || "http://localhost:5000";

export const API_ENDPOINTS = {
  REGISTER: `${API_BASE_URL}/api/auth/register`,
  LOGIN: `${API_BASE_URL}/api/auth/login`,
  ME: `${API_BASE_URL}/api/auth/me`,
  UPDATE_PROFILE: `${API_BASE_URL}/api/auth/profile`,
  LOGOUT: `${API_BASE_URL}/api/auth/logout`,
  FORGOT_PASSWORD: `${API_BASE_URL}/api/auth/forgot-password`,
  VERIFY_RESET_OTP: `${API_BASE_URL}/api/auth/verify-reset-otp`,
  RESET_PASSWORD: `${API_BASE_URL}/api/auth/reset-password`,
  RESEND_RESET_OTP: `${API_BASE_URL}/api/auth/resend-reset-otp`,
  CHANGE_PASSWORD: `${API_BASE_URL}/api/auth/change-password`,
  OAUTH_INITIATE: (provider) => `${API_BASE_URL}/api/auth/oauth/${encodeURIComponent(provider)}`,
  OAUTH_EXCHANGE: `${API_BASE_URL}/api/auth/oauth/exchange`,
  OAUTH_PROVIDERS: `${API_BASE_URL}/api/auth/oauth/providers`,
  INTERVIEW_START: `${API_BASE_URL}/api/interview/start`,
  INTERVIEW_FOLLOWUP: `${API_BASE_URL}/api/interview/followup`,
  INTERVIEW_SKIP: `${API_BASE_URL}/api/interview/skip`,
  INTERVIEW_HISTORY: `${API_BASE_URL}/api/interview/history`,
  INTERVIEW_ANALYTICS: `${API_BASE_URL}/api/interview/analytics`,
  INTERVIEW_REPORT: (sessionId) => `${API_BASE_URL}/api/interview/${encodeURIComponent(sessionId)}/report`,
  INTERVIEW_RETRY_REPORT: (sessionId) => `${API_BASE_URL}/api/interview/${encodeURIComponent(sessionId)}/retry-report`,
  INTERVIEW_PDF: (sessionId) => `${API_BASE_URL}/api/interview/${encodeURIComponent(sessionId)}/pdf`,
  INTERVIEW_VALIDATE: `${API_BASE_URL}/api/interview/validate`,
  INTERVIEW_FIT_CHECK: `${API_BASE_URL}/api/interview/fit-check`,
  RESUMES: `${API_BASE_URL}/api/resumes`,
  RESUME_UPLOAD: `${API_BASE_URL}/api/resumes/upload`,
  RESUME_BY_ID: (id) => `${API_BASE_URL}/api/resumes/${encodeURIComponent(id)}`,
  JDS: `${API_BASE_URL}/api/jds`,
  JD_BY_ID: (id) => `${API_BASE_URL}/api/jds/${encodeURIComponent(id)}`,
};

/**
 * Retrieves the stored JWT token.
 */
export function getStoredToken() {
  return localStorage.getItem("prepNova_token");
}

/**
 * Retrieves the stored user profile object.
 */
export function getStoredUser() {
  try {
    const raw = localStorage.getItem("prepNova_user");
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

/**
 * Stores the authentication session.
 */
export function setAuthSession(token, user) {
  if (token) {
    localStorage.setItem("prepNova_token", token);
  }
  if (user) {
    localStorage.setItem("prepNova_user", JSON.stringify(user));
  }
}

/**
 * Clears the stored authentication session.
 */
export function clearAuthSession() {
  localStorage.removeItem("prepNova_token");
  localStorage.removeItem("prepNova_user");
}

/**
 * Standardized authenticated fetch wrapper.
 */
export async function apiFetch(url, options = {}) {
  const token = getStoredToken();
  const isFormData = typeof FormData !== "undefined" && options.body instanceof FormData;
  const headers = {
    ...(isFormData ? {} : { "Content-Type": "application/json" }),
    ...(options.headers || {})
  };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const response = await fetch(url, {
    ...options,
    headers
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    if (response.status === 401) {
      if (token) {
        clearAuthSession();
      }
    }

    const errorMsg = data.error || data.message || `Request failed with status ${response.status}`;
    const error = new Error(errorMsg);
    error.status = response.status;
    error.data = data;
    throw error;
  }

  return data;
}

/**
 * Register API helper
 */
export async function registerApi(userData) {
  const data = await apiFetch(API_ENDPOINTS.REGISTER, {
    method: "POST",
    body: JSON.stringify(userData)
  });

  if (data.token && data.user) {
    setAuthSession(data.token, data.user);
  }

  return data;
}

/**
 * Login API helper
 */
export async function loginApi(email, password) {
  const data = await apiFetch(API_ENDPOINTS.LOGIN, {
    method: "POST",
    body: JSON.stringify({ email, password })
  });

  if (data.token && data.user) {
    setAuthSession(data.token, data.user);
  }

  return data;
}

/**
 * Get current user profile helper
 */
export async function getMeApi() {
  return await apiFetch(API_ENDPOINTS.ME, {
    method: "GET"
  });
}

/**
 * Update user profile helper
 */
export async function updateProfileApi(profileData) {
  const data = await apiFetch(API_ENDPOINTS.UPDATE_PROFILE, {
    method: "PUT",
    body: JSON.stringify(profileData)
  });
  if (data.user) {
    const current = getStoredUser() || {};
    setAuthSession(null, { ...current, ...data.user });
  }
  return data;
}

/**
 * Exchange OAuth one-time handoff ticket for application session token
 */
export async function exchangeOAuthTicketApi(ticket) {
  const data = await apiFetch(API_ENDPOINTS.OAUTH_EXCHANGE, {
    method: "POST",
    body: JSON.stringify({ ticket })
  });

  if (data.token && data.user) {
    setAuthSession(data.token, data.user);
  }

  return data;
}

/**
 * Fetch available OAuth providers
 */
export async function getOAuthProvidersApi() {
  return await apiFetch(API_ENDPOINTS.OAUTH_PROVIDERS, {
    method: "GET"
  });
}

/**
 * Logout API helper
 */
export async function logoutApi() {
  try {
    await apiFetch(API_ENDPOINTS.LOGOUT, {
      method: "POST"
    });
  } catch (err) {
    console.warn("Server logout notification failed:", err);
  } finally {
    clearAuthSession();
  }
}

/**
 * Request password reset 6-digit OTP code
 */
export async function forgotPasswordApi(email) {
  return await apiFetch(API_ENDPOINTS.FORGOT_PASSWORD, {
    method: "POST",
    body: JSON.stringify({ email })
  });
}

/**
 * Verify submitted 6-digit OTP code and retrieve short-lived resetToken
 */
export async function verifyResetOtpApi(email, otp) {
  return await apiFetch(API_ENDPOINTS.VERIFY_RESET_OTP, {
    method: "POST",
    body: JSON.stringify({ email, otp })
  });
}

/**
 * Reset password using verified resetToken
 */
export async function resetPasswordApi(resetToken, newPassword, confirmPassword) {
  return await apiFetch(API_ENDPOINTS.RESET_PASSWORD, {
    method: "POST",
    body: JSON.stringify({ resetToken, newPassword, confirmPassword })
  });
}

/**
 * Resend password reset OTP
 */
export async function resendResetOtpApi(email) {
  return await apiFetch(API_ENDPOINTS.RESEND_RESET_OTP, {
    method: "POST",
    body: JSON.stringify({ email })
  });
}

// -------------------------------------------------------------
// Interview API Helpers
// -------------------------------------------------------------

export async function startInterviewApi(payload) {
  return await apiFetch(API_ENDPOINTS.INTERVIEW_START, {
    method: "POST",
    body: JSON.stringify(payload)
  });
}

export async function followupInterviewApi(payload) {
  return await apiFetch(API_ENDPOINTS.INTERVIEW_FOLLOWUP, {
    method: "POST",
    body: JSON.stringify(payload)
  });
}

export async function skipInterviewQuestionApi(payload) {
  return await apiFetch(API_ENDPOINTS.INTERVIEW_SKIP, {
    method: "POST",
    body: JSON.stringify(payload)
  });
}

export async function endInterviewApi(sessionId) {
  return await apiFetch(API_ENDPOINTS.INTERVIEW_END(sessionId), {
    method: "DELETE"
  });
}

export async function validateInterviewInputsApi(payload) {
  return await apiFetch(API_ENDPOINTS.INTERVIEW_VALIDATE, {
    method: "POST",
    body: JSON.stringify(payload)
  });
}

export async function getInterviewHistoryApi(page = 1, limit = 10) {
  return await apiFetch(`${API_ENDPOINTS.INTERVIEW_HISTORY}?page=${page}&limit=${limit}`, {
    method: "GET"
  });
}

export async function getDashboardAnalyticsApi() {
  return await apiFetch(API_ENDPOINTS.INTERVIEW_ANALYTICS, {
    method: "GET"
  });
}

export async function getInterviewReportApi(sessionId) {
  return await apiFetch(API_ENDPOINTS.INTERVIEW_REPORT(sessionId), {
    method: "GET"
  });
}

export async function retryInterviewReportApi(sessionId) {
  return await apiFetch(API_ENDPOINTS.INTERVIEW_RETRY_REPORT(sessionId), {
    method: "POST"
  });
}

export function getInterviewPdfUrl(sessionId) {
  return API_ENDPOINTS.INTERVIEW_PDF(sessionId);
}

// -------------------------------------------------------------
// Resume & JD Management APIs
// -------------------------------------------------------------

export async function uploadResumeApi(file) {
  const formData = new FormData();
  formData.append("resume", file);
  return await apiFetch(`${API_BASE_URL}/api/resume/upload`, {
    method: "POST",
    body: formData
  });
}

export async function getMyResumesApi() {
  return await apiFetch(`${API_BASE_URL}/api/resume/my`, { method: "GET" });
}

export async function listResumesApi() {
  return await apiFetch(`${API_BASE_URL}/api/resume/my`, { method: "GET" });
}

export async function deleteResumeApi(resumeId) {
  return await apiFetch(`${API_BASE_URL}/api/resume/${encodeURIComponent(resumeId)}`, { method: "DELETE" });
}

export async function uploadJdApi(fileOrText, filename = "job_description.pdf") {
  if (typeof fileOrText === "string") {
    return await apiFetch(`${API_BASE_URL}/api/jd/extract`, {
      method: "POST",
      body: JSON.stringify({ text: fileOrText })
    });
  }
  const formData = new FormData();
  formData.append("jd", fileOrText, filename);
  return await apiFetch(`${API_BASE_URL}/api/jd/upload`, {
    method: "POST",
    body: formData
  });
}

export async function getMyJdsApi() {
  return await apiFetch(`${API_BASE_URL}/api/jd/my`, { method: "GET" });
}

export async function listJdsApi() {
  return await apiFetch(`${API_BASE_URL}/api/jd/my`, { method: "GET" });
}

export async function createJdApi(title, text) {
  return await apiFetch(`${API_BASE_URL}/api/jd/extract`, {
    method: "POST",
    body: JSON.stringify({ title, text })
  });
}

export async function deleteJdApi(jdId) {
  return await apiFetch(`${API_BASE_URL}/api/jd/${encodeURIComponent(jdId)}`, { method: "DELETE" });
}

/**
 * Change authenticated user password
 */
export async function changePasswordApi(currentPassword, newPassword, confirmPassword) {
  return await apiFetch(API_ENDPOINTS.CHANGE_PASSWORD, {
    method: "POST",
    body: JSON.stringify({ currentPassword, newPassword, confirmPassword })
  });
}

/**
 * Client-side route guard helper
 */
export function requireAuth(redirectUrl = "/login") {
  const token = getStoredToken();
  if (!token) {
    window.location.href = redirectUrl;
    return false;
  }
  return true;
}

