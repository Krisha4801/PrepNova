const express = require("express");
const cors = require("cors");

const app = express();

// Configure CORS
const configuredOrigins = process.env.FRONTEND_URL
  ? process.env.FRONTEND_URL.split(",").map((o) => o.trim())
  : ["http://127.0.0.1:5173", "http://localhost:5173", "http://localhost:3000", "http://127.0.0.1:3000"];

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (e.g. mobile apps, curl, server-to-server)
      if (!origin || configuredOrigins.includes(origin) || process.env.NODE_ENV !== "production") {
        return callback(null, true);
      }
      return callback(new Error("CORS policy violation: origin not allowed"));
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"]
  })
);

app.use(express.json());

// Public healthcheck
app.get("/test", (req, res) => {
  res.send("Backend working");
});

// App Routes
app.use("/api/auth", require("./routes/auth.routes"));
app.use("/api/interview", require("./routes/interview.routes"));

// 404 Not Found Handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: `Route not found: ${req.method} ${req.originalUrl}`
  });
});

// Global Error Handler
app.use((err, req, res, next) => {
  const statusCode = err.statusCode || 500;
  const message = process.env.NODE_ENV === "production" && statusCode === 500
    ? "Internal Server Error"
    : err.message || "An unexpected error occurred.";

  res.status(statusCode).json({
    success: false,
    error: message,
    ...(err.errors && { errors: err.errors })
  });
});

module.exports = app;
