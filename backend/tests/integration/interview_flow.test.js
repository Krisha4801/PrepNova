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

    aiServiceClient.planBlueprint = async (params) => {
      return {
        version: 1,
        role: params.role || "Frontend Developer",
        difficulty: params.difficulty || "intermediate",
        target_duration_minutes: 30,
        sections: [
          { id: "introduction", title: "Introduction", type: "introduction", planned_primary_question_count: 1, applicable: true },
          { id: "projects", title: "Projects", type: "projects", planned_primary_question_count: 2, applicable: true },
          { id: "technical_concepts", title: "Technical Fundamentals", type: "technical_concepts", planned_primary_question_count: 2, applicable: true }
        ],
        global_rules: { maxFollowUpsPerQuestion: 1, evaluateOnlyAfterCompletion: true }
      };
    };

    aiServiceClient.generateSectionBatch = async (params) => {
      const count = Number(params.plannedPrimaryQuestionCount || 2);
      const questions = [];
      for (let i = 1; i <= count; i++) {
        questions.push({
          questionId: `q_${params.sessionId}_${params.sectionId}_${i}`,
          sectionId: params.sectionId,
          order: i,
          type: "primary",
          objective: `Assess ${params.sectionId}`,
          difficulty: params.difficulty || "intermediate",
          text: `Question ${i} for section ${params.sectionId} on ${params.role}`,
          contextReferences: ["role"],
          status: "pending"
        });
      }
      return {
        sectionId: params.sectionId,
        generationMode: String(params.generationMode || "6"),
        plannedPrimaryQuestionCount: count,
        questions,
        generationVersion: 1
      };
    };

    aiServiceClient.decideFollowUp = async (params) => {
      return {
        action: "NEXT_PRIMARY",
        followUp: null,
        reason: "Answer complete"
      };
    };

    aiServiceClient.generateNextTurn = async (params) => {
      const turnsTaken = params.totalTurnsTaken || 0;
      if (turnsTaken >= 6) {
        return {
          action: "COMPLETE",
          is_complete: true,
          interviewer_text: "Thank you for completing the interview!"
        };
      }
      return {
        action: "ASK_QUESTION",
        section_id: turnsTaken === 1 ? "projects" : "technical_concepts",
        question_type: "primary",
        interviewer_text: `Next technical question #${turnsTaken + 1} for ${params.role}`,
        is_complete: false
      };
    };

    aiServiceClient.evaluateSession = async (params) => {
      return {
        overall_score: 8.5,
        rating_label: "Interview Ready",
        category_scores: {
          correctness: 8.5,
          clarity: 8.5,
          depth: 8.0,
          relevance: 9.0,
          completeness: 8.5
        },
        intro_evaluation: {
          score: 8.5,
          structure: "Structured, concise introduction.",
          role_relevance: `Aligned well with ${params.role}`,
          evidence: "Highlighted key frontend experiences.",
          conciseness: "Paced well.",
          clarity: "Articulate delivery.",
          strengths: ["Clear overview", "Relevant tools cited"],
          improvements: ["Quantify impact earlier"],
          sample_improved_answer: "Hi, I am a frontend developer with extensive React experience..."
        },
        section_summaries: {
          introduction: "Clear self-summary.",
          projects: "Good architecture details."
        },
        feedback: "Strong overall performance.",
        strengths: ["Clear technical reasoning", "Good architecture choices"],
        areas_of_improvement: ["Elaborate on performance metrics"],
        preparation_plan: ["Study web vitals optimization", "Practice STAR behavioral storytelling"],
        coverage_summary: { total_turns: params.transcript?.length || 6, sections_assessed: ["Introduction", "Projects", "Technical"] },
        evaluations: (params.transcript || []).map((t, idx) => ({
          question_index: idx,
          section_id: t.section_id || "technical",
          score: 8.5,
          feedback: "Solid answer with clear rationale.",
          correctness: 8.5,
          clarity: 8.5,
          depth: 8.0,
          relevance: 9.0,
          completeness: 8.5
        }))
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
    it("1.1 should start interview with role selected, generate blueprint, and open with introduction", async () => {
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
      assert.match(res.data.question, /introduce yourself/i, "Turn 0 must be the opening self-introduction");
      assert.strictEqual(res.data.section, "introduction");
      assert.strictEqual(res.data.progress.current, 1);
      activeSessionId = res.data.sessionId;

      // Verify persistent session in MongoDB
      const doc = await InterviewSession.findOne({ sessionId: activeSessionId });
      assert.ok(doc, "MongoDB session document exists");
      assert.strictEqual(String(doc.userId), user1Id);
      assert.strictEqual(doc.status, "in_progress");
      assert.strictEqual(doc.reportStatus, "not_started");
      assert.ok(doc.blueprint, "Blueprint persisted in session");
      assert.strictEqual(doc.questions[0].sectionId, "introduction");
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

  describe("2. Answer Submission, Zero Live Scoring & Conversational Engine", () => {
    it("2.1 should accept answer without exposing live scores and advance to next question", async () => {
      const res = await request("/api/interview/followup", {
        method: "POST",
        headers: { Authorization: `Bearer ${user1Token}` },
        body: {
          sessionId: activeSessionId,
          answer: "Hi, I am a frontend developer with 2 years of experience using React, Redux, and TypeScript to build web platforms."
        }
      });

      assert.strictEqual(res.status, 200);
      // Spec: ZERO scores or evaluations exposed during live interview!
      assert.strictEqual(res.data.evaluation, undefined, "Live evaluation must NOT be returned");
      assert.strictEqual(res.data.score, undefined, "Live score must NOT be returned");
      assert.ok(res.data.question, "Next question returned");
      assert.strictEqual(res.data.completed, false);
      assert.strictEqual(res.data.progress.current, 2);

      // Verify answer persisted in MongoDB with evaluationStatus: "pending"
      const doc = await InterviewSession.findOne({ sessionId: activeSessionId });
      assert.strictEqual(doc.answers.length, 1);
      assert.strictEqual(doc.answers[0].evaluationStatus, "pending");
    });

    it("2.2 should handle skipped question gracefully without live evaluation", async () => {
      const res = await request("/api/interview/skip", {
        method: "POST",
        headers: { Authorization: `Bearer ${user1Token}` },
        body: { sessionId: activeSessionId }
      });

      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.data.evaluation, undefined, "Live evaluation must NOT be returned on skip");
      assert.strictEqual(res.data.skipped, true);
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
      const doc = await InterviewSession.findOne({ sessionId: activeSessionId });
      const targetTotal = doc.totalQuestions;
      for (let i = doc.answers.length + 1; i <= targetTotal; i++) {
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

  after(async () => {
    if (mongoose.connection.readyState !== 0) {
      await mongoose.disconnect();
    }
    if (server) {
      await new Promise((resolve) => server.close(resolve));
    }
  });
});

