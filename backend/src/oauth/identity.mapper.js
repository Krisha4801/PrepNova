/**
 * Identity Normalizer / Mapper
 * Converts raw provider payloads (Google, GitHub, etc.) into a consistent,
 * sanitized internal identity structure.
 */

class IdentityMapper {
  /**
   * Normalizes a Google profile/ID-token claims object.
   */
  static normalizeGoogle(claims = {}) {
    const email = claims.email ? claims.email.trim().toLowerCase() : null;
    const emailVerified =
      claims.email_verified === true || claims.email_verified === "true";

    const name =
      claims.name ||
      [claims.given_name, claims.family_name].filter(Boolean).join(" ") ||
      (email ? email.split("@")[0] : "Google User");

    return {
      provider: "google",
      providerUserId: String(claims.sub || claims.id || ""),
      email,
      emailVerified,
      name: name.trim(),
      firstName: (claims.given_name || "").trim(),
      lastName: (claims.family_name || "").trim(),
      avatarUrl: claims.picture || "",
      rawProfile: claims
    };
  }

  /**
   * Normalizes a GitHub profile & verified emails object.
   */
  static normalizeGitHub(profile = {}, primaryEmailObj = null) {
    let email = null;
    let emailVerified = false;

    if (primaryEmailObj) {
      email = primaryEmailObj.email ? primaryEmailObj.email.trim().toLowerCase() : null;
      emailVerified = !!primaryEmailObj.verified;
    } else if (profile.email) {
      email = profile.email.trim().toLowerCase();
      emailVerified = true;
    }

    const name =
      profile.name ||
      profile.login ||
      (email ? email.split("@")[0] : "GitHub User");

    return {
      provider: "github",
      providerUserId: String(profile.id || ""),
      email,
      emailVerified,
      name: name.trim(),
      firstName: "",
      lastName: "",
      avatarUrl: profile.avatar_url || "",
      rawProfile: profile
    };
  }

  /**
   * Generic normalizer delegator.
   */
  static normalize(provider, rawData, extraData = null) {
    switch (provider.toLowerCase()) {
      case "google":
        return IdentityMapper.normalizeGoogle(rawData);
      case "github":
        return IdentityMapper.normalizeGitHub(rawData, extraData);
      default:
        return {
          provider: provider.toLowerCase(),
          providerUserId: String(rawData.sub || rawData.id || ""),
          email: rawData.email ? rawData.email.trim().toLowerCase() : null,
          emailVerified: !!rawData.email_verified,
          name: (rawData.name || "OAuth User").trim(),
          firstName: (rawData.given_name || "").trim(),
          lastName: (rawData.family_name || "").trim(),
          avatarUrl: rawData.picture || rawData.avatar_url || "",
          rawProfile: rawData
        };
    }
  }
}

module.exports = IdentityMapper;
