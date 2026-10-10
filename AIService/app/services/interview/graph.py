import json
from typing import Dict, Any, List, Optional
from pydantic import BaseModel, Field

from langgraph.graph import StateGraph, START, END
from langchain_core.messages import SystemMessage, HumanMessage

from app.schemas.interview import (
    InterviewMode,
    DifficultyLevel,
    GeneratedQuestion,
    AnswerEvaluation,
    GenerateQuestionRequest,
    EvaluateAnswerRequest
)
from app.services.llm.client import LLMClient
from app.services.vectorstore.chroma_store import ChromaStore

LEVELS = ["beginner", "intermediate", "advanced"]


def get_rating_label(score: float) -> str:
    if score >= 8.5:
        return "Excellent"
    if score >= 7.0:
        return "Interview ready"
    if score >= 5.0:
        return "Needs targeted practice"
    return "Needs fundamentals"


def calculate_next_difficulty(current_difficulty: str, score: float) -> str:
    current = str(current_difficulty or "beginner").lower().strip()
    if current not in LEVELS:
        current = "beginner"

    idx = LEVELS.index(current)
    if score >= 8.0 and idx < len(LEVELS) - 1:
        return LEVELS[idx + 1]
    elif score <= 4.5 and idx > 0:
        return LEVELS[idx - 1]
    return current


# =========================================================
# 1. QUESTION GENERATION LANGGRAPH
# =========================================================

class QuestionState(BaseModel):
    user_id: Optional[str] = None
    role: Optional[str] = None
    difficulty: str = "beginner"
    mode: Optional[str] = None
    resume_id: Optional[str] = None
    jd_id: Optional[str] = None
    history: List[Dict[str, Any]] = Field(default_factory=list)
    asked_question_ids: List[str] = Field(default_factory=list)
    focus_areas: List[str] = Field(default_factory=list)
    
    # Internal workflow state
    validated_mode: str = "role"
    grounding_context: str = ""
    error: Optional[str] = None
    output_question: Optional[GeneratedQuestion] = None


def validate_interview_mode_node(state: QuestionState) -> Dict[str, Any]:
    has_resume = bool(state.resume_id and state.user_id)
    has_role = bool(state.role and state.role.strip())
    has_jd = bool(state.jd_id and state.user_id)

    if has_resume and has_jd:
        mode = InterviewMode.RESUME_JD.value
    elif has_resume:
        mode = InterviewMode.RESUME.value
    elif has_role and has_jd:
        mode = InterviewMode.ROLE_JD.value
    elif has_role:
        mode = InterviewMode.ROLE.value
    else:
        return {
            "error": "Insufficient context: either a resume upload or a target role selection is required to start an interview.",
            "validated_mode": "invalid"
        }

    return {"validated_mode": mode, "error": None}


def retrieve_context_node(state: QuestionState) -> Dict[str, Any]:
    if state.error or state.validated_mode == "invalid":
        return {"grounding_context": ""}

    store = ChromaStore()
    context_chunks = []
    mode = state.validated_mode
    query = f"{state.role or ''} {' '.join(state.focus_areas)} technical concepts and responsibilities".strip()

    try:
        # Mode 1: Resume or Resume + JD
        if mode in [InterviewMode.RESUME.value, InterviewMode.RESUME_JD.value]:
            if state.user_id:
                results = store.search(
                    query=query,
                    user_id=state.user_id,
                    document_id=state.resume_id,
                    top_k=4
                )
                if results and "documents" in results and results["documents"]:
                    for doc in results["documents"][0]:
                        context_chunks.append(f"[Resume Context]: {doc}")

        # Mode 2: JD (if provided)
        if mode in [InterviewMode.RESUME_JD.value, InterviewMode.ROLE_JD.value]:
            if state.user_id and state.jd_id:
                jd_results = store.search(
                    query=query,
                    user_id=state.user_id,
                    document_id=state.jd_id,
                    top_k=3
                )
                if jd_results and "documents" in jd_results and jd_results["documents"]:
                    for doc in jd_results["documents"][0]:
                        context_chunks.append(f"[Job Description Context]: {doc}")

        # Mode 3: Role Knowledge Base (when no resume or as supplement)
        if mode in [InterviewMode.ROLE.value, InterviewMode.ROLE_JD.value] or not context_chunks:
            target_role = state.role or "Software Engineer"
            role_results = store.search_role(
                query=query,
                role=target_role,
                top_k=4
            )
            if role_results and "documents" in role_results and role_results["documents"]:
                for doc in role_results["documents"][0]:
                    context_chunks.append(f"[Role Knowledge]: {doc}")

    except Exception as e:
        context_chunks.append(f"[Fallback Context]: Core skills and design patterns for {state.role or 'Software Engineer'}")

    grounding_text = "\n\n".join(context_chunks)
    return {"grounding_context": grounding_text}


def generate_question_node(state: QuestionState) -> Dict[str, Any]:
    if state.error:
        return {}

    llm = LLMClient().get_llm()
    role = state.role or "Software Engineer"
    difficulty = state.difficulty or "beginner"

    previous_questions_text = ""
    if state.history:
        prev_list = [f"- Q: {h.get('question', '')} (Level: {h.get('level', '')})" for h in state.history[-4:]]
        previous_questions_text = "Previous questions already asked in this session:\n" + "\n".join(prev_list)

    system_prompt = """You are PrepNova's senior technical interviewer.
Generate a realistic, challenging, and clear interview question strictly grounded in the provided context, target role, and difficulty level.
You MUST output valid JSON only matching this schema:
{
  "question": "string containing the interview question text",
  "category": "Resume-Based | JD-Based | Technical Concept | Scenario-Based | System Design | Debugging | Behavioral",
  "format": "Scenario | Coding | Short Answer | Behavioral",
  "expected_concepts": ["keyword1", "keyword2", "keyword3"],
  "sample_answer_points": "brief description of what a good answer covers"
}
Do NOT repeat previously asked questions. Return JSON only with no markdown formatting."""

    user_prompt = f"""Role: {role}
Difficulty Level: {difficulty}
Interview Mode: {state.validated_mode}
Focus Areas: {', '.join(state.focus_areas) if state.focus_areas else 'Core technical skills'}

{previous_questions_text}

Retrieved Grounding Context:
---
{state.grounding_context if state.grounding_context else f'Standard industry standards and expectations for {role}.'}
---

Generate exactly one interview question."""

    try:
        response = llm.invoke([
            SystemMessage(content=system_prompt),
            HumanMessage(content=user_prompt)
        ])

        raw_content = response.content.replace("```json", "").replace("```", "").strip()
        data = json.loads(raw_content)

        generated = GeneratedQuestion(
            id=f"q_{abs(hash(data.get('question', '')))}",
            question=data.get("question", f"Explain core principles and architectural trade-offs in {role}."),
            category=data.get("category", "Technical Concept"),
            format=data.get("format", "Scenario"),
            difficulty=difficulty,
            expected_concepts=data.get("expected_concepts", [role]),
            grounding_context=state.grounding_context[:400] if state.grounding_context else None,
            source="langgraph_rag",
            role=role
        )

        return {"output_question": generated}

    except Exception as e:
        fallback_question = GeneratedQuestion(
            id=f"q_fallback_{Date_now_id()}",
            question=f"In your experience as a {role}, how do you approach debugging production failures and ensuring system reliability?",
            category="Technical Concept",
            format="Scenario",
            difficulty=difficulty,
            expected_concepts=[role, "debugging", "reliability"],
            grounding_context=state.grounding_context[:400] if state.grounding_context else None,
            source="fallback",
            role=role
        )
        return {"output_question": fallback_question}


def Date_now_id():
    import time
    return int(time.time() * 1000)


# Build Question Generation Graph
def build_question_graph():
    builder = StateGraph(QuestionState)
    builder.add_node("validate_mode", validate_interview_mode_node)
    builder.add_node("retrieve_context", retrieve_context_node)
    builder.add_node("generate_question", generate_question_node)

    builder.add_edge(START, "validate_mode")
    builder.add_edge("validate_mode", "retrieve_context")
    builder.add_edge("retrieve_context", "generate_question")
    builder.add_edge("generate_question", END)

    return builder.compile()

question_workflow = build_question_graph()


# =========================================================
# 2. ANSWER EVALUATION LANGGRAPH
# =========================================================

class EvaluationState(BaseModel):
    role: str
    difficulty: str = "beginner"
    question: str
    answer: str
    grounding_context: Optional[str] = None
    format: Optional[str] = "Scenario"
    expected_concepts: List[str] = Field(default_factory=list)

    # Output
    evaluation: Optional[AnswerEvaluation] = None


def evaluate_answer_node(state: EvaluationState) -> Dict[str, Any]:
    llm = LLMClient().get_llm()

    system_prompt = """You are PrepNova's strict, fair technical interviewer evaluating a candidate's answer.
Evaluate the answer across the 5-part rubric (0 to 10 scale each):
1. relevance (Does the answer address the question asked?)
2. correctness (Is the technical information accurate?)
3. completeness (Did they cover all core concepts and constraints?)
4. clarity (Is the response well-structured and easy to follow?)
5. depth (Did they demonstrate deep understanding, trade-offs, and examples?)

Output valid JSON strictly in this structure:
{
  "score": number (0 to 10, weighted average),
  "relevance": number (0 to 10),
  "correctness": number (0 to 10),
  "completeness": number (0 to 10),
  "clarity": number (0 to 10),
  "depth": number (0 to 10),
  "feedback": "2-3 sentences of constructive feedback",
  "strengths": ["specific strength 1", "specific strength 2"],
  "areas_of_improvement": ["actionable improvement 1", "actionable improvement 2"],
  "matched_concepts": ["concept1", "concept2"],
  "missed_concepts": ["concept3"],
  "reference_answer": "a concise model answer demonstrating best practices"
}
Return valid JSON only without markdown codeblocks."""

    user_prompt = f"""Role: {state.role}
Difficulty: {state.difficulty}
Question Format: {state.format}
Interview Question: {state.question}
Candidate Answer: {state.answer}

Grounding Context / Expected Concepts:
{state.grounding_context if state.grounding_context else ', '.join(state.expected_concepts)}

Evaluate the candidate's answer now."""

    try:
        response = llm.invoke([
            SystemMessage(content=system_prompt),
            HumanMessage(content=user_prompt)
        ])

        raw = response.content.replace("```json", "").replace("```", "").strip()
        data = json.loads(raw)

        score = max(0.0, min(10.0, float(data.get("score", 7.0))))
        relevance = max(0.0, min(10.0, float(data.get("relevance", score))))
        correctness = max(0.0, min(10.0, float(data.get("correctness", score))))
        completeness = max(0.0, min(10.0, float(data.get("completeness", score))))
        clarity = max(0.0, min(10.0, float(data.get("clarity", score))))
        depth = max(0.0, min(10.0, float(data.get("depth", score))))

        next_diff = calculate_next_difficulty(state.difficulty, score)

        eval_result = AnswerEvaluation(
            score=round(score, 1),
            relevance=round(relevance, 1),
            correctness=round(correctness, 1),
            completeness=round(completeness, 1),
            clarity=round(clarity, 1),
            depth=round(depth, 1),
            rating_label=get_rating_label(score),
            feedback=data.get("feedback", "Answer evaluated successfully."),
            strengths=data.get("strengths", []),
            areas_of_improvement=data.get("areas_of_improvement", ["Provide more concrete examples."]),
            matched_concepts=data.get("matched_concepts", []),
            missed_concepts=data.get("missed_concepts", []),
            reference_answer=data.get("reference_answer"),
            next_difficulty=next_diff,
            source="langgraph_llm"
        )

        return {"evaluation": eval_result}

    except Exception as e:
        score = 6.0
        fallback_eval = AnswerEvaluation(
            score=score,
            relevance=6.0,
            correctness=6.0,
            completeness=6.0,
            clarity=6.0,
            depth=6.0,
            rating_label=get_rating_label(score),
            feedback="Answer received. To improve, structure your thoughts with specific technical terminology and trade-offs.",
            strengths=["Addressed the general topic."],
            areas_of_improvement=["Provide deeper technical explanations and constraints."],
            matched_concepts=[],
            missed_concepts=[],
            reference_answer="A complete answer clearly defines the concept, explains trade-offs, and provides a real-world example.",
            next_difficulty=state.difficulty,
            source="fallback_evaluation"
        )
        return {"evaluation": fallback_eval}


def build_evaluation_graph():
    builder = StateGraph(EvaluationState)
    builder.add_node("evaluate_answer", evaluate_answer_node)
    builder.add_edge(START, "evaluate_answer")
    builder.add_edge("evaluate_answer", END)
    return builder.compile()

evaluation_workflow = build_evaluation_graph()
