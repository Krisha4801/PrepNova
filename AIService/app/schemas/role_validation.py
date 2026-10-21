from typing import List, Optional, Any
from pydantic import BaseModel, Field


class ValidationPrerequisite(BaseModel):
    name: str = Field(..., description="Prerequisite name or domain competency")
    status: str = Field(..., description="Status: met, partial, or missing")
    details: str = Field(..., description="Explanation of why this status was assigned")


class RiskFlag(BaseModel):
    code: str = Field(..., description="Machine-readable risk code, e.g. TECH_STACK_MISMATCH")
    severity: str = Field(..., description="Severity level: info, low, medium, or high")
    message: str = Field(..., description="Human-readable description of the risk")
    recommendation: Optional[str] = Field(None, description="Suggested action to mitigate the risk")


class RoleValidationRequest(BaseModel):
    mode: str = Field("role", description="Interview configuration mode")
    target_role: Optional[str] = Field(None, description="Target job title or role")
    resume: Optional[Any] = Field(None, description="Extracted resume payload (optional)")
    jd: Optional[Any] = Field(None, description="Extracted job description payload (optional)")


class RoleValidationResult(BaseModel):
    is_valid: bool = Field(True, description="Whether the configuration can proceed to interview generation")
    compatibility_score: float = Field(..., description="Calculated alignment score between 0.0 and 100.0")
    target_role: str = Field(..., description="Effective target role being assessed")
    mode: str = Field(..., description="Interview configuration mode, e.g. RESUME_JD_ROLE")
    prerequisites: List[ValidationPrerequisite] = Field(default_factory=list, description="Evaluated role prerequisites")
    risk_flags: List[RiskFlag] = Field(default_factory=list, description="Identified risk flags or warnings")
    skill_overlaps: List[str] = Field(default_factory=list, description="Skills verified in both candidate profile and role/JD")
    missing_critical_skills: List[str] = Field(default_factory=list, description="Critical skills missing from candidate profile")
    summary: str = Field(..., description="Executive summary of the alignment assessment")
    recommended_adjustments: List[str] = Field(default_factory=list, description="Actionable recommendations for the interview blueprint")
