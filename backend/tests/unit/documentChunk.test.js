const test = require("node:test");
const assert = require("node:assert/strict");
const DocumentChunk = require("../../src/models/DocumentChunk");
const { AiServiceClient } = require("../../src/services/aiService.client");

test("DocumentChunk Schema & Compound Index Specification", () => {
  const indexes = DocumentChunk.schema.indexes();
  
  // Find compound unique index
  const compoundIndex = indexes.find(([fields]) => {
    return (
      fields.userId === 1 &&
      fields.documentType === 1 &&
      fields.documentId === 1 &&
      fields.chunkIndex === 1
    );
  });

  assert.ok(compoundIndex, "DocumentChunk must have a compound index on { userId, documentType, documentId, chunkIndex }");
  assert.strictEqual(compoundIndex[1].unique, true, "Compound index must be unique for idempotent storage");

  // Verify paths
  const paths = DocumentChunk.schema.paths;
  assert.ok(paths.userId, "userId path exists");
  assert.ok(paths.documentType, "documentType path exists");
  assert.ok(paths.documentId, "documentId path exists");
  assert.ok(paths.chunkIndex, "chunkIndex path exists");
  assert.ok(paths.chunkId, "chunkId path exists");
  assert.ok(paths.content, "content path exists");
  assert.ok(paths.embedding, "embedding path exists");
  assert.strictEqual(paths.documentType.enumValues.includes("resume"), true);
  assert.strictEqual(paths.documentType.enumValues.includes("jd"), true);
});

test("AiServiceClient Document Status & Rehydration Contracts", async () => {
  const client = new AiServiceClient("http://127.0.0.1:8000", 5000);

  // Validate parameter checking
  await assert.rejects(
    async () => client.checkDocumentStatus({ userId: null, documentId: "doc_1" }),
    { message: /userId and documentId are required/ }
  );

  await assert.rejects(
    async () => client.rehydrateDocument({ userId: "u1", documentId: "doc_1", chunks: [] }),
    { message: /non-empty chunks array are required/ }
  );

  // Verify request formatting with mock httpClient
  let capturedRequest = null;
  client.httpClient = {
    get: async (url, config) => {
      capturedRequest = { method: "GET", url, config };
      return { data: { indexed_in_chroma: true } };
    },
    post: async (url, body) => {
      capturedRequest = { method: "POST", url, body };
      return { data: { success: true, rehydrated_chunks_count: body.chunks.length } };
    }
  };

  const statusRes = await client.checkDocumentStatus({
    userId: "user_123",
    documentId: "resume_456",
    documentType: "resume"
  });
  assert.strictEqual(capturedRequest.method, "GET");
  assert.strictEqual(capturedRequest.url, "/rag/document-status");
  assert.strictEqual(capturedRequest.config.params.user_id, "user_123");
  assert.strictEqual(statusRes.indexed_in_chroma, true);

  const rehydrateRes = await client.rehydrateDocument({
    userId: "user_123",
    documentId: "resume_456",
    documentType: "resume",
    chunks: [
      {
        chunkId: "resume:user_123:resume_456:0",
        chunkIndex: 0,
        content: "Experienced Full Stack Engineer with React and Node.js",
        section: "experience",
        embedding: [0.012, -0.034, 0.567]
      }
    ]
  });
  assert.strictEqual(capturedRequest.method, "POST");
  assert.strictEqual(capturedRequest.url, "/rag/rehydrate");
  assert.strictEqual(capturedRequest.body.chunks.length, 1);
  assert.strictEqual(capturedRequest.body.chunks[0].chunk_id, "resume:user_123:resume_456:0");
  assert.strictEqual(rehydrateRes.success, true);
  assert.strictEqual(rehydrateRes.rehydrated_chunks_count, 1);
});

test("AiServiceClient X-AI-Service-Key Header Attachment", () => {
  const origKey = process.env.AI_SERVICE_API_KEY;
  try {
    process.env.AI_SERVICE_API_KEY = "test_secret_ai_key_987";
    const clientWithKey = new AiServiceClient("http://127.0.0.1:8000", 5000);
    assert.strictEqual(
      clientWithKey.httpClient.defaults.headers["X-AI-Service-Key"],
      "test_secret_ai_key_987",
      "AiServiceClient must attach X-AI-Service-Key from environment"
    );

    delete process.env.AI_SERVICE_API_KEY;
    const clientWithoutKey = new AiServiceClient("http://127.0.0.1:8000", 5000);
    assert.strictEqual(
      clientWithoutKey.httpClient.defaults.headers["X-AI-Service-Key"],
      undefined,
      "AiServiceClient must omit key when AI_SERVICE_API_KEY is unset"
    );
  } finally {
    if (origKey !== undefined) {
      process.env.AI_SERVICE_API_KEY = origKey;
    } else {
      delete process.env.AI_SERVICE_API_KEY;
    }
  }
});

test("Rehydration Document-Level User Ownership Authorization", async () => {
  const resumeController = require("../../src/controllers/resume.controller");
  const Resume = require("../../src/models/Resume");

  // Mock Resume.findOne
  const origFindOne = Resume.findOne;
  const origChunksFind = DocumentChunk.find;

  try {
    // 1. Resume not found -> 404
    Resume.findOne = async () => null;
    let statusCode = null;
    let jsonBody = null;
    let req = { user: { id: "user_owner" }, params: { documentId: "resume_999" } };
    let res = {
      status: (code) => { statusCode = code; return res; },
      json: (data) => { jsonBody = data; return res; }
    };
    await resumeController.rehydrateResume(req, res, () => {});
    assert.strictEqual(statusCode, 404);
    assert.strictEqual(jsonBody.error, "Resume not found.");

    // 2. Resume owned by user_different -> 403 Forbidden
    Resume.findOne = async () => ({
      userId: "user_different",
      documentId: "resume_999",
      save: async () => {}
    });
    await resumeController.rehydrateResume(req, res, () => {});
    assert.strictEqual(statusCode, 403);
    assert.strictEqual(jsonBody.error, "Access denied. You do not own this document.");

    // 3. User owns document, but 0 chunks exist -> 404
    Resume.findOne = async () => ({
      userId: "user_owner",
      documentId: "resume_999",
      save: async () => {}
    });
    DocumentChunk.find = () => ({
      sort: () => Promise.resolve([])
    });
    await resumeController.rehydrateResume(req, res, () => {});
    assert.strictEqual(statusCode, 404);
    assert.match(jsonBody.error, /No stored vector chunks found/);

    // 4. User owns document, valid chunks exist -> 200 rehydrated
    statusCode = null;
    jsonBody = null;
    DocumentChunk.find = () => ({
      sort: () => Promise.resolve([
        {
          chunkId: "c1",
          chunkIndex: 0,
          content: "Skills: Python, Node.js",
          section: "skills",
          embedding: [0.1, 0.2]
        }
      ])
    });

    const { aiServiceClient } = require("../../src/services/aiService.client");
    const origRehydrate = aiServiceClient.rehydrateDocument;
    aiServiceClient.rehydrateDocument = async (opts) => {
      assert.strictEqual(opts.userId, "user_owner");
      assert.strictEqual(opts.documentId, "resume_999");
      return { success: true, rehydrated_chunks_count: 1 };
    };

    let saved = false;
    Resume.findOne = async () => ({
      userId: "user_owner",
      documentId: "resume_999",
      save: async () => { saved = true; }
    });

    await resumeController.rehydrateResume(req, res, () => {});
    assert.strictEqual(statusCode, null); // 200 default
    assert.strictEqual(jsonBody.success, true);
    assert.strictEqual(jsonBody.rehydratedChunksCount, 1);
    assert.strictEqual(saved, true);

    aiServiceClient.rehydrateDocument = origRehydrate;
  } finally {
    Resume.findOne = origFindOne;
    DocumentChunk.find = origChunksFind;
  }
});
