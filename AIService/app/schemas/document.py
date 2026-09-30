from typing import Any, Dict
from pydantic import BaseModel, Field

class InterviewDocument(BaseModel):
    """
    Common representation of searchable content
    inside PrepNova.
    """
    content: str
    source: str
    document_type: str
    section: str
    metadata: Dict[str, Any] = Field(
        default_factory=dict
    )