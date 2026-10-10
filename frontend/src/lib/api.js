/**
 * Centralized API & Authentication Client for PrepNova Frontend
 */

const API_BASE_URL = window.PREPNOVA_API_BASE || "http://localhost:5000";

export const API_ENDPOINTS = {
  REGISTER: `${API_BASE_URL}/api/auth/register`,
  LOGIN: `${API_BASE_URL}/api/auth/login`,
  ME: `${API_BASE_URL}/api/auth/me`,
  LOGOUT: `${API_BASE_URL}/api/auth/logout`,
  FORGOT_PASSWORD: `${API_BASE_URL}/api/auth/forgot-password`,
  VERIFY_RESET_OTP: `${API_BASE_URL}/api/auth/verify-reset-otp`,
  RESET_PASSWORD: `${API_BASE_URL}/api/auth/reset-password`,
  RESEND_RESET_OTP: `${API_BASE_URL}/api/auth/resend-reset-otp`,
  OAUTH_INITIATE: (provider) => `${API_BASE_URL}/api/auth/oauth/${encodeURIComponent(provider)}`,
  OAUTH_EXCHANGE: `${API_BASE_URL}/api/auth/oauth/exchange`,
  OAUTH_PROVIDERS: `${API_BASE_URL}/api/auth/oauth/providers`,
  INTERVIEW_START: `${API_BASE_URL}/api/interview/start`,
  INTERVIEW_FOLLOWUP: `${API_BASE_URL}/api/interview/followup`,
  INTERVIEW_SKIP: `${API_BASE_URL}/api/interview/skip`,
  INTERVIEW_END: (sessionId) => `${API_BASE_URL}/api/interview/${encodeURIComponent(sessionId)}`
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
  const headers = {
    "Content-Type": "application/json",
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
    // Handle 401 Unauthorized globally across all API requests
    if (response.status === 401) {
      // Clear local session storage if authenticated request was rejected
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
