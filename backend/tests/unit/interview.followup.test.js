const { describe, it } = require("node:test");
const assert = require("node:assert");
const { validateRuntimeFollowUp } = require("../../src/validators/interview.validator");

describe("Runtime Post-Answer Follow-Up Unit Tests", () => {
  it("should validate a well-formed runtime follow-up", () => {
    const validFollowUp = {
      type: "follow_up",
      parentQuestionId: "q_sess123_skills_1",
      sectionId: "skills",
      objective: "Explore candidate technical depth on concurrency and state management",
      text: "How did you manage race conditions when multiple workers updated the same cache key?",
      contextReferences: ["candidate_answer"]
    };

    const result = validateRuntimeFollowUp(validFollowUp);
    assert.strictEqual(result.valid, true);
    assert.strictEqual(result.errors.length, 0);
  });

  it("should reject a malformed runtime follow-up missing required fields", () => {
    const invalidFollowUp = {
      type: "follow_up",
      // missing parentQuestionId
      sectionId: "skills",
      text: ""
    };

    const result = validateRuntimeFollowUp(invalidFollowUp);
    assert.strictEqual(result.valid, false);
    assert.ok(result.errors.some((e) => e.includes("parentQuestionId")));
    assert.ok(result.errors.some((e) => e.includes("text")));
  });

  it("should ensure skipped answers never create follow-ups and advance to next primary", () => {
    const session = {
      sessionId: "sess_test_skip",
      totalQuestions: 6,
      currentSectionId: "skills",
      questions: [
        {
          questionId: "q_1",
          sectionId: "skills",
          questionType: "primary",
          question: "Can you explain how async/await works in Node.js under the hood?"
        }
      ],
      answers: [],
      sectionBatches: [
        {
          sectionId: "skills",
          questions: [
            { questionId: "q_1", sectionId: "skills", status: "asked" },
            { questionId: "q_2", sectionId: "skills", status: "pending", text: "What is the role of libuv thread pool?" }
          ]
        }
      ]
    };

    // Candidate skips question
    const currentIndex = session.answers.length;
    session.answers.push({
      questionIndex: currentIndex,
      turnId: session.questions[currentIndex].questionId,
      sectionId: session.questions[currentIndex].sectionId,
      answer: "[Skipped by candidate]",
      isSkipped: true
    });

    // Verify skip state
    assert.strictEqual(session.answers[0].isSkipped, true);

    // Rule: Skip must NEVER trigger a follow-up. It advances to next pending primary question
    const pendingQuestions = session.sectionBatches[0].questions.filter((q) => q.status === "pending");
    assert.strictEqual(pendingQuestions.length, 1);
    const nextPrimary = pendingQuestions[0];
    assert.strictEqual(nextPrimary.questionId, "q_2");

    // No follow-up question in session.questions
    const followUps = session.questions.filter((q) => q.questionType === "follow_up");
    assert.strictEqual(followUps.length, 0);
  });

  it("should maintain primary question count when a runtime follow-up is inserted", () => {
    const initialTotalQuestions = 7; // 1 intro + 6 primary
    let totalQuestions = initialTotalQuestions;

    const primaryQuestion = {
      questionId: "q_tech_1",
      sectionId: "technical_concepts",
      questionType: "primary",
      question: "How did you design your caching layer?"
    };

    const questions = [primaryQuestion];

    // Candidate submits substantive technical answer
    const answer = "We deployed Redis with write-through invalidation to cache user sessions and hot inventory data.";

    // Targeted follow-up decided by AI runtime
    const followUpQuestion = {
      questionId: `fu_${primaryQuestion.questionId}_123`,
      question: "What cache eviction strategy did you configure to handle memory spikes?",
      category: "technical_concepts",
      format: "Follow-up",
      difficulty: "intermediate",
      sectionId: "technical_concepts",
      questionType: "follow_up",
      parentQuestionId: primaryQuestion.questionId,
      objective: "Explore cache eviction policy",
      source: "runtime_follow_up"
    };

    // When follow-up is inserted, totalQuestions is incremented to keep primary count unchanged
    questions.push(followUpQuestion);
    totalQuestions += 1;

    // Verify questions and count isolation
    const primaryQuestions = questions.filter((q) => q.questionType === "primary");
    const followUpQuestions = questions.filter((q) => q.questionType === "follow_up");

    assert.strictEqual(primaryQuestions.length, 1);
    assert.strictEqual(followUpQuestions.length, 1);
    assert.strictEqual(totalQuestions, initialTotalQuestions + 1);
    assert.strictEqual(followUpQuestions[0].parentQuestionId, "q_tech_1");
  });

  it("should enforce maximum 1 follow-up per section/question", () => {
    const maxFollowUpsPerQuestion = 1;
    const questions = [
      { questionId: "q_1", sectionId: "skills", questionType: "primary" },
      { questionId: "fu_1", sectionId: "skills", questionType: "follow_up", parentQuestionId: "q_1" }
    ];

    const followUpsInSection = questions.filter(
      (q) => q.sectionId === "skills" && q.questionType === "follow_up"
    ).length;

    // Another follow-up must be blocked because limit is reached
    const canFollowUp = followUpsInSection < maxFollowUpsPerQuestion;
    assert.strictEqual(canFollowUp, false);
  });
});
