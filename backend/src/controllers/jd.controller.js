const crypto = require("crypto");
const mongoose = require("mongoose");
const JobDescription = require("../models/JobDescription");
const { aiServiceClient } = require("../services/aiService.client");

/**
 * Upload or paste, extract structured data, and index Job Description in ChromaDB.
 * POST /api/jd/extract
 */
exports.extractAndIndexJd = async (req, res, next) => {
  try {
    const userId = req.user ? String(req.user._id || req.user.id) : null;
    if (!userId) {
      return res.status(401).json({
        success: false,
        error: "Authentication required to extract and index job descriptions."
      });
    }

    const fileBuffer = req.file ? req.file.buffer : null;
    const filename = req.file ? req.file.originalname : null;
    const text = req.body.text || req.body.jd_text || null;

    if (!fileBuffer && (!text || !text.trim())) {
      return res.status(400).json({
        success: false,
        error: "Either a PDF file or text content is required for JD extraction."
      });
    }

    const documentId = `jd_${Date.now()}_${crypto.randomBytes(4).toString("hex")}`;
    const shouldIndex = req.body.index !== "false" && req.body.index !== false;

    // Forward to Python FastAPI AI service
    const aiResult = await aiServiceClient.extractJd({
      fileBuffer,
      filename,
      text,
      userId,
      documentId,
      indexDocument: shouldIndex
    });

    if (!aiResult || !aiResult.jd) {
      return res.status(422).json({
        success: false,
        error: "AI service was unable to extract structured data from this job description."
      });
    }

    const parsedJd = aiResult.jd;
    const jobInfo = parsedJd.job_info || {};

    // Persist in MongoDB
    const jdRecord = await JobDescription.create({
      userId,
      documentId,
      title: jobInfo.title || req.body.title || null,
      company: jobInfo.company || req.body.company || null,
      location: jobInfo.location || null,
      rawText: text || null,
      originalFilename: filename || null,
      parsedData: parsedJd,
      indexedInChroma: !!aiResult.indexed,
      chunksCount: aiResult.chunks_count || 0
    });

    res.status(201).json({
      success: true,
      message: "Job description extracted and indexed successfully.",
      jd: jdRecord
    });
  } catch (err) {
    next(err);
  }
};

/**
 * Get all JDs for current user.
 * GET /api/jd/my
 */
exports.getMyJds = async (req, res, next) => {
  try {
    const userId = req.user ? String(req.user._id || req.user.id) : null;
    const jds = await JobDescription.find({ userId }).sort({ createdAt: -1 });

    res.json({
      success: true,
      count: jds.length,
      jds
    });
  } catch (err) {
    next(err);
  }
};

/**
 * Get specific JD by documentId.
 * GET /api/jd/:documentId
 */
exports.getJdById = async (req, res, next) => {
  try {
    const userId = req.user ? String(req.user._id || req.user.id) : null;
    const { documentId } = req.params;

    const query = mongoose.Types.ObjectId.isValid(documentId)
      ? { $or: [{ documentId }, { _id: documentId }] }
      : { documentId };

    const jd = await JobDescription.findOne(query);
    if (!jd) {
      return res.status(404).json({
        success: false,
        error: "Job description not found."
      });
    }

    if (String(jd.userId) !== userId) {
      return res.status(403).json({
        success: false,
        error: "Access denied. You do not own this document."
      });
    }

    res.json({
      success: true,
      jd
    });
  } catch (err) {
    next(err);
  }
};

/**
 * Delete JD from MongoDB and ChromaDB.
 * DELETE /api/jd/:documentId
 */
exports.deleteJd = async (req, res, next) => {
  try {
    const userId = req.user ? String(req.user._id || req.user.id) : null;
    const { documentId } = req.params;

    const query = mongoose.Types.ObjectId.isValid(documentId)
      ? { $or: [{ documentId }, { _id: documentId }] }
      : { documentId };

    const jd = await JobDescription.findOne(query);
    if (!jd) {
      return res.status(404).json({
        success: false,
        error: "Job description not found."
      });
    }

    if (String(jd.userId) !== userId) {
      return res.status(403).json({
        success: false,
        error: "Access denied. You do not own this document."
      });
    }

    if (jd.indexedInChroma) {
      try {
        await aiServiceClient.deleteUserDocument({ userId, documentId });
      } catch (chromaErr) {
        console.warn(`[ChromaDB] Vector deletion warning for ${documentId}:`, chromaErr.message);
      }
    }

    await JobDescription.deleteOne({ _id: jd._id });

    res.json({
      success: true,
      message: "Job description and associated vector embeddings deleted successfully."
    });
  } catch (err) {
    next(err);
  }
};
