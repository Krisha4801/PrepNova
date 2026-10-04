const mongoose = require("mongoose");
const User = require("../models/User");
const { generateToken } = require("../utils/jwt");
const oauthConfig = require("./oauth.config");
const {
  createTransaction,
  consumeTransaction,
  createHandoffTicket,
  consumeHandoffTicket
} = require("./oauth.state");
const { getProvider } = require("./providers");

function checkDatabaseReady() {
  if (mongoose.connection.readyState !== 1) {
    const err = new Error("Database service is currently unavailable.");
    err.statusCode = 503;
    throw err;
  }
}

/**
 * Validates a redirect URL against the allowed frontend origins allowlist
 */
function sanitizeRedirectUrl(targetUrl) {
  const allowedOrigins = oauthConfig.getFrontendOrigins();
  const defaultUrl = oauthConfig.getDefaultFrontendUrl();

  if (!targetUrl || typeof targetUrl !== "string") {
    return defaultUrl;
  }

  try {
    const parsed = new URL(targetUrl);
    const origin = parsed.origin;
    if (allowedOrigins.includes(origin)) {
      return targetUrl;
    }
  } catch {
    // Relative path support on default frontend origin
    if (targetUrl.startsWith("/") && !targetUrl.startsWith("//")) {
      return `${defaultUrl}${targetUrl}`;
    }
  }

  return defaultUrl;
}

class OAuthService {
  /**
   * Initiates the OAuth flow for a given provider
   */
  async initiate(providerName, { returnTo = null, customRedirectUri = null } = {}) {
    const provider = getProvider(providerName);
    if (!provider) {
      const err = new Error(`Unsupported OAuth provider: '${providerName}'.`);
      err.statusCode = 400;
      throw err;
    }

    const safeReturnTo = sanitizeRedirectUrl(returnTo);

    const transaction = createTransaction({
      provider: providerName.toLowerCase(),
      returnTo: safeReturnTo
    });

    const authorizationUrl = provider.getAuthorizationUrl({
      state: transaction.state,
      codeChallenge: transaction.codeChallenge,
      codeChallengeMethod: transaction.codeChallengeMethod,
      nonce: transaction.nonce,
      customRedirectUri
    });

    return {
      provider: providerName.toLowerCase(),
      authorizationUrl,
      state: transaction.state
    };
  }

  /**
   * Handles the OAuth callback from the provider
   */
  async handleCallback(providerName, queryParams = {}) {
    checkDatabaseReady();

    const { code, state, error, error_description } = queryParams;

    // Check for provider error responses (e.g. user consent denied)
    if (error) {
      const msg = error_description || error;
      const err = new Error(`OAuth provider error: ${msg}`);
      err.statusCode = 400;
      throw err;
    }

    if (!code || typeof code !== "string") {
      const err = new Error("Authorization code is missing from callback query.");
      err.statusCode = 400;
      throw err;
    }

    if (!state || typeof state !== "string") {
      const err = new Error("OAuth state parameter is missing from callback query.");
      err.statusCode = 400;
      throw err;
    }

    // Single-use, validated transaction retrieval
    const transaction = consumeTransaction(state);
    if (!transaction) {
      const err = new Error("Invalid, expired, or already-used OAuth state parameter. Please try again.");
      err.statusCode = 400;
      throw err;
    }

    if (transaction.provider !== providerName.toLowerCase()) {
      const err = new Error("OAuth provider mismatch for this transaction state.");
      err.statusCode = 400;
      throw err;
    }

    const provider = getProvider(providerName);
    if (!provider) {
      const err = new Error(`Unsupported OAuth provider: '${providerName}'.`);
      err.statusCode = 400;
      throw err;
    }

    // Exchange authorization code for tokens (using PKCE verifier)
    const tokenResult = await provider.exchangeCode({
      code,
      codeVerifier: transaction.codeVerifier
    });

    // Obtain & cryptographically verify user identity
    const identity = await provider.getUserIdentity(tokenResult, {
      expectedNonce: transaction.nonce
    });

    if (!identity.email) {
      const err = new Error("Unable to retrieve a valid email address from your OAuth profile.");
      err.statusCode = 400;
      throw err;
    }

    if (!identity.emailVerified) {
      const err = new Error("Your email address with the OAuth provider is unverified. Please verify your email with the provider first.");
      err.statusCode = 403;
      throw err;
    }

    const normalizedEmail = identity.email.trim().toLowerCase();

    // Account resolution & linking
    let user = null;

    // 1. Check by existing provider identity
    user = await User.findOne({
      "authProviders.provider": identity.provider,
      "authProviders.providerUserId": identity.providerUserId
    });

    if (!user) {
      // 2. Check if a user exists with matching verified email
      const existingUserByEmail = await User.findOne({ email: normalizedEmail });

      if (existingUserByEmail) {
        // Link new provider to existing user
        existingUserByEmail.authProviders = existingUserByEmail.authProviders || [];
        const alreadyLinked = existingUserByEmail.authProviders.some(
          (ap) =>
            ap.provider === identity.provider &&
            ap.providerUserId === identity.providerUserId
        );

        if (!alreadyLinked) {
          existingUserByEmail.authProviders.push({
            provider: identity.provider,
            providerUserId: identity.providerUserId,
            email: normalizedEmail,
            linkedAt: new Date()
          });
          if (!existingUserByEmail.avatar && identity.avatarUrl) {
            existingUserByEmail.avatar = identity.avatarUrl;
          }
          await existingUserByEmail.save();
        }
        user = existingUserByEmail;
      } else {
        // 3. Create new user with default role
        try {
          user = await User.create({
            name: identity.name || normalizedEmail.split("@")[0],
            email: normalizedEmail,
            role: "user",
            avatar: identity.avatarUrl || "",
            authProviders: [
              {
                provider: identity.provider,
                providerUserId: identity.providerUserId,
                email: normalizedEmail,
                linkedAt: new Date()
              }
            ]
          });
        } catch (dbErr) {
          // Handle potential race conditions
          if (dbErr.code === 11000) {
            user = await User.findOne({ email: normalizedEmail });
            if (!user) {
              throw dbErr;
            }
          } else {
            throw dbErr;
          }
        }
      }
    }

    // Verify user account is not suspended/deactivated
    if (user.isActive === false) {
      const err = new Error("Your account has been deactivated or suspended. Please contact support.");
      err.statusCode = 403;
      throw err;
    }

    // Generate standard PrepNova application JWT
    const appToken = generateToken({
      id: user._id.toString(),
      email: user.email,
      role: user.role
    });

    // Create temporary single-use handoff ticket
    const handoffTicket = createHandoffTicket({
      token: appToken,
      user: user.toJSON()
    });

    const frontendBase = transaction.returnTo || oauthConfig.getDefaultFrontendUrl();

    return {
      handoffTicket,
      frontendRedirectUrl: frontendBase,
      user: user.toJSON(),
      token: appToken
    };
  }

  /**
   * Exchanges a temporary handoff ticket for application session token & user profile
   */
  exchangeHandoffTicket(ticket) {
    if (!ticket || typeof ticket !== "string") {
      const err = new Error("Handoff ticket is required.");
      err.statusCode = 400;
      throw err;
    }

    const data = consumeHandoffTicket(ticket);
    if (!data) {
      const err = new Error("Invalid or expired OAuth authentication ticket. Please sign in again.");
      err.statusCode = 400;
      throw err;
    }

    return {
      token: data.token,
      user: data.user
    };
  }
}

module.exports = new OAuthService();
