/**
 * Centralized HTTP Client for communicating from Express Backend to Python FastAPI AI/RAG Service.
 * 
 * Features:
 * - Environment-driven configuration (AI_SERVICE_URL, AI_SERVICE_TIMEOUT_MS)
 * - Safe error handling (sanitizes Python tracebacks, handles timeouts & connection errors)
 * - Native FormData & JSON payload formatting
 * - Scoped retrieval and document indexing methods
 */

const axios = require("axios");

function getAiServiceBaseUrl() {
  return (process.env.AI_SERVICE_URL || "http://127.0.0.1:8000").replace(/\/+$/, "");
}

function getAiServiceTimeout() {
  const parsed = parseInt(process.env.AI_SERVICE_TIMEOUT_MS, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 30000;
}

/**
 * Normalizes and sanitizes errors thrown during AI service communication.
 * Prevents raw internal Python exceptions, file system paths, or tokens from leaking to the client.
 */
function normalizeAiServiceError(err, context = "AI service request") {
  if (err.code === "ECONNREFUSED" || err.code === "ENOTFOUND") {
    const error = new Error("AI Service is currently unreachable. Please ensure the AI microservice is running.");
    error.statusCode = 503;
    error.code = "AI_SERVICE_UNAVAILABLE";
    return error;
  }

  if (err.code === "ECONNABORTED" || err.message?.toLowerCase().includes("timeout")) {
    const error = new Error("AI Service request timed out. The document or extraction took longer than expected.");
    error.statusCode = 504;
    error.code = "AI_SERVICE_TIMEOUT";
    return error;
  }

  if (err.response) {
    const status = err.response.status;
    const detail = err.response.data?.detail || err.response.data?.message || err.response.data?.error;
    const safeMessage = typeof detail === "string" ? detail : `${context} failed with status ${status}.`;

    const error = new Error(safeMessage);
    error.statusCode = status;
    error.data = err.response.data;
    error.code = "AI_SERVICE_ERROR";
    return error;
  }

  const error = new Error(err.message || `${context} encountered an unexpected error.`);
  error.statusCode = err.statusCode || 500;
  return error;
}

class AiServiceClient {
  constructor(baseURL = null, timeout = null) {
    this.baseURL = baseURL || getAiServiceBaseUrl();
    this.timeout = timeout || getAiServiceTimeout();
    this.httpClient = axios.create({
      baseURL: this.baseURL,
      timeout: this.timeout
    });
  }

  /**
   * Health check for AI service
   */
  async healthCheck() {
    try {
      const response = await this.httpClient.get("/health");
      return response.data;
    } catch (err) {
      throw normalizeAiServiceError(err, "Health check");
    }
  }

  /**
   * Extract and optionally index a PDF resume
   * @param {Buffer} fileBuffer - PDF file buffer
   * @param {string} filename - Original filename
   * @param {Object} options - { userId, documentId, indexDocument }
   */
  async extractResume(fileBuffer, filename, options = {}) {
    if (!fileBuffer || !Buffer.isBuffer(fileBuffer)) {
      const err = new Error("A valid file buffer is required for resume extraction.");
      err.statusCode = 400;
      throw err;
    }

    const { userId, documentId, indexDocument = false } = options;

    try {
      const formData = new FormData();
      const blob = new Blob([fileBuffer], { type: "application/pdf" });
      formData.append("file", blob, filename || "resume.pdf");

      if (userId) formData.append("user_id", String(userId));
      if (documentId) formData.append("document_id", String(documentId));
      if (indexDocument) formData.append("index_document", "true");

      const response = await this.httpClient.post("/resume/extract", formData);
      return response.data;
    } catch (err) {
      throw normalizeAiServiceError(err, "Resume extraction");
    }
  }

  /**
   * Extract and optionally index a Job Description (from PDF file or plain text)
   * @param {Object} params - { fileBuffer, filename, text, userId, documentId, indexDocument }
   */
  async extractJd(params = {}) {
    const { fileBuffer, filename, text, userId, documentId, indexDocument = false } = params;

    if (!fileBuffer && (!text || !text.trim())) {
      const err = new Error("Either a PDF file or non-empty JD text must be provided.");
      err.statusCode = 400;
      throw err;
    }

    try {
      const formData = new FormData();

      if (fileBuffer) {
        const blob = new Blob([fileBuffer], { type: "application/pdf" });
        formData.append("file", blob, filename || "job_description.pdf");
      } else if (text) {
        formData.append("text", text.trim());
      }

      if (userId) formData.append("user_id", String(userId));
      if (documentId) formData.append("document_id", String(documentId));
      if (indexDocument) formData.append("index_document", "true");

      const response = await this.httpClient.post("/jd/extract", formData);
      return response.data;
    } catch (err) {
      throw normalizeAiServiceError(err, "Job description extraction");
    }
  }

  /**
   * Perform user-scoped similarity search in ChromaDB
   * @param {Object} params - { userId, query, documentId, topK }
   */
  async searchUserDocuments({ userId, query, documentId = null, topK = 5 }) {
    if (!userId || !query || !query.trim()) {
      const err = new Error("userId and query are required for user document search.");
      err.statusCode = 400;
      throw err;
    }

    try {
      const response = await this.httpClient.post("/rag/search/user", {
        user_id: String(userId),
        query: query.trim(),
        document_id: documentId ? String(documentId) : null,
        top_k: Math.max(1, Math.min(20, parseInt(topK, 10) || 5))
      });
      return response.data;
    } catch (err) {
      throw normalizeAiServiceError(err, "User document search");
    }
  }

  /**
   * Perform role-scoped knowledge search in ChromaDB
   * @param {Object} params - { role, query, topK }
   */
  async searchRoleKnowledge({ role, query, topK = 5 }) {
    if (!role || !role.trim() || !query || !query.trim()) {
      const err = new Error("role and query are required for role knowledge search.");
      err.statusCode = 400;
      throw err;
    }

    try {
      const response = await this.httpClient.post("/rag/search/role", {
        role: role.trim(),
        query: query.trim(),
        top_k: Math.max(1, Math.min(20, parseInt(topK, 10) || 5))
      });
      return response.data;
    } catch (err) {
      throw normalizeAiServiceError(err, "Role knowledge search");
    }
  }

  /**
   * Delete a user's document vectors from ChromaDB
   * @param {Object} params - { userId, documentId }
   */
  async deleteUserDocument({ userId, documentId }) {
    if (!userId || !documentId) {
      const err = new Error("userId and documentId are required to delete a document.");
      err.statusCode = 400;
      throw err;
    }

    try {
      const response = await this.httpClient.delete("/rag/documents", {
        data: {
          user_id: String(userId),
          document_id: String(documentId)
        }
      });
      return response.data;
    } catch (err) {
      throw normalizeAiServiceError(err, "Document deletion");
    }
  }

  /**
   * Retrieve RAG vector store statistics
   */
  async getRagStats() {
    try {
      const response = await this.httpClient.get("/rag/stats");
      return response.data;
    } catch (err) {
      throw normalizeAiServiceError(err, "RAG stats retrieval");
    }
  }

  /**
   * Execute LangGraph workflow to generate a grounded interview question
   * @param {Object} params - { userId, role, difficulty, mode, resumeId, jdId, history, askedQuestionIds, focusAreas }
   */
  async generateInterviewQuestion(params = {}) {
    try {
      const response = await this.httpClient.post("/interview/generate-question", {
        user_id: params.userId || null,
        role: params.role || "",
        difficulty: params.difficulty || "beginner",
        mode: params.mode || null,
        resume_id: params.resumeId || null,
        jd_id: params.jdId || null,
        history: params.history || [],
        asked_question_ids: params.askedQuestionIds || [],
        focus_areas: params.focusAreas || []
      });
      return response.data;
    } catch (err) {
      throw normalizeAiServiceError(err, "Interview question generation");
    }
  }

  /**
   * Execute LangGraph workflow to evaluate candidate answer against 5-part rubric
   * @param {Object} params - { role, difficulty, question, answer, groundingContext, format, expectedConcepts }
   */
  async evaluateInterviewAnswer(params = {}) {
    try {
      const response = await this.httpClient.post("/interview/evaluate-answer", {
        role: params.role || "Candidate",
        difficulty: params.difficulty || "beginner",
        question: params.question,
        answer: params.answer,
        grounding_context: params.groundingContext || null,
        format: params.format || "Scenario",
        expected_concepts: params.expectedConcepts || []
      });
      return response.data;
    } catch (err) {
      throw normalizeAiServiceError(err, "Interview answer evaluation");
    }
  }

  /**
   * Plan a structured interview blueprint before presenting the first question
   * @param {Object} params - { userId, role, difficulty, mode, resumeId, jdId, jdTitle, targetDurationMinutes, focusAreas }
   */
  async planBlueprint(params = {}) {
    try {
      const response = await this.httpClient.post("/interview/plan-blueprint", {
        user_id: params.userId || null,
        role: params.role || "Software Engineer",
        difficulty: params.difficulty || "beginner",
        mode: params.mode || null,
        resume_id: params.resumeId || null,
        jd_id: params.jdId || null,
        jd_title: params.jdTitle || null,
        target_duration_minutes: params.targetDurationMinutes || 30,
        focus_areas: params.focusAreas || []
      });
      return response.data;
    } catch (err) {
      throw normalizeAiServiceError(err, "Interview blueprint planning");
    }
  }

  /**
   * Validate alignment between candidate profile, target role, and job description
   * Supports 6-stage decision flow, 6 fit dimensions, and standard messages (PDF §3, §9, §10)
   * @param {Object} params - { mode, targetRole, resume, jd, userId, resumeId, jdId }
   */
  async validateInputs(params = {}) {
    try {
      const response = await this.httpClient.post("/interview/validate-inputs", {
        mode: params.mode || "role",
        target_role: params.targetRole || params.role || null,
        resume: params.resume || null,
        jd: params.jd || null,
        user_id: params.userId || null,
        resume_id: params.resumeId || null,
        jd_id: params.jdId || null
      });
      return response.data;
    } catch (err) {
      throw normalizeAiServiceError(err, "Input validation and fit assessment");
    }
  }

  /**
   * Generate the next conversational turn according to the blueprint and context
   * @param {Object} params - { sessionId, userId, role, difficulty, mode, resumeId, jdId, blueprint, history, currentSectionId, followUpsInCurrentSection, totalTurnsTaken, maxTurns }
   */
  async generateNextTurn(params = {}) {
    try {
      const response = await this.httpClient.post("/interview/next-turn", {
        session_id: params.sessionId,
        user_id: params.userId || null,
        role: params.role || "Candidate",
        difficulty: params.difficulty || "beginner",
        mode: params.mode || null,
        resume_id: params.resumeId || null,
        jd_id: params.jdId || null,
        blueprint: params.blueprint || null,
        history: params.history || [],
        current_section_id: params.currentSectionId || "introduction",
        follow_ups_in_current_section: params.followUpsInCurrentSection || 0,
        total_turns_taken: params.totalTurnsTaken || 0,
        max_turns: params.maxTurns || 6
      });
      return response.data;
    } catch (err) {
      throw normalizeAiServiceError(err, "Next turn generation");
    }
  }

  /**
   * Evaluate full interview session transcript strictly at completion in a single holistic batch call
   * @param {Object} params - { role, difficulty, transcript, blueprint, resumeId, jdId }
   */
  async evaluateSession(params = {}) {
    try {
      const response = await this.httpClient.post("/interview/evaluate-session", {
        role: params.role || "Candidate",
        difficulty: params.difficulty || "beginner",
        transcript: params.transcript || [],
        blueprint: params.blueprint || null,
        resume_id: params.resumeId || null,
        jd_id: params.jdId || null
      });
      return response.data;
    } catch (err) {
      throw normalizeAiServiceError(err, "Session batch evaluation");
    }
  }
}

// Export singleton instance and class
const defaultAiServiceClient = new AiServiceClient();

module.exports = {
  AiServiceClient,
  aiServiceClient: defaultAiServiceClient,
  normalizeAiServiceError,
  getAiServiceBaseUrl,
  getAiServiceTimeout
};
