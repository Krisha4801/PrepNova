const express = require("express");
const {
  endInterview,
  followup,
  skipQuestion,
  startInterview
} = require("../controllers/interview.controller");
const router = express.Router();

router.post("/start", startInterview);
router.post("/followup", followup);
router.post("/skip", skipQuestion);
router.delete("/:sessionId", endInterview);

module.exports = router;
