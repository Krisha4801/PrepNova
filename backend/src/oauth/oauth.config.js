/**
 * OAuth & OIDC Configuration Module
 * Centralizes provider credentials, redirect URIs, scopes, and security parameters.
 */

function getFrontendOrigins() {
  if (process.env.FRONTEND_URL) {
    return process.env.FRONTEND_URL.split(",").map((o) => o.trim()).filter(Boolean);
  }
  return [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://localhost:3000",
    "http://127.0.0.1:3000"
  ];
}

function getDefaultFrontendUrl() {
  const origins = getFrontendOrigins();
  return origins[0] || "http://localhost:5173";
}

const oauthConfig = {
  providers: {
    google: {
      name: "Google",
      clientId: process.env.GOOGLE_CLIENT_ID || "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
      redirectUri:
        process.env.GOOGLE_REDIRECT_URI ||
        "http://localhost:5000/api/auth/oauth/google/callback",
      issuer: "https://accounts.google.com",
      discoveryUrl: "https://accounts.google.com/.well-known/openid-configuration",
      authorizationEndpoint: "https://accounts.google.com/o/oauth2/v2/auth",
      tokenEndpoint: "https://oauth2.googleapis.com/token",
      userinfoEndpoint: "https://openidconnect.googleapis.com/v1/userinfo",
      jwksUri: "https://www.googleapis.com/oauth2/v3/certs",
      scopes: ["openid", "email", "profile"],
      usePkce: true,
      useNonce: true
    },
    github: {
      name: "GitHub",
      clientId: process.env.GITHUB_CLIENT_ID || "",
      clientSecret: process.env.GITHUB_CLIENT_SECRET || "",
      redirectUri:
        process.env.GITHUB_REDIRECT_URI ||
        "http://localhost:5000/api/auth/oauth/github/callback",
      authorizationEndpoint: "https://github.com/login/oauth/authorize",
      tokenEndpoint: "https://github.com/login/oauth/access_token",
      userinfoEndpoint: "https://api.github.com/user",
      emailsEndpoint: "https://api.github.com/user/emails",
      scopes: ["read:user", "user:email"],
      usePkce: true,
      useNonce: false
    }
  },
  stateTtlMs: 10 * 60 * 1000, // 10 minutes
  handoffTicketTtlMs: 60 * 1000, // 60 seconds
  getFrontendOrigins,
  getDefaultFrontendUrl,
  isProviderConfigured(providerKey) {
    const config = this.providers[providerKey];
    return !!(config && config.clientId && config.clientSecret);
  }
};

module.exports = oauthConfig;
