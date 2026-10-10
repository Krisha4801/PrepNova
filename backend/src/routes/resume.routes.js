const express = require("express");
const { authenticateToken } = require("../middleware/auth.middleware");
const { uploadPdf } = require("../middleware/upload.middleware");
const {
  extractAndIndexResume,
  getMyResumes,
  getResumeById,
  deleteResume
} = require("../controllers/resume.controller");

const router = express.Router();

// All resume routes require authentication
router.use(authenticateToken);

// Upload and extract resume
router.post("/extract", uploadPdf.single("file"), extractAndIndexResume);
router.post("/upload", uploadPdf.single("file"), extractAndIndexResume);

// Retrieve resumes
router.get("/my", getMyResumes);
router.get("/:documentId", getResumeById);

// Delete resume
router.delete("/:documentId", deleteResume);

module.exports = router;
