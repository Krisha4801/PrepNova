/**
 * Base OAuth/OIDC Provider Adapter Interface
 * All concrete providers must adhere to this interface.
 */

class BaseOAuthProvider {
  constructor(name, config) {
    this.name = name;
    this.config = config;
  }

  /**
   * Generates the provider authorization URL.
   * @param {Object} params - { state, codeChallenge, codeChallengeMethod, nonce, customRedirectUri }
   * @returns {string} Fully qualified authorization URL
   */
  getAuthorizationUrl(params) {
    throw new Error(`getAuthorizationUrl not implemented for ${this.name}`);
  }

  /**
   * Exchanges an authorization code for tokens.
   * @param {Object} params - { code, codeVerifier, customRedirectUri }
   * @returns {Promise<Object>} { accessToken, idToken, rawTokens }
   */
  async exchangeCode(params) {
    throw new Error(`exchangeCode not implemented for ${this.name}`);
  }

  /**
   * Validates the ID token and returns verified identity.
   * @param {string} idToken - Raw JWT ID token string
   * @param {Object} options - { expectedNonce, expectedAudience, expectedIssuer }
   * @returns {Promise<Object>} Verified claims
   */
  async verifyIdToken(idToken, options) {
    throw new Error(`verifyIdToken not implemented for ${this.name}`);
  }

  /**
   * Obtains and returns the normalized user identity.
   * @param {Object} tokenResult - { accessToken, idToken, rawTokens, codeVerifier, expectedNonce }
   * @returns {Promise<Object>} Normalized user identity
   */
  async getUserIdentity(tokenResult) {
    throw new Error(`getUserIdentity not implemented for ${this.name}`);
  }
}

module.exports = BaseOAuthProvider;
