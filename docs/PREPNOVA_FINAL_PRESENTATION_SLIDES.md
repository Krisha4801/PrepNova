# PrepNova: Final Project Presentation Slide Deck

**Course**: WS & SOA (IT644) — Master of Science in Information Technology  
**Project**: PrepNova — RAG-based Adaptive Mock Interview Platform  
**Team**: 8 Members | Repository: `github.com/Krisha4801/PrepNova`  
**Duration**: 15 Minutes Presentation + 5 Minutes Q&A / Live Demo  

---

## Slide 1: Title & Team Introduction
- **Project Name**: PrepNova
- **Subtitle**: Enterprise-Grade, RAG-Augmented Adaptive Mock Interview Simulator
- **Team**:
  1. Hardi Dhadhal — Frontend: Authentication, Dashboard & General UI
  2. Shruti Makwana — Frontend: Interview Interface & Flow
  3. Varunee Agrawal — Backend: Auth, Security & Document APIs
  4. Kush Dani — Backend: Interview Session Lifecycle & Persistence
  5. Krisha Shah — AI: PDF Ingestion, Section-Aware Chunking & Vector Embeddings
  6. Garv Modi — AI: ChromaDB Vector Retrieval, Multi-Collections & Adaptive Scoring
  7. Dev Patel — AI + Frontend: LangGraph Question Generation & Candidate UX
  8. Jaimin Trivedi — AI + Backend: Microservice Orchestration, Security & Testing Lead

---

## Slide 2: Problem Statement & Motivation
- **The Problem**: Traditional technical interview preparation platforms rely on static LeetCode-style questions or generic question banks that fail to mirror realistic conversational hiring interviews.
- **The Gap**: Candidates are evaluated in a vacuum, without grounding in their actual resume claims, stated technologies, or specific job description (JD) requirements.
- **The Solution**: PrepNova leverages Retrieval-Augmented Generation (RAG) to conduct personalized, multi-turn interviews dynamically grounded in the candidate's verified background.

---

## Slide 3: Core Architectural Highlights (3-Tier SOA)
- **Client Layer**: React 18, Tailwind CSS, Slate & Indigo SaaS design tokens, Vite.
- **Application Orchestration**: Node.js & Express REST API, JWT auth, Mongoose ODM.
- **AI Microservice**: Python FastAPI, LangGraph state engine, Groq LLM inference, PyMuPDF, Tesseract OCR.
- **Vector Retrieval**: ChromaDB with 3 dedicated collections (`prepnova_resumes`, `prepnova_jds`, `prepnova_role_kb`), BAAI/bge-small-en-v1.5 embeddings.
- **Data Persistence**: MongoDB Atlas (Users, Resumes, JDs, InterviewSessions, DocumentChunks).

---

## Slide 4: Input Combination Matrix & Decision Flow
- **Resume Only**: Grounded exclusively in candidate's parsed projects and claimed skills.
- **Role Only**: Fallback to curated role knowledge base across standard industry archetypes.
- **Resume + Job Description (JD)**: The gold standard — calculates matched skills vs. JD skill gaps, generating targeted questions probing unverified requirements.
- **Role + JD**: Targeted role preparation aligned with real company job postings.
- **Validation Rule**: If neither resume nor role is supplied, session creation is strictly rejected with HTTP 400.

---

## Slide 5: Dual Practice Modes
1. **Complete Comprehensive Interview**:
   - 7-Section Blueprint: Introduction, Projects, Work Experience, Technical Skills, Concepts, Workplace Scenarios (production outages/cascading failures), and Behavioral (STAR).
2. **Section-Based Interview Practice**:
   - 17 Technical Categories (React, Node.js, System Design, DSA, Databases, DevOps, Security, etc.).
   - Custom candidate-defined topics (e.g., "Solana Smart Contracts").
   - Smart Section Recommender based on resume/JD skill match.

---

## Slide 6: Multi-Dimensional Evaluation & Adaptive Pacing
- **5-Part Rubric**: Technical Correctness, Completeness, Clarity, Depth, and Relevance.
- **Adaptive Difficulty Engine**:
  - Score $\ge 8/10$: Elevates difficulty for the next question turn.
  - Score $\le 4/10$: Decreases difficulty or prompts foundational concepts.
- **ATS-Lite Compatibility Scoring**: Deterministic keyword alignment badge and category checklist.

---

## Slide 7: Security Hardening & Zero-Leak Isolation
- **Stateless Authorization**: HS256-signed JWTs with 7-day TTL and `tokenVersion` multi-device invalidation.
- **Strict Data Isolation**: Metadata filtering on `userId` and `documentId` prevents cross-tenant vector retrieval.
- **Rate Limiting**: `express-rate-limit` prevents brute-force attacks on auth and upload endpoints.
- **Prompt Injection Defense**: Pre-sanitization of candidate resume text prior to LLM context injection.

---

## Slide 8: Quality Assurance & Test Verification
- **Backend Unit & Integration Suite**: 108 tests passing across 28 suites.
- **AI Microservice Suite**: 34 unit & contract tests passing.
- **Live System E2E Audit**: Automated end-to-end verification covering the entire candidate journey.
- **Load Testing (k6 / Locust)**: Validated sub-100ms response times for auth and dashboard routes under 25 concurrent virtual users.

---

## Slide 9: Live Demonstration
- *Presenter*: Dev Patel & Shruti Makwana
- *Flow*: Candidate Login &rarr; PDF Resume Upload &rarr; Section Setup &rarr; Multi-Turn Question Answering &rarr; Dynamic Evaluation &rarr; Scorecard Report Review.

---

## Slide 10: Conclusion & Future Scope
- **Delivered**: Complete 14-week curriculum scope delivered without reduction.
- **Future Enhancements**: Bidirectional voice synthesis, real-time code execution sandbox, and calendar scheduling integration.
- **Q&A**: Thank you! Open for faculty questions.
