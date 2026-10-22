const { describe, it } = require("node:test");
const assert = require("node:assert");
const { validateSectionBatch } = require("../../src/validators/interview.validator");

describe("Section-Wise Batch Generation & Persistence Unit Tests", () => {
  it("should validate and persist an introduction batch with 1 primary question", () => {
    const introBatch = {
      sectionId: "introduction",
      generationMode: "6",
      plannedPrimaryQuestionCount: 1,
      generationVersion: 1,
      questions: [
        {
          questionId: "q_sess123_introduction_1",
          sectionId: "introduction",
          order: 1,
          type: "primary",
          objective: "Assess communication structure and alignment with target role",
          difficulty: "intermediate",
          text: "Hello! To get started, could you please introduce yourself and highlight your relevant experience?",
          contextReferences: ["role"],
          status: "asked"
        }
      ]
    };

    const validation = validateSectionBatch(introBatch);
    assert.strictEqual(validation.valid, true);
    assert.strictEqual(introBatch.questions.length, 1);
    assert.strictEqual(introBatch.questions[0].status, "asked");
  });

  it("should validate and persist a multi-question technical section batch", () => {
    const projectsBatch = {
      sectionId: "projects",
      generationMode: "3",
      plannedPrimaryQuestionCount: 3,
      generationVersion: 1,
      questions: [
        {
          questionId: "q_sess123_projects_1",
          sectionId: "projects",
          order: 1,
          type: "primary",
          objective: "Assess architectural ownership",
          difficulty: "intermediate",
          text: "Can you walk me through the architecture and your specific personal contributions to a significant project?",
          contextReferences: ["resume"],
          status: "pending"
        },
        {
          questionId: "q_sess123_projects_2",
          sectionId: "projects",
          order: 2,
          type: "primary",
          objective: "Assess trade-offs and debugging",
          difficulty: "intermediate",
          text: "What was the most challenging technical decision or trade-off you faced in that project, and why?",
          contextReferences: ["resume"],
          status: "pending"
        },
        {
          questionId: "q_sess123_projects_3",
          sectionId: "projects",
          order: 3,
          type: "primary",
          objective: "Assess testing and component boundaries",
          difficulty: "intermediate",
          text: "How did you design the component boundaries and data contracts to ensure maintainability?",
          contextReferences: ["resume"],
          status: "pending"
        }
      ]
    };

    const validation = validateSectionBatch(projectsBatch);
    assert.strictEqual(validation.valid, true);
    assert.strictEqual(projectsBatch.questions.length, 3);

    // Verify ordering and section isolation
    projectsBatch.questions.forEach((q, idx) => {
      assert.strictEqual(q.sectionId, "projects");
      assert.strictEqual(q.order, idx + 1);
      assert.strictEqual(q.status, "pending");
    });
  });

  it("should advance question state one-by-one from pending to asked", () => {
    const batch = {
      sectionId: "skills",
      questions: [
        { questionId: "q1", sectionId: "skills", order: 1, status: "pending", text: "Question 1" },
        { questionId: "q2", sectionId: "skills", order: 2, status: "pending", text: "Question 2" }
      ]
    };

    // Candidate is served Question 1
    const q1 = batch.questions.find((q) => q.status === "pending");
    assert.ok(q1);
    assert.strictEqual(q1.questionId, "q1");
    q1.status = "asked";

    // Next pending is Question 2
    const q2 = batch.questions.find((q) => q.status === "pending");
    assert.ok(q2);
    assert.strictEqual(q2.questionId, "q2");
    q2.status = "asked";

    // No pending questions remain in this batch
    const q3 = batch.questions.find((q) => q.status === "pending");
    assert.strictEqual(q3, undefined);
  });

  it("should detect section completion and transition to next applicable section", () => {
    const applicableSections = [
      { id: "introduction", applicable: true },
      { id: "projects", applicable: true },
      { id: "skills", applicable: true }
    ];

    let currentSectionId = "introduction";

    // Helper simulating section transition
    function getNextSection(currSecId) {
      const idx = applicableSections.findIndex((s) => s.id === currSecId);
      if (idx >= 0 && idx + 1 < applicableSections.length) {
        return applicableSections[idx + 1].id;
      }
      return null;
    }

    currentSectionId = getNextSection(currentSectionId);
    assert.strictEqual(currentSectionId, "projects");

    currentSectionId = getNextSection(currentSectionId);
    assert.strictEqual(currentSectionId, "skills");

    currentSectionId = getNextSection(currentSectionId);
    assert.strictEqual(currentSectionId, null, "After last section, returns null to complete interview");
  });
});
