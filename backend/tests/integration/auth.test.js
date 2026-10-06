process.env.NODE_ENV = "test";
process.env.JWT_SECRET = "test_jwt_secret_key_1234567890";
process.env.JWT_EXPIRES_IN = "1h";
process.env.MONGO_URI = "mongodb://127.0.0.1:27017/prepnova_test";

const { describe, it, before, after } = require("node:test");
const assert = require("node:assert");
const http = require("http");
const mongoose = require("mongoose");
const app = require("../../src/app");
const User = require("../../src/models/User");
const { generateToken } = require("../../src/utils/jwt");

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
    body: options.body ? JSON.stringify(options.body) : undefined
  });

  const data = await response.json().catch(() => ({}));
  return {
    status: response.status,
    ok: response.ok,
    headers: response.headers,
    data
  };
}

describe("Auth & Protected Routes Integration Tests", () => {
  before(async () => {
    // Connect to test database
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(process.env.MONGO_URI);
    }
    await User.deleteMany({});

    // Start HTTP server on dynamic port
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
      await User.deleteMany({});
    }
    if (mongoose.connection.readyState !== 0) {
      await mongoose.disconnect();
    }
    if (server) {
      await new Promise((resolve) => server.close(resolve));
    }
  });

  // ==========================================
  // REGISTRATION TESTS
  // ==========================================
  describe("Registration API - POST /api/auth/register", () => {
    it("1. should register a new user successfully", async () => {
      const res = await request("/api/auth/register", {
        method: "POST",
        body: {
          name: "Jaimin Trivedi",
          email: "jaimin@example.com",
          password: "StrongPassword123!"
        }
      });

      assert.strictEqual(res.status, 201);
      assert.strictEqual(res.data.success, true);
      assert.ok(res.data.token, "Should return a JWT token");
      assert.strictEqual(res.data.user.name, "Jaimin Trivedi");
      assert.strictEqual(res.data.user.email, "jaimin@example.com");
      assert.strictEqual(res.data.user.role, "user");
      assert.strictEqual(res.data.user.password, undefined, "Must NOT expose password");
    });

    it("2. should reject duplicate email registration with 409 Conflict", async () => {
      const res = await request("/api/auth/register", {
        method: "POST",
        body: {
          name: "Jaimin Duplicate",
          email: "jaimin@example.com", // Same email
          password: "AnotherPassword123!"
        }
      });

      assert.strictEqual(res.status, 409);
      assert.strictEqual(res.data.success, false);
      assert.ok(res.data.error.includes("already exists"));
    });

    it("3. should reject invalid email format with 400 Bad Request", async () => {
      const res = await request("/api/auth/register", {
        method: "POST",
        body: {
          name: "Invalid User",
          email: "not-an-email",
          password: "ValidPassword123!"
        }
      });

      assert.strictEqual(res.status, 400);
      assert.strictEqual(res.data.success, false);
      assert.ok(res.data.error.includes("valid email"));
    });

    it("4. should reject weak/short password with 400 Bad Request", async () => {
      const res = await request("/api/auth/register", {
        method: "POST",
        body: {
          name: "Weak Pass User",
          email: "weak@example.com",
          password: "123"
        }
      });

      assert.strictEqual(res.status, 400);
      assert.strictEqual(res.data.success, false);
      assert.ok(res.data.error.includes("at least 6 characters"));
    });

    it("5. should reject missing required fields with 400 Bad Request", async () => {
      const res = await request("/api/auth/register", {
        method: "POST",
        body: {}
      });

      assert.strictEqual(res.status, 400);
      assert.strictEqual(res.data.success, false);
    });
  });

  // ==========================================
  // LOGIN TESTS
  // ==========================================
  describe("Login API - POST /api/auth/login", () => {
    it("6. should log in with valid credentials and return JWT", async () => {
      const res = await request("/api/auth/login", {
        method: "POST",
        body: {
          email: "jaimin@example.com",
          password: "StrongPassword123!"
        }
      });

      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.data.success, true);
      assert.ok(res.data.token, "Should return a JWT token");
      assert.strictEqual(res.data.user.email, "jaimin@example.com");
      assert.strictEqual(res.data.user.password, undefined);
    });

    it("7. should reject incorrect password with 401 Unauthorized", async () => {
      const res = await request("/api/auth/login", {
        method: "POST",
        body: {
          email: "jaimin@example.com",
          password: "WrongPassword999!"
        }
      });

      assert.strictEqual(res.status, 401);
      assert.strictEqual(res.data.success, false);
      assert.strictEqual(res.data.error, "Invalid email or password.");
    });

    it("8. should reject nonexistent email with generic 401 Unauthorized", async () => {
      const res = await request("/api/auth/login", {
        method: "POST",
        body: {
          email: "doesnotexist@example.com",
          password: "AnyPassword123!"
        }
      });

      assert.strictEqual(res.status, 401);
      assert.strictEqual(res.data.success, false);
      assert.strictEqual(res.data.error, "Invalid email or password.");
    });

    it("9. should reject missing credentials with 400 Bad Request", async () => {
      const res = await request("/api/auth/login", {
        method: "POST",
        body: { email: "" }
      });

      assert.strictEqual(res.status, 400);
      assert.strictEqual(res.data.success, false);
    });
  });

  // ==========================================
  // CURRENT USER (GET /api/auth/me) TESTS
  // ==========================================
  describe("Current User Profile - GET /api/auth/me", () => {
    let validToken;

    before(async () => {
      const loginRes = await request("/api/auth/login", {
        method: "POST",
        body: {
          email: "jaimin@example.com",
          password: "StrongPassword123!"
        }
      });
      validToken = loginRes.data.token;
    });

    it("10 & 19. should return current user profile with valid Bearer token", async () => {
      const res = await request("/api/auth/me", {
        method: "GET",
        headers: {
          Authorization: `Bearer ${validToken}`
        }
      });

      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.data.success, true);
      assert.strictEqual(res.data.user.email, "jaimin@example.com");
      assert.strictEqual(res.data.user.password, undefined);
    });

    it("11 & 20. should return 401 Unauthorized when token is missing", async () => {
      const res = await request("/api/auth/me", { method: "GET" });

      assert.strictEqual(res.status, 401);
      assert.strictEqual(res.data.success, false);
    });

    it("12. should return 401 Unauthorized for malformed authorization header", async () => {
      const res = await request("/api/auth/me", {
        method: "GET",
        headers: {
          Authorization: "Basic invalid_credentials"
        }
      });

      assert.strictEqual(res.status, 401);
      assert.strictEqual(res.data.success, false);
    });

    it("13. should return 401 Unauthorized for forged or invalid token", async () => {
      const res = await request("/api/auth/me", {
        method: "GET",
        headers: {
          Authorization: "Bearer invalid.jwt.token"
        }
      });

      assert.strictEqual(res.status, 401);
      assert.strictEqual(res.data.success, false);
    });

    it("14. should return 401 Unauthorized for expired token", async () => {
      const expiredToken = generateToken({ id: "user_exp", email: "exp@example.com" }, "1ms");
      await new Promise((r) => setTimeout(r, 50));

      const res = await request("/api/auth/me", {
        method: "GET",
        headers: {
          Authorization: `Bearer ${expiredToken}`
        }
      });

      assert.strictEqual(res.status, 401);
      assert.strictEqual(res.data.success, false);
      assert.ok(res.data.error.includes("expired"));
    });
  });

  // ==========================================
  // LOGOUT & IMMEDIATE REVOCATION TESTS
  // ==========================================
  describe("Logout API - POST /api/auth/logout & Revocation", () => {
    it("21. should successfully logout authenticated user and revoke active token", async () => {
      const loginRes = await request("/api/auth/login", {
        method: "POST",
        body: {
          email: "jaimin@example.com",
          password: "StrongPassword123!"
        }
      });
      const token = loginRes.data.token;

      // 1. First logout call: returns 200
      const res = await request("/api/auth/logout", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.data.success, true);
      assert.ok(res.data.message.includes("Logout successful"));

      // 2. Subsequent access with logged-out token must be rejected with 401
      const meRes = await request("/api/auth/me", {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      assert.strictEqual(meRes.status, 401);
      assert.strictEqual(meRes.data.success, false);

      // 3. Repeated logout with same token must succeed gracefully (Idempotent)
      const repeatRes = await request("/api/auth/logout", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      assert.strictEqual(repeatRes.status, 200);
      assert.strictEqual(repeatRes.data.success, true);
    });

    it("22. should gracefully handle logout with no token, invalid token, or expired token", async () => {
      const res1 = await request("/api/auth/logout", { method: "POST" });
      assert.strictEqual(res1.status, 200);

      const res2 = await request("/api/auth/logout", {
        method: "POST",
        headers: { Authorization: "Bearer invalid.token.xyz" }
      });
      assert.strictEqual(res2.status, 200);
    });
  });

  // ==========================================
  // DELETED USER & ACCOUNT STATUS TESTS
  // ==========================================
  describe("User Existence & Deletion Lifecycle Invalidation", () => {
    it("23. should immediately reject valid JWT with 401 if user is deleted from MongoDB", async () => {
      // 1. Create temporary candidate user
      const regRes = await request("/api/auth/register", {
        method: "POST",
        body: {
          name: "Temporary User",
          email: "temp_to_delete@example.com",
          password: "Password123!"
        }
      });
      assert.strictEqual(regRes.status, 201);
      const token = regRes.data.token;
      const userId = regRes.data.user.id;

      // 2. Verify token works before deletion
      const preCheck = await request("/api/auth/me", {
        headers: { Authorization: `Bearer ${token}` }
      });
      assert.strictEqual(preCheck.status, 200);

      // 3. Delete user directly from MongoDB
      await User.findByIdAndDelete(userId);

      // 4. Token must immediately be rejected with 401 (not 404 or 500)
      const postCheck = await request("/api/auth/me", {
        headers: { Authorization: `Bearer ${token}` }
      });
      assert.strictEqual(postCheck.status, 401);
      assert.strictEqual(postCheck.data.success, false);
      assert.match(postCheck.data.error, /no longer exists/i);

      // 5. Normal login for deleted account must be rejected with 401
      const loginAttempt = await request("/api/auth/login", {
        method: "POST",
        body: {
          email: "temp_to_delete@example.com",
          password: "Password123!"
        }
      });
      assert.strictEqual(loginAttempt.status, 401);
    });

    it("24. should reject deactivated/suspended user accounts with 401", async () => {
      const regRes = await request("/api/auth/register", {
        method: "POST",
        body: {
          name: "Suspended User",
          email: "suspended@example.com",
          password: "Password123!"
        }
      });
      const token = regRes.data.token;
      const userId = regRes.data.user.id;

      // Mark account as inactive
      await User.findByIdAndUpdate(userId, { isActive: false });

      // Accessing /api/auth/me must return 401
      const meRes = await request("/api/auth/me", {
        headers: { Authorization: `Bearer ${token}` }
      });
      assert.strictEqual(meRes.status, 401);
      assert.match(meRes.data.error, /deactivated or suspended/i);

      // Logging in to deactivated account must return 401
      const loginRes = await request("/api/auth/login", {
        method: "POST",
        body: {
          email: "suspended@example.com",
          password: "Password123!"
        }
      });
      assert.strictEqual(loginRes.status, 401);
    });
  });

  // ==========================================
  // PROTECTED ROUTES & USER DATA ISOLATION
  // ==========================================
  describe("Protected Interview Routes & User Isolation", () => {
    let user1Token;
    let user2Token;

    before(async () => {
      // User 1
      const u1 = await request("/api/auth/register", {
        method: "POST",
        body: {
          name: "Interview User 1",
          email: "interview_u1@example.com",
          password: "StrongPassword123!"
        }
      });
      user1Token = u1.data.token;

      // User 2
      const u2 = await request("/api/auth/register", {
        method: "POST",
        body: {
          name: "Second User",
          email: "user2@example.com",
          password: "StrongPassword123!"
        }
      });
      user2Token = u2.data.token;
    });

    it("15. should allow authenticated user to start interview", async () => {
      const res = await request("/api/interview/start", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${user1Token}`
        },
        body: {
          role: "Frontend Developer",
          level: "beginner"
        }
      });

      assert.strictEqual(res.status, 200);
      assert.ok(res.data.sessionId, "Session ID should be created");
      assert.ok(res.data.question, "First question returned");
    });

    it("16. should block unauthenticated request to /api/interview/start with 401", async () => {
      const res = await request("/api/interview/start", {
        method: "POST",
        body: {
          role: "Frontend Developer",
          level: "beginner"
        }
      });

      assert.strictEqual(res.status, 401);
    });

    it("17. should prevent User 2 from accessing or modifying User 1's interview session (403 Forbidden)", async () => {
      // User 1 starts a session
      const startRes = await request("/api/interview/start", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${user1Token}`
        },
        body: {
          role: "Backend Developer",
          level: "beginner"
        }
      });
      const sessionId = startRes.data.sessionId;

      // User 2 tries to submit answer to User 1's session
      const followRes = await request("/api/interview/followup", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${user2Token}`
        },
        body: {
          sessionId,
          answer: "I am trying to answer another user's session."
        }
      });

      assert.strictEqual(followRes.status, 403, "Must return 403 Forbidden for cross-user session tampering");
      assert.ok(followRes.data.error.includes("Access denied"));

      // User 2 tries to end User 1's session
      const endRes = await request(`/api/interview/${sessionId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${user2Token}`
        }
      });
      assert.strictEqual(endRes.status, 403, "Must return 403 Forbidden when trying to delete another user's session");

      // User 1 can legitimately answer their own session
      const legitRes = await request("/api/interview/followup", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${user1Token}`
        },
        body: {
          sessionId,
          answer: "Node.js uses an event-driven, non-blocking I/O model."
        }
      });
      assert.strictEqual(legitRes.status, 200);
    });
  });
});
