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
const Resume = require("../../src/models/Resume");
const JobDescription = require("../../src/models/JobDescription");
const InterviewSession = require("../../src/models/InterviewSession");

describe("Comprehensive Edge-Case & 7-Combination Backend Integration Tests", () => {
  let server;
  let port;
  let user1Token;
  let user1Id;
  let user2Token;
  let user2Id;

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

    await User.deleteMany({ email: /@edgecasetest\.prepnova\.com$/i });
    await InterviewSession.deleteMany({ userId: { $in: [user1Id, user2Id] } });

    // Register User 1
    const u1 = await request("/api/auth/register", {
      method: "POST",
      body: {
        name: "Edge Case User One",
        email: "user1@edgecasetest.prepnova.com",
        password: "StrongPassword123!"
      }
    });
    user1Token = u1.data.token;
    user1Id = u1.data.user ? (u1.data.user.id || u1.data.user._id) : null;

    // Register User 2
    const u2 = await request("/api/auth/register", {
      method: "POST",
      body: {
        name: "Edge Case User Two",
        email: "user2@edgecasetest.prepnova.com",
        password: "StrongPassword123!"
      }
    });
    user2Token = u2.data.token;
    user2Id = u2.data.user ? (u2.data.user.id || u2.data.user._id) : null;
  });

  after(async () => {
    if (server) {
      await new Promise((resolve) => server.close(resolve));
    }
  });

  it("POST /api/interview/validate handles Combination 3: Role only", async () => {
    const res = await request("/api/interview/validate", {
      method: "POST",
      headers: { Authorization: `Bearer ${user1Token}` },
      body: {
        mode: "role",
        role: "DevOps Engineer"
      }
    });

    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.data.success, true);
    assert.strictEqual(res.data.decision_state, "READY");
    assert.ok(res.data.user_recommendations.some((r) => r.includes("Because no resume or job description was provided")));
  });

  it("POST /api/interview/validate handles Combination 6: Role + JD Conflict (NEEDS_CLARIFICATION)", async () => {
    // Create a Data Science JD for User 1
    const jdDoc = await JobDescription.create({
      userId: user1Id,
      documentId: `jd_conflict_${Date.now()}`,
      title: "Senior Data Scientist",
      rawText: "Senior Data Scientist required with PyTorch, Machine Learning, and NLP",
      parsedData: {
        role_title: "Senior Data Scientist",
        required_skills: ["PyTorch", "TensorFlow", "NLP", "Machine Learning"]
      }
    });

    const res = await request("/api/interview/validate", {
      method: "POST",
      headers: { Authorization: `Bearer ${user1Token}` },
      body: {
        mode: "role_jd",
        role: "Frontend Engineer",
        jdId: jdDoc.documentId
      }
    });

    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.data.decision_state, "NEEDS_CLARIFICATION");
    assert.ok(res.data.conflicts.length > 0);
    assert.ok(res.data.user_recommendations.some((r) => r.includes("The selected role and job description appear to target different responsibilities")));
  });

  it("POST /api/interview/validate handles Combination 4: Low Fit Assessment (READY_WITH_WARNINGS)", async () => {
    // Resume has only basic web design
    const resumeDoc = await Resume.create({
      userId: user1Id,
      documentId: `res_lowfit_${Date.now()}`,
      originalFilename: "designer_resume.pdf",
      detectedRole: "Web Designer",
      rawText: "HTML, CSS, UI Design, WordPress, Figma for marketing sites",
      parsedData: {
        skills: ["HTML", "CSS", "UI Design", "Figma", "WordPress"],
        experience: [{ description: "Created marketing landing pages and WordPress themes" }],
        projects: [{ description: "Freelance design portfolio" }]
      }
    });

    // JD is for Senior Data Engineer
    const jdDoc = await JobDescription.create({
      userId: user1Id,
      documentId: `jd_dataeng_${Date.now()}`,
      title: "Senior Data Engineer",
      rawText: "Senior Data Engineer with Apache Kafka, PySpark, Snowflake, Databricks",
      parsedData: {
        role_title: "Senior Data Engineer",
        required_skills: ["Apache Kafka", "PySpark", "Snowflake", "Databricks", "Kubernetes"]
      }
    });

    const res = await request("/api/interview/validate", {
      method: "POST",
      headers: { Authorization: `Bearer ${user1Token}` },
      body: {
        mode: "resume_jd",
        resumeId: resumeDoc.documentId,
        jdId: jdDoc.documentId
      }
    });

    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.data.decision_state, "READY_WITH_WARNINGS");
    assert.ok(res.data.compatibility_score < 40.0);
    assert.ok(res.data.user_recommendations.some((r) => r.includes("Your current resume appears to have limited alignment with this job description")));
  });

  it("Cross-user authorization: User 2 cannot access or validate with User 1 documents", async () => {
    // Resume belongs to User 1
    const user1Resume = await Resume.create({
      userId: user1Id,
      documentId: `res_private_${Date.now()}`,
      originalFilename: "private_resume.pdf",
      detectedRole: "Backend Engineer",
      rawText: "Private resume data",
      parsedData: {
        skills: ["Node.js", "Docker"]
      }
    });

    // User 2 passes User 1's resumeId to validate
    const res = await request("/api/interview/validate", {
      method: "POST",
      headers: { Authorization: `Bearer ${user2Token}` },
      body: {
        mode: "resume",
        resumeId: user1Resume.documentId
      }
    });

    // Controller strictly scopes findOne({ documentId, userId: user2Id }), so User 1's resume is not retrieved
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.data.decision_state, "INSUFFICIENT_EVIDENCE");
  });

  it("Cross-user session authorization: User 2 cannot access or submit answers to User 1 session", async () => {
    const user1Session = await InterviewSession.create({
      userId: user1Id,
      sessionId: `sess_user1_${Date.now()}`,
      role: "Backend Engineer",
      difficulty: "intermediate",
      mode: "role",
      totalQuestions: 5,
      questions: [{ questionId: "turn_0", question: "Introduce yourself", sectionId: "introduction" }],
      answers: [],
      evaluations: [],
      status: "in_progress"
    });

    // User 2 attempts to submit answer to User 1's session
    const res = await request("/api/interview/followup", {
      method: "POST",
      headers: { Authorization: `Bearer ${user2Token}` },
      body: {
        sessionId: user1Session.sessionId,
        answer: "Hacking into user 1 session"
      }
    });

    assert.strictEqual(res.status, 403);
    assert.ok(res.data.error.includes("Access denied"));
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

