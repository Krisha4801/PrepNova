/**
 * Validators for Interview Session, Question Count Modes, Section Batches, and Follow-Ups
 */

const VALID_COUNT_MODES = ["3", "6", "10", "dynamic"];

/**
 * Normalizes and validates the question count mode.
 * Accepts "3", "6", "10", "dynamic", or numbers 3, 6, 10.
 * Defaults to "6" if missing or invalid.
 */
function normalizeQuestionCountMode(modeInput) {
  if (modeInput === undefined || modeInput === null) {
    return "6";
  }
  const strVal = String(modeInput).toLowerCase().trim();
  if (VALID_COUNT_MODES.includes(strVal)) {
    return strVal;
  }
  // Numeric fallback check
  const num = Number(modeInput);
  if (num === 3) return "3";
  if (num === 6) return "6";
  if (num === 10) return "10";
  return "6";
}

/**
 * Validates section batch structure before persistence or serving.
 * Throws or returns validation report.
 */
function validateSectionBatch(batch) {
  if (!batch || typeof batch !== "object") {
    return { valid: false, error: "Section batch must be an object." };
  }

  if (!batch.sectionId || typeof batch.sectionId !== "string") {
    return { valid: false, error: "Section batch must specify a valid sectionId string." };
  }

  if (!Array.isArray(batch.questions)) {
    return { valid: false, error: "Section batch questions must be an array." };
  }

  const seenIds = new Set();
  const seenTexts = new Set();

  for (let i = 0; i < batch.questions.length; i++) {
    const q = batch.questions[i];
    if (!q || typeof q !== "object") {
      return { valid: false, error: `Question at index ${i} is invalid.` };
    }

    const questionText = String(q.text || q.question || "").trim();
    if (!questionText) {
      return { valid: false, error: `Question at index ${i} has empty text.` };
    }

    const qId = String(q.questionId || q.id || `q_${batch.sectionId}_${i + 1}`);
    if (seenIds.has(qId)) {
      return { valid: false, error: `Duplicate questionId detected: ${qId}` };
    }
    seenIds.add(qId);

    // Basic duplicate text check
    const normalizedText = questionText.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
    if (seenTexts.has(normalizedText)) {
      return { valid: false, error: `Duplicate question text detected at index ${i}.` };
    }
    seenTexts.add(normalizedText);

    if (q.sectionId && q.sectionId !== batch.sectionId) {
      return { valid: false, error: `Question sectionId (${q.sectionId}) does not match batch sectionId (${batch.sectionId}).` };
    }
  }

  return { valid: true };
}

/**
 * Validates follow-up object structure generated at runtime.
 */
function validateFollowUp(followUp) {
  if (!followUp || typeof followUp !== "object") {
    return { valid: false, error: "Follow-up must be an object." };
  }

  const text = String(followUp.text || "").trim();
  if (!text) {
    return { valid: false, error: "Follow-up text cannot be empty." };
  }

  if (!followUp.parentQuestionId) {
    return { valid: false, error: "Follow-up must have a parentQuestionId." };
  }

  return { valid: true };
}

module.exports = {
  VALID_COUNT_MODES,
  normalizeQuestionCountMode,
  validateSectionBatch,
  validateFollowUp
};
