from typing import List, Optional, Any, Dict
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


class FitDimensions(BaseModel):
    skill_alignment: float = Field(0.0, description="Percentage of required and preferred skills evidenced in resume (0-100)")
    experience_alignment: float = Field(0.0, description="Seniority, years, and responsibility alignment (0-100)")
    project_evidence: float = Field(0.0, description="Ratio of claimed skills demonstrated in projects or work history (0-100)")
    critical_gaps_count: int = Field(0, description="Number of mandatory or high-priority missing requirements")
    semantic_relevance: float = Field(0.0, description="Semantic and synonym overlap score (0-100)")
    evidence_confidence: float = Field(0.0, description="Confidence in extracted document data (0-100)")


class RoleValidationRequest(BaseModel):
    mode: str = Field("role", description="Interview configuration mode")
    target_role: Optional[str] = Field(None, description="Target job title or role")
    resume_id: Optional[str] = Field(None, description="Optional resume document ID")
    jd_id: Optional[str] = Field(None, description="Optional job description document ID")
    user_id: Optional[str] = Field(None, description="Authenticated user ID")
    resume: Optional[Any] = Field(None, description="Extracted resume payload (optional)")
    jd: Optional[Any] = Field(None, description="Extracted job description payload (optional)")


class RoleValidationResult(BaseModel):
    is_valid: bool = Field(True, description="Whether the configuration can proceed to interview generation")
    decision_state: str = Field("READY", description="Decision state: READY, READY_WITH_WARNINGS, NEEDS_CLARIFICATION, INVALID_INPUT, INSUFFICIENT_EVIDENCE")
    compatibility_score: float = Field(..., description="Calculated alignment score between 0.0 and 100.0")
    target_role: str = Field(..., description="Effective target role being assessed")
    mode: str = Field(..., description="Interview configuration mode, e.g. resume_jd_role")
    fit_dimensions: FitDimensions = Field(default_factory=FitDimensions, description="Detailed 6-dimension fit evaluation breakdown")
    prerequisites: List[ValidationPrerequisite] = Field(default_factory=list, description="Evaluated role prerequisites")
    risk_flags: List[RiskFlag] = Field(default_factory=list, description="Identified risk flags or warnings")
    skill_overlaps: List[str] = Field(default_factory=list, description="Skills verified in both candidate profile and role/JD")
    missing_critical_skills: List[str] = Field(default_factory=list, description="Critical skills missing from candidate profile")
    transferable_skills: List[str] = Field(default_factory=list, description="Candidate skills that transfer to target requirements")
    gap_focused_interview_eligible: bool = Field(False, description="Whether candidate can proceed with gap-focused practice")
    user_recommendations: List[str] = Field(default_factory=list, description="Standard user-facing recommendations and advice from specification")
    conflicts: List[str] = Field(default_factory=list, description="Identified material contradictions requiring user clarification")
    summary: str = Field(..., description="Executive summary of the alignment assessment")
    recommended_adjustments: List[str] = Field(default_factory=list, description="Actionable recommendations for the interview blueprint")
