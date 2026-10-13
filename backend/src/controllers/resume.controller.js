const crypto = require("crypto");
const mongoose = require("mongoose");
const Resume = require("../models/Resume");
const { aiServiceClient } = require("../services/aiService.client");

/**
 * Upload, extract structured data, and index resume in ChromaDB.
 * POST /api/resume/extract
 */
exports.extractAndIndexResume = async (req, res, next) => {
  try {
    if (!req.file || !req.file.buffer) {
      return res.status(400).json({
        success: false,
        error: "A valid PDF resume file is required."
      });
    }

    const userId = req.user ? String(req.user._id || req.user.id) : null;
    if (!userId) {
      return res.status(401).json({
        success: false,
        error: "Authentication required to upload and index resume."
      });
    }

    const documentId = `resume_${Date.now()}_${crypto.randomBytes(4).toString("hex")}`;
    const shouldIndex = req.body.index !== "false" && req.body.index !== false;

    // Forward file buffer to Python FastAPI AI service
    const aiResult = await aiServiceClient.extractResume(
      req.file.buffer,
      req.file.originalname,
      {
        userId,
        documentId,
        indexDocument: shouldIndex
      }
    );

    if (!aiResult || !aiResult.resume) {
      return res.status(422).json({
        success: false,
        error: "AI service was unable to extract structured data from this resume."
      });
    }

    // Extract detected role from candidate target role or latest experience
    const detectedRole =
      aiResult.resume?.candidate?.targetRole ||
      aiResult.resume?.targetRole ||
      (Array.isArray(aiResult.resume?.experience) && aiResult.resume.experience[0]?.role) ||
      (Array.isArray(aiResult.resume?.experience) && aiResult.resume.experience[0]?.title) ||
      null;

    // Persist parsed data in MongoDB
    const resumeRecord = await Resume.create({
      userId,
      documentId,
      originalFilename: req.file.originalname,
      fileSize: req.file.size || req.file.buffer.length,
      mimeType: req.file.mimetype || "application/pdf",
      extractionMethod: aiResult.extraction_method || "pdf_text",
      parsedData: aiResult.resume,
      detectedRole,
      indexedInChroma: !!aiResult.indexed,
      chunksCount: aiResult.chunks_count || 0
    });

    res.status(201).json({
      success: true,
      message: "Resume extracted and indexed successfully.",
      resume: resumeRecord
    });
  } catch (err) {
    next(err);
  }
};

/**
 * Get all resumes uploaded by the current user.
 * GET /api/resume/my
 */
exports.getMyResumes = async (req, res, next) => {
  try {
    const userId = req.user ? String(req.user._id || req.user.id) : null;
    const resumes = await Resume.find({ userId }).sort({ createdAt: -1 });

    res.json({
      success: true,
      count: resumes.length,
      resumes
    });
  } catch (err) {
    next(err);
  }
};

/**
 * Get specific resume by documentId with user ownership check.
 * GET /api/resume/:documentId
 */
exports.getResumeById = async (req, res, next) => {
  try {
    const userId = req.user ? String(req.user._id || req.user.id) : null;
    const { documentId } = req.params;

    const query = mongoose.Types.ObjectId.isValid(documentId)
      ? { $or: [{ documentId }, { _id: documentId }] }
      : { documentId };

    const resume = await Resume.findOne(query);
    if (!resume) {
      return res.status(404).json({
        success: false,
        error: "Resume not found."
      });
    }

    // Enforce cross-user data isolation
    if (String(resume.userId) !== userId) {
      return res.status(403).json({
        success: false,
        error: "Access denied. You do not own this document."
      });
    }

    res.json({
      success: true,
      resume
    });
  } catch (err) {
    next(err);
  }
};

/**
 * Delete resume from MongoDB and vector chunks from ChromaDB.
 * DELETE /api/resume/:documentId
 */
exports.deleteResume = async (req, res, next) => {
  try {
    const userId = req.user ? String(req.user._id || req.user.id) : null;
    const { documentId } = req.params;

    const query = mongoose.Types.ObjectId.isValid(documentId)
      ? { $or: [{ documentId }, { _id: documentId }] }
      : { documentId };

    const resume = await Resume.findOne(query);
    if (!resume) {
      return res.status(404).json({
        success: false,
        error: "Resume not found."
      });
    }

    // Enforce cross-user data isolation
    if (String(resume.userId) !== userId) {
      return res.status(403).json({
        success: false,
        error: "Access denied. You do not own this document."
      });
    }

    // Delete vectors from ChromaDB if indexed
    if (resume.indexedInChroma) {
      try {
        await aiServiceClient.deleteUserDocument({ userId, documentId });
      } catch (chromaErr) {
        console.warn(`[ChromaDB] Vector deletion warning for ${documentId}:`, chromaErr.message);
      }
    }

    await Resume.deleteOne({ _id: resume._id });

    res.json({
      success: true,
      message: "Resume and associated vector embeddings deleted successfully."
    });
  } catch (err) {
    next(err);
  }
};
