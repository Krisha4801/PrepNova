from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any

class UserSearchRequest(BaseModel):
    user_id: str = Field(..., description="Authenticated user ID")
    query: str = Field(..., min_length=1, description="Search query string")
    document_id: Optional[str] = Field(None, description="Optional document ID filter")
    top_k: int = Field(5, ge=1, le=20, description="Max number of results")

class RoleSearchRequest(BaseModel):
    role: str = Field(..., min_length=1, description="Target role name (e.g. Frontend Developer)")
    query: str = Field(..., min_length=1, description="Search query string")
    top_k: int = Field(5, ge=1, le=20, description="Max number of results")

class DeleteDocumentRequest(BaseModel):
    user_id: str = Field(..., description="Authenticated user ID")
    document_id: str = Field(..., description="Document ID to delete")

class SearchResultItem(BaseModel):
    content: str
    metadata: Dict[str, Any] = Field(default_factory=dict)
    distance: Optional[float] = None

class SearchResponse(BaseModel):
    success: bool = True
    query: str
    results: List[SearchResultItem] = Field(default_factory=list)
    count: int = 0
