# PrepNova: Free-Tier Production Deployment & Operations Guide

This document defines the production deployment architecture, configuration, and verification steps for PrepNova using free-tier cloud infrastructure.

---

## 1. Target Production Architecture

| Tier | Component | Platform & Hardware | Public Domain Target |
| :--- | :--- | :--- | :--- |
| **Client Frontend** | React 18 + Vite SPA | Vercel (Hobby Free Tier) | `https://prepnova.vercel.app` |
| **Application Backend** | Node.js 20 + Express REST API | Render (Web Service Free Tier, 512 MB RAM) | `https://prepnova-api.onrender.com` |
| **AI / RAG Microservice** | FastAPI (LangChain, LangGraph, Groq) | Hugging Face Spaces (Docker SDK, CPU Basic) | `https://<hf-username>-prepnova-ai.hf.space` |
| **Application Database** | MongoDB 7.0 Cluster | MongoDB Atlas (M0 Shared Cluster, 512 MB storage) | `mongodb+srv://...` |
| **Vector Index & Storage** | ChromaDB (3 Isolated Collections) | Durable in MongoDB `DocumentChunk` with Chroma rehydration | Embedded in AI Microservice Container |

> [!IMPORTANT]
> **Hosting Policy & Cloudflare Quick Tunnel Clarification**:
> Temporary Cloudflare quick tunnels (`*.trycloudflare.com`) are ephemeral development tunnels that change upon every process restart. They are **NOT** permanent production hosting. The official production architecture targets persistent free cloud platforms (Vercel, Render, Hugging Face Spaces, and MongoDB Atlas).

---

## 2. AI Microservice Free-Tier Hosting Specification

### Primary Target: Hugging Face Spaces (Docker SDK, CPU Basic)
Hugging Face Spaces provides a generous free tier:
- **Specs**: 2 vCPU, 16 GB RAM, 50 GB disk.
- **Port Requirement**: Must listen on `0.0.0.0:7860`.
- **User Permission**: Must run as non-root user (UID `1000`).
- **Configuration**: The repository provides `AIService/Dockerfile` pre-configured with Python 3.11-slim, Tesseract OCR system packages, CPU-only PyTorch wheels (`--index-url https://download.pytorch.org/whl/cpu torch`), and non-root execution.

### Account-Specific Constraints & Confirmed Free Options

> [!WARNING]
> **Account Verification Limitation**:
> Hugging Face has recently enforced billing verification restrictions on certain accounts, displaying CPU Basic as disabled and Docker as paid/unavailable without a payment method on file. **Do not assume CPU Basic or any Hugging Face Space type is unconditionally available without payment.**

If your Hugging Face account does not permit creating a free CPU Basic Space, do not enter payment details or purchase paid hardware. The confirmed viable options for deployment are:

1. **Render Free Web Service (Cloud Hosting)**:
   - Deploy `AIService` as a separate free web service on Render alongside the Express backend.
   - Configure environment: Python 3.11, build command `pip install --no-cache-dir --extra-index-url https://download.pytorch.org/whl/cpu torch -r requirements.txt`, start command `uvicorn main:app --host 0.0.0.0 --port 10000 --workers 1`.
   - *Memory Considerations*: To stay strictly within Render's 512 MB free tier ceiling, `AIService` relies on lazy proxy loading (`LazyChromaProxy`, `LazyRetrievalProxy`) so embedding weights are not held permanently in idle memory.

2. **Hugging Face Docker Space (If Unlocked on Verified Free Accounts)**:
   - The repository provides a production-ready [AIService/Dockerfile](file:///d:/Jaimin_Files/Sem3/SOA/SOA_PrepNova/PrepNova/AIService/Dockerfile) pre-configured with Python 3.11-slim, Tesseract OCR system packages, CPU-only PyTorch, non-root user (UID 1000), and port 7860, ready for accounts where CPU Basic is enabled at no charge.

3. **Persistent Self-Hosted Tunnel (Demonstration & Viva Fallback)**:
   - If cloud memory or platform billing constraints block cloud AI hosting, run the FastAPI microservice locally on the evaluation machine with a configured, named Cloudflare Tunnel (or ngrok auth token) pointing to port 8000.
   - *Note*: An ephemeral quick tunnel (`trycloudflare.com`) is strictly for local prototyping, as its URL expires whenever the process closes. For a demonstration, use a stable named tunnel or local network binding.

---

## 3. Environment Variables Specification

### A. Express Backend (`backend/.env` / Render Environment Variables)
```env
PORT=5000
NODE_ENV=production
MONGO_URI=mongodb+srv://<admin>:<password>@cluster0.mongodb.net/prepnova?retryWrites=true&w=majority
JWT_SECRET=super_secret_prepnova_production_jwt_key_2026_at_least_64_chars_long
JWT_EXPIRES_IN=7d
FRONTEND_URL=https://prepnova.vercel.app
AI_SERVICE_URL=https://<hf-username>-prepnova-ai.hf.space
AI_SERVICE_API_KEY=your_shared_secret_ai_key_between_backend_and_fastapi
AI_SERVICE_TIMEOUT_MS=45000
AUTH_RATE_LIMIT_MAX=100
AUTH_RATE_LIMIT_WINDOW_MS=900000
```

### B. Python AI Microservice (`AIService/.env` / Hugging Face Repository Secrets)
```env
GROQ_API_KEY=gsk_your_production_groq_api_key
GROQ_MODEL=openai/gpt-oss-20b
AI_SERVICE_API_KEY=your_shared_secret_ai_key_between_backend_and_fastapi
PYTHONUNBUFFERED=1
PORT=7860
```

### C. React Frontend (`frontend/.env.production` / Vercel Environment Variables)
```env
VITE_API_URL=https://prepnova-api.onrender.com
```

---

## 4. ChromaDB Durability & Multi-Collection Architecture

To survive ephemeral cloud container restarts (such as Hugging Face Spaces sleep cycles or Render spin-downs):
1. **Three Isolated Collections**:
   - `prepnova_resumes`: Candidate resume chunks and extracted skills.
   - `prepnova_jds`: Target job description chunks.
   - `prepnova_role_kb`: Pre-seeded role knowledge questions and rubrics.
2. **MongoDB `DocumentChunk` Persistence**:
   - Every chunk and its pre-computed 384-d vector (`BAAI/bge-small-en-v1.5`) is stored in the MongoDB `DocumentChunk` collection with compound unique index:
     `{ userId: 1, documentType: 1, documentId: 1, chunkIndex: 1 }`.
   - Embeddings are kept out of parent `Resume` / `JobDescription` models, guaranteeing that MongoDB 16 MB document size limits are never exceeded.
3. **Idempotent Rehydration**:
   - If ChromaDB container restarts, vector indexes are reloaded via `POST /api/resume/:documentId/rehydrate` or `POST /api/jd/:documentId/rehydrate`.
   - The backend validates candidate ownership before dispatching chunk vectors to `POST /rag/rehydrate` with header `X-AI-Service-Key`.
   - Existing vector IDs are updated in place without duplicate records or re-running expensive LLM embeddings.

---

## 5. Deployment Step-by-Step

### Step 1: MongoDB Atlas Setup
1. Create a free M0 cluster on MongoDB Atlas.
2. Create a database user `prepnova-admin`.
3. Allow network access from anywhere (`0.0.0.0/0`) since cloud hosts use dynamic IP ranges.
4. Copy the connection URI: `mongodb+srv://prepnova-admin:<password>@cluster0.mongodb.net/prepnova?retryWrites=true&w=majority`.

### Step 2: Deploy AI Microservice to Hugging Face Spaces
1. Create a new Space on Hugging Face:
   - Name: `prepnova-ai`
   - License: MIT
   - SDK: **Docker** (Blank)
   - Hardware: **CPU Basic (2 vCPU · 16 GB RAM) — Free**
2. In Space Settings &rarr; **Repository Secrets**, add:
   - `GROQ_API_KEY`
   - `AI_SERVICE_API_KEY`
   - `GROQ_MODEL=openai/gpt-oss-20b`
3. Push the `AIService/` directory contents (including `Dockerfile`, `requirements.txt`, and `app/`) to the Hugging Face Space Git repository.
4. Once built, verify the public URL: `https://<username>-prepnova-ai.hf.space/health` returns `{"status":"ok","service":"prep-nova-ai-service"}`.

### Step 3: Deploy Express Backend to Render
1. Create a new **Web Service** on Render connected to GitHub repository `Krisha4801/PrepNova`.
2. Configure settings:
   - Root Directory: `backend`
   - Environment: `Node`
   - Build Command: `npm install`
   - Start Command: `node src/index.js`
   - Plan: **Free**
3. Add Environment Variables specified in Section 3.A.
4. Once live, verify `GET https://prepnova-api.onrender.com/health` returns `{"status":"ok","database":"connected"}`.

### Step 4: Deploy Frontend to Vercel
1. In Vercel, import the Git repository.
2. Configure project:
   - Framework Preset: `Vite`
   - Root Directory: `frontend`
   - Build Command: `npm run build`
   - Output Directory: `dist`
3. Add Environment Variable:
   - `VITE_API_URL=https://prepnova-api.onrender.com`
4. Deploy. The `frontend/vercel.json` SPA catch-all rewrite rules guarantee that client-side React routes (`/interview`, `/results/:id`, `/history`) resolve seamlessly without 404 errors.

---

## 6. Production Smoke-Test Checklist

Verify live deployment end-to-end:
- [ ] `GET https://prepnova-api.onrender.com/health` returns `{"status":"ok","database":"connected"}`.
- [ ] `GET https://<ai-service-url>/health` returns `{"status":"ok","service":"prep-nova-ai-service"}`.
- [ ] Candidate registration and JWT issuance at `https://prepnova.vercel.app/register`.
- [ ] Resume upload parses text and indexes chunks into `prepnova_resumes`.
- [ ] Candidate starts interview turn; verifies question grounded in candidate experience.
- [ ] Answer evaluation runs via LangGraph judge and calculates adaptive progression.
- [ ] Final scorecard report renders on `/results/:id`.
- [ ] Interview history displays on `/history`.
