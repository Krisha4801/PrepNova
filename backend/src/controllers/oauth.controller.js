const oauthService = require("../oauth/oauth.service");
const { getAvailableProviders } = require("../oauth/providers");
const oauthConfig = require("../oauth/oauth.config");

/**
 * Controller: List available and configured OAuth providers
 * GET /api/auth/oauth/providers
 */
exports.getProviders = async (req, res) => {
  return res.status(200).json({
    success: true,
    providers: getAvailableProviders()
  });
};

/**
 * Controller: Initiate OAuth authorization flow
 * GET /api/auth/oauth/:provider
 */
exports.initiateOAuth = async (req, res) => {
  try {
    const provider = req.params.provider;
    const returnTo = req.query.returnTo || req.query.redirect_uri;
    const customRedirectUri = req.query.custom_redirect_uri;

    const result = await oauthService.initiate(provider, {
      returnTo,
      customRedirectUri
    });

    // If client requested JSON response (e.g. for SPA popup or programmatic redirect)
    if (req.query.format === "json" || req.headers["x-requested-with"] === "XMLHttpRequest") {
      return res.status(200).json({
        success: true,
        authorizationUrl: result.authorizationUrl,
        state: result.state,
        provider: result.provider
      });
    }

    // Standard browser redirect to OAuth provider login
    return res.redirect(result.authorizationUrl);
  } catch (err) {
    const statusCode = err.statusCode || 500;
    return res.status(statusCode).json({
      success: false,
      error: err.message || "Failed to initiate OAuth authorization."
    });
  }
};

/**
 * Controller: Handle OAuth provider redirect callback
 * GET /api/auth/oauth/:provider/callback
 */
exports.handleCallback = async (req, res) => {
  const provider = req.params.provider || req.query.provider || "google";
  const defaultFrontend = oauthConfig.getDefaultFrontendUrl();

  try {
    const result = await oauthService.handleCallback(provider, req.query);

    // Redirect to frontend login page with short-lived handoff ticket
    const redirectBase = result.frontendRedirectUrl.replace(/\/+$/, "");
    const destination = `${redirectBase}/login?oauth_ticket=${encodeURIComponent(
      result.handoffTicket
    )}`;

    return res.redirect(destination);
  } catch (err) {
    console.error(`[OAuth Callback Error] Provider: ${provider} - ${err.message}`);

    const destination = `${defaultFrontend}/login?oauth_error=${encodeURIComponent(
      err.message || "OAuth authentication failed."
    )}`;

    return res.redirect(destination);
  }
};

/**
 * Controller: Exchange one-time handoff ticket for application JWT and user profile
 * POST /api/auth/oauth/exchange
 */
exports.exchangeOAuthTicket = async (req, res) => {
  try {
    const { ticket } = req.body;
    const result = oauthService.exchangeHandoffTicket(ticket);

    return res.status(200).json({
      success: true,
      message: "Authentication successful",
      token: result.token,
      user: result.user
    });
  } catch (err) {
    const statusCode = err.statusCode || 400;
    return res.status(statusCode).json({
      success: false,
      error: err.message || "Failed to exchange OAuth authentication ticket."
    });
  }
};
