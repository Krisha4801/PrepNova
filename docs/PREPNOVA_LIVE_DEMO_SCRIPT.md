# PrepNova: Live Demonstration Script & Viva Defense Guide

**Target Audience**: Academic Examination Faculty & Project Evaluators  
**Estimated Run Time**: 5 Minutes  
**Demonstrators**: Shruti Makwana, Dev Patel, and Hardi Dhadhal (supported by full team)  

---

## 1. Pre-Demo Setup Checklist
- [ ] MongoDB running locally or connected to Atlas.
- [ ] AI Microservice running on `http://127.0.0.1:8000` (FastAPI with ChromaDB).
- [ ] Express Backend running on `http://localhost:5000`.
- [ ] React Frontend running on `http://localhost:5173`.
- [ ] Sample digital PDF resume ready: `AIService/test_resume.pdf`.

---

## 2. Step-by-Step Demonstration Walkthrough

### Part 1: Authentication & SaaS Design System (1 Minute)
1. **Action**: Open browser at `http://localhost:5173/login`.
2. **Speaker (Hardi)**:
   > "Respected faculty, here is PrepNova's candidate authentication interface. It features client-side validation, password strength indicators requiring uppercase, lowercase, numbers, and symbols, and seamless light/dark mode toggling persisted in localStorage."
3. **Action**: Sign in with an existing account or create a new test candidate.
4. **Speaker (Hardi)**:
   > "Upon sign in, the candidate is routed to their personal Dashboard. Notice real-time readiness cards, historical score trajectories rendered via Recharts, and quick navigation to practice sessions."

---

### Part 2: Resume Ingestion, Extraction & ATS-Lite Scoring (1 Minute)
1. **Action**: Navigate to `/customize` or `/resume/upload` and upload `test_resume.pdf`.
2. **Speaker (Krisha / Varunee)**:
   > "When a candidate uploads a PDF resume, our backend buffers the stream and passes it to our Python FastAPI service. PyMuPDF extracts the native text—with automatic Tesseract OCR fallback if scanned images are detected. Our section-aware chunker then splits the document into structured semantic entities and generates 384-dimensional normalized vector embeddings using Hugging Face's `BAAI/bge-small-en-v1.5` model, storing them in our dedicated `prepnova_resumes` ChromaDB collection."
3. **Action**: Show detected target role (e.g., *AI Engineer*) and the calculated ATS-Lite score badge.
4. **Speaker (Garv)**:
   > "Notice that the system automatically extracted the candidate's target role and computed an ATS compatibility score based on keyword completeness across contact info, education, skills, and project experience."

---

### Part 3: Live Adaptive Interview Simulation (2 Minutes)
1. **Action**: Select **Section-Based Practice** &rarr; Select **System Design** and **Node.js** &rarr; Click **Start Interview**.
2. **Speaker (Shruti / Dev)**:
   > "Now we enter the live interview environment. PrepNova generated targeted technical questions using our compiled LangGraph state graph. Notice the section progress tracker, turn timer, and monospace answer workspace."
3. **Action**: Type a strong answer into the answer box:
   ```text
   In Node.js, asynchronous I/O is managed by libuv's event loop. When a blocking file operation or crypto hash runs, it is offloaded to the libuv threadpool (default 4 threads), leaving the main JavaScript thread free to process incoming requests.
   ```
4. **Action**: Click **Submit Answer**.
5. **Speaker (Dev)**:
   > "When the answer is submitted, our LangGraph AI Judge compares the candidate's response against retrieved technical evidence and evaluates it across 5 distinct rubric dimensions. Notice the adaptive difficulty indicator: because the response demonstrated high depth and correctness, the next question automatically calibrates to an advanced difficulty tier."

---

### Part 4: Final Scorecard Report & History Persistence (1 Minute)
1. **Action**: Advance/complete the interview to reach `/results/:sessionId`.
2. **Speaker (Shruti / Kush)**:
   > "Upon interview completion, PrepNova generates a persistent performance scorecard. Notice the overall score, the radar chart comparing Technical Correctness, Relevance, Completeness, Clarity, and Depth, followed by actionable strengths and weak points."
3. **Action**: Navigate to `/history`.
4. **Speaker (Kush)**:
   > "All sessions, transcripts, and section scorecards are durably stored in MongoDB under `InterviewSession` and `DocumentChunk`. Candidates can revisit past interviews, review previous feedback, and track improvement over time."

---

## 3. Likely Faculty Defense Questions & Concise Answers

- **Q: Why separate the system into Express and FastAPI instead of using Python for everything?**
  - *Answer*: "Following Service-Oriented Architecture (SOA) principles, Node.js excels at asynchronous high-concurrency REST routing, JWT authentication, and MongoDB persistence, while Python provides best-in-class ecosystems for AI, PyTorch embeddings, ChromaDB, and LangGraph workflow compilation."
- **Q: How do you guarantee candidates cannot view or retrieve each other's resumes?**
  - *Answer*: "Every ChromaDB query applies mandatory `$and` metadata filters on `user_id` and `document_id`. Even with identical vector cosine similarities, vectors belonging to other users are completely filtered out at the vector database layer."
