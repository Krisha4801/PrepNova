const { describe, it } = require("node:test");
const assert = require("node:assert");
const {
  VALID_COUNT_MODES,
  normalizePracticeMode,
  validateSelectedSections,
  normalizeQuestionCountMode,
  validateSectionBatch,
  validateFollowUp
} = require("../../src/validators/interview.validator");
const { AiServiceClient } = require("../../src/services/aiService.client");

describe("Interview Generation Contracts & Validator Unit Tests", () => {
  describe("Topic-only practice mode", () => {
    it("accepts selected standard and custom topics and preserves their metadata", () => {
      const result = validateSelectedSections([
        { id: "react", name: "React.js", category: "frontend" },
        { id: "custom_graphql", name: "GraphQL Performance", isCustom: true }
      ]);

      assert.strictEqual(normalizePracticeMode("selected_sections"), "selected_sections");
      assert.strictEqual(result.valid, true);
      assert.deepStrictEqual(result.sections.map(({ id, name, isCustom }) => ({ id, name, isCustom })), [
        { id: "react", name: "React.js", isCustom: false },
        { id: "custom_graphql", name: "GraphQL Performance", isCustom: true }
      ]);
    });

    it("rejects malformed selected topic entries", () => {
      assert.strictEqual(validateSelectedSections(null).valid, false);
      assert.strictEqual(validateSelectedSections(["   "]).valid, false);
      assert.strictEqual(validateSelectedSections([{ id: "", name: "" }]).valid, false);
    });

    it("defaults an unknown practice mode to the comprehensive interview", () => {
      assert.strictEqual(normalizePracticeMode("unknown"), "complete");
    });
  });

  describe("Question Count Mode Normalization", () => {
    it("should accept valid string count modes '3', '6', '10', and 'dynamic'", () => {
      assert.strictEqual(normalizeQuestionCountMode("3"), "3");
      assert.strictEqual(normalizeQuestionCountMode("6"), "6");
      assert.strictEqual(normalizeQuestionCountMode("10"), "10");
      assert.strictEqual(normalizeQuestionCountMode("dynamic"), "dynamic");
      assert.strictEqual(normalizeQuestionCountMode("DYNAMIC"), "dynamic");
    });

    it("should normalize numeric count modes 3, 6, and 10 to strings", () => {
      assert.strictEqual(normalizeQuestionCountMode(3), "3");
      assert.strictEqual(normalizeQuestionCountMode(6), "6");
      assert.strictEqual(normalizeQuestionCountMode(10), "10");
    });

    it("should default to '6' when count mode is missing or invalid", () => {
      assert.strictEqual(normalizeQuestionCountMode(undefined), "6");
      assert.strictEqual(normalizeQuestionCountMode(null), "6");
      assert.strictEqual(normalizeQuestionCountMode("unsupported_mode"), "6");
      assert.strictEqual(normalizeQuestionCountMode(99), "6");
    });
  });

  describe("Section Batch Validation", () => {
    it("should validate a well-formed section batch", () => {
      const batch = {
        sectionId: "technical-skills",
        generationMode: "dynamic",
        plannedPrimaryQuestionCount: 6,
        questions: [
          {
            questionId: "q-101",
            sectionId: "technical-skills",
            order: 1,
            type: "primary",
            objective: "Assess API design knowledge",
            difficulty: "intermediate",
            text: "How would you design pagination for an API returning thousands of records?",
            contextReferences: [],
            status: "pending"
          },
          {
            questionId: "q-102",
            sectionId: "technical-skills",
            order: 2,
            type: "primary",
            objective: "Assess caching trade-offs",
            difficulty: "intermediate",
            text: "When would you prefer Redis over Memcached for distributed session storage?",
            contextReferences: [],
            status: "pending"
          }
        ]
      };

      const result = validateSectionBatch(batch);
      assert.strictEqual(result.valid, true);
    });

    it("should reject batch with missing sectionId", () => {
      const result = validateSectionBatch({ questions: [] });
      assert.strictEqual(result.valid, false);
      assert.match(result.error, /sectionId/i);
    });

    it("should reject batch with duplicate questionId", () => {
      const batch = {
        sectionId: "projects",
        questions: [
          { questionId: "dup-1", text: "First question" },
          { questionId: "dup-1", text: "Second question" }
        ]
      };
      const result = validateSectionBatch(batch);
      assert.strictEqual(result.valid, false);
      assert.match(result.error, /Duplicate questionId/i);
    });

    it("should reject batch with duplicate question text", () => {
      const batch = {
        sectionId: "projects",
        questions: [
          { questionId: "q1", text: "Tell me about a challenging project?" },
          { questionId: "q2", text: "Tell me about a challenging project?" }
        ]
      };
      const result = validateSectionBatch(batch);
      assert.strictEqual(result.valid, false);
      assert.match(result.error, /Duplicate question text/i);
    });

    it("should reject batch where question sectionId does not match batch sectionId", () => {
      const batch = {
        sectionId: "technical-skills",
        questions: [
          { questionId: "q1", sectionId: "behavioral", text: "Tell me about a conflict?" }
        ]
      };
      const result = validateSectionBatch(batch);
      assert.strictEqual(result.valid, false);
      assert.match(result.error, /does not match/i);
    });
  });

  describe("Runtime Follow-Up Validation", () => {
    it("should validate a well-formed follow-up object", () => {
      const fu = {
        type: "follow_up",
        parentQuestionId: "q-101",
        sectionId: "technical-skills",
        objective: "Explore candidate reasoning",
        text: "How would your approach change if records were deleted concurrently?",
        contextReferences: []
      };
      const result = validateFollowUp(fu);
      assert.strictEqual(result.valid, true);
    });

    it("should reject follow-up with empty text", () => {
      const result = validateFollowUp({ parentQuestionId: "q-1", text: "   " });
      assert.strictEqual(result.valid, false);
      assert.match(result.error, /empty/i);
    });

    it("should reject follow-up missing parentQuestionId", () => {
      const result = validateFollowUp({ text: "Why did you choose that?" });
      assert.strictEqual(result.valid, false);
      assert.match(result.error, /parentQuestionId/i);
    });
  });

  describe("AI Service Client Contract Integration", () => {
    it("should format generateSectionBatch POST request correctly", async () => {
      const client = new AiServiceClient("http://127.0.0.1:8000", 5000);
      let captured = null;
      client.httpClient.post = async (path, body) => {
        captured = { path, body };
        return {
          data: {
            section_id: body.section_id,
            generation_mode: body.generation_mode,
            planned_primary_question_count: body.planned_primary_question_count,
            questions: []
          }
        };
      };

      const res = await client.generateSectionBatch({
        sessionId: "sess_test_1",
        sectionId: "skills",
        generationMode: "dynamic",
        plannedPrimaryQuestionCount: 5,
        role: "Backend Engineer",
        difficulty: "intermediate"
      });

      assert.strictEqual(captured.path, "/interview/section-batch");
      assert.strictEqual(captured.body.section_id, "skills");
      assert.strictEqual(captured.body.generation_mode, "dynamic");
      assert.strictEqual(captured.body.planned_primary_question_count, 5);
      assert.strictEqual(res.section_id, "skills");
    });

    it("should format decideFollowUp POST request correctly", async () => {
      const client = new AiServiceClient("http://127.0.0.1:8000", 5000);
      let captured = null;
      client.httpClient.post = async (path, body) => {
        captured = { path, body };
        return {
          data: {
            action: "FOLLOW_UP",
            follow_up: {
              type: "follow_up",
              parent_question_id: body.current_question_id,
              text: "How would that scale?"
            }
          }
        };
      };

      const res = await client.decideFollowUp({
        sessionId: "sess_test_1",
        sectionId: "skills",
        currentQuestionId: "q_1",
        currentQuestionText: "Describe Redis caching",
        submittedAnswer: "We use Redis for session management and distributed locks.",
        isSkipped: false,
        role: "Backend Engineer",
        difficulty: "intermediate"
      });

      assert.strictEqual(captured.path, "/interview/decide-followup");
      assert.strictEqual(captured.body.current_question_id, "q_1");
      assert.strictEqual(captured.body.is_skipped, false);
      assert.strictEqual(res.action, "FOLLOW_UP");
      assert.ok(res.follow_up);
    });
  });
});
