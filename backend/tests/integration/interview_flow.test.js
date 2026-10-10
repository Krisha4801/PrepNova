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

describe("Interview Lifecycle & History Integration Tests", () => {
  let server;
  let port;
  let user1Token;
  let user1Id;
  let user2Token;
  let user2Id;
  let activeSessionId;
  let originalGenerateQuestion;
  let originalEvaluateAnswer;

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

    await User.deleteMany({ email: /@flowtest\.prepnova\.com$/i });
    await InterviewSession.deleteMany({});

    // Register test user 1
    const u1 = await request("/api/auth/register", {
      method: "POST",
      body: {
        name: "Flow User One",
        email: "user1@flowtest.prepnova.com",
        password: "StrongPassword123!"
      }
    });
    user1Token = u1.data.token;
    user1Id = u1.data.user ? (u1.data.user.id || u1.data.user._id) : null;

    // Register test user 2
    const u2 = await request("/api/auth/register", {
      method: "POST",
      body: {
        name: "Flow User Two",
        email: "user2@flowtest.prepnova.com",
        password: "StrongPassword123!"
      }
    });
    user2Token = u2.data.token;
    user2Id = u2.data.user ? (u2.data.user.id || u2.data.user._id) : null;

    // Stub AIService client methods for fast unit/integration testing
    originalGenerateQuestion = aiServiceClient.generateInterviewQuestion;
    originalEvaluateAnswer = aiServiceClient.evaluateInterviewAnswer;

    aiServiceClient.generateInterviewQuestion = async (params) => {
      return {
        question: `Generated question for ${params.role} at level ${params.difficulty}`,
        category: "Technical Concepts",
        format: "scenario",
        difficulty: params.difficulty || "intermediate",
        expected_concepts: ["State Lifecycle", "Reconciliation", "Virtual DOM"],
        grounding_context: "Curated role knowledge base for Frontend Developer",
        source: "role_knowledge_base"
      };
    };

    aiServiceClient.evaluateInterviewAnswer = async (params) => {
      return {
        score: 8.5,
        rating: 8.5,
        relevance: 9.0,
        correctness: 8.5,
        completeness: 8.0,
        clarity: 8.5,
        depth: 8.0,
        feedback: "Clear technical explanation demonstrating solid understanding of concepts.",
        strengths: ["Strong architectural terminology", "Clear structural rationale"],
        weaknesses: ["Could elaborate on concurrency bottlenecks"],
        areas_of_improvement: ["Mention edge-case handling in state updates"],
        recommended_difficulty: "hard"
      };
    };
  });



  after(async () => {
    if (mongoose.connection.readyState === 1) {
      await User.deleteMany({ email: /@flowtest\.prepnova\.com$/i });
      await InterviewSession.deleteMany({});
    }
    await new Promise((resolve) => server.close(resolve));
  });

  describe("1. Interview Start & Input Combination Rules", () => {
    it("1.1 should start interview with role selected (role knowledge base fallback)", async () => {
      const res = await request("/api/interview/start", {
        method: "POST",
        headers: { Authorization: `Bearer ${user1Token}` },
        body: {
          role: "Frontend Developer",
          level: "intermediate"
        }
      });

      assert.strictEqual(res.status, 200);
      assert.ok(res.data.sessionId, "Session ID generated");
      assert.ok(res.data.question, "Initial question returned");
      assert.strictEqual(res.data.progress.current, 1);
      activeSessionId = res.data.sessionId;

      // Verify persistent session in MongoDB
      const doc = await InterviewSession.findOne({ sessionId: activeSessionId });
      assert.ok(doc, "MongoDB session document exists");
      assert.strictEqual(String(doc.userId), user1Id);
      assert.strictEqual(doc.status, "in_progress");
    });

    it("1.2 should reject start interview when neither resume nor role is provided", async () => {
      const res = await request("/api/interview/start", {
        method: "POST",
        headers: { Authorization: `Bearer ${user1Token}` },
        body: { role: "" }
      });

      assert.strictEqual(res.status, 400);
      assert.match(res.data.error, /insufficient/i);
    });


    it("1.3 should enforce authentication on interview start", async () => {
      const res = await request("/api/interview/start", {
        method: "POST",
        body: { role: "Backend Developer" }
      });

      assert.strictEqual(res.status, 401);
    });
  });

  describe("2. Answer Submission, Rubric Evaluation & Adaptive Difficulty", () => {
    it("2.1 should evaluate answer and advance session", async () => {
      const res = await request("/api/interview/followup", {
        method: "POST",
        headers: { Authorization: `Bearer ${user1Token}` },
        body: {
          sessionId: activeSessionId,
          answer: "In React, reconciliation uses the virtual DOM diffing algorithm to compute minimal updates before committing them to the actual DOM tree."
        }
      });

      assert.strictEqual(res.status, 200);
      assert.ok(res.data.evaluation, "Evaluation provided");
      assert.ok(typeof res.data.evaluation.score === "number", "Evaluation has numeric score");
      assert.ok(res.data.question, "Next question returned");
      assert.strictEqual(res.data.progress.current, 2);
    });

    it("2.2 should handle skipped question gracefully", async () => {
      const res = await request("/api/interview/skip", {
        method: "POST",
        headers: { Authorization: `Bearer ${user1Token}` },
        body: { sessionId: activeSessionId }
      });

      assert.strictEqual(res.status, 200);
      assert.ok(res.data.evaluation, "Skip evaluation recorded");
      assert.strictEqual(res.data.progress.current, 3);
    });

    it("2.3 should prevent cross-user submission to another user's session", async () => {
      const res = await request("/api/interview/followup", {
        method: "POST",
        headers: { Authorization: `Bearer ${user2Token}` },
        body: {
          sessionId: activeSessionId,
          answer: "Malicious submission attempt"
        }
      });

      assert.strictEqual(res.status, 403, "Access denied to unauthorized user");
    });
  });

  describe("3. Interview Completion, Final Report & Analytics", () => {
    it("3.1 should complete interview when max questions reached", async () => {
      let finalResult = null;
      // We already answered 1 question and skipped 1 question, so 2 answers exist.
      // Submit remaining answers to reach 6.
      for (let i = 3; i <= 6; i++) {
        const res = await request("/api/interview/followup", {
          method: "POST",
          headers: { Authorization: `Bearer ${user1Token}` },
          body: {
            sessionId: activeSessionId,
            answer: `Detailed technical answer answering question ${i} with clear explanations and trade-offs.`
          }
        });

        assert.strictEqual(res.status, 200);
        if (res.data.completed) {
          finalResult = res.data;
          break;
        }
      }

      assert.ok(finalResult, "Interview completed");
      assert.strictEqual(finalResult.completed, true);
      assert.ok(finalResult.finalScore !== undefined || finalResult.finalReport);

      // Verify MongoDB document marked as completed
      const completedDoc = await InterviewSession.findOne({ sessionId: activeSessionId });
      assert.strictEqual(completedDoc.status, "completed");
      assert.ok(completedDoc.finalReport.finalScore !== undefined);
    });

    it("3.2 should fetch interview report by sessionId", async () => {
      const res = await request(`/api/interview/${activeSessionId}/report`, {
        headers: { Authorization: `Bearer ${user1Token}` }
      });

      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.data.success, true);
      assert.strictEqual(res.data.session.sessionId, activeSessionId);
      assert.ok(res.data.session.finalScore !== undefined);
      assert.ok(res.data.session.categoryScores);
    });

    it("3.3 should prevent unauthorized user from viewing another user's report", async () => {
      const res = await request(`/api/interview/${activeSessionId}/report`, {
        headers: { Authorization: `Bearer ${user2Token}` }
      });

      assert.strictEqual(res.status, 403);
    });

    it("3.4 should list user interview history with pagination", async () => {
      const res = await request("/api/interview/history?page=1&limit=10", {
        headers: { Authorization: `Bearer ${user1Token}` }
      });

      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.data.success, true);
      assert.ok(Array.isArray(res.data.sessions));
      assert.strictEqual(res.data.sessions.length, 1);
      assert.strictEqual(res.data.sessions[0].sessionId, activeSessionId);
    });

    it("3.5 should compute user dashboard analytics from real completed sessions", async () => {
      const res = await request("/api/interview/analytics", {
        headers: { Authorization: `Bearer ${user1Token}` }
      });

      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.data.success, true);
      assert.strictEqual(res.data.analytics.completedInterviews, 1);
      assert.ok(typeof res.data.analytics.averageScore === "number");
      assert.ok(Array.isArray(res.data.analytics.recentTrends));
    });

    it("3.6 should download printable HTML/PDF report", async () => {
      const res = await request(`/api/interview/${activeSessionId}/pdf`, {
        headers: { Authorization: `Bearer ${user1Token}` }
      });

      assert.strictEqual(res.status, 200);
      assert.ok(res.headers["content-type"].includes("text/html"));
      assert.ok(typeof res.data === "string" && res.data.includes("PrepNova Mock Interview Performance Report"));
    });
  });


  describe("4. Candidate Profile Management", () => {
    it("4.1 should update user profile metadata", async () => {
      const res = await request("/api/auth/profile", {
        method: "PUT",
        headers: { Authorization: `Bearer ${user1Token}` },
        body: {
          targetRole: "Senior Full Stack Engineer",
          experienceLevel: "Senior (5+ years)",
          organization: "PrepNova Tech",
          bio: "Specializing in distributed cloud systems and reactive interfaces."
        }
      });

      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.data.success, true);
      assert.strictEqual(res.data.user.targetRole, "Senior Full Stack Engineer");
      assert.strictEqual(res.data.user.organization, "PrepNova Tech");

      // Verify GET /api/auth/me returns updated data
      const meRes = await request("/api/auth/me", {
        headers: { Authorization: `Bearer ${user1Token}` }
      });
      assert.strictEqual(meRes.data.user.targetRole, "Senior Full Stack Engineer");
    });
  });
});
