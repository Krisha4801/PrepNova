const { describe, it } = require("node:test");
const assert = require("node:assert/strict");
const IdentityMapper = require("../../src/oauth/identity.mapper");

describe("OAuth Identity Mapper Unit Tests", () => {
  it("should correctly normalize a Google profile claims object", () => {
    const googleClaims = {
      sub: "google_user_1029384756",
      email: "Candidate@Domain.COM",
      email_verified: true,
      name: "Alex Doe",
      given_name: "Alex",
      family_name: "Doe",
      picture: "https://lh3.googleusercontent.com/a/sample-photo"
    };

    const normalized = IdentityMapper.normalize("google", googleClaims);

    assert.strictEqual(normalized.provider, "google");
    assert.strictEqual(normalized.providerUserId, "google_user_1029384756");
    assert.strictEqual(normalized.email, "candidate@domain.com");
    assert.strictEqual(normalized.emailVerified, true);
    assert.strictEqual(normalized.name, "Alex Doe");
    assert.strictEqual(normalized.firstName, "Alex");
    assert.strictEqual(normalized.lastName, "Doe");
    assert.strictEqual(normalized.avatarUrl, "https://lh3.googleusercontent.com/a/sample-photo");
  });

  it("should normalize email_verified as boolean when passed as string", () => {
    const claims = {
      sub: "12345",
      email: "test@example.com",
      email_verified: "true",
      name: "Test User"
    };

    const normalized = IdentityMapper.normalize("google", claims);
    assert.strictEqual(normalized.emailVerified, true);
  });

  it("should handle missing name in Google profile by falling back to email prefix", () => {
    const claims = {
      sub: "12345",
      email: "dev_candidate@prepnova.io",
      email_verified: true
    };

    const normalized = IdentityMapper.normalize("google", claims);
    assert.strictEqual(normalized.name, "dev_candidate");
  });

  it("should correctly normalize a GitHub profile and primary email", () => {
    const ghProfile = {
      id: 987654,
      login: "octocat",
      name: "The Octocat",
      avatar_url: "https://avatars.githubusercontent.com/u/987654"
    };
    const ghEmail = {
      email: "octocat@github.com",
      primary: true,
      verified: true
    };

    const normalized = IdentityMapper.normalize("github", ghProfile, ghEmail);

    assert.strictEqual(normalized.provider, "github");
    assert.strictEqual(normalized.providerUserId, "987654");
    assert.strictEqual(normalized.email, "octocat@github.com");
    assert.strictEqual(normalized.emailVerified, true);
    assert.strictEqual(normalized.name, "The Octocat");
    assert.strictEqual(normalized.avatarUrl, "https://avatars.githubusercontent.com/u/987654");
  });
});
