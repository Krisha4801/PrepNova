from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
from enum import Enum


class InterviewMode(str, Enum):
    RESUME_JD_ROLE = "resume_jd_role"
    RESUME_JD = "resume_jd"
    RESUME_ROLE = "resume_role"
    RESUME = "resume"
    JD = "jd"
    ROLE_JD = "role_jd"
    ROLE = "role"


class DifficultyLevel(str, Enum):
    BEGINNER = "beginner"
    INTERMEDIATE = "intermediate"
    ADVANCED = "advanced"


class PreviousQA(BaseModel):
    question: str
    answer: str
    score: Optional[float] = None
    level: Optional[str] = None
    is_skipped: Optional[bool] = False
    category: Optional[str] = None
    intent: Optional[str] = None


class GenerateQuestionRequest(BaseModel):
    user_id: Optional[str] = None
    role: Optional[str] = None
    difficulty: DifficultyLevel = DifficultyLevel.BEGINNER
    mode: Optional[InterviewMode] = None
    resume_id: Optional[str] = None
    jd_id: Optional[str] = None
    history: List[PreviousQA] = Field(default_factory=list)
    asked_question_ids: List[str] = Field(default_factory=list)
    focus_areas: List[str] = Field(default_factory=list)


class GeneratedQuestion(BaseModel):
    id: Optional[str] = None
    question: str
    category: str = "Technical Concept"
    format: str = "Scenario"
    difficulty: str = "beginner"
    expected_concepts: List[str] = Field(default_factory=list)
    grounding_context: Optional[str] = None
    source: str = "rag_llm"
    role: str = "General"
    focus_topic: Optional[str] = None
    intent: Optional[str] = None
    grounding_source: Optional[str] = None


class EvaluateAnswerRequest(BaseModel):
    role: str
    difficulty: str = "beginner"
    question: str
    answer: str
    grounding_context: Optional[str] = None
    format: Optional[str] = "Scenario"
    expected_concepts: List[str] = Field(default_factory=list)


class AnswerEvaluation(BaseModel):
    score: float = Field(..., ge=0, le=10)
    relevance: float = Field(..., ge=0, le=10)
    correctness: float = Field(..., ge=0, le=10)
    completeness: float = Field(..., ge=0, le=10)
    clarity: float = Field(..., ge=0, le=10)
    depth: float = Field(..., ge=0, le=10)
    rating_label: str = "Interview ready"
    feedback: str
    strengths: List[str] = Field(default_factory=list)
    areas_of_improvement: List[str] = Field(default_factory=list)
    matched_concepts: List[str] = Field(default_factory=list)
    missed_concepts: List[str] = Field(default_factory=list)
    reference_answer: Optional[str] = None
    next_difficulty: str = "beginner"
    source: str = "langgraph_llm"


# =========================================================
# BLUEPRINT & ADAPTIVE TURN CONTRACTS (SPECIFICATION 2026)
# =========================================================

class BlueprintSection(BaseModel):
    id: str
    type: str
    title: str
    objective: str
    priority: str = "high"
    target_question_count: int = 1
    target_minutes: float = 4.0
    difficulty: List[str] = Field(default_factory=lambda: ["beginner", "intermediate"])
    context_refs: List[str] = Field(default_factory=list)
    applicable: bool = True
    skip_reason: Optional[str] = None


class InterviewBlueprint(BaseModel):
    version: int = 1
    session_id: Optional[str] = None
    role: str = "Candidate"
    difficulty: str = "beginner"
    target_duration_minutes: int = 30
    sections: List[BlueprintSection] = Field(default_factory=list)
    global_rules: Dict[str, Any] = Field(
        default_factory=lambda: {
            "maxFollowUpsPerQuestion": 2,
            "avoidSemanticDuplicates": True,
            "evaluateOnlyAfterCompletion": True
        }
    )
    context_availability: Dict[str, bool] = Field(default_factory=dict)


class PlanBlueprintRequest(BaseModel):
    user_id: Optional[str] = None
    role: Optional[str] = "Software Engineer"
    difficulty: DifficultyLevel = DifficultyLevel.BEGINNER
    mode: Optional[InterviewMode] = None
    resume_id: Optional[str] = None
    jd_id: Optional[str] = None
    target_duration_minutes: int = 30
    focus_areas: List[str] = Field(default_factory=list)


class NextTurnRequest(BaseModel):
    session_id: str
    user_id: Optional[str] = None
    role: str = "Candidate"
    difficulty: str = "beginner"
    mode: Optional[str] = None
    resume_id: Optional[str] = None
    jd_id: Optional[str] = None
    blueprint: Optional[InterviewBlueprint] = None
    history: List[Dict[str, Any]] = Field(default_factory=list)
    current_section_id: Optional[str] = "introduction"
    follow_ups_in_current_section: int = 0
    total_turns_taken: int = 0
    max_turns: int = 6


class NextTurnResponse(BaseModel):
    action: str = "ASK_QUESTION"  # "ASK_QUESTION", "COMPLETE"
    section_id: str = "introduction"
    objective_id: Optional[str] = None
    question_type: str = "primary"  # "primary", "follow_up"
    parent_question_id: Optional[str] = None
    interviewer_text: str
    reason_code: Optional[str] = None
    expected_evidence: List[str] = Field(default_factory=list)
    context_refs: List[str] = Field(default_factory=list)
    estimated_seconds: int = 60
    is_complete: bool = False


class IntroductionEvaluation(BaseModel):
    score: float = Field(default=8.0, ge=0, le=10)
    structure: str = "Good structure"
    role_relevance: str = "Relevant to target position"
    evidence: str = "Provides background evidence"
    conciseness: str = "Clear and appropriately concise"
    clarity: str = "Well-articulated"
    strengths: List[str] = Field(default_factory=list)
    improvements: List[str] = Field(default_factory=list)
    sample_improved_answer: Optional[str] = None


class SessionQAPair(BaseModel):
    question_index: int = 0
    question: str
    answer: str
    difficulty: str = "beginner"
    category: Optional[str] = "Technical Concept"
    section_id: Optional[str] = None
    is_skipped: Optional[bool] = False


class EvaluateSessionRequest(BaseModel):
    role: str = "Candidate"
    difficulty: str = "beginner"
    transcript: List[SessionQAPair] = Field(default_factory=list)
    blueprint: Optional[InterviewBlueprint] = None
    resume_id: Optional[str] = None
    jd_id: Optional[str] = None


class EvaluatedTurn(BaseModel):
    question_index: int
    score: float
    feedback: str
    correctness: float
    clarity: float
    depth: float
    relevance: Optional[float] = 8.0
    completeness: Optional[float] = 8.0
    section_id: Optional[str] = None


class SessionEvaluationResult(BaseModel):
    overall_score: float
    rating_label: str
    category_scores: Dict[str, float]
    intro_evaluation: Optional[IntroductionEvaluation] = None
    section_summaries: Dict[str, Any] = Field(default_factory=dict)
    feedback: str
    strengths: List[str]
    areas_of_improvement: List[str]
    preparation_plan: List[str] = Field(default_factory=list)
    coverage_summary: Dict[str, Any] = Field(default_factory=dict)
    evaluations: List[EvaluatedTurn] = Field(default_factory=list)
    source: str = "batch_llm"

