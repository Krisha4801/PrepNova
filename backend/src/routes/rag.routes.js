const express = require("express");
const { authenticateToken } = require("../middleware/auth.middleware");
const {
  searchUserDocuments,
  searchRoleKnowledge,
  getRagStats
} = require("../controllers/rag.controller");

const router = express.Router();

// Public / system stats
router.get("/stats", getRagStats);

// User document search requires authentication
router.post("/search/user", authenticateToken, searchUserDocuments);

// Role knowledge search
router.post("/search/role", authenticateToken, searchRoleKnowledge);

module.exports = router;
