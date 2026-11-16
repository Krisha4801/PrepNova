import os
from fastapi import Header, HTTPException, status
from app.core.config import settings

def verify_ai_service_key(
    x_ai_service_key: str | None = Header(None, alias="X-AI-Service-Key"),
    authorization: str | None = Header(None)
) -> bool:
    """
    Verifies that incoming requests to protected AI microservice endpoints
    possess the authorized shared secret key configured in AI_SERVICE_API_KEY.
    
    If AI_SERVICE_API_KEY is not configured, allows requests for local development.
    If configured, strictly requires a matching X-AI-Service-Key or Bearer token.
    """
    expected_key = settings.ai_service_api_key or os.getenv("AI_SERVICE_API_KEY")
    if not expected_key:
        return True

    token = None
    if x_ai_service_key:
        token = x_ai_service_key.strip()
    elif authorization and authorization.lower().startswith("bearer "):
        token = authorization[7:].strip()

    if not token or token != expected_key.strip():
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Unauthorized: Invalid or missing AI service authorization key."
        )
    return True
