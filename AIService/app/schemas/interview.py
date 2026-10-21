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


class SessionQAPair(BaseModel):
    question_index: int = 0
    question: str
    answer: str
    difficulty: str = "beginner"
    category: Optional[str] = "Technical Concept"


class EvaluateSessionRequest(BaseModel):
    role: str = "Candidate"
    difficulty: str = "beginner"
    transcript: List[SessionQAPair] = Field(default_factory=list)


class EvaluatedTurn(BaseModel):
    question_index: int
    score: float
    feedback: str
    correctness: float
    clarity: float
    depth: float


class SessionEvaluationResult(BaseModel):
    overall_score: float
    rating_label: str
    category_scores: Dict[str, float]
    feedback: str
    strengths: List[str]
    areas_of_improvement: List[str]
    evaluations: List[EvaluatedTurn]
    source: str = "batch_llm"
