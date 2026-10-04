const crypto = require("crypto");
const oauthConfig = require("./oauth.config");

/**
 * In-memory stores for OAuth authorization transactions and secure handoff tickets.
 * Both stores implement automatic expiration and strictly single-use consumption.
 */
const transactions = new Map();
const handoffTickets = new Map();

// Periodic cleanup of expired items
const cleanupInterval = setInterval(() => {
  const now = Date.now();
  for (const [key, value] of transactions.entries()) {
    if (now - value.createdAt > oauthConfig.stateTtlMs) {
      transactions.delete(key);
    }
  }
  for (const [key, value] of handoffTickets.entries()) {
    if (now - value.createdAt > oauthConfig.handoffTicketTtlMs) {
      handoffTickets.delete(key);
    }
  }
}, 60 * 1000);

// Prevent cleanup interval from blocking process shutdown
if (cleanupInterval.unref) {
  cleanupInterval.unref();
}

/**
 * Base64 URL-safe encoding helper
 */
function base64UrlEncode(buffer) {
  return buffer
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

/**
 * Generates a cryptographically secure PKCE code verifier (43-128 chars).
 */
function generateCodeVerifier() {
  return base64UrlEncode(crypto.randomBytes(32));
}

/**
 * Derives the PKCE code challenge from a code verifier using S256 (SHA-256).
 */
function deriveCodeChallenge(verifier) {
  const hash = crypto.createHash("sha256").update(verifier).digest();
  return base64UrlEncode(hash);
}

/**
 * Generates a cryptographically secure random state token.
 */
function generateState() {
  return crypto.randomBytes(32).toString("hex");
}

/**
 * Generates a cryptographically secure OIDC nonce.
 */
function generateNonce() {
  return base64UrlEncode(crypto.randomBytes(24));
}

/**
 * Generates a cryptographically secure single-use ticket.
 */
function generateTicket() {
  return "pnt_" + crypto.randomBytes(32).toString("hex");
}

/**
 * Creates and registers a new OAuth authorization transaction.
 */
function createTransaction({ provider, returnTo = null }) {
  const state = generateState();
  const codeVerifier = generateCodeVerifier();
  const codeChallenge = deriveCodeChallenge(codeVerifier);
  const nonce = generateNonce();

  transactions.set(state, {
    state,
    provider,
    codeVerifier,
    nonce,
    returnTo,
    createdAt: Date.now()
  });

  return {
    state,
    codeVerifier,
    codeChallenge,
    codeChallengeMethod: "S256",
    nonce
  };
}

/**
 * Retrieves and permanently consumes an OAuth transaction by state.
 * Single-use: state cannot be reused.
 */
function consumeTransaction(state) {
  if (!state || typeof state !== "string") {
    return null;
  }

  const transaction = transactions.get(state);
  if (!transaction) {
    return null;
  }

  // Enforce single-use: delete immediately
  transactions.delete(state);

  // Enforce expiration
  if (Date.now() - transaction.createdAt > oauthConfig.stateTtlMs) {
    return null;
  }

  return transaction;
}

/**
 * Creates a short-lived, single-use authentication handoff ticket.
 */
function createHandoffTicket(payload) {
  const ticket = generateTicket();
  handoffTickets.set(ticket, {
    ...payload,
    createdAt: Date.now()
  });
  return ticket;
}

/**
 * Validates and consumes a single-use handoff ticket.
 */
function consumeHandoffTicket(ticket) {
  if (!ticket || typeof ticket !== "string") {
    return null;
  }

  const data = handoffTickets.get(ticket);
  if (!data) {
    return null;
  }

  // Enforce single-use: delete immediately
  handoffTickets.delete(ticket);

  // Enforce expiration (60 seconds)
  if (Date.now() - data.createdAt > oauthConfig.handoffTicketTtlMs) {
    return null;
  }

  return data;
}

/**
 * Clear all internal stores (useful for tests)
 */
function clearAll() {
  transactions.clear();
  handoffTickets.clear();
}

module.exports = {
  generateCodeVerifier,
  deriveCodeChallenge,
  generateState,
  generateNonce,
  createTransaction,
  consumeTransaction,
  createHandoffTicket,
  consumeHandoffTicket,
  clearAll,
  base64UrlEncode
};
