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

const JS_FILLER_PATTERNS = [
  /^(?:(?:okay|ok|great|awesome|understood|perfect|got it|alright)[,\.!\s]+)?(?:thank\s+you|thanks|i\s+appreciate)(?:\s+(?:very\s+much|so\s+much))?(?:\s+(?:for\s+(?:sharing\s+(?:that|your\s+thoughts?|your\s+experience|your\s+answer)|your\s+(?:answer|explanation|response|time)|the\s+(?:explanation|response|walkthrough)|walking\s+me\s+through\s+that|that)))?[,\.!\s-]*/i,
  /^(?:(?:okay|ok|great|awesome|understood|perfect|got it|alright)[,\.!\s]+)?(?:that['’]?s\s+(?:great|interesting|helpful|insightful|good)|that\s+makes\s+sense|that\s+was\s+helpful|sounds\s+good)[,\.!\s-]*/i,
  /^(?:okay|ok|great|awesome|understood|perfect|got it|alright)[,\.!\s]+/i,
  /^(?:based\s+on\s+(?:what\s+you\s+(?:just\s+)?(?:said|shared|described)|your\s+(?:response|answer|explanation))|as\s+you\s+mentioned(?:\s+earlier)?|following\s+up\s+on\s+that|building\s+on\s+(?:that|what\s+you\s+said))[,\.!\s-]*/i,
  /^(?:moving\s+(?:on|forward)(?:\s+to\s+the\s+next\s+section|\s+now)?|let['’]?s\s+(?:move\s+on|continue|transition))[,\.!\s-]*/i,
  /^for\s+(?:sharing\s+(?:that|your\s+thoughts?|your\s+experience|your\s+answer)|your\s+answer|that)[,\.!\s-]*/i
];

function cleanConversationalFiller(text) {
  let cleaned = String(text || "").trim();
  let changed = true;
  let iterations = 0;
  while (changed && iterations < 10) {
    iterations++;
    changed = false;
    for (const pat of JS_FILLER_PATTERNS) {
      const next = cleaned.replace(pat, "").trim();
      if (next !== cleaned) {
        cleaned = next;
        changed = true;
      }
    }
  }
  if (cleaned.length > 0 && cleaned[0] === cleaned[0].toLowerCase()) {
    cleaned = cleaned[0].toUpperCase() + cleaned.slice(1);
  }
  return cleaned;
}

function getTokens(t) {
  const words = String(t || "").toLowerCase().replace(/[^a-z0-9\s]/g, " ").split(/\s+/).filter((w) => w.length > 2);
  return new Set(words.map((w) => (w.endsWith("s") && w.length > 3 ? w.slice(0, -1) : w)));
}

function isSemanticDuplicate(textA, textB, threshold = 0.75) {
  const tokensA = getTokens(textA);
  const tokensB = getTokens(textB);
  if (tokensA.size === 0 || tokensB.size === 0) return false;
  let intersection = 0;
  for (const t of tokensA) {
    if (tokensB.has(t)) intersection++;
  }
  const union = new Set([...tokensA, ...tokensB]).size;
  return union > 0 && (intersection / union) >= threshold;
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
  const seenTexts = [];

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

    // Semantic duplicate text check
    for (const prev of seenTexts) {
      if (isSemanticDuplicate(questionText, prev, 0.75)) {
        return { valid: false, error: `Duplicate or semantically identical question text detected at index ${i}.` };
      }
    }
    seenTexts.push(questionText);

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
  const errors = [];
  if (!followUp || typeof followUp !== "object") {
    return { valid: false, errors: ["Follow-up must be an object."], error: "Follow-up must be an object." };
  }

  const text = String(followUp.text || "").trim();
  if (!text) {
    errors.push("Follow-up text cannot be empty.");
  }

  if (!followUp.parentQuestionId) {
    errors.push("Follow-up must specify a valid parentQuestionId.");
  }

  return {
    valid: errors.length === 0,
    errors,
    error: errors.join("; ")
  };
}

module.exports = {
  VALID_COUNT_MODES,
  normalizeQuestionCountMode,
  validateSectionBatch,
  validateFollowUp,
  validateRuntimeFollowUp: validateFollowUp,
  cleanConversationalFiller,
  isSemanticDuplicate
};
