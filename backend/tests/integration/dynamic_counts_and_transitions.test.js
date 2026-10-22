process.env.NODE_ENV = "test";
process.env.JWT_SECRET = "test_jwt_secret_key_1234567890";
process.env.JWT_EXPIRES_IN = "1h";
process.env.MONGO_URI = "mongodb://127.0.0.1:27017/prepnova_test";

const { describe, it, before, after } = require("node:test");
const assert = require("node:assert");
const http = require("http");
const mongoose = require("mongoose");
const app = require("../../src/app");
const User = require("../../src/models/User");
const InterviewSession = require("../../src/models/InterviewSession");
const { aiServiceClient } = require("../../src/services/aiService.client");

describe("Dynamic Counts & Section Transitions Integration Tests", () => {
  let server;
  let port;
  let authToken;
  let userId;

  const request = (path, options = {}) => {
    return new Promise((resolve, reject) => {
      const payload = options.body ? JSON.stringify(options.body) : null;
      const headers = {
        "Content-Type": "application/json",
        ...(payload ? { "Content-Length": Buffer.byteLength(payload) } : {}),
        ...(options.headers || {})
      };

      const req = http.request(
        {
          hostname: "127.0.0.1",
          port,
          path,
          method: options.method || "GET",
          headers
        },
        (res) => {
          let rawData = "";
          res.setEncoding("utf8");
          res.on("data", (chunk) => (rawData += chunk));
          res.on("end", () => {
            let parsed = null;
            try {
              parsed = JSON.parse(rawData);
            } catch (_) {
              parsed = rawData;
            }
            resolve({
              status: res.statusCode,
              headers: res.headers,
              data: parsed
            });
          });
        }
      );

      req.on("error", reject);
      if (payload) req.write(payload);
      req.end();
    });
  };

  before(async () => {
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(process.env.MONGO_URI);
    }

    await new Promise((resolve) => {
      server = app.listen(0, "127.0.0.1", () => {
        port = server.address().port;
        resolve();
      });
    });

    await User.deleteMany({ email: /@dynatest\.prepnova\.com$/i });

    const u = await request("/api/auth/register", {
      method: "POST",
      body: {
        name: "Dyna Test User",
        email: "user@dynatest.prepnova.com",
        password: "StrongPassword123!"
      }
    });
    authToken = u.data.token;
    userId = u.data.user ? (u.data.user.id || u.data.user._id) : null;

    // Stub aiServiceClient to provide deterministic responses
    aiServiceClient.planBlueprint = async (params) => {
      const mode = String(params.questionCountMode || "6");
      let secCounts = {};
      if (mode === "dynamic") {
        secCounts = {
          projects: 3,
          skills: 4,
          technical_concepts: 4,
          behavioral: 2
        };
      } else {
        const n = Number(mode) || 6;
        secCounts = {
          projects: n,
          skills: n,
          technical_concepts: n,
          behavioral: n
        };
      }

      return {
        version: 1,
        role: params.role || "Backend Engineer",
        difficulty: params.difficulty || "intermediate",
        target_duration_minutes: 30,
        question_count_mode: mode,
        sections: [
          { id: "introduction", title: "Introduction", type: "introduction", planned_primary_question_count: 1, applicable: true },
          { id: "projects", title: "Key Projects", type: "projects", planned_primary_question_count: secCounts.projects, applicable: true },
          { id: "skills", title: "Core Skills", type: "skills", planned_primary_question_count: secCounts.skills, applicable: true },
          { id: "technical_concepts", title: "Technical Fundamentals", type: "technical_concepts", planned_primary_question_count: secCounts.technical_concepts, applicable: true },
          { id: "behavioral", title: "Behavioral", type: "behavioral", planned_primary_question_count: secCounts.behavioral, applicable: true }
        ]
      };
    };

    aiServiceClient.generateSectionBatch = async (params) => {
      const count = Number(params.plannedPrimaryQuestionCount || 3);
      const questions = [];
      for (let i = 1; i <= count; i++) {
        questions.push({
          questionId: `q_${params.sessionId}_${params.sectionId}_${i}`,
          sectionId: params.sectionId,
          order: i,
          type: "primary",
          objective: `Assess ${params.sectionId} objective ${i}`,
          difficulty: params.difficulty || "intermediate",
          text: `Primary question ${i} for section ${params.sectionId}: Explain your technical approach.`,
          contextReferences: ["role"],
          status: "pending"
        });
      }
      return {
        sectionId: params.sectionId,
        generationMode: String(params.generationMode || "3"),
        plannedPrimaryQuestionCount: count,
        questions,
        generationVersion: 1
      };
    };

    aiServiceClient.decideFollowUp = async () => {
      return {
        action: "NEXT_PRIMARY",
        followUp: null,
        reason: "Objective satisfied, moving forward"
      };
    };

    aiServiceClient.evaluateSession = async (params) => {
      return {
        overall_score: 8.8,
        rating_label: "Interview Ready",
        category_scores: { correctness: 9, clarity: 9, depth: 8.5, relevance: 9, completeness: 8.5 },
        intro_evaluation: { score: 9.0, structure: "Clear", role_relevance: "High", evidence: "Good", conciseness: "Good", clarity: "High", strengths: [], improvements: [] },
        section_summaries: {},
        feedback: "Strong performance across sections.",
        strengths: ["Clear technical depth"],
        areas_of_improvement: [],
        preparation_plan: [],
        coverage_summary: {},
        evaluations: []
      };
    };
  });

  after(async () => {
    if (mongoose.connection.readyState === 1) {
      await User.deleteMany({ email: /@dynatest\.prepnova\.com$/i });
      await InterviewSession.deleteMany({ userId });
    }
    await new Promise((resolve) => server.close(resolve));
  });

  it("should accept and enforce per-section count mode '3' across all applicable sections", async () => {
    const res = await request("/api/interview/start", {
      method: "POST",
      headers: { Authorization: `Bearer ${authToken}` },
      body: {
        role: "Backend Engineer",
        level: "intermediate",
        questionCountMode: "3"
      }
    });

    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.data.questionCountMode, "3");

    // Introduction = 1, Projects = 3, Skills = 3, Tech Concepts = 3, Behavioral = 3 -> Total = 13 (NOT 3!)
    assert.strictEqual(res.data.plannedSectionCounts.projects, 3);
    assert.strictEqual(res.data.plannedSectionCounts.skills, 3);
    assert.strictEqual(res.data.plannedSectionCounts.technical_concepts, 3);
    assert.strictEqual(res.data.plannedSectionCounts.behavioral, 3);
    assert.strictEqual(res.data.progress.total, 13);
  });

  it("should accept and enforce dynamic question count mode with section-specific counts", async () => {
    const res = await request("/api/interview/start", {
      method: "POST",
      headers: { Authorization: `Bearer ${authToken}` },
      body: {
        role: "Backend Engineer",
        level: "intermediate",
        questionCountMode: "dynamic"
      }
    });

    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.data.questionCountMode, "dynamic");

    // Dynamic counts differ by section: projects=3, skills=4, tech=4, behavioral=2 + intro=1 -> Total = 14
    assert.strictEqual(res.data.plannedSectionCounts.projects, 3);
    assert.strictEqual(res.data.plannedSectionCounts.skills, 4);
    assert.strictEqual(res.data.plannedSectionCounts.technical_concepts, 4);
    assert.strictEqual(res.data.plannedSectionCounts.behavioral, 2);
    assert.strictEqual(res.data.progress.total, 14);

    const doc = await InterviewSession.findOne({ sessionId: res.data.sessionId });
    assert.strictEqual(doc.questionCountMode, "dynamic");
    assert.strictEqual(doc.plannedSectionCounts.projects, 3);
    assert.strictEqual(doc.plannedSectionCounts.skills, 4);
  });

  it("should present questions individually and transition seamlessly across sections", async () => {
    // Start compact 2-section interview
    aiServiceClient.planBlueprint = async (params) => ({
      version: 1,
      role: "Backend Engineer",
      difficulty: "intermediate",
      sections: [
        { id: "introduction", title: "Introduction", type: "introduction", planned_primary_question_count: 1, applicable: true },
        { id: "projects", title: "Projects", type: "projects", planned_primary_question_count: 2, applicable: true },
        { id: "skills", title: "Skills", type: "skills", planned_primary_question_count: 1, applicable: true }
      ]
    });

    const startRes = await request("/api/interview/start", {
      method: "POST",
      headers: { Authorization: `Bearer ${authToken}` },
      body: { role: "Backend Engineer", level: "intermediate", questionCountMode: "3" }
    });

    assert.strictEqual(startRes.status, 200);
    const sessId = startRes.data.sessionId;

    // Turn 1: Introduction (Question 1)
    assert.strictEqual(startRes.data.section, "introduction");

    // Answer Turn 1 -> Server should transition to projects section and generate projects batch
    const t1Res = await request("/api/interview/followup", {
      method: "POST",
      headers: { Authorization: `Bearer ${authToken}` },
      body: { sessionId: sessId, answer: "I have 5 years experience in Node.js and distributed systems." }
    });

    assert.strictEqual(t1Res.status, 200);
    assert.strictEqual(t1Res.data.completed, false);
    assert.strictEqual(t1Res.data.section, "projects");
    assert.match(t1Res.data.question, /Primary question 1 for section projects/i);

    // Answer Turn 2 (Projects Question 1) -> Advances to Projects Question 2
    const t2Res = await request("/api/interview/followup", {
      method: "POST",
      headers: { Authorization: `Bearer ${authToken}` },
      body: { sessionId: sessId, answer: "I architected an event-driven payment processing pipeline using Kafka." }
    });

    assert.strictEqual(t2Res.status, 200);
    assert.strictEqual(t2Res.data.completed, false);
    assert.strictEqual(t2Res.data.section, "projects");
    assert.match(t2Res.data.question, /Primary question 2 for section projects/i);

    // Answer Turn 3 (Projects Question 2) -> Projects section complete, server transitions to skills section
    const t3Res = await request("/api/interview/followup", {
      method: "POST",
      headers: { Authorization: `Bearer ${authToken}` },
      body: { sessionId: sessId, answer: "We achieved sub-second latency and zero data loss under failover." }
    });

    assert.strictEqual(t3Res.status, 200);
    assert.strictEqual(t3Res.data.completed, false);
    assert.strictEqual(t3Res.data.section, "skills");
    assert.match(t3Res.data.question, /Primary question 1 for section skills/i);

    // Answer Turn 4 (Skills Question 1) -> All sections complete! Interview concludes.
    const t4Res = await request("/api/interview/followup", {
      method: "POST",
      headers: { Authorization: `Bearer ${authToken}` },
      body: { sessionId: sessId, answer: "We used TypeScript with strict compiler flags and Jest unit testing." }
    });

    assert.strictEqual(t4Res.status, 200);
    assert.strictEqual(t4Res.data.completed, true);
    assert.ok(t4Res.data.finalScore !== undefined || t4Res.data.finalReport);

    // Verify session state in DB
    const finalDoc = await InterviewSession.findOne({ sessionId: sessId });
    assert.strictEqual(finalDoc.status, "completed");
    assert.strictEqual(finalDoc.answers.length, 4);
    assert.strictEqual(finalDoc.sectionBatches.length, 3); // intro + projects + skills
  });
});
