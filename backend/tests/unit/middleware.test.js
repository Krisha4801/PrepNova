const { describe, it } = require("node:test");
const assert = require("node:assert");
const { authenticateToken } = require("../../src/middleware/auth.middleware");
const { authorizeRoles } = require("../../src/middleware/authorize.middleware");
const { generateToken } = require("../../src/utils/jwt");

function createMockResponse() {
  const res = {
    statusCode: 200,
    body: null,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(data) {
      this.body = data;
      return this;
    }
  };
  return res;
}

describe("Middleware Unit Tests", () => {
  describe("authenticateToken", () => {
    it("should allow request with valid Bearer token", () => {
      const token = generateToken({ id: "user_456", email: "auth@example.com", role: "user" });
      const req = {
        headers: {
          authorization: `Bearer ${token}`
        }
      };
      const res = createMockResponse();
      let nextCalled = false;

      authenticateToken(req, res, () => {
        nextCalled = true;
      });

      assert.strictEqual(nextCalled, true);
      assert.ok(req.user);
      assert.strictEqual(req.user.id, "user_456");
      assert.strictEqual(req.user.email, "auth@example.com");
      assert.strictEqual(req.user.role, "user");
    });

    it("should return 401 when Authorization header is missing", () => {
      const req = { headers: {} };
      const res = createMockResponse();
      let nextCalled = false;

      authenticateToken(req, res, () => {
        nextCalled = true;
      });

      assert.strictEqual(nextCalled, false);
      assert.strictEqual(res.statusCode, 401);
      assert.strictEqual(res.body.success, false);
      assert.ok(res.body.error.includes("No authorization header"));
    });

    it("should return 401 when Authorization format is malformed", () => {
      const req = { headers: { authorization: "Token 12345" } };
      const res = createMockResponse();
      let nextCalled = false;

      authenticateToken(req, res, () => {
        nextCalled = true;
      });

      assert.strictEqual(nextCalled, false);
      assert.strictEqual(res.statusCode, 401);
      assert.strictEqual(res.body.success, false);
      assert.ok(res.body.error.includes("Bearer"));
    });

    it("should return 401 when token is invalid or signature is forged", () => {
      const req = { headers: { authorization: "Bearer invalid.signature.token" } };
      const res = createMockResponse();
      let nextCalled = false;

      authenticateToken(req, res, () => {
        nextCalled = true;
      });

      assert.strictEqual(nextCalled, false);
      assert.strictEqual(res.statusCode, 401);
      assert.strictEqual(res.body.success, false);
      assert.ok(res.body.error.includes("Invalid token"));
    });

    it("should return 401 when token is expired", async () => {
      const token = generateToken({ id: "user_exp", email: "exp@example.com" }, "1ms");
      await new Promise((resolve) => setTimeout(resolve, 50));

      const req = { headers: { authorization: `Bearer ${token}` } };
      const res = createMockResponse();
      let nextCalled = false;

      authenticateToken(req, res, () => {
        nextCalled = true;
      });

      assert.strictEqual(nextCalled, false);
      assert.strictEqual(res.statusCode, 401);
      assert.strictEqual(res.body.success, false);
      assert.ok(res.body.error.includes("expired"));
    });
  });

  describe("authorizeRoles", () => {
    it("should allow user with matching authorized role", () => {
      const req = { user: { id: "admin_1", role: "admin" } };
      const res = createMockResponse();
      let nextCalled = false;

      const middleware = authorizeRoles("admin");
      middleware(req, res, () => {
        nextCalled = true;
      });

      assert.strictEqual(nextCalled, true);
    });

    it("should block user with insufficient role with 403 Forbidden", () => {
      const req = { user: { id: "user_1", role: "user" } };
      const res = createMockResponse();
      let nextCalled = false;

      const middleware = authorizeRoles("admin");
      middleware(req, res, () => {
        nextCalled = true;
      });

      assert.strictEqual(nextCalled, false);
      assert.strictEqual(res.statusCode, 403);
      assert.strictEqual(res.body.success, false);
      assert.ok(res.body.error.includes("insufficient permissions"));
    });

    it("should return 401 if unauthenticated user hits authorize middleware", () => {
      const req = {};
      const res = createMockResponse();
      let nextCalled = false;

      const middleware = authorizeRoles("admin");
      middleware(req, res, () => {
        nextCalled = true;
      });

      assert.strictEqual(nextCalled, false);
      assert.strictEqual(res.statusCode, 401);
    });
  });
});
