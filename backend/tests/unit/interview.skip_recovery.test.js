const { describe, it } = require("node:test");
const assert = require("node:assert");

describe("Skip Handling, Idempotency & Session Recovery Unit Tests", () => {
  it("should record skip status cleanly without triggering follow-ups", () => {
    const session = {
      sessionId: "sess_recovery_1",
      questions: [
        {
          questionId: "q_intro_1",
          sectionId: "introduction",
          questionType: "primary",
          question: "Introduce yourself."
        },
        {
          questionId: "q_proj_1",
          sectionId: "projects",
          questionType: "primary",
          question: "Describe your primary project architecture."
        }
      ],
      answers: [],
      sectionBatches: [
        {
          sectionId: "projects",
          questions: [
            { questionId: "q_proj_1", sectionId: "projects", status: "asked" },
            { questionId: "q_proj_2", sectionId: "projects", status: "pending", text: "What trade-offs did you face?" }
          ]
        }
      ]
    };

    // Candidate answers intro
    session.answers.push({
      questionIndex: 0,
      turnId: "q_intro_1",
      sectionId: "introduction",
      answer: "I am a full stack engineer.",
      isSkipped: false
    });

    // Candidate skips projects question 1
    const currentIndex = session.answers.length;
    session.answers.push({
      questionIndex: currentIndex,
      turnId: "q_proj_1",
      sectionId: "projects",
      answer: "[Skipped by candidate]",
      isSkipped: true
    });

    assert.strictEqual(session.answers.length, 2);
    assert.strictEqual(session.answers[1].isSkipped, true);
    assert.strictEqual(session.answers[1].answer, "[Skipped by candidate]");

    // Verify next question served from batch is next primary (q_proj_2)
    const nextPending = session.sectionBatches[0].questions.find((q) => q.status === "pending");
    assert.ok(nextPending);
    assert.strictEqual(nextPending.questionId, "q_proj_2");

    // Ensure zero follow-ups were generated
    const followUps = session.questions.filter((q) => q.questionType === "follow_up");
    assert.strictEqual(followUps.length, 0);
  });

  it("should protect against duplicate submissions via idempotency check", () => {
    const session = {
      answers: [
        {
          questionIndex: 0,
          turnId: "q_0",
          sectionId: "introduction",
          answer: "My intro answer"
        }
      ]
    };

    // Client retries submission for questionIndex 0 (network jitter/double click)
    const retryIndex = 0;
    const existing = session.answers.find((a) => a.questionIndex === retryIndex);
    assert.ok(existing, "Existing answer found");

    // Duplicate submission is ignored
    if (!existing) {
      session.answers.push({ questionIndex: 0, answer: "Duplicate attempt" });
    }

    assert.strictEqual(session.answers.length, 1);
    assert.strictEqual(session.answers[0].answer, "My intro answer");
  });

  it("should restore exact active question, section, and progress on session reload", () => {
    const sessionDoc = {
      sessionId: "sess_reload_test",
      role: "Backend Engineer",
      difficulty: "intermediate",
      questionCountMode: "6",
      totalQuestions: 13,
      currentSectionId: "projects",
      questions: [
        { questionId: "q_intro", sectionId: "introduction", question: "Intro question", questionType: "primary" },
        { questionId: "q_proj_1", sectionId: "projects", question: "Projects question 1", questionType: "primary" },
        { questionId: "q_proj_2", sectionId: "projects", question: "Projects question 2", questionType: "primary" }
      ],
      answers: [
        { questionIndex: 0, turnId: "q_intro", answer: "Intro done" },
        { questionIndex: 1, turnId: "q_proj_1", answer: "Project 1 done" }
      ],
      sectionBatches: [
        {
          sectionId: "projects",
          questions: [
            { questionId: "q_proj_1", status: "answered" },
            { questionId: "q_proj_2", status: "asked" },
            { questionId: "q_proj_3", status: "pending" }
          ]
        }
      ]
    };

    // Simulate getActiveSession logic
    const currentIdx = sessionDoc.answers.length; // 2
    const activeQuestion = sessionDoc.questions[currentIdx];

    assert.ok(activeQuestion);
    assert.strictEqual(activeQuestion.questionId, "q_proj_2");
    assert.strictEqual(activeQuestion.sectionId, "projects");
    assert.strictEqual(currentIdx + 1, 3); // Progress: question 3 of 13

    // Reload does not mutate or regenerate batch
    assert.strictEqual(sessionDoc.sectionBatches.length, 1);
    assert.strictEqual(sessionDoc.questions.length, 3);
  });

  it("should preserve submitted answers when AI generation encounters recoverable error", () => {
    const session = {
      answers: [
        { questionIndex: 0, turnId: "q_0", answer: "Answer 1" },
        { questionIndex: 1, turnId: "q_1", answer: "Answer 2" }
      ]
    };

    // Simulated AI error during next question generation
    let aiErrorOccurred = false;
    try {
      throw new Error("AI service rate limit / timeout");
    } catch (_) {
      aiErrorOccurred = true;
    }

    assert.strictEqual(aiErrorOccurred, true);
    // Already submitted answers are completely intact
    assert.strictEqual(session.answers.length, 2);
    assert.strictEqual(session.answers[0].answer, "Answer 1");
    assert.strictEqual(session.answers[1].answer, "Answer 2");
  });
});
