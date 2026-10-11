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

// Helper middleware supporting both 'file' and 'jd' form fields
const jdUploadMiddleware = (req, res, next) => {
  uploadPdf.fields([
    { name: "file", maxCount: 1 },
    { name: "jd", maxCount: 1 }
  ])(req, res, (err) => {
    if (err) return next(err);
    if (!req.file && req.files) {
      req.file = req.files.file?.[0] || req.files.jd?.[0] || null;
    }
    next();
  });
};

// Upload PDF or submit text for JD extraction
router.post("/extract", jdUploadMiddleware, extractAndIndexJd);
router.post("/upload", jdUploadMiddleware, extractAndIndexJd);

// Retrieve JDs
router.get("/my", getMyJds);
router.get("/:documentId", getJdById);

// Delete JD
router.delete("/:documentId", deleteJd);

module.exports = router;
