const oauthConfig = require("../oauth.config");
const GoogleOAuthProvider = require("./google.provider");
const GitHubOAuthProvider = require("./github.provider");

const providers = new Map();

// Initialize configured providers
providers.set("google", new GoogleOAuthProvider(oauthConfig.providers.google));
providers.set("github", new GitHubOAuthProvider(oauthConfig.providers.github));

function getProvider(name) {
  if (!name || typeof name !== "string") {
    return null;
  }
  return providers.get(name.toLowerCase()) || null;
}

function registerProvider(name, providerInstance) {
  providers.set(name.toLowerCase(), providerInstance);
}

function getAvailableProviders() {
  const list = [];
  for (const [key, provider] of providers.entries()) {
    list.push({
      id: key,
      name: provider.config?.name || key,
      isConfigured: oauthConfig.isProviderConfigured(key)
    });
  }
  return list;
}

module.exports = {
  getProvider,
  registerProvider,
  getAvailableProviders
};
