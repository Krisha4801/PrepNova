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

// Helper middleware supporting both 'file' and 'resume' form fields
const resumeUploadMiddleware = (req, res, next) => {
  uploadPdf.fields([
    { name: "file", maxCount: 1 },
    { name: "resume", maxCount: 1 }
  ])(req, res, (err) => {
    if (err) return next(err);
    if (!req.file && req.files) {
      req.file = req.files.file?.[0] || req.files.resume?.[0] || null;
    }
    next();
  });
};

// Upload and extract resume
router.post("/extract", resumeUploadMiddleware, extractAndIndexResume);
router.post("/upload", resumeUploadMiddleware, extractAndIndexResume);

// Retrieve resumes
router.get("/my", getMyResumes);
router.get("/:documentId", getResumeById);

// Delete resume
router.delete("/:documentId", deleteResume);

module.exports = router;
