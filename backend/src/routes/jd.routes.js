const express = require("express");
const { authenticateToken } = require("../middleware/auth.middleware");
const { uploadPdf } = require("../middleware/upload.middleware");
const {
  extractAndIndexJd,
  getMyJds,
  getJdById,
  deleteJd
} = require("../controllers/jd.controller");

const router = express.Router();

// All JD routes require authentication
router.use(authenticateToken);

// Upload PDF or submit text for JD extraction
router.post("/extract", uploadPdf.single("file"), extractAndIndexJd);

// Retrieve JDs
router.get("/my", getMyJds);
router.get("/:documentId", getJdById);

// Delete JD
router.delete("/:documentId", deleteJd);

module.exports = router;
