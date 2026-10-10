process.env.NODE_ENV = "test";
process.env.JWT_SECRET = "test_jwt_secret_key_1234567890";
process.env.JWT_EXPIRES_IN = "1h";
process.env.MONGO_URI = "mongodb://127.0.0.1:27017/prepnova_rag_test";

const { describe, it, before, after, beforeEach } = require("node:test");
const assert = require("node:assert");
const http = require("http");
const mongoose = require("mongoose");
const app = require("../../src/app");
const User = require("../../src/models/User");
const Resume = require("../../src/models/Resume");
const JobDescription = require("../../src/models/JobDescription");
const { generateToken } = require("../../src/utils/jwt");
const { aiServiceClient } = require("../../src/services/aiService.client");

let server;
let baseUrl;
let userTokenA;
let userTokenB;
let userIdA;
let userIdB;

async function request(path, options = {}) {
  const url = `${baseUrl}${path}`;
  const headers = { ...(options.headers || {}) };

  let body = options.body;
  if (body && !(body instanceof FormData) && typeof body === "object") {
    headers["Content-Type"] = "application/json";
    body = JSON.stringify(body);
  }

  const response = await fetch(url, {
    method: options.method || "GET",
    headers,
    body
  });

  const data = await response.json().catch(() => ({}));
  return {
    status: response.status,
    ok: response.ok,
    headers: response.headers,
    data
  };
}

describe("Express-to-FastAPI AI & RAG Integration Tests", () => {
  before(async () => {
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(process.env.MONGO_URI);
    }
    await User.deleteMany({});
    await Resume.deleteMany({});
    await JobDescription.deleteMany({});

    // Start server on dynamic port
    await new Promise((resolve) => {
      server = app.listen(0, () => {
        const port = server.address().port;
        baseUrl = `http://127.0.0.1:${port}`;
        resolve();
      });
    });

    // Create User A
    const userA = await User.create({
      name: "Alice Developer",
      email: "alice@example.com",
      password: "Password123!"
    });
    userIdA = String(userA._id);
    userTokenA = generateToken({ id: userIdA, email: userA.email, role: userA.role, tokenVersion: 0 });

    // Create User B (for cross-user isolation tests)
    const userB = await User.create({
      name: "Bob Engineer",
      email: "bob@example.com",
      password: "Password123!"
    });
    userIdB = String(userB._id);
    userTokenB = generateToken({ id: userIdB, email: userB.email, role: userB.role, tokenVersion: 0 });
  });

  after(async () => {
    await User.deleteMany({});
    await Resume.deleteMany({});
    await JobDescription.deleteMany({});
    if (mongoose.connection.readyState !== 0) {
      await mongoose.disconnect();
    }
    if (server && server.close) {
      await new Promise((resolve) => server.close(resolve));
    }
  });

  // =========================================================
  // 1. AUTHENTICATION & ROUTE GUARDS
  // =========================================================
  describe("Route Guards & Authentication Enforcement", () => {
    it("1.1 should reject unauthenticated requests to /api/resume/* with 401", async () => {
      const res = await request("/api/resume/my");
      assert.strictEqual(res.status, 401);
      assert.strictEqual(res.data.success, false);
    });

    it("1.2 should reject unauthenticated requests to /api/jd/* with 401", async () => {
      const res = await request("/api/jd/my");
      assert.strictEqual(res.status, 401);
      assert.strictEqual(res.data.success, false);
    });

    it("1.3 should reject unauthenticated requests to /api/rag/search/user with 401", async () => {
      const res = await request("/api/rag/search/user", {
        method: "POST",
        body: { query: "React" }
      });
      assert.strictEqual(res.status, 401);
      assert.strictEqual(res.data.success, false);
    });
  });

  // =========================================================
  // 2. RESUME EXTRACTION & OWNERSHIP ISOLATION
  // =========================================================
  describe("Resume Extraction & MongoDB Persistence", () => {
    let createdDocIdA;

    it("2.1 should reject resume upload with missing file with 400", async () => {
      const res = await request("/api/resume/extract", {
        method: "POST",
        headers: { Authorization: `Bearer ${userTokenA}` }
      });
      assert.strictEqual(res.status, 400);
      assert.match(res.data.error, /file is required/i);
    });

    it("2.2 should successfully extract, index, and persist resume in MongoDB", async () => {
      // Stub aiServiceClient.extractResume for integration flow
      const originalExtractResume = aiServiceClient.extractResume;
      aiServiceClient.extractResume = async (buffer, filename, options) => {
        return {
          success: true,
          extraction_method: "pdf_text",
          indexed: true,
          chunks_count: 5,
          user_id: options.userId,
          document_id: options.documentId,
          resume: {
            candidate: { name: "Alice Developer", email: "alice@example.com" },
            summary: "Experienced Full Stack Software Engineer",
            skills: {
              programming_languages: ["JavaScript", "TypeScript", "Python"],
              frameworks: ["React", "Node.js", "Express"],
              databases: ["MongoDB", "PostgreSQL"],
              cloud: ["AWS", "Docker"]
            },
            education: [{ degree: "B.Tech Computer Science", institution: "Tech University" }],
            experience: [{ company: "Acme Corp", role: "Software Engineer", start_date: "2022", end_date: "2024" }],
            projects: [{ name: "PrepNova", technologies: ["React", "FastAPI"] }],
            certifications: ["AWS Certified Developer"]
          }
        };
      };

      try {
        const formData = new FormData();
        const fakePdfBlob = new Blob(["%PDF-1.4 Fake PDF Content for Test"], { type: "application/pdf" });
        formData.append("file", fakePdfBlob, "alice_resume.pdf");

        const res = await request("/api/resume/extract", {
          method: "POST",
          headers: { Authorization: `Bearer ${userTokenA}` },
          body: formData
        });

        assert.strictEqual(res.status, 201);
        assert.strictEqual(res.data.success, true);
        assert.ok(res.data.resume);
        assert.strictEqual(res.data.resume.originalFilename, "alice_resume.pdf");
        assert.strictEqual(res.data.resume.indexedInChroma, true);
        assert.strictEqual(res.data.resume.chunksCount, 5);
        assert.strictEqual(res.data.resume.parsedData.candidate.name, "Alice Developer");

        createdDocIdA = res.data.resume.documentId;

        // Verify record in MongoDB
        const dbRecord = await Resume.findOne({ documentId: createdDocIdA });
        assert.ok(dbRecord);
        assert.strictEqual(String(dbRecord.userId), userIdA);
      } finally {
        aiServiceClient.extractResume = originalExtractResume;
      }
    });

    it("2.3 should return user's resumes on GET /api/resume/my", async () => {
      const res = await request("/api/resume/my", {
        headers: { Authorization: `Bearer ${userTokenA}` }
      });
      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.data.success, true);
      assert.strictEqual(res.data.count, 1);
      assert.strictEqual(res.data.resumes[0].documentId, createdDocIdA);
    });

    it("2.4 should enforce cross-user isolation on GET /api/resume/:documentId (User B gets 403)", async () => {
      const res = await request(`/api/resume/${createdDocIdA}`, {
        headers: { Authorization: `Bearer ${userTokenB}` }
      });
      assert.strictEqual(res.status, 403);
      assert.strictEqual(res.data.success, false);
      assert.match(res.data.error, /access denied/i);
    });

    it("2.5 should allow owner to GET /api/resume/:documentId", async () => {
      const res = await request(`/api/resume/${createdDocIdA}`, {
        headers: { Authorization: `Bearer ${userTokenA}` }
      });
      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.data.success, true);
      assert.strictEqual(res.data.resume.documentId, createdDocIdA);
    });

    it("2.6 should enforce cross-user isolation on DELETE /api/resume/:documentId (User B gets 403)", async () => {
      const res = await request(`/api/resume/${createdDocIdA}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${userTokenB}` }
      });
      assert.strictEqual(res.status, 403);
      assert.match(res.data.error, /access denied/i);
    });

    it("2.7 should allow owner to DELETE resume from MongoDB and ChromaDB", async () => {
      let deleteCalled = false;
      const origDelete = aiServiceClient.deleteUserDocument;
      aiServiceClient.deleteUserDocument = async ({ userId, documentId }) => {
        deleteCalled = true;
        assert.strictEqual(userId, userIdA);
        assert.strictEqual(documentId, createdDocIdA);
        return { success: true };
      };

      try {
        const res = await request(`/api/resume/${createdDocIdA}`, {
          method: "DELETE",
          headers: { Authorization: `Bearer ${userTokenA}` }
        });
        assert.strictEqual(res.status, 200);
        assert.strictEqual(res.data.success, true);
        assert.strictEqual(deleteCalled, true);

        const checkDb = await Resume.findOne({ documentId: createdDocIdA });
        assert.strictEqual(checkDb, null);
      } finally {
        aiServiceClient.deleteUserDocument = origDelete;
      }
    });
  });

  // =========================================================
  // 3. JOB DESCRIPTION EXTRACTION & PERSISTENCE
  // =========================================================
  describe("Job Description Extraction & Persistence", () => {
    let createdJdDocIdA;

    it("3.1 should reject JD extraction when both text and file are missing", async () => {
      const res = await request("/api/jd/extract", {
        method: "POST",
        headers: { Authorization: `Bearer ${userTokenA}` },
        body: {}
      });
      assert.strictEqual(res.status, 400);
      assert.match(res.data.error, /either a pdf file or text content is required/i);
    });

    it("3.2 should extract and persist JD from text content", async () => {
      const origExtractJd = aiServiceClient.extractJd;
      aiServiceClient.extractJd = async (params) => {
        return {
          success: true,
          indexed: true,
          chunks_count: 3,
          document_id: params.documentId,
          user_id: params.userId,
          jd: {
            job_info: { title: "Senior React Engineer", company: "Meta", location: "Remote" },
            requirements: {
              required_skills: ["React", "TypeScript", "Redux", "GraphQL"],
              preferred_skills: ["Next.js", "Docker"]
            },
            responsibilities: { items: ["Build scalable UI components", "Optimize web performance"] }
          }
        };
      };

      try {
        const res = await request("/api/jd/extract", {
          method: "POST",
          headers: { Authorization: `Bearer ${userTokenA}` },
          body: {
            text: "Looking for Senior React Engineer at Meta with TypeScript and GraphQL experience."
          }
        });

        assert.strictEqual(res.status, 201);
        assert.strictEqual(res.data.success, true);
        assert.strictEqual(res.data.jd.title, "Senior React Engineer");
        assert.strictEqual(res.data.jd.company, "Meta");
        assert.strictEqual(res.data.jd.indexedInChroma, true);

        createdJdDocIdA = res.data.jd.documentId;
      } finally {
        aiServiceClient.extractJd = origExtractJd;
      }
    });

    it("3.3 should enforce isolation: User B cannot access User A's JD", async () => {
      const res = await request(`/api/jd/${createdJdDocIdA}`, {
        headers: { Authorization: `Bearer ${userTokenB}` }
      });
      assert.strictEqual(res.status, 403);
    });
  });

  // =========================================================
  // 4. CHROMADB RAG RETRIEVAL ENDPOINTS
  // =========================================================
  describe("RAG Similarity Search Endpoints", () => {
    it("4.1 should perform user-scoped document retrieval with authenticated user ID", async () => {
      let capturedUserId = null;
      const origSearch = aiServiceClient.searchUserDocuments;
      aiServiceClient.searchUserDocuments = async ({ userId, query, documentId, topK }) => {
        capturedUserId = userId;
        return {
          success: true,
          query,
          count: 1,
          results: [
            {
              content: "Skills: JavaScript, TypeScript, React, Node.js",
              metadata: { section: "skills", document_type: "resume" },
              distance: 0.12
            }
          ]
        };
      };

      try {
        const res = await request("/api/rag/search/user", {
          method: "POST",
          headers: { Authorization: `Bearer ${userTokenA}` },
          body: { query: "What frontend skills does the candidate have?", topK: 3 }
        });

        assert.strictEqual(res.status, 200);
        assert.strictEqual(res.data.success, true);
        assert.strictEqual(capturedUserId, userIdA);
        assert.strictEqual(res.data.results.length, 1);
        assert.match(res.data.results[0].content, /TypeScript/);
      } finally {
        aiServiceClient.searchUserDocuments = origSearch;
      }
    });

    it("4.2 should perform global role-knowledge search", async () => {
      let capturedRole = null;
      const origSearchRole = aiServiceClient.searchRoleKnowledge;
      aiServiceClient.searchRoleKnowledge = async ({ role, query, topK }) => {
        capturedRole = role;
        return {
          success: true,
          query,
          count: 2,
          results: [
            {
              content: "Role: Frontend Developer - Key concepts: Virtual DOM, State Management",
              metadata: { role: "Frontend Developer", scope: "global" }
            }
          ]
        };
      };

      try {
        const res = await request("/api/rag/search/role", {
          method: "POST",
          headers: { Authorization: `Bearer ${userTokenA}` },
          body: { role: "Frontend Developer", query: "state management patterns" }
        });

        assert.strictEqual(res.status, 200);
        assert.strictEqual(res.data.success, true);
        assert.strictEqual(capturedRole, "Frontend Developer");
      } finally {
        aiServiceClient.searchRoleKnowledge = origSearchRole;
      }
    });

    it("4.3 should return RAG stats from GET /api/rag/stats", async () => {
      const origStats = aiServiceClient.getRagStats;
      aiServiceClient.getRagStats = async () => {
        return { status: "ok", total_documents: 42 };
      };

      try {
        const res = await request("/api/rag/stats");
        assert.strictEqual(res.status, 200);
        assert.strictEqual(res.data.total_documents, 42);
      } finally {
        aiServiceClient.getRagStats = origStats;
      }
    });
  });
});
