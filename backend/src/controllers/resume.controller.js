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

    // Calculate deterministic ATS compliance score based on parsed completeness
    const atsScore = calculateAtsScore(aiResult.resume);

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
      atsScore,
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
 * Calculates a realistic ATS compatibility score (0-100) based on extracted resume sections.
 */
function calculateAtsScore(parsed) {
  if (!parsed || typeof parsed !== 'object') return 60;

  let score = 0;

  // 1. Candidate contact details (15 pts)
  const candidate = parsed.candidate || {};
  if (candidate.name && String(candidate.name).trim().length > 1) score += 4;
  if (candidate.email && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(candidate.email).trim())) score += 5;
  if (candidate.phone && String(candidate.phone).trim().length >= 6) score += 3;
  if (candidate.location && String(candidate.location).trim().length > 1) score += 3;

  // 2. Professional Summary (10 pts)
  const summary = parsed.summary;
  if (summary) {
    const summaryStr = Array.isArray(summary) ? summary.join(' ') : String(summary);
    if (summaryStr.trim().length > 20) score += 5;
    if (summaryStr.trim().length >= 80) score += 5;
  }

  // 3. Work Experience (25 pts)
  const experience = Array.isArray(parsed.experience) ? parsed.experience : [];
  if (experience.length >= 1) score += 10;
  if (experience.length >= 2) score += 5;
  const hasRoleAndCompany = experience.some(e => (e.role || e.title) && e.company);
  if (hasRoleAndCompany) score += 4;
  const hasDescriptions = experience.some(e => {
    const desc = Array.isArray(e.description) ? e.description.join(' ') : String(e.description || '');
    return desc.length > 25;
  });
  if (hasDescriptions) score += 3;
  const hasMetrics = experience.some(e => {
    const desc = Array.isArray(e.description) ? e.description.join(' ') : String(e.description || '');
    return /\b\d+%|\b\d+x|\b\d+k|\b\d+\s*(users|ms|clients|projects|million|reduction|increase)/i.test(desc);
  });
  if (hasMetrics) score += 3;

  // 4. Skills Depth & Categorization (25 pts)
  let skillsList = [];
  if (parsed.skills) {
    if (Array.isArray(parsed.skills)) {
      skillsList = parsed.skills;
    } else if (typeof parsed.skills === 'object') {
      for (const val of Object.values(parsed.skills)) {
        if (Array.isArray(val)) skillsList.push(...val);
        else if (typeof val === 'string') skillsList.push(...val.split(',').map(s => s.trim()));
      }
    }
  }
  skillsList = [...new Set(skillsList.filter(Boolean))];
  if (skillsList.length >= 3) score += 10;
  if (skillsList.length >= 6) score += 5;
  if (skillsList.length >= 10) score += 5;
  if (skillsList.length >= 15) score += 5;

  // 5. Education (15 pts)
  const education = Array.isArray(parsed.education) ? parsed.education : [];
  if (education.length >= 1) score += 8;
  const hasDegree = education.some(ed => ed.degree || ed.field);
  if (hasDegree) score += 4;
  const hasInst = education.some(ed => ed.institution);
  if (hasInst) score += 3;

  // 6. Projects & Certifications (10 pts)
  const projects = Array.isArray(parsed.projects) ? parsed.projects : [];
  if (projects.length >= 1) score += 6;
  const certs = Array.isArray(parsed.certifications) ? parsed.certifications : (parsed.certifications ? [parsed.certifications] : []);
  const achievements = Array.isArray(parsed.achievements) ? parsed.achievements : (parsed.achievements ? [parsed.achievements] : []);
  if (certs.length > 0 || achievements.length > 0) score += 4;

  return Math.min(100, Math.max(30, score));
}

/**
 * Get all resumes uploaded by the current user.
 * GET /api/resume/my
 */
exports.getMyResumes = async (req, res, next) => {
  try {
    const userId = req.user ? String(req.user._id || req.user.id) : null;
    const resumes = await Resume.find({ userId }).sort({ createdAt: -1 });

    const normalizedResumes = resumes.map((doc) => {
      const obj = doc.toObject();
      if (!obj.atsScore && obj.parsedData) {
        obj.atsScore = calculateAtsScore(obj.parsedData);
      }
      return obj;
    });

    res.json({
      success: true,
      count: normalizedResumes.length,
      resumes: normalizedResumes
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

    const resumeObj = resume.toObject();
    if (!resumeObj.atsScore && resumeObj.parsedData) {
      resumeObj.atsScore = calculateAtsScore(resumeObj.parsedData);
    }

    res.json({
      success: true,
      resume: resumeObj
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
