const express = require("express");
const {
  endInterview,
  followup,
  skipQuestion,
  startInterview,
  getInterviewHistory,
  getDashboardAnalytics,
  getInterviewReport,
  downloadPdfReport,
  retryReport
} = require("../controllers/interview.controller");
const { authenticateToken } = require("../middleware/auth.middleware");

const router = express.Router();

// All interview endpoints require authenticated user
router.use(authenticateToken);

router.post("/start", startInterview);
router.post("/followup", followup);
router.post("/skip", skipQuestion);
router.post("/end", endInterview);
router.post("/:sessionId/retry-report", retryReport);
router.get("/history", getInterviewHistory);
router.get("/analytics", getDashboardAnalytics);
router.get("/dashboard-analytics", getDashboardAnalytics);
router.get("/:sessionId/report", getInterviewReport);
router.get("/:sessionId/pdf", downloadPdfReport);
router.delete("/:sessionId", endInterview);

module.exports = router;

