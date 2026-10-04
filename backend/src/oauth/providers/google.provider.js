const axios = require("axios");
const crypto = require("crypto");
const jwt = require("jsonwebtoken");
const BaseOAuthProvider = require("./base.provider");
const IdentityMapper = require("../identity.mapper");

class GoogleOAuthProvider extends BaseOAuthProvider {
  constructor(config) {
    super("google", config);
    this.jwksCache = null;
    this.jwksCacheExpiresAt = 0;
  }

  /**
   * Generates Google OAuth 2.0 / OIDC Authorization URL with PKCE & Nonce
   */
  getAuthorizationUrl({ state, codeChallenge, codeChallengeMethod = "S256", nonce, customRedirectUri }) {
    if (!this.config.clientId) {
      const err = new Error("Google OAuth Client ID is not configured.");
      err.statusCode = 500;
      throw err;
    }

    const redirectUri = customRedirectUri || this.config.redirectUri;
    const scopes = (this.config.scopes || ["openid", "email", "profile"]).join(" ");

    const params = new URLSearchParams({
      response_type: "code",
      client_id: this.config.clientId,
      redirect_uri: redirectUri,
      scope: scopes,
      state,
      access_type: "online",
      prompt: "select_account"
    });

    if (codeChallenge) {
      params.append("code_challenge", codeChallenge);
      params.append("code_challenge_method", codeChallengeMethod);
    }

    if (nonce) {
      params.append("nonce", nonce);
    }

    return `${this.config.authorizationEndpoint}?${params.toString()}`;
  }

  /**
   * Exchanges authorization code for tokens using client secret and PKCE verifier
   */
  async exchangeCode({ code, codeVerifier, customRedirectUri }) {
    if (!this.config.clientId || !this.config.clientSecret) {
      const err = new Error("Google OAuth credentials are not properly configured on server.");
      err.statusCode = 500;
      throw err;
    }

    const redirectUri = customRedirectUri || this.config.redirectUri;

    const payload = new URLSearchParams({
      code,
      client_id: this.config.clientId,
      client_secret: this.config.clientSecret,
      redirect_uri: redirectUri,
      grant_type: "authorization_code"
    });

    if (codeVerifier) {
      payload.append("code_verifier", codeVerifier);
    }

    try {
      const response = await axios.post(this.config.tokenEndpoint, payload.toString(), {
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          Accept: "application/json"
        },
        timeout: 10000
      });

      return {
        accessToken: response.data.access_token,
        idToken: response.data.id_token,
        expiresIn: response.data.expires_in,
        tokenType: response.data.token_type,
        rawTokens: response.data
      };
    } catch (err) {
      const errorMsg =
        err.response?.data?.error_description ||
        err.response?.data?.error ||
        err.message ||
        "Token exchange with Google failed.";
      const error = new Error(`Google token exchange error: ${errorMsg}`);
      error.statusCode = err.response?.status || 502;
      throw error;
    }
  }

  /**
   * Fetches and caches Google's public JWKS certificates
   */
  async fetchJwks() {
    const now = Date.now();
    if (this.jwksCache && now < this.jwksCacheExpiresAt) {
      return this.jwksCache;
    }

    try {
      const response = await axios.get(this.config.jwksUri, { timeout: 8000 });
      this.jwksCache = response.data.keys || [];
      // Cache for 6 hours
      this.jwksCacheExpiresAt = now + 6 * 60 * 60 * 1000;
      return this.jwksCache;
    } catch (err) {
      if (this.jwksCache) {
        return this.jwksCache; // Fallback to cached keys on network error
      }
      const error = new Error(`Failed to fetch Google JWKS keys: ${err.message}`);
      error.statusCode = 502;
      throw error;
    }
  }

  /**
   * Converts a JWK into a PEM public key for verification
   */
  jwkToPem(jwk) {
    try {
      const keyObj = crypto.createPublicKey({ key: jwk, format: "jwk" });
      return keyObj.export({ type: "spki", format: "pem" });
    } catch (err) {
      throw new Error(`Failed to parse Google JWK into public key: ${err.message}`);
    }
  }

  /**
   * Validates Google ID Token (Signature, Issuer, Audience, Expiration, Nonce)
   */
  async verifyIdToken(idToken, { expectedNonce = null } = {}) {
    if (!idToken || typeof idToken !== "string") {
      const err = new Error("Google ID token is missing or malformed.");
      err.statusCode = 400;
      throw err;
    }

    // Decode header to retrieve key ID (kid)
    const decodedUnverified = jwt.decode(idToken, { complete: true });
    if (!decodedUnverified || !decodedUnverified.header || !decodedUnverified.payload) {
      const err = new Error("Invalid Google ID token structure.");
      err.statusCode = 400;
      throw err;
    }

    const { kid, alg } = decodedUnverified.header;
    if (alg !== "RS256") {
      const err = new Error(`Unsupported ID token algorithm: ${alg}. Expected RS256.`);
      err.statusCode = 400;
      throw err;
    }

    // Retrieve matching public key from Google JWKS
    const keys = await this.fetchJwks();
    const matchingJwk = keys.find((k) => k.kid === kid);
    if (!matchingJwk) {
      const err = new Error(`No matching Google public key found for kid: ${kid}`);
      err.statusCode = 401;
      throw err;
    }

    const pemKey = this.jwkToPem(matchingJwk);

    let claims;
    try {
      claims = jwt.verify(idToken, pemKey, {
        algorithms: ["RS256"],
        audience: this.config.clientId,
        issuer: ["https://accounts.google.com", "accounts.google.com"]
      });
    } catch (err) {
      const error = new Error(`Google ID token signature verification failed: ${err.message}`);
      error.statusCode = 401;
      throw error;
    }

    // Nonce validation (critical for OIDC replay prevention)
    if (expectedNonce) {
      if (!claims.nonce) {
        const err = new Error("Google ID token is missing expected nonce claim.");
        err.statusCode = 401;
        throw err;
      }
      if (claims.nonce !== expectedNonce) {
        const err = new Error("Google ID token nonce mismatch. Authentication rejected.");
        err.statusCode = 401;
        throw err;
      }
    }

    return claims;
  }

  /**
   * Fetches user profile from userinfo endpoint using access token
   */
  async fetchUserInfo(accessToken) {
    try {
      const response = await axios.get(this.config.userinfoEndpoint, {
        headers: {
          Authorization: `Bearer ${accessToken}`
        },
        timeout: 8000
      });
      return response.data;
    } catch (err) {
      const error = new Error(`Failed to fetch Google userinfo: ${err.message}`);
      error.statusCode = err.response?.status || 502;
      throw error;
    }
  }

  /**
   * Retrieves and normalizes user identity from ID token or userinfo endpoint
   */
  async getUserIdentity(tokenResult, { expectedNonce = null } = {}) {
    let profileClaims = null;

    if (tokenResult.idToken) {
      profileClaims = await this.verifyIdToken(tokenResult.idToken, { expectedNonce });
    } else if (tokenResult.accessToken) {
      profileClaims = await this.fetchUserInfo(tokenResult.accessToken);
    } else {
      const err = new Error("No ID token or access token available to obtain user identity.");
      err.statusCode = 400;
      throw err;
    }

    return IdentityMapper.normalizeGoogle(profileClaims);
  }
}

module.exports = GoogleOAuthProvider;
