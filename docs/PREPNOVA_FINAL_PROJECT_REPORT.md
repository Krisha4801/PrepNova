# PrepNova: RAG-Based Adaptive Mock Interview Platform
## Final Academic Project Report

**Course Code & Name**: WS & SOA (IT644) — Master of Science in Information Technology  
**Academic Term**: Semester 3, 2026  
**Repository**: [github.com/Krisha4801/PrepNova](https://github.com/Krisha4801/PrepNova)  
**Submission Date**: November 16, 2026  

---

## Team Members & Role Distribution

| Name | Student Role | Technical Domain | Assigned Responsibilities |
| :--- | :--- | :--- | :--- |
| **Hardi Dhadhal** | Team Member | Frontend 1 | Auth UI, Candidate Dashboard, ThemeContext, General SaaS Design Tokens |
| **Shruti Makwana** | Team Member | Frontend 2 | Live Interview Workspace, Question Reader, Multi-Turn Pacing, Scorecard UI |
| **Varunee Agrawal** | Team Member | Backend 1 | JWT Authentication, User Management, Document Upload APIs, Rate Limiting |
| **Kush Dani** | Team Member | Backend 2 | Interview Session Persistence, Turn Advancement, Mongoose Models, Analytics APIs |
| **Krisha Shah** | Team Member | AI 1 | Document Ingestion (PyMuPDF & Tesseract), Section Chunker, BGE Embeddings |
| **Garv Modi** | Team Member | AI 2 | ChromaDB Vector Store, Multi-Collections, Cosine Retrieval, Adaptive Scoring |
| **Dev Patel** | Team Member | AI + Frontend | LangGraph Question Generation Graph, Context Validation, AI Loading States |
| **Jaimin Trivedi** | Team Lead | AI + Backend | Microservice Orchestration, OAuth 2.0 PKCE, Nodemailer OTP, E2E Testing Lead |

---

## 1. Introduction & Problem Definition

In modern technical recruitment, traditional mock interview platforms face fundamental limitations:
1. Static question repositories lack context awareness, asking generic algorithmic problems irrelevant to a candidate's actual claimed projects or technologies.
2. Candidates preparing for specialized roles (e.g., AI Engineer, Distributed Systems, Cloud DevOps) receive superficial, uncalibrated questions that do not reflect real workplace architectural challenges.
3. Automated evaluation tools offer binary grading without granular rubric breakdowns or actionable remediation paths.

**PrepNova** addresses these challenges by applying **Retrieval-Augmented Generation (RAG)** within a **Service-Oriented Architecture (SOA)**. PrepNova dynamically ingests a candidate's resume and target Job Description (JD), decomposes them into semantically typed chunks, generates normalized vector embeddings, and uses a compiled **LangGraph state workflow** to conduct adaptive, multi-turn technical interviews.

---

## 2. System Architecture & Component Design

PrepNova adheres to a loosely coupled 3-tier Service-Oriented Architecture:

```text
[ Client Tier ]
  React 18 + Vite SPA (Port 5173)
  ├── Auth & Profile Views
  ├── Interactive Setup & Section Selector (17 categories + Custom topics)
  ├── Turn-by-Turn Monospace Answer Workspace
  └── Performance Radar Scorecards (Recharts)
        │
        ▼ (HTTPS REST / Bearer JWT)
[ Application Tier ]
  Node.js + Express Backend (Port 5000)
  ├── Auth Controller & Stateless JWT Verification (HS256)
  ├── Rate Limiter Middleware (express-rate-limit)
  ├── Session State Orchestrator & Mongoose ODM
  └── Centralized AiServiceClient (Axios HTTP Client with Circuit-Breaker)
        │
        ├── Mongoose TLS ──────► [ MongoDB Atlas Persistence ]
        │                        ├── Users & Credentials
        │                        ├── Resumes & JDs
        │                        ├── InterviewSessions & Transcripts
        │                        └── DocumentChunks & Embeddings
        │
        ▼ (Internal REST / X-AI-Service-Key)
[ AI Microservice Tier ]
  Python FastAPI Microservice (Port 8000)
  ├── PyMuPDF & Tesseract OCR Extraction Pipeline
  ├── Section-Aware Text Normalizer & Chunker
  ├── Hugging Face BAAI/bge-small-en-v1.5 Embedding Engine
  ├── ChromaDB Vector Store (3 Isolated Collections)
  └── LangGraph Question Generation & 5-Part Rubric AI Judge (Groq LLM)
```

---

## 3. Core System Modules & Implementation Details

### 3.1 Document Ingestion & Chunking Pipeline
- Resumes are received as PDF binaries, validated against strict MIME guards, and parsed using PyMuPDF. If native extractable character density is below 100 characters, Tesseract OCR automatically triggers.
- The section-aware chunker decomposes the document into distinct semantic components: *Summary, Education, Experience, Skills, Projects, and Certifications*.
- Each chunk is embedded using `BAAI/bge-small-en-v1.5`, producing 384-dimensional normalized vectors stored in ChromaDB.

### 3.2 ChromaDB Multi-Collection Architecture
ChromaDB is organized into three dedicated, user-isolated collections:
1. `prepnova_resumes`: Candidate resume text chunks and vectors.
2. `prepnova_jds`: Job description chunks and vectors.
3. `prepnova_role_kb`: Curated role knowledge base for candidates practicing without resumes.
- Mandatory metadata filtering on `user_id` and `document_id` guarantees multi-tenant data isolation.

### 3.3 MongoDB `DocumentChunk` Durable Persistence
To guarantee durability on ephemeral cloud hosting, all chunks and pre-computed 384-d vectors are durably stored in MongoDB under `DocumentChunk` with a compound unique index:
`{ userId: 1, documentType: 1, documentId: 1, chunkIndex: 1 }`.
If the vector store restarts, Chroma is idempotently rehydrated directly from MongoDB without re-calculating embeddings.

### 3.4 Multi-Turn LangGraph State Graph & Adaptive Pacing
- The interview state engine manages question budgets, active turn indices, and conversational non-repetition.
- Candidate answers are evaluated against a fixed 5-part rubric: **Technical Correctness, Completeness, Clarity, Depth, and Relevance**.
- If a candidate demonstrates mastery (score $\ge 8/10$), the engine raises difficulty for subsequent questions. If the candidate struggles (score $\le 4/10$), it adjusts to foundational concepts.

---

## 4. Verification, Testing & Quality Results

| Verification Type | Scope / Target | Executed Tools | Results |
| :--- | :--- | :--- | :--- |
| **Backend Unit Testing** | Auth, JWT, Validators, Contracts, DocumentChunk | Node.js Test Runner | **108 / 108 Passed (28 Suites)** |
| **AI Service Unit Testing** | Contracts, Chroma Multi-Collections, LangGraph | Python `unittest` | **34 / 34 Passed** |
| **Frontend Production Build** | React, Tailwind, Vite bundle optimization | `npm run build` | **0 Errors, Clean Production Output** |
| **End-to-End System Audit** | Full user flow, Resume RAG, Isolation checks | `live_e2e_audit.js` | **100% Passed (All Assertions Green)** |
| **Performance & Load Testing**| Concurrency, latency, rate-limiting | k6 & Locust | **p95 < 1500ms under 25 concurrent VUs** |

---

## 5. Academic Conclusion & Deliverable Compliance

All objectives set out in the 14-week Project Plan and Bi-weekly Status Reports #1 through #12 have been achieved:
- 100% of functional requirements and input combination rules implemented and verified.
- Complete documentation, OpenAPI specifications, presentation decks, and test reports consolidated in `/docs`.
- The system is architected, tested, and ready for production deployment.
