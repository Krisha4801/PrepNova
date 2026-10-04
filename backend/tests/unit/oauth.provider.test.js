const { describe, it, before } = require("node:test");
const assert = require("node:assert/strict");
const crypto = require("crypto");
const jwt = require("jsonwebtoken");
const GoogleOAuthProvider = require("../../src/oauth/providers/google.provider");

describe("Google OAuth & OIDC Provider Unit Tests", () => {
  let googleProvider;
  let testKeyPair;
  let testJwk;
  const testClientId = "test_google_client_id_123.apps.googleusercontent.com";
  const testKid = "test-key-id-999";

  before(() => {
    // Generate RSA 2048 key pair for OIDC RS256 signature verification tests
    testKeyPair = crypto.generateKeyPairSync("rsa", {
      modulusLength: 2048,
      publicKeyEncoding: { type: "spki", format: "pem" },
      privateKeyEncoding: { type: "pkcs8", format: "pem" }
    });

    const pubKeyObj = crypto.createPublicKey(testKeyPair.publicKey);
    const jwkExport = pubKeyObj.export({ format: "jwk" });
    testJwk = {
      ...jwkExport,
      kid: testKid,
      alg: "RS256",
      use: "sig"
    };

    googleProvider = new GoogleOAuthProvider({
      clientId: testClientId,
      clientSecret: "test_client_secret_xyz",
      redirectUri: "http://localhost:5000/api/auth/oauth/google/callback",
      authorizationEndpoint: "https://accounts.google.com/o/oauth2/v2/auth",
      tokenEndpoint: "https://oauth2.googleapis.com/token",
      userinfoEndpoint: "https://openidconnect.googleapis.com/v1/userinfo",
      jwksUri: "https://www.googleapis.com/oauth2/v3/certs",
      scopes: ["openid", "email", "profile"]
    });

    // Mock provider's internal JWKS cache with our generated test key
    googleProvider.jwksCache = [testJwk];
    googleProvider.jwksCacheExpiresAt = Date.now() + 3600000;
  });

  it("should generate a valid Google authorization URL containing PKCE and Nonce", () => {
    const authUrl = googleProvider.getAuthorizationUrl({
      state: "state_token_12345",
      codeChallenge: "challenge_abc_123",
      codeChallengeMethod: "S256",
      nonce: "nonce_xyz_987"
    });

    assert.ok(authUrl.startsWith("https://accounts.google.com/o/oauth2/v2/auth"));
    const parsed = new URL(authUrl);
    assert.strictEqual(parsed.searchParams.get("client_id"), testClientId);
    assert.strictEqual(parsed.searchParams.get("response_type"), "code");
    assert.strictEqual(parsed.searchParams.get("state"), "state_token_12345");
    assert.strictEqual(parsed.searchParams.get("code_challenge"), "challenge_abc_123");
    assert.strictEqual(parsed.searchParams.get("code_challenge_method"), "S256");
    assert.strictEqual(parsed.searchParams.get("nonce"), "nonce_xyz_987");
    assert.strictEqual(parsed.searchParams.get("access_type"), "online");
    assert.strictEqual(parsed.searchParams.get("prompt"), "select_account");
  });

  it("should successfully verify a valid Google ID token with matching signature and nonce", async () => {
    const payload = {
      iss: "https://accounts.google.com",
      aud: testClientId,
      sub: "google_123456789",
      email: "candidate@gmail.com",
      email_verified: true,
      name: "Test Candidate",
      nonce: "correct_nonce_456"
    };

    const signedToken = jwt.sign(payload, testKeyPair.privateKey, {
      algorithm: "RS256",
      keyid: testKid,
      expiresIn: "1h"
    });

    const claims = await googleProvider.verifyIdToken(signedToken, {
      expectedNonce: "correct_nonce_456"
    });

    assert.strictEqual(claims.sub, "google_123456789");
    assert.strictEqual(claims.email, "candidate@gmail.com");
    assert.strictEqual(claims.email_verified, true);
    assert.strictEqual(claims.name, "Test Candidate");
    assert.strictEqual(claims.nonce, "correct_nonce_456");
  });

  it("should reject an ID token with mismatched nonce", async () => {
    const payload = {
      iss: "https://accounts.google.com",
      aud: testClientId,
      sub: "google_123456789",
      email: "candidate@gmail.com",
      email_verified: true,
      nonce: "correct_nonce_456"
    };

    const signedToken = jwt.sign(payload, testKeyPair.privateKey, {
      algorithm: "RS256",
      keyid: testKid,
      expiresIn: "1h"
    });

    await assert.rejects(
      async () => {
        await googleProvider.verifyIdToken(signedToken, {
          expectedNonce: "wrong_nonce_999"
        });
      },
      /nonce mismatch/i
    );
  });

  it("should reject an ID token with wrong audience", async () => {
    const payload = {
      iss: "https://accounts.google.com",
      aud: "wrong_unauthorized_client_id",
      sub: "google_123456789",
      email: "candidate@gmail.com",
      email_verified: true,
      nonce: "correct_nonce_456"
    };

    const signedToken = jwt.sign(payload, testKeyPair.privateKey, {
      algorithm: "RS256",
      keyid: testKid,
      expiresIn: "1h"
    });

    await assert.rejects(
      async () => {
        await googleProvider.verifyIdToken(signedToken, {
          expectedNonce: "correct_nonce_456"
        });
      },
      /jwt audience invalid/i
    );
  });

  it("should reject an expired ID token", async () => {
    const payload = {
      iss: "https://accounts.google.com",
      aud: testClientId,
      sub: "google_123456789",
      email: "candidate@gmail.com",
      email_verified: true,
      nonce: "correct_nonce_456",
      exp: Math.floor(Date.now() / 1000) - 100 // expired
    };

    const signedToken = jwt.sign(payload, testKeyPair.privateKey, {
      algorithm: "RS256",
      keyid: testKid
    });

    await assert.rejects(
      async () => {
        await googleProvider.verifyIdToken(signedToken, {
          expectedNonce: "correct_nonce_456"
        });
      },
      /jwt expired/i
    );
  });
});
