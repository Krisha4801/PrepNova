process.env.NODE_ENV = "test";
process.env.JWT_SECRET = "test_jwt_secret_key_1234567890";
process.env.JWT_EXPIRES_IN = "1h";
process.env.MONGO_URI = "mongodb://127.0.0.1:27017/prepnova_test";
process.env.GOOGLE_CLIENT_ID = "test_google_client_id_123.apps.googleusercontent.com";
process.env.GOOGLE_CLIENT_SECRET = "test_google_client_secret_abc";
process.env.GOOGLE_REDIRECT_URI = "http://localhost:5000/api/auth/oauth/google/callback";

const { describe, it, before, after } = require("node:test");
const assert = require("node:assert");
const crypto = require("crypto");
const mongoose = require("mongoose");
const app = require("../../src/app");
const User = require("../../src/models/User");
const { getProvider } = require("../../src/oauth/providers");

let server;
let baseUrl;

async function request(path, options = {}) {
  const url = `${baseUrl}${path}`;
  const response = await fetch(url, {
    method: options.method || "GET",
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {})
    },
    redirect: "manual", // Prevent auto-following redirects so we can inspect 302
    body: options.body ? JSON.stringify(options.body) : undefined
  });

  const location = response.headers.get("location");
  let data = {};
  if (response.status !== 302) {
    data = await response.json().catch(() => ({}));
  }

  return {
    status: response.status,
    ok: response.ok,
    headers: response.headers,
    location,
    data
  };
}

describe("OAuth & OpenID Connect Full Integration Tests", () => {
  let googleProvider;

  before(async () => {
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(process.env.MONGO_URI);
    }
    await User.deleteMany({ email: /oauth|google|local_user|candidate|domain\.com|prepnova\.io/i });

    googleProvider = getProvider("google");

    // Start HTTP server on dynamic test port
    await new Promise((resolve) => {
      server = app.listen(0, () => {
        const port = server.address().port;
        baseUrl = `http://127.0.0.1:${port}`;
        resolve();
      });
    });
  });

  after(async () => {
    if (User.deleteMany) {
      await User.deleteMany({ email: /oauth|google|local_user|candidate|domain\.com|prepnova\.io/i });
    }
    if (server) {
      await new Promise((resolve) => server.close(resolve));
    }
    if (mongoose.connection.readyState !== 0) {
      await mongoose.disconnect();
    }
  });

  it("1. should list available OAuth providers", async () => {
    const res = await request("/api/auth/oauth/providers");
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.data.success, true);
    assert.ok(Array.isArray(res.data.providers));
    const google = res.data.providers.find((p) => p.id === "google");
    assert.ok(google);
    assert.strictEqual(google.name, "Google");
    assert.strictEqual(google.isConfigured, true);
  });

  it("2. should initiate OAuth and return 302 redirect with PKCE & Nonce", async () => {
    const res = await request("/api/auth/oauth/google");
    assert.strictEqual(res.status, 302);
    assert.ok(res.location);
    assert.ok(res.location.startsWith("https://accounts.google.com/o/oauth2/v2/auth"));

    const url = new URL(res.location);
    assert.strictEqual(url.searchParams.get("client_id"), process.env.GOOGLE_CLIENT_ID);
    assert.strictEqual(url.searchParams.get("response_type"), "code");
    assert.strictEqual(url.searchParams.get("code_challenge_method"), "S256");
    assert.ok(url.searchParams.get("code_challenge"));
    assert.ok(url.searchParams.get("state"));
    assert.ok(url.searchParams.get("nonce"));
  });

  it("3. should initiate OAuth with format=json", async () => {
    const res = await request("/api/auth/oauth/google?format=json");
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.data.success, true);
    assert.strictEqual(res.data.provider, "google");
    assert.ok(res.data.authorizationUrl);
    assert.ok(res.data.state);
  });

  it("4. should reject initiation for an unsupported provider with 400 Bad Request", async () => {
    const res = await request("/api/auth/oauth/unsupported_provider_xyz");
    assert.strictEqual(res.status, 400);
    assert.strictEqual(res.data.success, false);
    assert.match(res.data.error, /unsupported/i);
  });

  it("5. should handle provider error param by redirecting to frontend with oauth_error", async () => {
    const res = await request("/api/auth/oauth/google/callback?error=access_denied&error_description=User+denied+consent");
    assert.strictEqual(res.status, 302);
    assert.ok(res.location);
    assert.ok(res.location.includes("oauth_error"));
    assert.ok(res.location.includes("User"));
  });

  it("6. should reject callback with invalid or missing state", async () => {
    const res = await request("/api/auth/oauth/google/callback?code=some_code&state=forged_or_expired_state");
    assert.strictEqual(res.status, 302);
    assert.ok(res.location);
    assert.ok(res.location.includes("oauth_error"));
    assert.ok(res.location.includes("state"));
  });

  it("7. should complete full OAuth flow: initiate -> callback -> exchange -> verify /api/auth/me", async () => {
    // Step 1: Initiate OAuth to obtain valid state & PKCE transaction
    const initRes = await request("/api/auth/oauth/google?format=json");
    const { state } = initRes.data;
    assert.ok(state);

    // Mock Google exchangeCode and getUserIdentity for this test execution
    const originalExchange = googleProvider.exchangeCode;
    const originalGetUser = googleProvider.getUserIdentity;

    googleProvider.exchangeCode = async () => ({
      accessToken: "mock_google_access_token_123",
      idToken: "mock_google_id_token_xyz"
    });

    googleProvider.getUserIdentity = async () => ({
      provider: "google",
      providerUserId: "google_sub_99887766",
      email: "new_google_candidate@prepnova.io",
      emailVerified: true,
      name: "New Google Candidate",
      avatarUrl: "https://avatar.example.com/photo.png"
    });

    try {
      // Step 2: Simulate Google callback redirect
      const callbackRes = await request(`/api/auth/oauth/google/callback?code=mock_google_auth_code_123&state=${state}`);
      assert.strictEqual(callbackRes.status, 302);
      assert.ok(callbackRes.location);
      assert.ok(callbackRes.location.includes("oauth_ticket="));

      // Extract ticket from redirect URL
      const redirectUrl = new URL(callbackRes.location);
      const ticket = redirectUrl.searchParams.get("oauth_ticket");
      assert.ok(ticket && ticket.startsWith("pnt_"));

      // Step 3: Exchange handoff ticket for application JWT
      const exchangeRes = await request("/api/auth/oauth/exchange", {
        method: "POST",
        body: { ticket }
      });

      assert.strictEqual(exchangeRes.status, 200);
      assert.strictEqual(exchangeRes.data.success, true);
      assert.ok(exchangeRes.data.token);
      assert.strictEqual(exchangeRes.data.user.email, "new_google_candidate@prepnova.io");
      assert.strictEqual(exchangeRes.data.user.role, "user");

      const appToken = exchangeRes.data.token;

      // Step 4: Verify MongoDB document was created with OAuth provider metadata
      const userInDb = await User.findOne({ email: "new_google_candidate@prepnova.io" });
      assert.ok(userInDb);
      assert.strictEqual(userInDb.authProviders.length, 1);
      assert.strictEqual(userInDb.authProviders[0].provider, "google");
      assert.strictEqual(userInDb.authProviders[0].providerUserId, "google_sub_99887766");

      // Step 5: Test accessing /api/auth/me with the issued PrepNova JWT
      const meRes = await request("/api/auth/me", {
        headers: { Authorization: `Bearer ${appToken}` }
      });
      assert.strictEqual(meRes.status, 200);
      assert.strictEqual(meRes.data.success, true);
      assert.strictEqual(meRes.data.user.email, "new_google_candidate@prepnova.io");

      // Step 6: Verify handoff ticket replay is rejected (single-use)
      const replayRes = await request("/api/auth/oauth/exchange", {
        method: "POST",
        body: { ticket }
      });
      assert.strictEqual(replayRes.status, 400);
      assert.strictEqual(replayRes.data.success, false);
    } finally {
      googleProvider.exchangeCode = originalExchange;
      googleProvider.getUserIdentity = originalGetUser;
    }
  });

  it("8. should authenticate existing OAuth user on repeat login without duplicate records", async () => {
    const initRes = await request("/api/auth/oauth/google?format=json");
    const { state } = initRes.data;

    const originalExchange = googleProvider.exchangeCode;
    const originalGetUser = googleProvider.getUserIdentity;

    googleProvider.exchangeCode = async () => ({
      accessToken: "mock_google_access_token_123",
      idToken: "mock_google_id_token_xyz"
    });

    googleProvider.getUserIdentity = async () => ({
      provider: "google",
      providerUserId: "google_sub_99887766", // Same providerUserId from test 7
      email: "new_google_candidate@prepnova.io",
      emailVerified: true,
      name: "New Google Candidate"
    });

    try {
      const callbackRes = await request(`/api/auth/oauth/google/callback?code=mock_code&state=${state}`);
      assert.strictEqual(callbackRes.status, 302);
      const redirectUrl = new URL(callbackRes.location);
      const ticket = redirectUrl.searchParams.get("oauth_ticket");

      const exchangeRes = await request("/api/auth/oauth/exchange", {
        method: "POST",
        body: { ticket }
      });

      assert.strictEqual(exchangeRes.status, 200);
      assert.strictEqual(exchangeRes.data.user.email, "new_google_candidate@prepnova.io");

      // Verify total user count in DB is still 1
      const count = await User.countDocuments({ email: "new_google_candidate@prepnova.io" });
      assert.strictEqual(count, 1);
    } finally {
      googleProvider.exchangeCode = originalExchange;
      googleProvider.getUserIdentity = originalGetUser;
    }
  });

  it("9. should link Google OAuth provider to existing email/password account and preserve password login", async () => {
    // 1. Register local email/password user
    const regRes = await request("/api/auth/register", {
      method: "POST",
      body: {
        name: "Local User",
        email: "local_user@domain.com",
        password: "Password123!"
      }
    });
    assert.strictEqual(regRes.status, 201);

    // 2. Log in with Google matching the same verified email
    const initRes = await request("/api/auth/oauth/google?format=json");
    const { state } = initRes.data;

    const originalExchange = googleProvider.exchangeCode;
    const originalGetUser = googleProvider.getUserIdentity;

    googleProvider.exchangeCode = async () => ({ accessToken: "mock_token" });
    googleProvider.getUserIdentity = async () => ({
      provider: "google",
      providerUserId: "google_linked_sub_554433",
      email: "local_user@domain.com",
      emailVerified: true,
      name: "Local User"
    });

    try {
      const callbackRes = await request(`/api/auth/oauth/google/callback?code=mock_code&state=${state}`);
      const redirectUrl = new URL(callbackRes.location);
      const ticket = redirectUrl.searchParams.get("oauth_ticket");

      const exchangeRes = await request("/api/auth/oauth/exchange", {
        method: "POST",
        body: { ticket }
      });

      assert.strictEqual(exchangeRes.status, 200);
      assert.strictEqual(exchangeRes.data.user.email, "local_user@domain.com");

      // Verify account linking in MongoDB
      const linkedUser = await User.findOne({ email: "local_user@domain.com" });
      assert.ok(linkedUser);
      assert.strictEqual(linkedUser.authProviders.length, 1);
      assert.strictEqual(linkedUser.authProviders[0].providerUserId, "google_linked_sub_554433");

      // 3. Verify original password login STILL WORKS!
      const passLoginRes = await request("/api/auth/login", {
        method: "POST",
        body: {
          email: "local_user@domain.com",
          password: "Password123!"
        }
      });
      assert.strictEqual(passLoginRes.status, 200);
      assert.strictEqual(passLoginRes.data.success, true);
    } finally {
      googleProvider.exchangeCode = originalExchange;
      googleProvider.getUserIdentity = originalGetUser;
    }
  });

  it("10. should reject OAuth callback when provider email is unverified", async () => {
    const initRes = await request("/api/auth/oauth/google?format=json");
    const { state } = initRes.data;

    const originalExchange = googleProvider.exchangeCode;
    const originalGetUser = googleProvider.getUserIdentity;

    googleProvider.exchangeCode = async () => ({ accessToken: "mock_token" });
    googleProvider.getUserIdentity = async () => ({
      provider: "google",
      providerUserId: "google_unverified_sub_112233",
      email: "unverified@domain.com",
      emailVerified: false // Unverified
    });

    try {
      const callbackRes = await request(`/api/auth/oauth/google/callback?code=mock_code&state=${state}`);
      assert.strictEqual(callbackRes.status, 302);
      assert.ok(callbackRes.location.includes("oauth_error"));
      assert.ok(callbackRes.location.includes("unverified"));
    } finally {
      googleProvider.exchangeCode = originalExchange;
      googleProvider.getUserIdentity = originalGetUser;
    }
  });

  it("11. should immediately reject Google user application JWT with 401 when user is deleted from MongoDB", async () => {
    // 1. Initiate and complete OAuth login for temporary candidate
    const initRes = await request("/api/auth/oauth/google?format=json");
    const { state } = initRes.data;

    const originalExchange = googleProvider.exchangeCode;
    const originalGetUser = googleProvider.getUserIdentity;

    googleProvider.exchangeCode = async () => ({ accessToken: "mock_token" });
    googleProvider.getUserIdentity = async () => ({
      provider: "google",
      providerUserId: "google_to_delete_sub_7788",
      email: "google_to_delete@prepnova.io",
      emailVerified: true,
      name: "Google Delete Test"
    });

    try {
      const callbackRes = await request(`/api/auth/oauth/google/callback?code=mock_code&state=${state}`);
      const redirectUrl = new URL(callbackRes.location);
      const ticket = redirectUrl.searchParams.get("oauth_ticket");

      const exchangeRes = await request("/api/auth/oauth/exchange", {
        method: "POST",
        body: { ticket }
      });
      assert.strictEqual(exchangeRes.status, 200);
      const appToken = exchangeRes.data.token;
      const userId = exchangeRes.data.user.id;

      // 2. Token works initially
      const preCheck = await request("/api/auth/me", {
        headers: { Authorization: `Bearer ${appToken}` }
      });
      assert.strictEqual(preCheck.status, 200);

      // 3. Delete user document from MongoDB
      await User.findByIdAndDelete(userId);

      // 4. Token must immediately be rejected with 401
      const postCheck = await request("/api/auth/me", {
        headers: { Authorization: `Bearer ${appToken}` }
      });
      assert.strictEqual(postCheck.status, 401);
      assert.match(postCheck.data.error, /no longer exists/i);
    } finally {
      googleProvider.exchangeCode = originalExchange;
      googleProvider.getUserIdentity = originalGetUser;
    }
  });

  it("12. should create a fresh application user when a previously deleted Google user authenticates again", async () => {
    // Authenticate the same Google user whose record was deleted in test 11
    const initRes = await request("/api/auth/oauth/google?format=json");
    const { state } = initRes.data;

    const originalExchange = googleProvider.exchangeCode;
    const originalGetUser = googleProvider.getUserIdentity;

    googleProvider.exchangeCode = async () => ({ accessToken: "mock_token" });
    googleProvider.getUserIdentity = async () => ({
      provider: "google",
      providerUserId: "google_to_delete_sub_7788",
      email: "google_to_delete@prepnova.io",
      emailVerified: true,
      name: "Google Delete Test Re-created"
    });

    try {
      const callbackRes = await request(`/api/auth/oauth/google/callback?code=mock_code&state=${state}`);
      const redirectUrl = new URL(callbackRes.location);
      const ticket = redirectUrl.searchParams.get("oauth_ticket");

      const exchangeRes = await request("/api/auth/oauth/exchange", {
        method: "POST",
        body: { ticket }
      });
      assert.strictEqual(exchangeRes.status, 200);
      assert.strictEqual(exchangeRes.data.user.email, "google_to_delete@prepnova.io");

      // Verify new document exists in MongoDB
      const newDoc = await User.findOne({ email: "google_to_delete@prepnova.io" });
      assert.ok(newDoc);
      assert.strictEqual(newDoc.authProviders[0].providerUserId, "google_to_delete_sub_7788");

      // Access protected endpoint with new token
      const meRes = await request("/api/auth/me", {
        headers: { Authorization: `Bearer ${exchangeRes.data.token}` }
      });
      assert.strictEqual(meRes.status, 200);
    } finally {
      googleProvider.exchangeCode = originalExchange;
      googleProvider.getUserIdentity = originalGetUser;
    }
  });

  it("13. should reject Google login when user account is deactivated (isActive = false)", async () => {
    // 1. Deactivate existing user
    await User.findOneAndUpdate(
      { email: "google_to_delete@prepnova.io" },
      { isActive: false }
    );

    const initRes = await request("/api/auth/oauth/google?format=json");
    const { state } = initRes.data;

    const originalExchange = googleProvider.exchangeCode;
    const originalGetUser = googleProvider.getUserIdentity;

    googleProvider.exchangeCode = async () => ({ accessToken: "mock_token" });
    googleProvider.getUserIdentity = async () => ({
      provider: "google",
      providerUserId: "google_to_delete_sub_7788",
      email: "google_to_delete@prepnova.io",
      emailVerified: true
    });

    try {
      const callbackRes = await request(`/api/auth/oauth/google/callback?code=mock_code&state=${state}`);
      assert.strictEqual(callbackRes.status, 302);
      assert.ok(callbackRes.location.includes("oauth_error"));
      assert.ok(callbackRes.location.includes("deactivated"));
    } finally {
      googleProvider.exchangeCode = originalExchange;
      googleProvider.getUserIdentity = originalGetUser;
    }
  });
});
