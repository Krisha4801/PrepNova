const { describe, it } = require("node:test");
const assert = require("node:assert");
const {
  AiServiceClient,
  normalizeAiServiceError,
  getAiServiceBaseUrl,
  getAiServiceTimeout
} = require("../../src/services/aiService.client");

describe("AI Service Client Unit Tests", () => {
  it("1. should resolve default or environment-configured base URL and timeout", () => {
    const defaultClient = new AiServiceClient();
    assert.strictEqual(defaultClient.baseURL, getAiServiceBaseUrl());
    assert.strictEqual(defaultClient.timeout, getAiServiceTimeout());

    const customClient = new AiServiceClient("http://custom-ai-host:9000", 15000);
    assert.strictEqual(customClient.baseURL, "http://custom-ai-host:9000");
    assert.strictEqual(customClient.timeout, 15000);
  });

  it("2. should normalize ECONNREFUSED into a clean 503 error without leaking tracebacks", () => {
    const rawError = new Error("connect ECONNREFUSED 127.0.0.1:8000");
    rawError.code = "ECONNREFUSED";

    const normalized = normalizeAiServiceError(rawError, "Resume extraction");
    assert.strictEqual(normalized.statusCode, 503);
    assert.strictEqual(normalized.code, "AI_SERVICE_UNAVAILABLE");
    assert.match(normalized.message, /AI Service is currently unreachable/i);
    assert.strictEqual(normalized.message.includes("127.0.0.1"), false);
  });

  it("3. should normalize timeout errors into a clean 504 error", () => {
    const rawError = new Error("timeout of 30000ms exceeded");
    rawError.code = "ECONNABORTED";

    const normalized = normalizeAiServiceError(rawError, "PDF parsing");
    assert.strictEqual(normalized.statusCode, 504);
    assert.strictEqual(normalized.code, "AI_SERVICE_TIMEOUT");
    assert.match(normalized.message, /timed out/i);
  });

  it("4. should safely extract detail message from 4xx/5xx API responses", () => {
    const rawError = new Error("Request failed with status code 422");
    rawError.response = {
      status: 422,
      data: {
        detail: "Could not extract text from corrupted PDF document."
      }
    };

    const normalized = normalizeAiServiceError(rawError, "Resume extraction");
    assert.strictEqual(normalized.statusCode, 422);
    assert.strictEqual(normalized.message, "Could not extract text from corrupted PDF document.");
  });

  it("5. should reject resume extraction if file buffer is missing or invalid", async () => {
    const client = new AiServiceClient();
    await assert.rejects(
      async () => {
        await client.extractResume(null, "test.pdf");
      },
      (err) => {
        assert.strictEqual(err.statusCode, 400);
        assert.match(err.message, /valid file buffer is required/i);
        return true;
      }
    );
  });

  it("6. should reject JD extraction if both file and text are missing", async () => {
    const client = new AiServiceClient();
    await assert.rejects(
      async () => {
        await client.extractJd({});
      },
      (err) => {
        assert.strictEqual(err.statusCode, 400);
        assert.match(err.message, /either a pdf file or non-empty jd text/i);
        return true;
      }
    );
  });

  it("7. should validate user_id and query for user document search", async () => {
    const client = new AiServiceClient();
    await assert.rejects(
      async () => {
        await client.searchUserDocuments({ userId: "", query: "React skills" });
      },
      (err) => {
        assert.strictEqual(err.statusCode, 400);
        assert.match(err.message, /userId and query are required/i);
        return true;
      }
    );
  });

  it("8. should validate role and query for role knowledge search", async () => {
    const client = new AiServiceClient();
    await assert.rejects(
      async () => {
        await client.searchRoleKnowledge({ role: "", query: "Microservices" });
      },
      (err) => {
        assert.strictEqual(err.statusCode, 400);
        assert.match(err.message, /role and query are required/i);
        return true;
      }
    );
  });
});
