# PrepNova: Verification, End-to-End & Performance Testing Report

**Project**: PrepNova — RAG-based Adaptive Mock Interview Platform  
**Authors**: PrepNova Team (DevOps & Test Lead: Jaimin Trivedi; Backend Testing: Kush Dani, Varunee Agrawal; AI Testing: Krisha Shah, Garv Modi; Frontend QA: Hardi Dhadhal, Shruti Makwana, Dev Patel)  
**Date**: November 16, 2026  
**Document Ref**: Report #11 Deliverable (Week 12–13) & Report #12 Verification Audit  

---

## 1. Executive Summary & Verification Matrix

This report provides an evidence-based audit of all verification artifacts, test suites, and load test specifications across the PrepNova codebase on branch `main`.

| Verification Category | Status | Count / Metrics | Details |
| :--- | :---: | :---: | :--- |
| **Backend Unit & Contract Suite** | **PASS** | **110 / 110 tests (28 suites)** | Node.js native test runner, 2.19s total duration |
| **AI Microservice Suite** | **PASS** | **40 / 40 tests** | Python `unittest`, 4.64s total duration |
| **Frontend Production Build** | **PASS** | **0 errors, 2,290 modules** | Vite v5.4.21, 11.33s compile duration |
| **ChromaDB Multi-Collection Isolation** | **PASS** | **3 distinct collections** | `prepnova_resumes`, `prepnova_jds`, `prepnova_role_kb` |
| **ChromaDB Durability & Rehydration** | **PASS** | **100% idempotent** | Zero-loss recovery from MongoDB `DocumentChunk` |
| **Document Authorization & Security** | **PASS** | **Strict 401 & 403 enforcement** | Microservice key check + document ownership verification |

---

## 2. Categorization of Test Artifacts

### A. Implemented Scripts in Repository
The following test scripts and specifications are implemented and maintained in the repository:
1. `backend/scripts/load_test_k6.js`: k6 load testing suite simulating virtual users across registration, login, rate-limiting, and interview turns.
2. `AIService/scripts/locustfile.py`: Locust load testing suite evaluating AI microservice endpoints (`/health`, `/rag/search/role`, `/rag/document-status`, `/interview/plan-blueprint`).
3. `frontend/cypress/e2e/resume_interview.cy.js`: Cypress E2E browser specification for candidate registration, resume upload, 5-dimension AI question answer turn, and scorecard generation.
4. `frontend/cypress/e2e/role_interview.cy.js`: Cypress E2E browser specification for role-based interview flow without a resume.
5. `backend/scripts/live_e2e_audit.js`: Node.js multi-step integration script exercising full auth, resume upload, question generation, and report viewing.

### B. Tests Actually Executed
The following tests were executed in the local test environment with verified results:
1. **Node.js Backend Test Runner (`node --test tests/unit/*.test.js`)**:
   - 110 tests across 28 test files passed with 0 failures in 2,194 ms.
   - Covers: JWT utility, middleware authorization, Google OAuth OIDC & PKCE, OTP hashing, input validation, section-wise batch generation, per-section count modes (3, 6, 10, dynamic), conversational filler stripping, AI client contracts, DocumentChunk compound unique index, and document-level rehydration authorization.
2. **AI Microservice Test Runner (`python -m unittest discover -s tests -p "test_*.py"`)**:
   - 40 tests passed with 0 failures in 4,636 ms.
   - Covers: FastAPI route contracts, ChromaDB multi-collection separation, PyMuPDF text extraction, section-aware chunking, LangGraph question generation, adaptive scoring, simulated container restart rehydration, partial indexing failure recovery, and `verify_ai_service_key` authorization.
3. **Frontend Production Build (`npm run build` in `frontend/`)**:
   - Vite v5.4.21 successfully compiled and bundled all assets (`dist/index.html`, `dist/assets/index-*.js`, `dist/assets/index-*.css`) in 11.33 seconds with 0 syntax or bundling errors.

### C. Tests Not Executed & Exact Blockers
To maintain strict academic integrity, the following tests are explicitly reported as not executed in the current environment:
1. **Cypress Browser Runner (`cypress run`)**:
   - *Exact Blocker*: The `cypress` package is not installed in `frontend/node_modules` (empty devDependencies). Installing Cypress requires downloading the ~150 MB Electron desktop browser binary from external AWS S3 (`download.cypress.io`), which is unavailable in the isolated offline sandbox.
2. **k6 Load Runner (`k6 run`)**:
   - *Exact Blocker*: The `k6` CLI binary is not installed on the host Windows machine (`where.exe k6` returned not found).
3. **Locust Stress Runner (`locust -f ...`)**:
   - *Exact Blocker*: The `locust` package is not installed in `AIService/.venv`.

---

## 3. Actual Test Execution Timing & Design SLA Reference

To maintain strict truth-in-testing, we separate the **actual measured test-runner durations** from the **design SLA targets** specified in the Project Plan. Neither k6 nor Locust load tests were executed in this local environment; therefore, no synthetic or unverified load-test numbers are reported.

### A. Actually Measured Test-Runner Durations (Command Trace)

1. **Backend Unit & Contract Suite**:
   - **Execution Command**: `cd backend; node --test tests/unit/*.test.js`
   - **Environment**: Node.js v24.18.0 (Windows local development)
   - **Measured Total Suite Duration**: **2,194 ms – 2,300 ms** across 110 tests (28 suites).
   - **Breakdown by Major Test Suite**:
     - `jwt.test.js` (JWT signing, HMAC verification, expiration rejection): **96.8 ms**
     - `oauth.provider.test.js` (Google OIDC token signature, PKCE verifier, nonce checks): **136.0 ms**
     - `oauth.state.test.js` (Single-use CSRF tokens, state verification): **20.8 ms**
     - `documentChunk.test.js` (Schema, compound unique index, X-AI-Service-Key, ownership checks): **16.3 ms**
     - `validator.test.js` (Password complexity, registration, login schemas): **22.1 ms**
     - `interview.countModes.test.js` (Dynamic and static question count modes): **15.2 ms**
     - `interview.contracts.test.js` (Blueprint & section batch validation): **28.4 ms**
     - `interview.filler_dedup.test.js` (Filler removal and semantic deduplication): **16.8 ms**
     - `middleware.test.js` (Authentication token and role authorization gates): **63.5 ms**
     - `email.service.test.js` (Password reset and OAuth notification templates): **28.5 ms**

2. **AI Microservice Suite**:
   - **Execution Command**: `cd AIService; .venv\Scripts\python.exe -m unittest discover -s tests -p "test_*.py"`
   - **Environment**: Python 3.11.9 (Windows virtual environment)
   - **Measured Total Suite Duration**: **4,589 ms – 4,636 ms** across 40 tests.
   - **Breakdown by Component**:
     - `test_durability_and_security.py` (3 Chroma collections, container wipe rehydration, partial failure recovery, key auth): **2,666 ms**
     - `test_chroma_multi_collections.py` (Metadata filtering, collection routing): **340 ms**
     - `test_interview.py` & fallback tests (LangGraph state flow, section batching, scoring): **1,583 ms**

3. **Frontend Production Build**:
   - **Execution Command**: `cd frontend; npm run build`
   - **Environment**: Vite v5.4.21, React 18, Tailwind CSS v4
   - **Measured Build Duration**: **11.33 s** (2,290 modules transformed, 0 syntax/type errors).

### B. Project Plan Design SLA Targets (To Be Validated in Live Staging via k6)
The following are design SLA requirements defined in the course Project Plan (IT644 WS & SOA). These are **design specifications**, not locally measured load-test figures, and will be formally validated when k6 and Locust are executed in the staging environment:

| Service / Endpoint | Project Plan Target SLA | Testing Method Defined in Repo | Execution Status |
| :--- | :---: | :--- | :---: |
| `GET /health` | < 50 ms | `k6 run load_test_k6.js` & `locustfile.py` | Implemented; Pending Runner |
| `POST /api/auth/register` & `login` | < 200 ms | `k6 run load_test_k6.js` (25 virtual users) | Implemented; Pending Runner |
| `GET /api/interview/history` | < 150 ms | `k6 run load_test_k6.js` | Implemented; Pending Runner |
| `POST /rag/search/role` | < 300 ms | `locustfile.py` (concurrent vector query) | Implemented; Pending Runner |
| `POST /api/interview/start` | < 1,500 ms | `k6 run load_test_k6.js` (blueprint generation) | Implemented; Pending Runner |
| `POST /api/interview/followup` | < 3,000 ms | `k6 run load_test_k6.js` (multi-turn evaluator) | Implemented; Pending Runner |
| `POST /api/auth/*` (Rate Limiting) | HTTP 429 after burst | `k6 run load_test_k6.js` (threshold checks) | Implemented; Pending Runner |

---

## 4. ChromaDB Durability & Security Audit Findings

1. **Collection Separation**:
   - Resumes, JDs, and Role KB records are strictly partitioned into `prepnova_resumes`, `prepnova_jds`, and `prepnova_role_kb`.
2. **MongoDB Durable Vectors**:
   - Pre-computed 384-d vectors are stored in MongoDB `DocumentChunk` records with compound unique index `{ userId: 1, documentType: 1, documentId: 1, chunkIndex: 1 }`.
   - Embeddings are decoupled from the parent document, avoiding MongoDB 16 MB document size limits.
3. **Idempotent Rehydration**:
   - Rehydration via `POST /api/resume/:documentId/rehydrate` and `POST /rag/rehydrate` is verified to update chunks in place without creating duplicates or requiring expensive re-embedding.
4. **Security & Ownership**:
   - Protected microservice routes require `X-AI-Service-Key`.
   - Rehydration endpoints strictly verify that the requesting authenticated user matches `document.userId`, blocking unauthorized cross-user indexing attempts with HTTP `403 Forbidden`.
