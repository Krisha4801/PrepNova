# PrepNova: Team Presentation Scripts, Viva Guide & Faculty Q&A

This document provides presentation-ready, academically rigorous speaking scripts and technical viva defense preparation for all **8 team members of PrepNova**, tailored for an MSc IT project examination.

---

## Part 1: Individual Presentation Scripts (30–60 Seconds Each)

### 1. Hardi Dhadhal — Frontend: Authentication, Dashboard & General UI
> "Good morning, respected faculty. I was responsible for the candidate authentication views, user dashboard, and global UI design system in PrepNova. On the client side, I built the responsive login and registration interfaces using React, styled with our Slate and Indigo SaaS design tokens. I integrated client-side form validation, accessible error feedback, and OAuth initiation. On the candidate dashboard, I implemented real-time metric cards that render interview readiness, average scores, and recent practice sessions by consuming our backend analytics API. I also established the global ThemeContext, allowing seamless light and dark mode toggling persisted in localStorage. My work ensures that candidates experience an intuitive, accessible, and professional workspace from their very first interaction."

### 2. Shruti Makwana — Frontend: Interview Interface & Flow
> "Respected faculty, my responsibility focused on the live interview environment and multi-step session setup flow. I implemented the interactive `InterviewPage`, which guides the candidate turn-by-turn through AI-generated questions with a live countdown timer and progress ribbon. I built the input layer supporting both written technical answers in a monospace editor and voice transcription visualizers using browser speech APIs. To make configuration straightforward, I engineered the multi-step `SessionSetup` flow, allowing users to toggle between 7 distinct context combinations—such as resume-only, JD-only, or role-based tracks. Once an interview completes, my results component displays an interactive 5-part rubric radar breakdown, highlighting specific candidate strengths and improvement areas."

### 3. Varunee Agrawal — Backend: Authentication, User Management & Document APIs
> "Respected faculty, my core assignment covered user management, authentication security, and document upload endpoints in our Express backend. I implemented password hashing using bcrypt with 10 salt rounds and stateless authorization using HS256-signed JWTs with configurable expiration. In the Mongoose `User` model, I established strict validation schemas, role guards, and profile metadata fields. For document ingestion, I created the multipart file upload routes using Multer with strict MIME-type guards that reject non-PDF submissions. When a resume or job description is uploaded, my controller buffers the file and securely forwards it to our AI microservice for parsing, ensuring that uploaded documents are automatically associated with the authenticated user ID."

### 4. Kush Dani — Backend: Interview Management, Evaluation, Reports & Persistence
> "Good morning, faculty. I was responsible for backend interview session persistence, turn advancement, and analytics aggregation in MongoDB. I engineered the `InterviewSession` schema, which durably stores the complete transcript of questions, candidate answers, rubric evaluations, and category scores across turns. In the interview controller, I implemented state transition methods for starting sessions, handling skipped questions with zero-penalty logging, and completing interviews when the question threshold is reached. Upon completion, my controller calculates weighted average scores across technical correctness, clarity, depth, and relevance to generate a persistent final report. I also built the dashboard analytics route, using Mongoose aggregations to calculate real candidate readiness metrics."

### 5. Krisha Shah — AI: Resume Processing, Document Extraction & Embeddings
> "Respected faculty, my focus was on the document ingestion, parsing, and vector embedding pipeline in our Python FastAPI service. In real-world candidate preparation, resumes arrive in varied formats. To handle this, I built a dual-tier text extraction pipeline using PyMuPDF for native digital PDFs, backed by a Tesseract OCR fallback engine that activates whenever native character density falls below 100 characters. Once cleaned, I implemented our section-aware chunker, which decomposes resumes into typed semantic entities—including education, experience, technical skills, and projects. I then embedded these chunks using Hugging Face's `BAAI/bge-small-en-v1.5` model, producing 384-dimensional normalized vectors ready for semantic retrieval."

### 6. Garv Modi — AI: Retrieval, Answer Evaluation, Scoring & Vector Database
> "Good morning, respected faculty. My role centered on the vector database architecture, user-isolated retrieval, and adaptive scoring logic. I implemented our persistent ChromaDB vector store, structuring collections with strict metadata filtering on `user_id` and `document_id` to guarantee that candidates can never retrieve another applicant's confidential resume data. I also indexed our curated Role Knowledge Base to provide grounded context for candidates practicing without a resume. For answer assessment, I defined the multi-dimensional evaluation rubric, benchmarking candidate responses across technical correctness, completeness, clarity, depth, and relevance, and calculating dynamic difficulty transitions based on performance."

### 7. Dev Patel — AI + Frontend: Question Generation & UX Integration
> "Respected faculty, my focus bridged our AI microservice and candidate frontend through LangGraph workflow orchestration and setup UX. Within our FastAPI service, I constructed the compiled LangGraph `QuestionState` graph. This graph first executes a mode validation node that deterministically identifies which of our 7 context modes is active, queries ChromaDB for relevant resume or role chunks, and passes them to our Groq-hosted LLM with strict non-repetition rules. On the frontend, I integrated this workflow into the `SessionSetup` and `ReviewInterviewPage` components, resolving context combination edge cases, ensuring resume persistence, and displaying informative loading states while the AI synthesizes grounded interview questions."

### 8. Jaimin Trivedi — AI + Backend: Microservice Orchestration, Security & E2E Verification
> "Good morning, faculty. My responsibility was the technical orchestration connecting our Express backend, FastAPI AI service, and security architecture. I engineered the centralized `AiServiceClient`, implementing resilient HTTP communication, custom timeouts, circuit-breaker fallbacks, and error sanitization. In backend security, I built our Google OAuth 2.0 PKCE and OpenID Connect engine with RS256 JWKS validation, as well as our timed 6-digit OTP password reset system with transactional Nodemailer alerts and instant multi-device token invalidation via `tokenVersion`. Finally, to guarantee production readiness, I authored our automated test suites and live E2E audit suite, verifying 119 passing tests and proving end-to-end data isolation across the entire system."

---

## Part 2: Likely Viva Questions & Answers per Team Member

### 1. Hardi Dhadhal (Frontend: Auth, Dashboard & General UI)
- **Q1: How does your frontend manage authentication state and protect private routes?**
  - *Answer:* "We wrap our application in `AuthProvider` (`frontend/src/context/AuthContext.jsx`), which stores the JWT in `localStorage` and provides user profile state. Protected routes are wrapped in a `ProtectedRoute` component in `App.jsx`. If a user attempts to access `/dashboard` or `/interview` without a valid token, the component intercepts the navigation and redirects them to `/login` with the current pathname stored in state for post-login redirect."
- **Q2: How does the application handle sudden token expiration or HTTP 401 errors?**
  - *Answer:* "Our centralized API client (`frontend/src/lib/api.js`) intercepts all responses. When an HTTP 401 Unauthorized is detected, it triggers `clearAuthSession()`, which purges the stored JWT and cached user object from `localStorage` and resets `AuthContext`, returning the user gracefully to the sign-in screen without infinite render loops."
- **Q3: What chart library did you use for dashboard metrics, and where does the data originate?**
  - *Answer:* "We use Recharts to render performance radar charts and historical score progression. The data originates from our backend endpoint `GET /api/interview/analytics`, which aggregates completed session records from MongoDB and calculates category averages."

---

### 2. Shruti Makwana (Frontend: Interview Interface & Flow)
- **Q1: How is the multi-turn interview state maintained on the client during a live session?**
  - *Answer:* "In `frontend/src/pages/InterviewPage.jsx`, the active `sessionId`, current question text, category, turn index, timer, and question history are held in React component state. When an answer is submitted, an API call is made to `POST /api/interview/followup`. The response returns the AI's rubric evaluation for the turn and the next question, which immediately updates the UI without requiring a full page refresh."
- **Q2: How does the speech-to-text feature work, and what happens if a browser does not support it?**
  - *Answer:* "We interface with the native browser Web Speech API (`webkitSpeechRecognition`). In `VoiceRecorder.jsx`, we detect whether the API is available in the user's browser. If supported, interim and final speech transcripts are streamed into the answer textarea; if unsupported, speech controls are gracefully hidden and the candidate uses the monospace text editor directly."
- **Q3: What happens on the frontend when a candidate skips a question?**
  - *Answer:* "The candidate clicks 'Skip Question', which invokes `POST /api/interview/skip`. The backend logs a zero score for that question turn, records a feedback note suggesting the candidate review the concept, and returns the next question. The UI updates the turn ribbon, resets the timer, and displays the new question."

---

### 3. Varunee Agrawal (Backend: Auth, User Management & Document APIs)
- **Q1: Why did you choose bcrypt for password hashing, and how is it configured?**
  - *Answer:* "We chose bcrypt because it incorporates a cryptographic salt and configurable work factor to prevent rainbow table attacks. In `backend/src/services/auth.service.js`, we use 10 salt rounds (`bcrypt.genSalt(10)`), which offers an optimal balance between server hashing security and sub-100ms response latency."
- **Q2: How do your document upload endpoints protect against malicious or invalid files?**
  - *Answer:* "In `backend/src/middleware/upload.middleware.js`, we configure Multer with memory storage, strict file size limits (10MB), and a fileFilter function that inspects the file's MIME type (`application/pdf`) and file extension. Non-PDF files are rejected with HTTP 400 before reaching disk or microservice buffers."
- **Q3: How does your backend ensure user data isolation on document endpoints?**
  - *Answer:* "Every request passes through `authenticateToken` middleware, which attaches the verified `req.user.id`. In `resume.controller.js` and `jd.controller.js`, queries always include `{ _id: documentId, userId: req.user.id }`. If another authenticated user attempts to access or delete that document, the query returns null or HTTP 403 Forbidden."

---

### 4. Kush Dani (Backend: Interview Management, Evaluation & Persistence)
- **Q1: How does your Mongoose schema represent an entire interview session?**
  - *Answer:* "Our `InterviewSession` model (`backend/src/models/InterviewSession.js`) contains top-level metadata: `sessionId`, `userId`, `role`, `difficulty`, `mode`, `status` ('in_progress', 'completed', 'abandoned'), an array of `questions`, an array of `answers`, an array of `evaluations` (storing 5-part rubric scores, feedback, strengths, and missed concepts), and an embedded `finalReport` object containing the overall score and category breakdowns."
- **Q2: How does the backend calculate the final interview report when a session ends?**
  - *Answer:* "In `backend/src/controllers/interview.controller.js`, the `buildFinalFeedback()` function iterates over all turn evaluations in the session. It computes arithmetic averages for correctness, clarity, depth, relevance, and completeness, derives an overall rating label (such as 'Interview Ready' or 'Needs targeted practice'), aggregates top recurring strengths and weaknesses, and saves the final report directly to MongoDB."
- **Q3: How do you prevent an attacker from tampering with another user's active session?**
  - *Answer:* "In every session operation (`/followup`, `/skip`, `/end`, `/:sessionId/report`), the controller loads the session and verifies `session.userId.toString() === req.user.id.toString()`. If they do not match, the request is immediately rejected with HTTP 403 Forbidden, as verified in our automated integration tests."

---

### 5. Krisha Shah (AI: Resume Processing, Extraction & Embeddings)
- **Q1: Why did you implement both PyMuPDF and Tesseract OCR instead of using a single tool?**
  - *Answer:* "PyMuPDF (`fitz`) is extremely fast and accurate for digital PDFs containing embedded text streams. However, candidates frequently upload scanned PDF resumes or exported graphic files that contain raster images without selectable text. Our heuristic function `has_meaningful_text` checks if PyMuPDF extracted at least 100 alphanumeric characters; if not, it automatically routes the document to Tesseract OCR (`pytesseract`), ensuring no candidate resume fails silently."
- **Q2: How does your section-aware chunker differ from generic recursive character splitting?**
  - *Answer:* "Generic character chunkers split text at arbitrary character or newline counts, which frequently slices an education degree away from the university name or breaks a project's technical description in half. In `AIService/app/services/processing/chunker.py`, our chunker is semantic and section-aware: it maps structured Pydantic objects (`Education`, `Experience`, `Skills`, `Projects`) into discrete `InterviewDocument` instances with dedicated metadata tags (`section: 'skills'`, `section: 'experience'`), preserving conceptual integrity during retrieval."
- **Q3: What embedding model do you use, and why was it chosen?**
  - *Answer:* "We use `BAAI/bge-small-en-v1.5` from Hugging Face. It outputs 384-dimensional dense vectors and ranks among the highest-performing lightweight open-source embedding models on the MTEB benchmark. It runs efficiently on CPU without GPU overhead and produces normalized embeddings for cosine similarity search."

---

### 6. Garv Modi (AI: Retrieval, Vector DB & Adaptive Scoring)
- **Q1: How does ChromaDB guarantee data privacy between different candidates?**
  - *Answer:* "In `AIService/app/services/vectorstore/chroma_store.py`, every document chunk is upserted with metadata fields `scope: 'user'`, `user_id: <userId>`, and `document_id: <docId>`. When querying via `store.search()`, ChromaDB applies a mandatory `$and` where clause matching `user_id == req_user_id`. Even though chunks reside in the same persistent collection, vector search results are cryptographically isolated to the requesting user."
- **Q2: What are the 5 parts of the answer evaluation rubric, and how are they scored?**
  - *Answer:* "The rubric assesses: (1) Relevance (does the answer address the specific prompt?), (2) Technical Correctness (are algorithms, mechanisms, and syntax accurate?), (3) Completeness (were all constraints and components covered?), (4) Clarity (is the explanation well-structured?), and (5) Depth (did the candidate demonstrate trade-offs and edge cases?). Each category is rated on a 0–10 scale, and the overall score is computed as a weighted aggregate."
- **Q3: How does the adaptive difficulty transition work?**
  - *Answer:* "In `AIService/app/services/interview/graph.py`, `calculate_next_difficulty()` inspects the turn score. If the candidate achieves a score $\ge 8.0$, difficulty advances from beginner to intermediate, or intermediate to advanced. If the score falls $\le 4.5$, difficulty drops to reinforce fundamentals. Scores between $4.6$ and $7.9$ maintain the current tier."

---

### 7. Dev Patel (AI + Frontend: Question Generation & UX Integration)
- **Q1: How is the LangGraph Question Generation workflow structured?**
  - *Answer:* "Our question generation workflow is a compiled LangGraph `StateGraph(QuestionState)` with three sequential nodes: `validate_mode` -> `retrieve_context` -> `generate_question`. `validate_mode` evaluates the input context to determine which of the 7 combinations is active; `retrieve_context` queries ChromaDB for relevant resume, JD, or role knowledge chunks; and `generate_question` constructs the prompt for our Groq LLM, enforcing non-repetition by passing all previously asked questions."
- **Q2: What are the 7 interview context modes, and why are they necessary?**
  - *Answer:* "The 7 modes are: (1) `resume_jd_role`, (2) `resume_jd`, (3) `resume_role`, (4) `resume_only`, (5) `role_jd`, (6) `jd_only`, and (7) `role_only`. They are necessary because candidates have different preparation goals: some want to test their resume against a specific job posting, while others have no resume ready and want to practice general technical concepts for a target role like 'Backend Engineer'."
- **Q3: How does your system prevent the LLM from asking the same question twice in a session?**
  - *Answer:* "In `QuestionState`, we track `history` and `asked_question_ids`. When `generate_question_node` invokes ChatGroq, it injects a formatted list of all previously asked questions into the prompt alongside an explicit system constraint: *'Questions ALREADY asked in this session (NEVER repeat or closely rephrase any of these)'*. In addition, the retrieval query dynamically cycles through different technical themes per turn (architecture, debugging, production workflows, scalability) to retrieve diverse grounding chunks."

---

### 8. Jaimin Trivedi (AI + Backend: AI Service & Orchestration)
- **Q1: How does the Node.js Express backend communicate with the Python FastAPI microservice?**
  - *Answer:* "We created `AiServiceClient` (`backend/src/services/aiService.client.js`), a centralized Axios client. It encapsulates service discovery via `AI_SERVICE_URL`, configurable timeout handling (`AI_SERVICE_TIMEOUT_MS=30000`), native multipart FormData streaming for PDF buffers, and sanitized error normalization. If the AI microservice is down, it returns a clean HTTP 503 `AI_SERVICE_UNAVAILABLE` error instead of exposing raw Python stack traces to the candidate."
- **Q2: Explain the security architecture of your Google OAuth 2.0 implementation.**
  - *Answer:* "We implemented Google OAuth 2.0 with mandatory PKCE (`S256`) and OpenID Connect Nonce verification. The backend generates a cryptographically random `code_verifier`, hashes it with SHA-256 to create the `code_challenge`, and creates high-entropy state and nonce tokens. Upon callback, the backend validates state, exchanges the code, verifies the Google ID token's RS256 signature against Google's public JWKS certificates (`googleapis.com/oauth2/v3/certs`), links the user to MongoDB, and issues a short-lived, single-use ticket (`pnt_...`, 60s TTL) for the frontend to exchange via POST."
- **Q3: How does your password reset flow prevent user enumeration and session hijacking?**
  - *Answer:* "For user enumeration, `POST /api/auth/forgot-password` returns an identical HTTP 200 generic success message regardless of whether the email exists. The OTP is generated with `crypto.randomInt`, hashed with SHA-256, and verified using timing-safe comparisons with a 10-minute TTL and max 5 failed attempts. When the password is reset, `user.tokenVersion` is incremented in MongoDB, which immediately invalidates all existing JWT access tokens across all active candidate devices."

---

## Part 3: Five Key Faculty Questions for the Entire Team

### Q1: What makes PrepNova an 'agentic' RAG system rather than a standard LLM wrapper?
> **Team Answer:** "A simple LLM wrapper takes a single prompt and returns a completion without validation, grounding, or state transitions. PrepNova implements an agentic architecture using LangGraph StateGraphs. Our workflow dynamically inspects available state, validates one of 7 context combinations, selectively routes retrieval queries across isolated ChromaDB vectors (resume chunks, job description requirements, or role knowledge bases), evaluates retrieved relevance, and dynamically alters difficulty across multi-turn sessions based on a deterministic 5-part rubric judge. The system persists state, detects duplicates, and executes deterministic fallbacks if external LLMs are unavailable."

### Q2: How do you handle cross-tenant data privacy and security when multiple candidates upload resumes?
> **Team Answer:** "We enforce security at three distinct architectural boundaries:
> 1. **Transport & Auth:** All API endpoints require valid HS256 JWTs with database-backed existence checks on `User.findById(userId)`.
> 2. **Backend Controller Layer:** All document queries enforce `{ _id: docId, userId: req.user.id }`. An authenticated candidate attempting to fetch another user's resume receives an immediate HTTP 403 Forbidden.
> 3. **ChromaDB Vector Store:** All chunk embeddings are tagged with metadata `scope: 'user'` and `user_id: <userId>`. All vector similarity searches strictly execute with a mandatory where clause filter `user_id == req.user.id`, mathematically preventing cross-tenant chunk leakage."

### Q3: What happens if the Groq LLM API fails, times out, or hits rate limits during a live interview?
> **Team Answer:** "The system is engineered with dual-layer fallback resilience. If Groq API calls fail within the AI microservice, LangGraph catches the exception and returns a pre-calibrated role question from our diverse fallback bank (`source: 'fallback_diverse'`). If the entire Python microservice is offline, the Express backend's `AiServiceClient` catches the network error, falls back to `backend/src/services/llm.service.js` and `questionBank.service.js`, and serves rubric-backed questions locally. The interview session is never terminated abruptly."

### Q4: How does the system transition from an active interview into the post-interview analytics?
> **Team Answer:** "When a candidate answers the final question (default `maxQuestions: 6`), `interview.controller.js` triggers `buildFinalFeedback()`. This function aggregates all turn evaluations, calculates arithmetic means for each of the 5 rubric categories, assigns an overall qualitative readiness label, compiles top strengths and improvement areas, marks `status: 'completed'`, and writes a durable `finalReport` sub-document into MongoDB. When the candidate opens the dashboard or history, Mongoose aggregation pipelines calculate average scores, completion counts, and historical skill rings directly from these durable records."

### Q5: How did you test and verify that your system works end-to-end?
> **Team Answer:** "We built a multi-tier automated testing pyramid consisting of 119 tests across 14 test suites, achieving a 100% pass rate. This includes 9 unit test suites verifying token generation, bcrypt hashing, OTP mathematics, and input validators; 5 integration suites testing full MongoDB workflows for authentication, Google OAuth PKCE, password reset, interview turn lifecycles, and FastAPI AI document indexing; and a 346-line live end-to-end audit script (`live_e2e_audit.js`) that simulates candidate registration, PDF resume extraction, Plaintext JD parsing, multi-turn interview execution, answer evaluation, question skipping, attacker session tampering, and PDF report generation against running servers."

---

## Part 4: Three Challenging Architecture Questions (For High Marks)

### Architecture Question 1: "Why did you implement a separate Python FastAPI service for AI rather than running everything directly in Node.js?"
> **Technical Answer:**
> "We decoupled the AI service into Python FastAPI for three architectural reasons:
> 1. **Ecosystem & Library Maturity:** The open-source AI and RAG ecosystem—specifically LangGraph state machines, ChromaDB persistent client, PyMuPDF, and Hugging Face embedding pipelines—is natively maintained and optimized in Python. Node.js ports of vector databases and document chunkers are often secondary wrappers with limited feature parity.
> 2. **Resource Isolation & Scalability:** Ingesting multi-page PDFs, running OCR rendering, and calculating 384-dimensional dense embeddings are CPU-intensive operations. Running them in the same event loop as our Node.js HTTP server would block Express from serving lightweight REST requests. Decoupling allows independent horizontal scaling and worker process management.
> 3. **Clean Separation of Concerns:** Node.js Express acts as our transactional gateway (handling OAuth, JWT authentication, user persistence, billing, and candidate history in MongoDB), while FastAPI acts as a specialized compute microservice (handling document extraction, embedding generation, and LLM state orchestration)."

### Architecture Question 2: "In your RAG pipeline, why do you retrieve chunks per question turn instead of stuffing the entire resume into the system prompt once at session start?"
> **Technical Answer:**
> "While modern LLMs support large context windows, 'context stuffing' introduces three severe problems:
> 1. **Prompt Fatigue & Hallucination ('Lost in the Middle'):** When an entire multi-page resume and long job description are passed on every turn, LLMs tend to fixate on the top or bottom of the prompt, ignoring specific middle sections or generating repetitive questions about the candidate's first job.
> 2. **Token Latency and Inference Costs:** Re-transmitting full 4,000-token resumes across every question turn increases response latency and consumes unnecessary token budgets on cloud inference providers like Groq.
> 3. **Turn-Specific Semantic Steering:** By chunking documents and using vector similarity search with dynamic turn themes (such as architecture, debugging, production deployment, and scalability), each interview turn retrieves only the 3–4 chunks most relevant to that turn's conceptual focus. This produces realistic, focused interview questions that probe specific achievements and technologies."

### Architecture Question 3: "How does your system solve the 'cold-start' problem when a candidate wants to interview for a role but does not have an uploaded resume or job description?"
> **Technical Answer:**
> "We solved this by designing our 7-mode Context Validator in `AIService/app/services/interview/graph.py`. When a candidate provides only a role (e.g., 'Backend Engineer') without a resume or JD, the validator assigns `mode: 'role'`. The retrieval node dynamically redirects the vector search away from the empty user collection to our pre-indexed `role_knowledge` collections in ChromaDB. These collections contain curated markdown documents covering core API design, database indexing, system scalability, and testing standards for that specific profession. As a result, the candidate receives grounded technical questions without the system throwing a null reference error or falling back to generic conversational trivia."

---

## Part 5: One-Page Team Contribution Summary

```text
====================================================================================================
                        PREPNOVA — 8-MEMBER TECHNICAL RESPONSIBILITY BREAKDOWN
====================================================================================================

[FRONTEND WORKSTREAM]
1. Hardi Dhadhal   (Frontend 1): Candidate Auth UI (Login/Register), ThemeContext (Dark/Light),
                                  Dashboard Layout, Metric & Readiness Cards.
2. Shruti Makwana  (Frontend 2): Live Interview Workspace, Timer Ribbon, Text Editor & Speech
                                  Visualizer, SessionSetup Wizard, Scorecard Results View.

[BACKEND WORKSTREAM]
3. Varunee Agrawal (Backend 1) : User Management, Bcrypt Password Hashing, JWT Authentication,
                                  Input Validation, Multer PDF Upload Handlers & Guards.
4. Kush Dani       (Backend 2) : InterviewSession Mongoose Model, Session Persistence, Turn Advancement,
                                  Question Skipping, Aggregated Reports & Dashboard Analytics.

[AI & RAG WORKSTREAM]
5. Krisha Shah     (AI 1)      : Dual-tier PDF Extraction (PyMuPDF + Tesseract OCR Fallback),
                                  Section-Aware Chunker, HuggingFace BAAI/bge-small-en-v1.5 Embeddings.
6. Garv Modi       (AI 2)      : ChromaDB Vector Storage, User & Role Metadata Isolation,
                                  Cosine Similarity Retrieval, 5-Part Evaluation Rubric, Difficulty Logic.

[CROSS-FUNCTIONAL INTEGRATION WORKSTREAM]
7. Dev Patel       (AI + FE)   : LangGraph Question Generation Graph, 7-Mode Context Validator,
                                  Non-Repetition Engine, JD Extraction, Frontend Setup UX Integration.
8. Jaimin Trivedi  (AI + BE)   : Microservice Orchestration (AiServiceClient), Google OAuth 2.0 PKCE,
                                  OTP Password Reset Flow, Nodemailer Service, 119 Automated Tests & E2E.
====================================================================================================
```

---

## Part 6: Claims That Should NOT Be Made in the Presentation

To maintain absolute academic integrity, the team should avoid making these unsupported claims during the defense:

1. **DO NOT claim that audio processing or voice evaluation is performed on the server.**
   - *Reality:* The voice feature in `VoiceRecorder.jsx` uses browser-based Web Speech API (`webkitSpeechRecognition`) to convert spoken words into text in the browser. The backend and AI microservice receive and evaluate text transcripts; there is no Whisper or server-side speech-to-text pipeline running in Node or Python.
2. **DO NOT claim that the 14-week project plan is 100% completed.**
   - *Reality:* Phase 1 through Phase 4 (Core MVP, RAG foundation, LangGraph workflows, authentication, analytics, and testing) are complete. Weeks 9–14 features—such as automated CI/CD deployment pipelines, cloud vector hosting on Pinecone, and multi-tenant billing—remain planned extended roadmap items.
3. **DO NOT claim that every team member made equal Git commits under their personal name.**
   - *Reality:* Git history shows commits authored primarily by four accounts (`Varunee`, `devpatel`, `Jaimin Trivedi`, and `Krisha`). The team must explain honestly that code was shared and committed via team workstations, and reference university status report documentation (`docs/7_PrepNova_BiWeekly_Status_Report_2_Code.tex`) to confirm individual task allocation.
4. **DO NOT claim that Pinecone or OpenAI cloud APIs are active in production.**
   - *Reality:* The codebase is configured to run fully on local/open-source components: local ChromaDB for vector storage, Hugging Face `bge-small-en-v1.5` on CPU for embeddings, and Groq cloud API (`llama-3.3-70b-versatile` / `gpt-oss-120b`) for LLM inference.
5. **DO NOT claim that ATS resume scoring performs deep ML parsing of employer ATS formats.**
   - *Reality:* The ATS Resume Analysis page evaluates keyword match density, structural section presence, and extracted profile fields using structured LLM schemas; it is an ATS-lite estimator, not a proprietary enterprise parser like Workday or Taleo.
