const { aiServiceClient } = require("../services/aiService.client");
const Resume = require("../models/Resume");
const JobDescription = require("../models/JobDescription");

/**
 * Perform authenticated user-scoped semantic similarity search over private resume/JD chunks.
 * POST /api/rag/search/user
 */
exports.searchUserDocuments = async (req, res, next) => {
  try {
    const userId = req.user ? String(req.user._id || req.user.id) : null;
    if (!userId) {
      return res.status(401).json({
        success: false,
        error: "Authentication required for document search."
      });
    }

    const { query, documentId, topK } = req.body;

    if (!query || !query.trim()) {
      return res.status(400).json({
        success: false,
        error: "Query string is required."
      });
    }

    // If documentId is specified, verify ownership first
    if (documentId) {
      const isResume = await Resume.findOne({ documentId, userId });
      const isJd = !isResume ? await JobDescription.findOne({ documentId, userId }) : null;

      if (!isResume && !isJd) {
        return res.status(403).json({
          success: false,
          error: "Document not found or access denied."
        });
      }
    }

    const results = await aiServiceClient.searchUserDocuments({
      userId,
      query,
      documentId,
      topK: topK || 5
    });

    res.json(results);
  } catch (err) {
    next(err);
  }
};

/**
 * Perform global role-knowledge semantic similarity search.
 * POST /api/rag/search/role
 */
exports.searchRoleKnowledge = async (req, res, next) => {
  try {
    const { role, query, topK } = req.body;

    if (!role || !role.trim()) {
      return res.status(400).json({
        success: false,
        error: "Role is required."
      });
    }

    if (!query || !query.trim()) {
      return res.status(400).json({
        success: false,
        error: "Query string is required."
      });
    }

    const results = await aiServiceClient.searchRoleKnowledge({
      role,
      query,
      topK: topK || 5
    });

    res.json(results);
  } catch (err) {
    next(err);
  }
};

/**
 * Get RAG vector store health and document counts.
 * GET /api/rag/stats
 */
exports.getRagStats = async (req, res, next) => {
  try {
    const stats = await aiServiceClient.getRagStats();
    res.json(stats);
  } catch (err) {
    next(err);
  }
};
