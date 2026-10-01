const express = require("express");
const {
  endInterview,
  followup,
  skipQuestion,
  startInterview
} = require("../controllers/interview.controller");
const { authenticateToken } = require("../middleware/auth.middleware");

const router = express.Router();

// All interview endpoints require authenticated user
router.use(authenticateToken);

router.post("/start", startInterview);
router.post("/followup", followup);
router.post("/skip", skipQuestion);
router.delete("/:sessionId", endInterview);

module.exports = router;
