const { describe, it } = require("node:test");
const assert = require("node:assert");
const {
  cleanConversationalFiller,
  isSemanticDuplicate,
  validateSectionBatch
} = require("../../src/validators/interview.validator");

describe("Conversational Filler Elimination & Semantic Duplicate Tests", () => {
  it("should strip common conversational filler phrases", () => {
    const testCases = [
      {
        input: "Okay, thank you for sharing that. Can you explain your experience with Docker?",
        expected: "Can you explain your experience with Docker?"
      },
      {
        input: "Great, that's interesting! How do you handle concurrency in PostgreSQL?",
        expected: "How do you handle concurrency in PostgreSQL?"
      },
      {
        input: "Understood, that makes sense. What is your strategy for writing unit tests?",
        expected: "What is your strategy for writing unit tests?"
      },
      {
        input: "Based on what you just said, why did you choose Redis over Memcached?",
        expected: "Why did you choose Redis over Memcached?"
      },
      {
        input: "As you mentioned earlier, how did you handle data migrations?",
        expected: "How did you handle data migrations?"
      },
      {
        input: "Thanks for your answer. How would you design an idempotent API endpoint?",
        expected: "How would you design an idempotent API endpoint?"
      }
    ];

    testCases.forEach(({ input, expected }) => {
      const result = cleanConversationalFiller(input);
      assert.strictEqual(result, expected);
    });
  });

  it("should detect exact and semantic duplicates using token overlap", () => {
    const q1 = "How would you design pagination for an API returning millions of database records?";
    const q2 = "How would you design pagination for an API returning millions of database records to clients?";
    const qDistinct = "What caching strategy do you use when updating database records?";

    // High overlap (> 85%) should be flagged as semantic duplicate
    assert.strictEqual(isSemanticDuplicate(q1, q2, 0.85), true);

    // Distinct question should not be flagged
    assert.strictEqual(isSemanticDuplicate(q1, qDistinct, 0.85), false);
  });

  it("should reject a section batch containing near-duplicate questions", () => {
    const duplicateBatch = {
      sectionId: "technical_concepts",
      generationMode: "3",
      plannedPrimaryQuestionCount: 2,
      questions: [
        {
          questionId: "q1",
          sectionId: "technical_concepts",
          order: 1,
          type: "primary",
          text: "How would you design a distributed rate limiter that throttles clients across 50 nodes?",
          status: "pending"
        },
        {
          questionId: "q2",
          sectionId: "technical_concepts",
          order: 2,
          type: "primary",
          text: "How would you design a distributed rate limiter that throttles client requests across 50 nodes?",
          status: "pending"
        }
      ]
    };

    const validation = validateSectionBatch(duplicateBatch);
    assert.strictEqual(validation.valid, false);
    assert.ok(validation.error.includes("Duplicate or semantically identical"));
  });

  it("should accept a section batch with completely distinct questions", () => {
    const validBatch = {
      sectionId: "technical_concepts",
      generationMode: "3",
      plannedPrimaryQuestionCount: 2,
      questions: [
        {
          questionId: "q1",
          sectionId: "technical_concepts",
          order: 1,
          type: "primary",
          text: "How would you design a distributed rate limiter that throttles clients across 50 nodes?",
          status: "pending"
        },
        {
          questionId: "q2",
          sectionId: "technical_concepts",
          order: 2,
          type: "primary",
          text: "What immediate mitigations and architectural defenses would you put in place for connection pool exhaustion?",
          status: "pending"
        }
      ]
    };

    const validation = validateSectionBatch(validBatch);
    assert.strictEqual(validation.valid, true);
  });
});
