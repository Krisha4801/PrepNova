const { describe, it } = require("node:test");
const assert = require("node:assert");
const mongoose = require("mongoose");
const Resume = require("../../src/models/Resume");
const InterviewSession = require("../../src/models/InterviewSession");
const { startInterview } = require("../../src/controllers/interview.controller");
const { aiServiceClient } = require("../../src/services/aiService.client");

// Mock Resume.findOne to avoid unneeded MongoDB connection timeouts in unit tests
Resume.findOne = () => ({
  sort: () => Promise.resolve(null)
});

describe("Per-Section Question Count Modes Unit Tests", () => {
  const dummyUserId = new mongoose.Types.ObjectId();

  const mockReqRes = (body, user = { _id: dummyUserId }) => {
    let statusCode = 200;
    let jsonResult = null;
    const req = {
      body,
      user
    };
    const res = {
      status(code) {
        statusCode = code;
        return this;
      },
      json(data) {
        jsonResult = data;
        return this;
      }
    };
    return { req, res, getStatus: () => statusCode, getJson: () => jsonResult };
  };

  it("should apply mode '3' per section (1 intro + 3 questions each for other sections)", async () => {
    const originalPlanBlueprint = aiServiceClient.planBlueprint;
    aiServiceClient.planBlueprint = async (params) => {
      assert.strictEqual(params.questionCountMode, "3");
      return {
        version: 1,
        question_count_mode: "3",
        sections: [
          { id: "introduction", type: "introduction", planned_primary_question_count: 1, applicable: true },
          { id: "projects", type: "projects", planned_primary_question_count: 3, applicable: true },
          { id: "skills", type: "skills", planned_primary_question_count: 3, applicable: true },
          { id: "technical_concepts", type: "technical_concepts", planned_primary_question_count: 3, applicable: true },
          { id: "scenario", type: "scenario", planned_primary_question_count: 3, applicable: true },
          { id: "behavioral", type: "behavioral", planned_primary_question_count: 3, applicable: true }
        ]
      };
    };

    const originalCreate = InterviewSession.create;
    let createdSessionDoc = null;
    InterviewSession.create = async (docData) => {
      createdSessionDoc = {
        ...docData,
        toObject: () => ({ ...docData })
      };
      return createdSessionDoc;
    };

    try {
      const { req, res, getStatus, getJson } = mockReqRes({
        role: "Frontend Developer",
        level: "intermediate",
        questionCountMode: "3"
      });

      await startInterview(req, res, () => {});

      assert.strictEqual(getStatus(), 200);
      const data = getJson();
      assert.strictEqual(data.questionCountMode, "3");
      assert.strictEqual(data.plannedSectionCounts.projects, 3);
      assert.strictEqual(data.plannedSectionCounts.skills, 3);
      assert.strictEqual(data.plannedSectionCounts.technical_concepts, 3);
      assert.strictEqual(data.plannedSectionCounts.scenario, 3);
      assert.strictEqual(data.plannedSectionCounts.behavioral, 3);
      assert.strictEqual(data.plannedSectionCounts.introduction, 1);

      // Total questions is per-section sum (1 + 5*3 = 16), NOT just 3!
      assert.strictEqual(data.progress.total, 16);
      assert.strictEqual(createdSessionDoc.totalQuestions, 16);
      assert.strictEqual(createdSessionDoc.questionCountMode, "3");
      assert.match(data.question, /introduce yourself/i);
      assert.strictEqual(data.section, "introduction");
    } finally {
      aiServiceClient.planBlueprint = originalPlanBlueprint;
      InterviewSession.create = originalCreate;
    }
  });

  it("should apply mode '6' per section (1 intro + 6 questions each for other sections)", async () => {
    const originalPlanBlueprint = aiServiceClient.planBlueprint;
    aiServiceClient.planBlueprint = async (params) => {
      assert.strictEqual(params.questionCountMode, "6");
      return {
        version: 1,
        question_count_mode: "6",
        sections: [
          { id: "introduction", planned_primary_question_count: 1, applicable: true },
          { id: "projects", planned_primary_question_count: 6, applicable: true },
          { id: "skills", planned_primary_question_count: 6, applicable: true },
          { id: "technical_concepts", planned_primary_question_count: 6, applicable: true },
          { id: "scenario", planned_primary_question_count: 6, applicable: true },
          { id: "behavioral", planned_primary_question_count: 6, applicable: true }
        ]
      };
    };

    const originalCreate = InterviewSession.create;
    InterviewSession.create = async (docData) => ({
      ...docData,
      toObject: () => ({ ...docData })
    });

    try {
      const { req, res, getStatus, getJson } = mockReqRes({
        role: "Backend Developer",
        level: "intermediate",
        questionCountMode: "6"
      });

      await startInterview(req, res, () => {});

      assert.strictEqual(getStatus(), 200);
      const data = getJson();
      assert.strictEqual(data.questionCountMode, "6");
      assert.strictEqual(data.plannedSectionCounts.projects, 6);
      // Total questions is 1 + 5*6 = 31, NOT 6!
      assert.strictEqual(data.progress.total, 31);
    } finally {
      aiServiceClient.planBlueprint = originalPlanBlueprint;
      InterviewSession.create = originalCreate;
    }
  });

  it("should apply mode '10' per section (1 intro + 10 questions each for other sections)", async () => {
    const originalPlanBlueprint = aiServiceClient.planBlueprint;
    aiServiceClient.planBlueprint = async (params) => {
      assert.strictEqual(params.questionCountMode, "10");
      return {
        version: 1,
        question_count_mode: "10",
        sections: [
          { id: "introduction", planned_primary_question_count: 1, applicable: true },
          { id: "projects", planned_primary_question_count: 10, applicable: true },
          { id: "skills", planned_primary_question_count: 10, applicable: true },
          { id: "technical_concepts", planned_primary_question_count: 10, applicable: true },
          { id: "scenario", planned_primary_question_count: 10, applicable: true },
          { id: "behavioral", planned_primary_question_count: 10, applicable: true }
        ]
      };
    };

    const originalCreate = InterviewSession.create;
    InterviewSession.create = async (docData) => ({
      ...docData,
      toObject: () => ({ ...docData })
    });

    try {
      const { req, res, getStatus, getJson } = mockReqRes({
        role: "Fullstack Engineer",
        level: "advanced",
        questionCountMode: "10"
      });

      await startInterview(req, res, () => {});

      assert.strictEqual(getStatus(), 200);
      const data = getJson();
      assert.strictEqual(data.questionCountMode, "10");
      assert.strictEqual(data.plannedSectionCounts.projects, 10);
      // Total is 1 + 5*10 = 51!
      assert.strictEqual(data.progress.total, 51);
    } finally {
      aiServiceClient.planBlueprint = originalPlanBlueprint;
      InterviewSession.create = originalCreate;
    }
  });

  it("should support 'dynamic' mode and fallback gracefully when AI service is down", async () => {
    const originalPlanBlueprint = aiServiceClient.planBlueprint;
    aiServiceClient.planBlueprint = async () => {
      throw new Error("AI service temporarily down");
    };

    const originalCreate = InterviewSession.create;
    InterviewSession.create = async (docData) => ({
      ...docData,
      toObject: () => ({ ...docData })
    });

    try {
      const { req, res, getStatus, getJson } = mockReqRes({
        role: "DevOps Engineer",
        level: "intermediate",
        questionCountMode: "dynamic"
      });

      await startInterview(req, res, () => {});

      assert.strictEqual(getStatus(), 200);
      const data = getJson();
      assert.strictEqual(data.questionCountMode, "dynamic");
      assert.ok(data.plannedSectionCounts);
      assert.strictEqual(data.plannedSectionCounts.introduction, 1);
      assert.strictEqual(data.progress.current, 1);
      assert.ok(data.progress.total > 6, "Total questions across sections must exceed 6");
    } finally {
      aiServiceClient.planBlueprint = originalPlanBlueprint;
      InterviewSession.create = originalCreate;
    }
  });
});
