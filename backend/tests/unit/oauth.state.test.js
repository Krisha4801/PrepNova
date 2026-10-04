const { describe, it, beforeEach } = require("node:test");
const assert = require("node:assert/strict");
const crypto = require("crypto");
const {
  generateCodeVerifier,
  deriveCodeChallenge,
  generateState,
  generateNonce,
  createTransaction,
  consumeTransaction,
  createHandoffTicket,
  consumeHandoffTicket,
  clearAll
} = require("../../src/oauth/oauth.state");

describe("OAuth State & PKCE Unit Tests", () => {
  beforeEach(() => {
    clearAll();
  });

  it("should generate a valid URL-safe PKCE code verifier", () => {
    const verifier = generateCodeVerifier();
    assert.ok(verifier && typeof verifier === "string");
    assert.ok(verifier.length >= 43 && verifier.length <= 128);
    // Ensure URL safe characters only
    assert.match(verifier, /^[A-Za-z0-9_-]+$/);
  });

  it("should correctly derive SHA-256 PKCE code challenge", () => {
    const verifier = "test-verifier-string-1234567890-abcdefghijklmnop";
    const challenge1 = deriveCodeChallenge(verifier);
    const challenge2 = deriveCodeChallenge(verifier);

    assert.strictEqual(challenge1, challenge2);
    assert.match(challenge1, /^[A-Za-z0-9_-]+$/);

    // Manually verify SHA256 base64url calculation
    const expected = crypto
      .createHash("sha256")
      .update(verifier)
      .digest("base64")
      .replace(/\+/g, "-")
      .replace(/\//g, "_")
      .replace(/=+$/, "");
    assert.strictEqual(challenge1, expected);
  });

  it("should generate unique, random state tokens", () => {
    const state1 = generateState();
    const state2 = generateState();
    assert.notStrictEqual(state1, state2);
    assert.strictEqual(state1.length, 64); // 32 bytes hex
  });

  it("should generate unique, random OIDC nonces", () => {
    const nonce1 = generateNonce();
    const nonce2 = generateNonce();
    assert.notStrictEqual(nonce1, nonce2);
    assert.match(nonce1, /^[A-Za-z0-9_-]+$/);
  });

  it("should create and consume an authorization transaction (enforcing single-use)", () => {
    const tx = createTransaction({ provider: "google", returnTo: "http://localhost:5173/dashboard" });
    assert.ok(tx.state);
    assert.ok(tx.codeVerifier);
    assert.ok(tx.codeChallenge);
    assert.strictEqual(tx.codeChallengeMethod, "S256");
    assert.ok(tx.nonce);

    // First consumption: should succeed
    const consumed = consumeTransaction(tx.state);
    assert.ok(consumed);
    assert.strictEqual(consumed.provider, "google");
    assert.strictEqual(consumed.codeVerifier, tx.codeVerifier);
    assert.strictEqual(consumed.nonce, tx.nonce);
    assert.strictEqual(consumed.returnTo, "http://localhost:5173/dashboard");

    // Second consumption (replay attack prevention): must return null
    const replay = consumeTransaction(tx.state);
    assert.strictEqual(replay, null);
  });

  it("should return null for unknown or empty state", () => {
    assert.strictEqual(consumeTransaction("nonexistent-state"), null);
    assert.strictEqual(consumeTransaction(null), null);
    assert.strictEqual(consumeTransaction(""), null);
  });

  it("should create and consume a single-use handoff ticket", () => {
    const samplePayload = { token: "sample_jwt_123", user: { id: "u123", email: "test@example.com" } };
    const ticket = createHandoffTicket(samplePayload);
    assert.ok(ticket && ticket.startsWith("pnt_"));

    // First consumption: should succeed
    const data = consumeHandoffTicket(ticket);
    assert.ok(data);
    assert.strictEqual(data.token, "sample_jwt_123");
    assert.strictEqual(data.user.email, "test@example.com");

    // Second consumption: must fail (ticket is burned)
    const burned = consumeHandoffTicket(ticket);
    assert.strictEqual(burned, null);
  });
});
