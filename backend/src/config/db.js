const mongoose = require("mongoose");
const dns = require("dns");

/**
 * Sanitizes MongoDB connection string by masking user credentials for safe logging.
 */
function sanitizeUri(uri) {
  if (!uri || typeof uri !== "string") return "";
  return uri.replace(/\/\/[^@]+@/, "//***:***@");
}

const connectDB = async () => {
  if ((process.env.NODE_ENV === "production" || process.env.VERCEL === "1") && !process.env.MONGO_URI) {
    console.warn("[Database] MONGO_URI is required in production; skipping local database fallback.");
    return;
  }

  const primaryUri = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/prepnova";
  const localFallbackUri = "mongodb://127.0.0.1:27017/prepnova";

  // When using SRV connection string (mongodb+srv://), Windows system DNS resolver often fails with
  // ECONNREFUSED on UDP SRV record lookups (_mongodb._tcp).
  // Configuring public reliable DNS servers (Google 8.8.8.8, Cloudflare 1.1.1.1) resolves this cleanly.
  if (primaryUri.startsWith("mongodb+srv://")) {
    try {
      dns.setServers(["8.8.8.8", "1.1.1.1", "8.8.4.4"]);
    } catch (dnsErr) {
      console.warn("[Database] Warning: Could not configure DNS resolvers:", dnsErr.message);
    }
  }

  try {
    await mongoose.connect(primaryUri, {
      serverSelectionTimeoutMS: 5000
    });
    console.log(`[Database] MongoDB Connected to: ${sanitizeUri(primaryUri)}`);
    return;
  } catch (error) {
    console.warn(`[Database] Primary MongoDB connection failed (${sanitizeUri(primaryUri)}): ${error.message}`);

    // If primary was a remote cluster and failed, automatically try local MongoDB fallback
    if (primaryUri !== localFallbackUri && process.env.NODE_ENV !== "production" && process.env.VERCEL !== "1") {
      console.log(`[Database] Attempting connection to local MongoDB fallback (${localFallbackUri})...`);
      try {
        await mongoose.connect(localFallbackUri, {
          serverSelectionTimeoutMS: 3000
        });
        console.log(`[Database] Successfully connected to local MongoDB fallback: ${localFallbackUri}`);
        return;
      } catch (fallbackError) {
        console.warn(`[Database] Local fallback also failed: ${fallbackError.message}`);
      }
    }

    console.warn("[Database] Continuing without active MongoDB connection. Ensure MongoDB service is running.");
  }
};

module.exports = connectDB;
