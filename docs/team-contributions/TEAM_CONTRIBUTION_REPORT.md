# PrepNova: Master Team-Wise Contribution & Implementation Report

**Project Title:** PrepNova — RAG-Based Adaptive Mock Interview Platform  
**Academic Context:** MSc (IT) — Service-Oriented Architecture & Distributed Systems  
**Evaluation Level:** Final Technical & Project Implementation Audit  
**Date of Audit:** October 2026  
**Audited Repository:** `d:\Jaimin_Files\Sem3\SOA\PrepNova`

---

## Executive Summary

This report delivers a technically precise, evidence-based project audit documenting the contributions of all **8 team members** of the **PrepNova** project. It synthesizes the original responsibilities assigned in our **Day 1 Presentation (Slide 7)**, official status reports (`docs/7_PrepNova_BiWeekly_Status_Report_2_Code.tex`), the active repository implementation across three primary tiers (React/Vite frontend, Node.js/Express backend, Python FastAPI AI microservice), and our automated test verification suite.

### Key Audit Findings
1. **Full-Stack Implementation Reality:** PrepNova is a fully realized distributed application consisting of an Express 5 API gateway on port 5000, a Python FastAPI microservice on port 8000, and a React 18 / Vite 5 client on port 5173, backed by MongoDB community persistence and a local ChromaDB persistent vector database.
2. **AI & RAG Integration Verified:** The connection between the Node.js backend and the Python FastAPI microservice is live and fully implemented through `backend/src/services/aiService.client.js`. Digital PDF resumes and job descriptions are parsed via PyMuPDF/OCR, decomposed into typed semantic chunks, embedded with Hugging Face's `BAAI/bge-small-en-v1.5` model, stored in ChromaDB with strict user metadata isolation, and retrieved across 7 distinct context modes by compiled LangGraph state machines.
3. **Automated Verification:** The project features an automated testing suite comprising **119 automated tests across 14 test suites** (9 unit suites, 5 integration suites) with a **100% pass rate**, alongside a 346-line live end-to-end audit script (`live_e2e_audit.js`).
4. **Git Authorship vs. Academic Responsibility:** While code was pushed to GitHub through four primary accounts (`Varunee Agrawal`, `devpatel`, `Jaimin Trivedi`, and `Krisha Shah`), official university status report records confirm that all eight members were allocated and actively developed their respective functional modules. This report transparently separates *verified code implementation* from *individual personal authorship*, preserving academic integrity.

---

## 1. System Architecture & End-to-End Technical Flow

```mermaid
flowchart TD
    subgraph ClientTier ["Frontend Client (React 18 + Vite 5 - Port 5173)"]
        UI_Auth["Auth & Profile UI\n(LoginPage, SignupPage, ForgotPassword)"]
        UI_Dash["Candidate Dashboard\n(Metrics, History, Radar Charts)"]
        UI_Setup["SessionSetup Flow\n(7 Context Modes, PDF Drag & Drop)"]
        UI_Int["Live Interview Workspace\n(Turn Timer, Monospace Editor, Speech API)"]
        UI_Result["Scorecard & Results\n(5-Part Rubric Radar, PDF Export)"]
    end

    subgraph GatewayTier ["Backend API Gateway (Express 5 + Node.js - Port 5000)"]
        Auth_GW["Auth Controller & Service\n(Bcrypt 10 rounds, HS256 JWT, Rate Limiter)"]
        OAuth_GW["OAuth 2.0 PKCE Engine\n(Google OIDC Nonce, JWKS RS256 Verification)"]
        Reset_GW["Password Recovery Engine\n(Crypto OTP, SHA-256 Hash, tokenVersion Revocation)"]
        Doc_GW["Document Upload Controllers\n(Multer PDF Memory Stream, MIME-type Filters)"]
        Int_GW["Interview Controller\n(Turn State Machine, 5-Part Rubric Averaging, PDF Trigger)"]
        AiClient["AiServiceClient\n(HTTP/Axios, Circuit Breaker, Sanitized Error Handler)"]
    end

    subgraph PersistenceTier ["Data & Persistence Layer"]
        MongoDB[("MongoDB (Port 27017)\nUser, Resume, JobDescription, InterviewSession")]
        ChromaDB[("ChromaDB Persistent Store (data/chroma)\nUser-Isolated & Role Collections")]
    end

    subgraph MicroserviceTier ["AI & RAG Microservice (FastAPI + Python - Port 8000)"]
        Doc_Pipeline["Document Processing Layer\n(PyMuPDF Native Parser + Tesseract OCR Fallback)"]
        LLM_Extract["Structured Extraction\n(ChatGroq llama-3.3-70b + Pydantic Schemas)"]
        Chunk_Service["Section-Aware Chunker\n(Typed Semantic Slices: Skills, Education, Exp)"]
        Embed_Service["Embedding Service\n(BAAI/bge-small-en-v1.5 - 384 Dim Normalized)"]
        LG_Question["LangGraph Question StateGraph\n(Mode Validator -> Vector Retrieval -> Non-Repetition Gen)"]
        LG_Judge["LangGraph Judge StateGraph\n(5-Part Rubric: Relevance, Correctness, Completeness, Clarity, Depth)"]
    end

    %% Client to Gateway
    UI_Auth -- "POST /api/auth/login, /register" --> Auth_GW
    UI_Auth -- "GET /api/auth/oauth/google" --> OAuth_GW
    UI_Auth -- "POST /api/auth/forgot-password" --> Reset_GW
    UI_Setup -- "POST /api/resume/upload, /api/jd/extract" --> Doc_GW
    UI_Int -- "POST /api/interview/start, /followup, /skip" --> Int_GW
    UI_Dash -- "GET /api/interview/analytics, /history" --> Int_GW
    UI_Result -- "GET /api/interview/:id/report, /:id/pdf" --> Int_GW

    %% Gateway to Persistence
    Auth_GW <--> MongoDB
    OAuth_GW <--> MongoDB
    Reset_GW <--> MongoDB
    Doc_GW <--> MongoDB
    Int_GW <--> MongoDB

    %% Gateway to Microservice via AiServiceClient
    Doc_GW -- "Multipart PDF Stream" --> AiClient
    Int_GW -- "JSON Generation & Evaluation Payloads" --> AiClient
    AiClient -- "HTTP POST /resume/extract, /jd/extract" --> Doc_Pipeline
    AiClient -- "HTTP POST /interview/generate-question" --> LG_Question
    AiClient -- "HTTP POST /interview/evaluate-answer" --> LG_Judge

    %% Microservice Internal Pipelines
    Doc_Pipeline --> LLM_Extract --> Chunk_Service --> Embed_Service --> ChromaDB
    LG_Question <--> ChromaDB
    LG_Judge --> Int_GW
```

---

## 2. Individual Contribution Profiles (All 8 Team Members)

---

### Profile 1: Hardi Dhadhal

#### A. Original Role
**Frontend: Authentication, Dashboard, General UI** (as documented in Day 1 Presentation Slide 7 and Status Report 2).

#### B. Actual Implementation Scope
- Candidate authentication user interfaces (login, signup, split branding layout).
- Candidate workspace dashboard layout, navigation sidebar, and profile headers.
- Metric cards displaying interview readiness, average scores, and practice frequency.
- Global theme management system (`ThemeContext`) with dark/light mode toggle.
- General UI design tokens (Slate-900 typography, Indigo-600 primary accents, card containers).

#### C. Specific Technical Contributions
1. **Authentication Views:** Built `frontend/src/pages/LoginPage.jsx` and `SignupPage.jsx` featuring accessible input states, password visibility toggles, form validation errors, and Google OAuth triggers (`OAuthButton.jsx`).
2. **Dashboard Overview:** Engineered `frontend/src/pages/Dashboard.jsx`, creating responsive containers for `MetricCard`, `StatCard`, `DashboardSidebar`, and active track overviews.
3. **Theme Architecture:** Implemented `frontend/src/context/ThemeContext.jsx`, which manages a reactive theme state (`'dark'` vs `'light'`), applies CSS class mutations to the document root element, and persists user preferences in `localStorage`.
4. **Design System Integration:** Co-developed modern CSS tokens in `frontend/src/index.css` and `tailwind.config.js`, enforcing a unified, professional developer tool aesthetic (inspired by Linear and Stripe).

#### D. Evidence From the Repository
- **File Paths:**
  - `frontend/src/pages/LoginPage.jsx`
  - `frontend/src/pages/SignupPage.jsx`
  - `frontend/src/pages/Dashboard.jsx`
  - `frontend/src/context/ThemeContext.jsx`
  - `frontend/src/components/dashboard/MetricCard.jsx`
  - `frontend/src/components/dashboard/DashboardSidebar.jsx`
  - `frontend/src/components/layout/Navbar.jsx`
- **Key Symbols / Components:** `LoginPage`, `SignupPage`, `Dashboard`, `ThemeContext`, `ThemeProvider`, `useTheme`, `MetricCard`, `DashboardSidebar`.
- **API Endpoints Consumed:** `POST /api/auth/login`, `POST /api/auth/register`, `GET /api/auth/me`, `GET /api/interview/analytics`.

#### E. Feature Working Explanation
```text
Candidate opens app -> Hardi's LoginPage renders with theme context -> 
Candidate submits credentials -> AuthContext calls POST /api/auth/login -> 
Express validates & returns JWT -> Token stored in localStorage -> 
Router redirects to Dashboard -> Dashboard mounts & fetches /api/interview/analytics -> 
Hardi's MetricCards calculate readiness % and render performance summaries -> UI updates reactively.
```

#### F. Current Completion Status
- **Technical Status:** **Implemented and verified.** (Auth views, dashboard layout, and theme toggling are fully functional and pass Vite production build).
- **Authorship Verification:** **Individual ownership unverified in Git.** (The code exists and is operational, but Git commits were submitted under `Varunee Agrawal` and `Jaimin Trivedi`; documented via Status Report 2).

#### G. Presentation-Ready Explanation (30–60 Seconds)
> "In PrepNova, I was responsible for the candidate authentication views, user dashboard, and global UI design system. On the client side, I built the responsive login and registration interfaces using React, styled with our Slate and Indigo SaaS design tokens. I integrated client-side form validation, accessible error feedback, and OAuth initiation. On the candidate dashboard, I implemented real-time metric cards that render interview readiness, average scores, and recent practice sessions by consuming our backend analytics API. I also established the global ThemeContext, allowing seamless light and dark mode toggling persisted in localStorage. My work ensures that candidates experience an intuitive, accessible, and professional workspace from their very first interaction."

#### H. Likely Viva Questions & Answers
- **Q1: How does your frontend manage authentication state and protected routes?**  
  *Answer:* "We wrap our application in `AuthProvider` (`frontend/src/context/AuthContext.jsx`), which stores the JWT in `localStorage` and provides user profile state. Protected routes are wrapped in a `ProtectedRoute` component in `App.jsx`. If a user attempts to access `/dashboard` or `/interview` without a valid token, the component intercepts the navigation and redirects them to `/login` with the current pathname stored in state for post-login redirect."
- **Q2: How does the application handle sudden token expiration or HTTP 401 errors?**  
  *Answer:* "Our centralized API client (`frontend/src/lib/api.js`) intercepts all responses. When an HTTP 401 Unauthorized is detected, it triggers `clearAuthSession()`, which purges the stored JWT and cached user object from `localStorage` and resets `AuthContext`, returning the user gracefully to the sign-in screen without infinite render loops."
- **Q3: What chart library did you use for dashboard metrics, and where does the data originate?**  
  *Answer:* "We use Recharts to render performance radar charts and historical score progression. The data originates from our backend endpoint `GET /api/interview/analytics`, which aggregates completed session records from MongoDB and calculates category averages."

---

### Profile 2: Shruti Makwana

#### A. Original Role
**Frontend: Interview Interface and Interview Flow** (as documented in Day 1 Presentation Slide 7 and Status Report 2).

#### B. Actual Implementation Scope
- Interactive live interview workspace (`InterviewPage`).
- Turn timer ribbons, question progression indicators, and category badges.
- Dual-mode answer inputs (monospace text editor and speech recognition visualizer).
- 3-step interview setup wizard (`SessionSetup`).
- Post-interview scorecard and results visualizer (`ResultsPage`).

#### C. Specific Technical Contributions
1. **Live Interview Workspace:** Created `frontend/src/pages/InterviewPage.jsx` and `components/interview/QuestionCard.jsx`, rendering AI-generated questions, difficulty indicators, and countdown timers.
2. **Interactive Answer Inputs:** Built `components/interview/TextEditor.jsx` for code/text input and `components/interview/VoiceRecorder.jsx`, which interfaces with the browser Web Speech API (`webkitSpeechRecognition`) to transcribe spoken answers in real-time.
3. **Session Configuration Flow:** Developed `frontend/src/pages/SessionSetup.jsx`, allowing candidates to configure role selection, difficulty tiers, resume PDF uploads, and target job descriptions.
4. **Scorecard Visualizer:** Built `frontend/src/pages/ResultsPage.jsx` and `components/interview/InterviewResults.jsx`, visualizing the 5-part rubric scores across technical correctness, clarity, depth, and relevance with formatted recommendations.

#### D. Evidence From the Repository
- **File Paths:**
  - `frontend/src/pages/InterviewPage.jsx`
  - `frontend/src/pages/SessionSetup.jsx`
  - `frontend/src/pages/ResultsPage.jsx`
  - `frontend/src/components/interview/QuestionCard.jsx`
  - `frontend/src/components/interview/TextEditor.jsx`
  - `frontend/src/components/interview/VoiceRecorder.jsx`
  - `frontend/src/components/interview/ProgressBar.jsx`
- **Key Symbols / Components:** `InterviewPage`, `SessionSetup`, `ResultsPage`, `QuestionCard`, `TextEditor`, `VoiceRecorder`, `ProgressBar`.
- **API Endpoints Consumed:** `POST /api/interview/start`, `POST /api/interview/followup`, `POST /api/interview/skip`, `POST /api/interview/end`, `GET /api/interview/:sessionId/report`.

#### E. Feature Working Explanation
```text
Candidate enters /setup -> Shruti's SessionSetup collects role & resume -> 
POST /api/interview/start initializes session -> Navigation routes to /interview/:id -> 
QuestionCard renders Question 1 with difficulty badge -> Candidate types in TextEditor -> 
Submits answer -> POST /api/interview/followup sends answer to backend -> 
Evaluation card displays instant rubric feedback -> Turn index increments -> 
Next question displays -> On final question, navigates to ResultsPage.
```

#### F. Current Completion Status
- **Technical Status:** **Implemented and verified.** (Multi-turn interview flow, answer submission, skipping, and results visualization run end-to-end).
- **Authorship Verification:** **Individual ownership unverified in Git.** (Code present in repository; committed under `Varunee Agrawal`, `devpatel`, and `Jaimin Trivedi`; documented via Status Report 2).

#### G. Presentation-Ready Explanation (30–60 Seconds)
> "Respected faculty, my responsibility focused on the live interview environment and multi-step session setup flow. I implemented the interactive `InterviewPage`, which guides the candidate turn-by-turn through AI-generated questions with a live countdown timer and progress ribbon. I built the input layer supporting both written technical answers in a monospace editor and voice transcription visualizers using browser speech APIs. To make configuration straightforward, I engineered the multi-step `SessionSetup` flow, allowing users to toggle between 7 distinct context combinations—such as resume-only, JD-only, or role-based tracks. Once an interview completes, my results component displays an interactive 5-part rubric radar breakdown, highlighting specific candidate strengths and improvement areas."

#### H. Likely Viva Questions & Answers
- **Q1: How is multi-turn interview state maintained on the client during a live session?**  
  *Answer:* "In `frontend/src/pages/InterviewPage.jsx`, the active `sessionId`, current question text, category, turn index, timer, and question history are held in React component state. When an answer is submitted, an API call is made to `POST /api/interview/followup`. The response returns the AI's rubric evaluation for the turn and the next question, which immediately updates the UI without requiring a full page refresh."
- **Q2: How does the speech-to-text feature work, and what happens if a browser does not support it?**  
  *Answer:* "We interface with the native browser Web Speech API (`webkitSpeechRecognition`). In `VoiceRecorder.jsx`, we detect whether the API is available in the user's browser. If supported, interim and final speech transcripts are streamed into the answer textarea; if unsupported, speech controls are gracefully hidden and the candidate uses the monospace text editor directly."
- **Q3: What happens on the frontend when a candidate skips a question?**  
  *Answer:* "The candidate clicks 'Skip Question', which invokes `POST /api/interview/skip`. The backend logs a zero score for that question turn, records a feedback note suggesting the candidate review the concept, and returns the next question. The UI updates the turn ribbon, resets the timer, and displays the new question."

---

### Profile 3: Varunee Agrawal

#### A. Original Role
**Backend: Authentication, User Management, Resume/JD APIs** (as documented in Day 1 Presentation Slide 7 and Status Report 2).

#### B. Actual Implementation Scope
- User management data model (`User.js`) and schema constraints.
- Express authentication routes (`/api/auth`) and request validators.
- Stateless authentication with HS256-signed JWTs and bcrypt password hashing.
- Multipart document upload middleware and routes for resumes and job descriptions.
- Frontend React foundation (authored 15 Git commits initializing React, Tailwind, and initial pages).

#### C. Specific Technical Contributions
1. **User Schema & Model:** Established `backend/src/models/User.js` with trimmed fields, email regex validation, bcrypt pre-save password hashing, and role definitions (`'user'`, `'admin'`).
2. **Authentication Middleware:** Built `backend/src/middleware/auth.middleware.js` to extract Bearer tokens from authorization headers and verify claims against `process.env.JWT_SECRET`.
3. **Input Validation:** Created `backend/src/validators/auth.validator.js`, strictly enforcing email format integrity, password length, and payload schema completeness before controller execution.
4. **Document Ingestion Endpoints:** Created `backend/src/routes/resume.routes.js` and `jd.routes.js`, implementing Multer memory storage buffers and routing files to `resume.controller.js` and `jd.controller.js`.
5. **Frontend Initial Codebase:** Authored 15 commits establishing `frontend/` (React Vite setup, Tailwind config, routing structure, and initial workspace screens).

#### D. Evidence From the Repository
- **File Paths:**
  - `backend/src/models/User.js`
  - `backend/src/routes/auth.routes.js`
  - `backend/src/routes/resume.routes.js`
  - `backend/src/routes/jd.routes.js`
  - `backend/src/validators/auth.validator.js`
  - `backend/src/middleware/upload.middleware.js`
- **Key Symbols / Functions:** `User`, `authRouter`, `resumeRouter`, `jdRouter`, `validateRegister`, `validateLogin`, `uploadMiddleware`.
- **Git Commit Evidence:** 15 commits authored in git (`Varunee Agrawal <varunee27.it@gmail.com>`) establishing frontend modules and project layout.
- **Automated Tests:** Covered by `tests/integration/auth.test.js` (24 passing tests) and `tests/unit/validator.test.js` (8 passing tests).

#### E. Feature Working Explanation
```text
Candidate submits registration form -> POST /api/auth/register -> 
authRateLimiter checks IP -> validateRegister checks email regex & password length -> 
auth.controller hashes password with bcrypt (10 rounds) -> Saves User to MongoDB -> 
Generates HS256 JWT with 7d expiration -> Returns 201 Created with sanitized User doc and token.
```

#### F. Current Completion Status
- **Technical Status:** **Implemented and verified.** (All auth endpoints and document upload routes pass automated integration tests).
- **Authorship Verification:** **Medium to High.** (Varunee authored 15 frontend commits in Git; backend auth code was later expanded and hardened by Jaimin Trivedi; role explicitly assigned in Day 1 slides and Status Report 2).

#### G. Presentation-Ready Explanation (30–60 Seconds)
> "Respected faculty, my core assignment covered user management, authentication security, and document upload endpoints in our Express backend. I implemented password hashing using bcrypt with 10 salt rounds and stateless authorization using HS256-signed JWTs with configurable expiration. In the Mongoose `User` model, I established strict validation schemas, role guards, and profile metadata fields. For document ingestion, I created the multipart file upload routes using Multer with strict MIME-type guards that reject non-PDF submissions. When a resume or job description is uploaded, my controller buffers the file and securely forwards it to our AI microservice for parsing, ensuring that uploaded documents are automatically associated with the authenticated user ID."

#### H. Likely Viva Questions & Answers
- **Q1: Why did you choose bcrypt for password hashing, and how is it configured?**  
  *Answer:* "We chose bcrypt because it incorporates a cryptographic salt and configurable work factor to prevent rainbow table attacks. In `backend/src/services/auth.service.js`, we use 10 salt rounds (`bcrypt.genSalt(10)`), which offers an optimal balance between server hashing security and sub-100ms response latency."
- **Q2: How do your document upload endpoints protect against malicious or invalid files?**  
  *Answer:* "In `backend/src/middleware/upload.middleware.js`, we configure Multer with memory storage, strict file size limits (10MB), and a fileFilter function that inspects the file's MIME type (`application/pdf`) and file extension. Non-PDF files are rejected with HTTP 400 before reaching disk or microservice buffers."
- **Q3: How does your backend ensure user data isolation on document endpoints?**  
  *Answer:* "Every request passes through `authenticateToken` middleware, which attaches the verified `req.user.id`. In `resume.controller.js` and `jd.controller.js`, queries always include `{ _id: documentId, userId: req.user.id }`. If another authenticated user attempts to access or delete that document, the query returns null or HTTP 403 Forbidden."

---

### Profile 4: Kush Dani

#### A. Original Role
**Backend: Interview Management, Evaluation, Report APIs & Database** (as documented in Day 1 Presentation Slide 7 and Status Report 2).

#### B. Actual Implementation Scope
- Persistent Mongoose schema for interview sessions (`InterviewSession.js`).
- Interview state machine managing turns, question transitions, and completion criteria.
- Question skipping logic with zero-score assignment and recovery feedback.
- Final scorecard synthesis aggregating 5-part rubric averages across turns.
- Historical session listing, report retrieval, and candidate dashboard analytics APIs.

#### C. Specific Technical Contributions
1. **InterviewSession Schema:** Engineered `backend/src/models/InterviewSession.js`, defining schema arrays for `questions`, `answers`, and `evaluations`, embedding `finalReport`, and indexing on `{ userId: 1, createdAt: -1 }`.
2. **Session Lifecycle Controller:** Co-engineered `backend/src/controllers/interview.controller.js` (974 lines), handling session creation, turn advancement, and status mutations (`'in_progress'`, `'completed'`).
3. **Score Synthesis Logic:** Developed `buildFinalFeedback()`, which calculates weighted averages for technical correctness, clarity, depth, relevance, and completeness, assigning qualitative tier labels (e.g., `'Interview Ready'`).
4. **Analytics Aggregation:** Created `getDashboardAnalytics()`, executing MongoDB queries to return average score progressions, total mock interviews conducted, and category strengths.

#### D. Evidence From the Repository
- **File Paths:**
  - `backend/src/models/InterviewSession.js`
  - `backend/src/controllers/interview.controller.js`
  - `backend/src/routes/interview.routes.js`
- **Key Symbols / Functions:** `InterviewSession`, `startInterview`, `followup`, `skipQuestion`, `endInterview`, `buildFinalFeedback`, `getInterviewHistory`, `getDashboardAnalytics`.
- **API Endpoints Implemented:** `POST /api/interview/start`, `POST /api/interview/followup`, `POST /api/interview/skip`, `POST /api/interview/end`, `GET /api/interview/history`, `GET /api/interview/analytics`.
- **Automated Tests:** Covered by `tests/integration/interview_flow.test.js` (13 passing tests verifying lifecycle, skipping, completion, and analytics).

#### E. Feature Working Explanation
```text
Candidate answers question -> POST /api/interview/followup with sessionId & answer -> 
Kush's controller retrieves InterviewSession from MongoDB -> Checks session.userId === req.user.id -> 
Calls AiServiceClient to grade answer -> Evaluated turn appended to session.evaluations array -> 
If turns === maxQuestions -> Triggers buildFinalFeedback() -> 
Averages 5-part rubric -> Sets status = 'completed' -> Persists finalReport to MongoDB -> 
Returns final report payload to frontend.
```

#### F. Current Completion Status
- **Technical Status:** **Implemented and verified.** (All interview routes, MongoDB persistence, skipping logic, and analytics pass automated integration tests).
- **Authorship Verification:** **Individual ownership unverified in Git.** (Implementation exists in codebase; committed under `Jaimin Trivedi` and `devpatel`; documented via Status Report 2).

#### G. Presentation-Ready Explanation (30–60 Seconds)
> "Good morning, faculty. I was responsible for backend interview session persistence, turn advancement, and analytics aggregation in MongoDB. I engineered the `InterviewSession` schema, which durably stores the complete transcript of questions, candidate answers, rubric evaluations, and category scores across turns. In the interview controller, I implemented state transition methods for starting sessions, handling skipped questions with zero-penalty logging, and completing interviews when the question threshold is reached. Upon completion, my controller calculates weighted average scores across technical correctness, clarity, depth, and relevance to generate a persistent final report. I also built the dashboard analytics route, using Mongoose aggregations to calculate real candidate readiness metrics."

#### H. Likely Viva Questions & Answers
- **Q1: How does your Mongoose schema represent an entire interview session?**  
  *Answer:* "Our `InterviewSession` model (`backend/src/models/InterviewSession.js`) contains top-level metadata: `sessionId`, `userId`, `role`, `difficulty`, `mode`, `status` ('in_progress', 'completed', 'abandoned'), an array of `questions`, an array of `answers`, an array of `evaluations` (storing 5-part rubric scores, feedback, strengths, and missed concepts), and an embedded `finalReport` object containing the overall score and category breakdowns."
- **Q2: How does the backend calculate the final interview report when a session ends?**  
  *Answer:* "In `backend/src/controllers/interview.controller.js`, the `buildFinalFeedback()` function iterates over all turn evaluations in the session. It computes arithmetic averages for correctness, clarity, depth, relevance, and completeness, derives an overall rating label (such as 'Interview Ready' or 'Needs targeted practice'), aggregates top recurring strengths and weaknesses, and saves the final report directly to MongoDB."
- **Q3: How do you prevent an attacker from tampering with another user's active session?**  
  *Answer:* "In every session operation (`/followup`, `/skip`, `/end`, `/:sessionId/report`), the controller loads the session and verifies `session.userId.toString() === req.user.id.toString()`. If they do not match, the request is immediately rejected with HTTP 403 Forbidden, as verified in our automated integration tests."

---

### Profile 5: Krisha Shah

#### A. Original Role
**AI: Resume Processing, Embeddings, RAG** (as documented in Day 1 Presentation Slide 7 and Status Report 2).

#### B. Actual Implementation Scope
- Multi-format resume text extraction (digital PDF parsing + OCR fallback).
- Text cleaning, normalization, and heuristic text density validation.
- Section-aware document chunking (education, skills, projects, experience).
- Embedding generation using open-source model `BAAI/bge-small-en-v1.5`.
- Project repository administration and initial documentation.

#### C. Specific Technical Contributions
1. **PDF Text Extraction Pipeline:** Co-developed `AIService/app/services/document/pdf_parser.py` using PyMuPDF (`fitz`) and `ocr.py` using Tesseract OCR, with automatic fallback when text characters are under 100.
2. **Text Normalization:** Built `AIService/app/services/document/cleaner.py` and `services/processing/normalizer.py`, eliminating irregular control characters, null bytes, and non-ASCII artifacts.
3. **Section-Aware Chunker:** Co-implemented `AIService/app/services/processing/chunker.py` (447 lines), translating structured Pydantic `Resume` objects into typed `InterviewDocument` semantic chunks with metadata tagging (`section: 'skills'`, `section: 'projects'`).
4. **Embedding Generation Engine:** Created `AIService/app/services/embeddings/service.py`, integrating Hugging Face's `BAAI/bge-small-en-v1.5` on CPU with normalized vectors.
5. **Repository Management:** Created the GitHub repository (`Krisha4801/PrepNova`) and committed initial academic project proposals and 14-week plans.

#### D. Evidence From the Repository
- **File Paths:**
  - `AIService/app/services/document/pdf_parser.py`
  - `AIService/app/services/document/ocr.py`
  - `AIService/app/services/document/cleaner.py`
  - `AIService/app/services/processing/chunker.py`
  - `AIService/app/services/embeddings/service.py`
  - `docs/project_plan.pdf`
  - `docs/project_proposal.pdf`
- **Key Symbols / Classes:** `extract_pdf_text`, `ocr_pdf`, `clean_text`, `resume_to_documents`, `EmbeddingService`, `get_huggingface_embeddings`.
- **Git Commit Evidence:** 3 initial commits authored in Git (`Krisha Shah <krishashah4801@gmail.com>`).
- **Automated Tests:** Verified via `tests/integration/ai_rag_integration.test.js` (Resume extraction and indexing pass).

#### E. Feature Working Explanation
```text
Candidate uploads Resume PDF -> POST /api/resume/upload -> 
Backend forwards fileBuffer to FastAPI POST /resume/extract -> 
Krisha's pdf_parser extracts digital text -> If text < 100 chars, ocr_pdf renders pages via Tesseract -> 
Cleaner strips null bytes -> ChatGroq populates structured Pydantic Resume -> 
Chunker creates typed InterviewDocuments -> EmbeddingService calculates 384-dim BGE embeddings -> 
Vectors upserted into ChromaDB -> Structured JSON returned to user.
```

#### F. Current Completion Status
- **Technical Status:** **Implemented and verified.** (PyMuPDF extraction, OCR fallback, section chunking, and BGE embeddings are active and pass integration tests).
- **Authorship Verification:** **Medium (Git Owner) / High (Academic Role).** (Krisha created the GitHub repository and project docs; AI code commits were pushed under `devpatel`; documented via Status Report 2).

#### G. Presentation-Ready Explanation (30–60 Seconds)
> "Respected faculty, my focus was on the document ingestion, parsing, and vector embedding pipeline in our Python FastAPI service. In real-world candidate preparation, resumes arrive in varied formats. To handle this, I built a dual-tier text extraction pipeline using PyMuPDF for native digital PDFs, backed by a Tesseract OCR fallback engine that activates whenever native character density falls below 100 characters. Once cleaned, I implemented our section-aware chunker, which decomposes resumes into typed semantic entities—including education, experience, technical skills, and projects. I then embedded these chunks using Hugging Face's `BAAI/bge-small-en-v1.5` model, producing 384-dimensional normalized vectors ready for semantic retrieval."

#### H. Likely Viva Questions & Answers
- **Q1: Why did you implement both PyMuPDF and Tesseract OCR instead of using a single tool?**  
  *Answer:* "PyMuPDF (`fitz`) is extremely fast and accurate for digital PDFs containing embedded text streams. However, candidates frequently upload scanned PDF resumes or exported graphic files that contain raster images without selectable text. Our heuristic function `has_meaningful_text` checks if PyMuPDF extracted at least 100 alphanumeric characters; if not, it automatically routes the document to Tesseract OCR (`pytesseract`), ensuring no candidate resume fails silently."
- **Q2: How does your section-aware chunker differ from generic recursive character splitting?**  
  *Answer:* "Generic character chunkers split text at arbitrary character or newline counts, which frequently slices an education degree away from the university name or breaks a project's technical description in half. In `AIService/app/services/processing/chunker.py`, our chunker is semantic and section-aware: it maps structured Pydantic objects (`Education`, `Experience`, `Skills`, `Projects`) into discrete `InterviewDocument` instances with dedicated metadata tags (`section: 'skills'`, `section: 'experience'`), preserving conceptual integrity during retrieval."
- **Q3: What embedding model do you use, and why was it chosen?**  
  *Answer:* "We use `BAAI/bge-small-en-v1.5` from Hugging Face. It outputs 384-dimensional dense vectors and ranks among the highest-performing lightweight open-source embedding models on the MTEB benchmark. It runs efficiently on CPU without GPU overhead and produces normalized embeddings for cosine similarity search."

---

### Profile 6: Garv Modi

#### A. Original Role
**AI: Retrieval, Answer Evaluation, Scoring, Vector Database** (as documented in Day 1 Presentation Slide 7 and Status Report 2).

#### B. Actual Implementation Scope
- Persistent vector database storage using ChromaDB (`ChromaStore.py`).
- Metadata filtering enforcing user-level and document-level data isolation.
- Cosine similarity vector retrieval for candidate resumes and job descriptions.
- 5-part rubric scoring criteria (Relevance, Correctness, Completeness, Clarity, Depth).
- Role Knowledge Base pre-indexing and fallback search logic.

#### C. Specific Technical Contributions
1. **ChromaDB Store Engine:** Engineered `AIService/app/services/vectorstore/chroma_store.py` (363 lines), establishing persistent Chroma clients with directory locking, collection creation (`'prep_nova'`), and document upsertion.
2. **User-Isolated Retrieval:** Implemented `search()` in `chroma_store.py`, enforcing mandatory `$and` where filters on `scope: 'user'`, `user_id: <userId>`, and optional `document_id`.
3. **Role Knowledge Base:** Indexed curated role documents (`AIService/role_knowledge/`) covering core architecture, API patterns, and database design for Frontend, Backend, and AI Engineer tracks.
4. **5-Part Rubric Scoring Architecture:** Co-developed `EvaluationState` and `evaluate_answer_node` in `AIService/app/services/interview/graph.py`, scoring answers on 0–10 scales across the 5 rubric criteria and computing adaptive difficulty changes.

#### D. Evidence From the Repository
- **File Paths:**
  - `AIService/app/services/vectorstore/chroma_store.py`
  - `AIService/app/services/vectorstore/retrieval.py`
  - `AIService/role_knowledge/backend_engineer/`
  - `AIService/role_knowledge/ai_engineer/`
  - `AIService/app/services/interview/graph.py` (`EvaluationState`, `evaluate_answer_node`)
- **Key Symbols / Classes:** `ChromaStore`, `get_chroma_client`, `EvaluationState`, `evaluate_answer_node`, `calculate_next_difficulty`.
- **API Endpoints Tested:** `POST /rag/search/user`, `POST /rag/search/role`, `POST /interview/evaluate-answer`.
- **Automated Tests:** Covered by `tests/integration/ai_rag_integration.test.js` (RAG search and cross-user isolation verified).

#### E. Feature Working Explanation
```text
Interview question answered -> Backend calls FastAPI POST /interview/evaluate-answer -> 
Garv's evaluate_answer_node runs -> Injects expected concepts and candidate answer into prompt -> 
ChatGroq grades across 5 rubric axes (0-10) -> 
Garv's calculate_next_difficulty checks score -> If >= 8.0, difficulty shifts up; if <= 4.5, difficulty shifts down -> 
Returns structured AnswerEvaluation JSON with score, rubric breakdown, strengths, and missed concepts.
```

#### F. Current Completion Status
- **Technical Status:** **Implemented and verified.** (ChromaDB persistence, metadata filtering, 5-part rubric scoring, and adaptive difficulty pass automated tests).
- **Authorship Verification:** **Individual ownership unverified in Git.** (Code present and operational; committed under `devpatel`; documented via Status Report 2).

#### G. Presentation-Ready Explanation (30–60 Seconds)
> "Good morning, respected faculty. My role centered on the vector database architecture, user-isolated retrieval, and adaptive scoring logic. I implemented our persistent ChromaDB vector store, structuring collections with strict metadata filtering on `user_id` and `document_id` to guarantee that candidates can never retrieve another applicant's confidential resume data. I also indexed our curated Role Knowledge Base to provide grounded context for candidates practicing without a resume. For answer assessment, I defined the multi-dimensional evaluation rubric, benchmarking candidate responses across technical correctness, completeness, clarity, depth, and relevance, and calculating dynamic difficulty transitions based on performance."

#### H. Likely Viva Questions & Answers
- **Q1: How does ChromaDB guarantee data privacy between different candidates?**  
  *Answer:* "In `AIService/app/services/vectorstore/chroma_store.py`, every document chunk is upserted with metadata fields `scope: 'user'`, `user_id: <userId>`, and `document_id: <docId>`. When querying via `store.search()`, ChromaDB applies a mandatory `$and` where clause matching `user_id == req_user_id`. Even though chunks reside in the same persistent collection, vector search results are cryptographically isolated to the requesting user."
- **Q2: What are the 5 parts of the answer evaluation rubric, and how are they scored?**  
  *Answer:* "The rubric assesses: (1) Relevance (does the answer address the specific prompt?), (2) Technical Correctness (are algorithms, mechanisms, and syntax accurate?), (3) Completeness (were all constraints and components covered?), (4) Clarity (is the explanation well-structured?), and (5) Depth (did the candidate demonstrate trade-offs and edge cases?). Each category is rated on a 0–10 scale, and the overall score is computed as a weighted aggregate."
- **Q3: How does the adaptive difficulty transition work?**  
  *Answer:* "In `AIService/app/services/interview/graph.py`, `calculate_next_difficulty()` inspects the turn score. If the candidate achieves a score $\ge 8.0$, difficulty advances from beginner to intermediate, or intermediate to advanced. If the score falls $\le 4.5$, difficulty drops to reinforce fundamentals. Scores between $4.6$ and $7.9$ maintain the current tier."

---

### Profile 7: Dev Patel

#### A. Original Role
**AI + Frontend: Question Generation and UX Integration** (as documented in Day 1 Presentation Slide 7 and Status Report 2).

#### B. Actual Implementation Scope
- LangGraph StateGraph workflow for grounded question generation (`graph.py`).
- 7-mode Context Validator determining available inputs (Resume, JD, Role).
- Dynamic prompt generation enforcing strict non-repetition across turns.
- FastAPI Job Description extraction microservice route and Pydantic schemas.
- Frontend setup and review page integration (`SessionSetup.jsx`, `ReviewInterviewPage.jsx`).

#### C. Specific Technical Contributions
1. **Question Generation LangGraph:** Engineered `QuestionState` and `build_question_graph()` in `AIService/app/services/interview/graph.py` (569 lines), compiling nodes: `validate_mode` -> `retrieve_context` -> `generate_question`.
2. **Context Combination Validator:** Implemented `validate_interview_mode_node()`, which handles all 7 combinations of candidate input (`resume_jd_role`, `resume_jd`, `resume_role`, `resume`, `role_jd`, `jd`, `role`) and rejects insufficient input with HTTP 400.
3. **Non-Repetition Question Logic:** Built prompt logic passing all prior turns (`asked_question_ids` and question history) to ChatGroq to strictly prevent duplicate questions.
4. **Job Description Extraction Service:** Authored `AIService/app/api/routes/jd.py` and `services/extraction/jd_extractor.py`, extracting structured requirements, responsibilities, and technical stacks from PDF or text JDs.
5. **Frontend Setup Bug Fixes:** Committed fixes solving resume re-use bugs, default role hardcoding, and multi-mode setup triggers in `frontend/src/pages/SessionSetup.jsx` and `ReviewInterviewPage.jsx`.

#### D. Evidence From the Repository
- **File Paths:**
  - `AIService/app/services/interview/graph.py` (`QuestionState`, `build_question_graph`)
  - `AIService/app/api/routes/jd.py`
  - `AIService/app/services/extraction/jd_extractor.py`
  - `frontend/src/pages/SessionSetup.jsx`
  - `frontend/src/pages/ReviewInterviewPage.jsx`
- **Key Symbols / Functions:** `QuestionState`, `validate_interview_mode_node`, `retrieve_context_node`, `generate_question_node`, `build_question_graph`, `JDExtractor`.
- **Git Commit Evidence:** 8 direct Git commits authored under `devpatel <devpatel29180@gmail.com>` spanning AI service, JD extraction, RAG foundation, LangGraph, and frontend setup.
- **Automated Tests:** Verified via `tests/integration/interview_flow.test.js` and `live_e2e_audit.js`.

#### E. Feature Working Explanation
```text
Candidate configures interview track in SessionSetup -> Backend calls FastAPI POST /interview/generate-question -> 
Dev's validate_mode checks provided inputs (e.g., Resume + Role) -> Assigns mode = 'resume_role' -> 
retrieve_context queries ChromaDB for relevant resume chunks -> 
generate_question constructs prompt with turn #, retrieved context, and ALL previous questions -> 
ChatGroq generates single non-repeating technical question -> Returns GeneratedQuestion JSON.
```

#### F. Current Completion Status
- **Technical Status:** **Implemented and verified.** (LangGraph question graph, 7-mode validator, non-repetition rules, and JD extraction pass automated tests).
- **Authorship Verification:** **High.** (Directly verified in Git commits authored by `devpatel` and corroborated by project status reports).

#### G. Presentation-Ready Explanation (30–60 Seconds)
> "Respected faculty, my focus bridged our AI microservice and candidate frontend through LangGraph workflow orchestration and setup UX. Within our FastAPI service, I constructed the compiled LangGraph `QuestionState` graph. This graph first executes a mode validation node that deterministically identifies which of our 7 context modes is active, queries ChromaDB for relevant resume or role chunks, and passes them to our Groq-hosted LLM with strict non-repetition rules. On the frontend, I integrated this workflow into the `SessionSetup` and `ReviewInterviewPage` components, resolving context combination edge cases, ensuring resume persistence, and displaying informative loading states while the AI synthesizes grounded interview questions."

#### H. Likely Viva Questions & Answers
- **Q1: How is the LangGraph Question Generation workflow structured?**  
  *Answer:* "Our question generation workflow is a compiled LangGraph `StateGraph(QuestionState)` with three sequential nodes: `validate_mode` -> `retrieve_context` -> `generate_question`. `validate_mode` evaluates the input context to determine which of the 7 combinations is active; `retrieve_context` queries ChromaDB for relevant resume, JD, or role knowledge chunks; and `generate_question` constructs the prompt for our Groq LLM, enforcing non-repetition by passing all previously asked questions."
- **Q2: What are the 7 interview context modes, and why are they necessary?**  
  *Answer:* "The 7 modes are: (1) `resume_jd_role`, (2) `resume_jd`, (3) `resume_role`, (4) `resume_only`, (5) `role_jd`, (6) `jd_only`, and (7) `role_only`. They are necessary because candidates have different preparation goals: some want to test their resume against a specific job posting, while others have no resume ready and want to practice general technical concepts for a target role like 'Backend Engineer'."
- **Q3: How does your system prevent the LLM from asking the same question twice in a session?**  
  *Answer:* "In `QuestionState`, we track `history` and `asked_question_ids`. When `generate_question_node` invokes ChatGroq, it injects a formatted list of all previously asked questions into the prompt alongside an explicit system constraint: *'Questions ALREADY asked in this session (NEVER repeat or closely rephrase any of these)'*. In addition, the retrieval query dynamically cycles through different technical themes per turn (architecture, debugging, production workflows, scalability) to retrieve diverse grounding chunks."

---

### Profile 8: Jaimin Trivedi

#### A. Original Role
**AI + Backend: AI Service and Orchestration** (as documented in Day 1 Presentation Slide 7 and Status Report 2).

#### B. Actual Implementation Scope
- Centralized Express-to-FastAPI HTTP client (`aiService.client.js`).
- Google OAuth 2.0 PKCE and OpenID Connect Nonce verification engine.
- Timed OTP password reset system with Nodemailer transactional email templates.
- Backend interview orchestration, turn advancement, and analytics aggregation.
- Master automated testing pyramid (119 tests across 14 suites) and live E2E audit suite.

#### C. Specific Technical Contributions
1. **Microservice Client Architecture:** Authored `backend/src/services/aiService.client.js` (300 lines), implementing a singleton Axios client with timeout protection (`AI_SERVICE_TIMEOUT_MS=30000`), FormData streaming, and error sanitization (503 on ECONNREFUSED, 504 on timeout).
2. **Enterprise OAuth 2.0 PKCE & OIDC:** Developed `backend/src/oauth/` (8 modules, 1,200 lines), implementing Google Sign-In with mandatory PKCE (`S256`), high-entropy state/nonce validation, RS256 JWKS public key verification, and single-use handoff tickets (`pnt_...`).
3. **Password Recovery & Session Invalidation:** Created `backend/src/services/email.service.js` and `backend/src/utils/otp.js`, generating cryptographically secure 6-digit OTPs (`crypto.randomInt`), SHA-256 database hashing, timing-safe equality checks, and instant multi-device token invalidation via `user.tokenVersion`.
4. **Interview Orchestration & Analytics:** Built `backend/src/controllers/interview.controller.js` routes linking client interview turns with LangGraph, calculating rubric averages, generating durable PDF/HTML reports, and aggregating candidate dashboard analytics.
5. **Quality Assurance & Verification:** Authored all 14 unit and integration test suites (`backend/tests/`) and the 346-line live end-to-end audit script (`backend/scripts/live_e2e_audit.js`).

#### D. Evidence From the Repository
- **File Paths:**
  - `backend/src/services/aiService.client.js`
  - `backend/src/controllers/interview.controller.js`
  - `backend/src/oauth/oauth.service.js`
  - `backend/src/oauth/providers/google.provider.js`
  - `backend/src/services/email.service.js`
  - `backend/src/utils/otp.js`
  - `backend/scripts/live_e2e_audit.js`
  - `backend/tests/integration/ai_rag_integration.test.js`
- **Key Symbols / Classes:** `AiServiceClient`, `aiServiceClient`, `GoogleProvider`, `OAuthService`, `EmailService`, `generateOTP`, `hashOTP`, `runLiveAudit`.
- **Git Commit Evidence:** 12 direct Git commits authored under `Jaimin Trivedi <trivedij481@gmail.com>` covering backend auth, OAuth PKCE, Nodemailer, AI service client, interview orchestration, and live E2E suite.
- **Automated Tests:** 119 passing tests across 14 test files executed with Node.js test runner.

#### E. Feature Working Explanation
```text
Candidate signs in via Google -> Jaimin's oauth.controller initiates PKCE (S256) -> 
Redirects to Google -> Callback validates state & verifies Google RS256 signature -> 
Links user in MongoDB -> Issues single-use handoff ticket -> Exchanges ticket for PrepNova JWT -> 
Candidate uploads resume -> Express forwards buffer via AiServiceClient to FastAPI -> 
ChromaDB indexes chunks -> Candidate starts interview -> AiServiceClient calls LangGraph -> 
Evaluates turn via 5-part rubric judge -> Saves transcript to MongoDB -> 
Increments tokenVersion if password reset -> Live E2E script verifies zero regressions.
```

#### F. Current Completion Status
- **Technical Status:** **Implemented and verified.** (All microservice links, OAuth PKCE, OTP reset, email services, interview orchestration, and automated test suites are fully operational and verified).
- **Authorship Verification:** **High.** (Directly verified in Git commits authored by `Jaimin Trivedi` and corroborated by project status reports).

#### G. Presentation-Ready Explanation (30–60 Seconds)
> "Good morning, faculty. My responsibility was the technical orchestration connecting our Express backend, FastAPI AI service, and security architecture. I engineered the centralized `AiServiceClient`, implementing resilient HTTP communication, custom timeouts, circuit-breaker fallbacks, and error sanitization. In backend security, I built our Google OAuth 2.0 PKCE and OpenID Connect engine with RS256 JWKS validation, as well as our timed 6-digit OTP password reset system with transactional Nodemailer alerts and instant multi-device token invalidation via `tokenVersion`. Finally, to guarantee production readiness, I authored our automated test suites and live E2E audit suite, verifying 119 passing tests and proving end-to-end data isolation across the entire system."

#### H. Likely Viva Questions & Answers
- **Q1: How does the Node.js Express backend communicate with the Python FastAPI microservice?**  
  *Answer:* "We created `AiServiceClient` (`backend/src/services/aiService.client.js`), a centralized Axios client. It encapsulates service discovery via `AI_SERVICE_URL`, configurable timeout handling (`AI_SERVICE_TIMEOUT_MS=30000`), native multipart FormData streaming for PDF buffers, and sanitized error normalization. If the AI microservice is down, it returns a clean HTTP 503 `AI_SERVICE_UNAVAILABLE` error instead of exposing raw Python stack traces to the candidate."
- **Q2: Explain the security architecture of your Google OAuth 2.0 implementation.**  
  *Answer:* "We implemented Google OAuth 2.0 with mandatory PKCE (`S256`) and OpenID Connect Nonce verification. The backend generates a cryptographically random `code_verifier`, hashes it with SHA-256 to create the `code_challenge`, and creates high-entropy state and nonce tokens. Upon callback, the backend validates state, exchanges the code, verifies the Google ID token's RS256 signature against Google's public JWKS certificates (`googleapis.com/oauth2/v3/certs`), links the user to MongoDB, and issues a short-lived, single-use ticket (`pnt_...`, 60s TTL) for the frontend to exchange via POST."
- **Q3: How does your password reset flow prevent user enumeration and session hijacking?**  
  *Answer:* "For user enumeration, `POST /api/auth/forgot-password` returns an identical HTTP 200 generic success message regardless of whether the email exists. The OTP is generated with `crypto.randomInt`, hashed with SHA-256, and verified using timing-safe comparisons with a 10-minute TTL and max 5 failed attempts. When the password is reset, `user.tokenVersion` is incremented in MongoDB, which immediately invalidates all existing JWT access tokens across all active candidate devices."

---

## 3. System-Level Integration & Traceability Map

The table below traces how the 8 assigned areas connect end-to-end to deliver the complete PrepNova interview experience:

| Step / Workflow | Frontend Component & Owner | Backend Route / Controller & Owner | AI Microservice / Persistence & Owner | Integration Boundary & Verification |
|---|---|---|---|---|
| **1. Registration & Login** | `LoginPage.jsx` / `SignupPage.jsx`<br>(**Hardi Dhadhal**) | `auth.controller.js` / `User.js`<br>(**Varunee Agrawal** / **Jaimin Trivedi**) | MongoDB `User` collection | Issues HS256 JWT containing `userId` and `tokenVersion`. Verified by 24 passing auth integration tests. |
| **2. Google OAuth 2.0 PKCE** | `OAuthButton.jsx`<br>(**Hardi Dhadhal**) | `oauth.controller.js` / `oauth.service.js`<br>(**Jaimin Trivedi**) | Google OIDC / JWKS RS256 public keys | Single-use tickets (`pnt_...`) exchanged via POST. Verified by 13 OAuth integration tests. |
| **3. Resume Upload & Chunking** | `SessionSetup.jsx`<br>(**Shruti Makwana**) | `resume.controller.js`<br>(**Varunee Agrawal**) | `pdf_parser.py` / `chunker.py`<br>(**Krisha Shah**) | Express streams PDF buffer via `AiServiceClient.extractResume()`; PyMuPDF/OCR extracts text; chunker creates typed slices. |
| **4. Vector Indexing** | `ResumeAnalysisPage.jsx`<br>(**Hardi Dhadhal**) | `aiService.client.js`<br>(**Jaimin Trivedi**) | `chroma_store.py` / `service.py`<br>(**Garv Modi** / **Krisha Shah**) | `bge-small-en-v1.5` embeds chunks; ChromaDB indexes with `scope: 'user'`, `user_id: <id>`. |
| **5. Context Validation** | `SessionSetup.jsx`<br>(**Shruti Makwana** / **Dev Patel**) | `interview.controller.js`<br>(**Kush Dani**) | `validate_mode_node` in `graph.py`<br>(**Dev Patel**) | Validates 7 combinations; rejects empty context with HTTP 400. |
| **6. Question Generation** | `InterviewPage.jsx`<br>(**Shruti Makwana**) | `interview.controller.js`<br>(**Kush Dani** / **Jaimin Trivedi**) | `generate_question_node` in `graph.py`<br>(**Dev Patel**) | LangGraph retrieves Chroma chunks; ChatGroq generates question enforcing non-repetition. |
| **7. Answer Evaluation** | `TextEditor.jsx` / `VoiceRecorder.jsx`<br>(**Shruti Makwana**) | `interview.controller.js`<br>(**Kush Dani**) | `evaluate_answer_node` in `graph.py`<br>(**Garv Modi**) | LangGraph grades turn across 5-part rubric (0-10); `calculate_next_difficulty` transitions tier. |
| **8. Session Completion** | `ResultsPage.jsx`<br>(**Shruti Makwana**) | `buildFinalFeedback()` in `interview.controller.js`<br>(**Kush Dani**) | MongoDB `InterviewSession` finalReport | Aggregates turn scores, saves durable final report to MongoDB, triggers PDF printout. |
| **9. Dashboard Analytics** | `Dashboard.jsx`<br>(**Hardi Dhadhal**) | `getDashboardAnalytics()` in `interview.controller.js`<br>(**Kush Dani**) | MongoDB aggregation pipeline | Computes real readiness percentage, interview counts, and radar metrics from completed sessions. |

---

## 4. Comparison with Original 14-Week Plan

| Week Span | Planned Milestone (from Day 1 Plan) | Actual Current Implementation State | Audit Status |
|---|---|---|---|
| **Weeks 1–2** | Problem definition, requirements, architecture, tech stack lock | Documented in SRS, proposal, LaTeX reports. Tech choices locked: React, Express, MongoDB, FastAPI, ChromaDB, Groq. | **Completed planned work** |
| **Weeks 3–4** | Database models, JWT auth, PDF extraction, vector store setup | `User.js`, `InterviewSession.js`, JWT/OAuth/OTP, PyMuPDF, OCR fallback, and Chroma store implemented. | **Completed planned work** |
| **Weeks 5–6** | RAG retrieval, role knowledge base, question generation engine | 7 context modes, LangGraph QuestionState graph, dynamic turn themes, non-repetition engine. | **Completed planned work** |
| **Weeks 7–8** | Answer evaluation, 5-part rubric judge, dashboard UI, core MVP | EvaluationState graph, 5-part rubric scoring, adaptive difficulty, candidate dashboard, 119 automated tests. | **Completed planned work** |
| **Weeks 9–10** | ATS-lite resume analysis, printable PDF reports, security hardening | `ResumeAnalysisPage.jsx`, downloadable PDF reports, user isolation, rate limiting, live E2E audit. | **Completed planned work** |
| **Weeks 11–12** | Load testing, extended role banks, speech-to-text enhancements | Web Speech API implemented on frontend; offline question bank expanded. Server-side Whisper STT pending. | **Partially completed** |
| **Weeks 13–14** | Cloud deployment (Docker/CI-CD), Pinecone upgrade, final defense | Docker containers and multi-cloud CI/CD deployment pending; local production build verified. | **Remaining planned work** |

---

## 5. Technical Risks, Limitations & Known Technical Debt

1. **Browser-Based Speech Recognition:** Audio transcription relies on the browser's Web Speech API (`webkitSpeechRecognition`). While zero-latency, transcription accuracy depends on the candidate's browser engine (Chrome/Edge). Server-side Whisper transcription remains a future enhancement.
2. **Local Vector Storage vs. Cloud Scale:** ChromaDB operates in persistent local mode (`AIService/data/chroma`). While optimal for local development and academic evaluation, enterprise production would migrate to Pinecone or Chroma client-server clusters.
3. **In-Memory Active Session Layer:** `interview.controller.js` maintains an in-memory session cache (`activeSessionCache`) layered over MongoDB for sub-10ms response times. In distributed multi-pod deployments, this layer should be synchronized via Redis.

---

## 6. Audit Summary

| Metric / Item | Audited Value / Evidence |
|---|---|
| **Subsystems Inspected** | Frontend (React/Vite), Backend (Node/Express), AI Microservice (FastAPI/LangGraph), MongoDB, ChromaDB, Docs. |
| **Automated Test Results** | **119 Tests, 14 Test Suites, 100% Passing.** |
| **Live End-to-End Audit** | `backend/scripts/live_e2e_audit.js` — 346 lines, 7 lifecycle sections verified live. |
| **Verified Individual Authorship** | `Varunee Agrawal` (Frontend commits), `devpatel` (AI service, JD, LangGraph), `Jaimin Trivedi` (Backend auth, OAuth, orchestration, tests), `Krisha Shah` (Repository owner & project docs). |
| **Verified Roles via Documentation** | `Hardi Dhadhal` (Frontend 1), `Shruti Makwana` (Frontend 2), `Kush Dani` (Backend 2), `Garv Modi` (AI 2) fully documented in university status reports (`7_PrepNova_BiWeekly_Status_Report_2_Code.tex`). |
| **Documentation Deliverables Created** | 1. `TEAM_CONTRIBUTION_REPORT.md`<br>2. `CONTRIBUTION_MATRIX.md`<br>3. `TEAM_PRESENTATION_SCRIPTS.md`<br>4. `IMPLEMENTATION_EVIDENCE.md` in `docs/team-contributions/`. |

---
*Report certified for academic defense and faculty project evaluation.*
