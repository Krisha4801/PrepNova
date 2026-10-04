const axios = require("axios");
const BaseOAuthProvider = require("./base.provider");
const IdentityMapper = require("../identity.mapper");

class GitHubOAuthProvider extends BaseOAuthProvider {
  constructor(config) {
    super("github", config);
  }

  getAuthorizationUrl({ state, customRedirectUri }) {
    if (!this.config.clientId) {
      const err = new Error("GitHub OAuth Client ID is not configured.");
      err.statusCode = 500;
      throw err;
    }

    const redirectUri = customRedirectUri || this.config.redirectUri;
    const scopes = (this.config.scopes || ["read:user", "user:email"]).join(" ");

    const params = new URLSearchParams({
      client_id: this.config.clientId,
      redirect_uri: redirectUri,
      scope: scopes,
      state
    });

    return `${this.config.authorizationEndpoint}?${params.toString()}`;
  }

  async exchangeCode({ code, customRedirectUri }) {
    if (!this.config.clientId || !this.config.clientSecret) {
      const err = new Error("GitHub OAuth credentials are not configured.");
      err.statusCode = 500;
      throw err;
    }

    const redirectUri = customRedirectUri || this.config.redirectUri;

    try {
      const response = await axios.post(
        this.config.tokenEndpoint,
        {
          client_id: this.config.clientId,
          client_secret: this.config.clientSecret,
          code,
          redirect_uri: redirectUri
        },
        {
          headers: {
            Accept: "application/json",
            "Content-Type": "application/json"
          },
          timeout: 10000
        }
      );

      if (response.data.error) {
        const error = new Error(`GitHub token exchange error: ${response.data.error_description || response.data.error}`);
        error.statusCode = 400;
        throw error;
      }

      return {
        accessToken: response.data.access_token,
        tokenType: response.data.token_type,
        rawTokens: response.data
      };
    } catch (err) {
      const error = new Error(err.message || "Failed to exchange code with GitHub.");
      error.statusCode = err.statusCode || 502;
      throw error;
    }
  }

  async getUserIdentity(tokenResult) {
    const accessToken = tokenResult.accessToken;
    if (!accessToken) {
      const err = new Error("Access token is missing from GitHub token response.");
      err.statusCode = 400;
      throw err;
    }

    try {
      const [userRes, emailsRes] = await Promise.all([
        axios.get(this.config.userinfoEndpoint, {
          headers: { Authorization: `Bearer ${accessToken}`, "User-Agent": "PrepNova-OAuth" }
        }),
        axios.get(this.config.emailsEndpoint, {
          headers: { Authorization: `Bearer ${accessToken}`, "User-Agent": "PrepNova-OAuth" }
        }).catch(() => ({ data: [] }))
      ]);

      const primaryEmail = (emailsRes.data || []).find((e) => e.primary) || (emailsRes.data || [])[0] || null;
      return IdentityMapper.normalizeGitHub(userRes.data, primaryEmail);
    } catch (err) {
      const error = new Error(`Failed to fetch GitHub profile: ${err.message}`);
      error.statusCode = 502;
      throw error;
    }
  }
}

module.exports = GitHubOAuthProvider;
