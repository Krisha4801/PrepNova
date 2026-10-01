/**
 * In-memory sliding rate limiter for authentication endpoints.
 * Configurable via environment variables:
 * - AUTH_RATE_LIMIT_WINDOW_MS (default: 15 minutes = 900000ms)
 * - AUTH_RATE_LIMIT_MAX (default: 50 requests)
 */

const ipRequests = new Map();

// Periodic cleanup of stale IP entries every 5 minutes
setInterval(() => {
  const now = Date.now();
  const windowMs = Number(process.env.AUTH_RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000;
  for (const [ip, record] of ipRequests.entries()) {
    if (now - record.startTime > windowMs) {
      ipRequests.delete(ip);
    }
  }
}, 5 * 60 * 1000).unref();

function authRateLimiter(req, res, next) {
  // Allow test environments to bypass or use high thresholds
  if (process.env.NODE_ENV === "test" && !process.env.TEST_RATE_LIMIT) {
    return next();
  }

  const windowMs = Number(process.env.AUTH_RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000;
  const maxRequests = Number(process.env.AUTH_RATE_LIMIT_MAX) || 50;

  const clientIp = req.ip || req.connection.remoteAddress || "unknown_ip";
  const now = Date.now();

  const record = ipRequests.get(clientIp);

  if (!record || now - record.startTime > windowMs) {
    ipRequests.set(clientIp, {
      count: 1,
      startTime: now
    });
    return next();
  }

  if (record.count >= maxRequests) {
    const retryAfterSeconds = Math.ceil((record.startTime + windowMs - now) / 1000);
    res.setHeader("Retry-After", retryAfterSeconds);
    return res.status(429).json({
      success: false,
      error: "Too many authentication requests from this IP. Please try again later.",
      retryAfter: retryAfterSeconds
    });
  }

  record.count += 1;
  return next();
}

module.exports = {
  authRateLimiter
};
