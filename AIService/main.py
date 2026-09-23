from fastapi import FastAPI
from app.api.routes.resume import router as resume_router

app = FastAPI(
    title="PrepNova AI Service",
    version="0.1.0"
)

app.include_router(resume_router)


@app.get("/health")
def health_check():

    return {
        "status": "ok",
        "service": "prep-nova-ai-service",
    }

