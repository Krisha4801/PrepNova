from fastapi import FastAPI
from app.api.routes.resume import router as resume_router
from app.api.routes.jd import router as jd_router
from app.api.routes.rag import router as rag_router
from app.api.routes.interview import router as interview_router

app = FastAPI(
    title="PrepNova AI Service",
    version="0.1.0"
)

app.include_router(resume_router)
app.include_router(jd_router)
app.include_router(rag_router)
app.include_router(interview_router)


@app.on_event("startup")
def startup_event():
    try:
        from app.services.role_knowledge.seed import seed_role_knowledge
        res = seed_role_knowledge(force=False)
        print(f"[PrepNova Startup] Role knowledge check: {res.get('status')}, roles available: {len(res.get('roles_available', []))}")
    except Exception as e:
        print(f"[PrepNova Startup] Warning: Role knowledge seeding encountered: {e}")


@app.get("/health")
def health_check():

    return {
        "status": "ok",
        "service": "prep-nova-ai-service",
    }

