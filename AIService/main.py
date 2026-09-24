from fastapi import FastAPI
from app.api.routes.resume import router as resume_router
from app.api.routes.jd import router as jd_router

app = FastAPI(
    title="PrepNova AI Service",
    version="0.1.0"
)

app.include_router(resume_router)
app.include_router(jd_router)


@app.get("/health")
def health_check():

    return {
        "status": "ok",
        "service": "prep-nova-ai-service",
    }

