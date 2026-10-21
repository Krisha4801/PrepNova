import json
import logging
import re
import math
import numpy as np
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
    EvaluateAnswerRequest,
    EvaluateSessionRequest,
    SessionEvaluationResult,
    EvaluatedTurn
)
from app.services.llm.client import LLMClient
from app.services.vectorstore.chroma_store import ChromaStore
from app.services.embeddings.service import EmbeddingService
from app.services.interview.benchmark import (
    get_benchmark_slot,
    get_role_default_topics,
    get_calibrated_fallback_question,
    normalize_level_key,
    DIFFICULTY_BENCHMARKS,
)

logger = logging.getLogger(__name__)
_shared_embedding_service = None

def get_shared_embedding_service() -> EmbeddingService:
    global _shared_embedding_service
    if _shared_embedding_service is None:
        _shared_embedding_service = EmbeddingService()
    return _shared_embedding_service

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
# REPETITION DETECTION HELPERS
# =========================================================

def normalize_text_tokens(text: str) -> set:
    """Extract lowercase alpha-numeric tokens excluding common stop words."""
    words = re.findall(r"\b[a-z0-9]+\b", text.lower())
    stop_words = {
        "a", "an", "the", "in", "on", "of", "to", "for", "with", "at", "by",
        "how", "what", "why", "when", "where", "which", "can", "you", "explain",
        "describe", "discuss", "would", "could", "should", "tell", "me", "about"
    }
    return {w for w in words if w not in stop_words and len(w) > 2}


def compute_jaccard_similarity(text1: str, text2: str) -> float:
    """Token set Jaccard similarity for near-exact match detection."""
    set1 = normalize_text_tokens(text1)
    set2 = normalize_text_tokens(text2)
    if not set1 or not set2:
        return 0.0
    intersection = len(set1.intersection(set2))
    union = len(set1.union(set2))
    return float(intersection / union) if union > 0 else 0.0


def compute_cosine_similarity(vec_a: List[float], vec_b: List[float]) -> float:
    """Cosine similarity between two normalized embedding vectors."""
    a = np.array(vec_a, dtype=float)
    b = np.array(vec_b, dtype=float)
    norm_a = np.linalg.norm(a)
    norm_b = np.linalg.norm(b)
    if norm_a == 0 or norm_b == 0:
        return 0.0
    return float(np.dot(a, b) / (norm_a * norm_b))


def is_semantic_duplicate(
    candidate_question: str,
    previous_questions: List[str],
    embedding_service: EmbeddingService,
    similarity_threshold: float = 0.82,
    jaccard_threshold: float = 0.65
) -> tuple[bool, float, str]:
    """
    Checks candidate question against all previously asked questions in the session.
    Returns (is_duplicate, max_similarity, duplicate_reason).
    """
    if not previous_questions or not candidate_question.strip():
        return False, 0.0, ""

    candidate_clean = candidate_question.strip()

    # 1. Exact & Jaccard token overlap check
    for prev in previous_questions:
        if not prev or not prev.strip():
            continue
        prev_clean = prev.strip()
        if candidate_clean.lower() == prev_clean.lower():
            return True, 1.0, f"Exact match with previous question: '{prev_clean}'"

        jaccard = compute_jaccard_similarity(candidate_clean, prev_clean)
        if jaccard >= jaccard_threshold:
            return True, jaccard, f"High token overlap ({jaccard:.2f}) with: '{prev_clean}'"

    # 2. Embedding cosine similarity using singleton BAAI/bge-small-en-v1.5
    try:
        candidate_emb = embedding_service.embed_query(candidate_clean)
        for prev in previous_questions:
            if not prev or not prev.strip():
                continue
            prev_emb = embedding_service.embed_query(prev.strip())
            sim = compute_cosine_similarity(candidate_emb, prev_emb)
            if sim >= similarity_threshold:
                return True, sim, f"Semantic similarity ({sim:.2f} >= {similarity_threshold}) with: '{prev.strip()}'"
    except Exception:
        # Fall back to token check if embedding fails
        pass

    return False, 0.0, ""


# =========================================================
# 1. QUESTION GENERATION LANGGRAPH PIPELINE
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
    effective_user_id: Optional[str] = None
    effective_resume_id: Optional[str] = None
    effective_jd_id: Optional[str] = None
    effective_role: str = "Candidate"
    
    # Blueprint state
    turn_index: int = 1
    slot_objective: str = ""
    active_focus_topic: str = ""
    target_search_query: str = ""
    
    # Context & generation state
    grounding_context: str = ""
    insufficient_context: bool = False
    retry_count: int = 0
    candidate_question_text: str = ""
    error: Optional[str] = None
    output_question: Optional[GeneratedQuestion] = None


def validate_interview_mode_node(state: QuestionState) -> Dict[str, Any]:
    """
    Enforces deterministic source policy based on the requested interview mode.
    Disallows unpermitted sources from influencing retrieval.
    """
    requested_mode = (state.mode or "").strip().lower()
    user_id = state.user_id
    raw_role = (state.role or "").strip()
    raw_resume_id = state.resume_id
    raw_jd_id = state.jd_id

    # Check available inputs
    has_resume = bool(raw_resume_id and user_id)
    has_jd = bool(raw_jd_id and user_id)
    has_role = bool(raw_role and raw_role.lower() not in {"candidate", "general", "resume candidate", "jd candidate"})

    # Determine validated mode strictly honoring user request if valid
    validated_mode = None
    effective_resume_id = None
    effective_jd_id = None
    effective_role = raw_role or "Candidate"

    if requested_mode:
        if requested_mode == InterviewMode.RESUME.value:
            if not has_resume:
                return {"error": "Resume mode requires a valid resume_id and user_id.", "validated_mode": "invalid"}
            validated_mode = InterviewMode.RESUME.value
            effective_resume_id = raw_resume_id
            effective_role = raw_role if has_role else "Resume Candidate"

        elif requested_mode == InterviewMode.ROLE.value:
            if not raw_role:
                return {"error": "Role mode requires a target role specification.", "validated_mode": "invalid"}
            validated_mode = InterviewMode.ROLE.value
            effective_role = raw_role

        elif requested_mode == InterviewMode.RESUME_JD.value:
            if not has_resume or not has_jd:
                return {"error": "Resume + JD mode requires both resume_id and jd_id.", "validated_mode": "invalid"}
            validated_mode = InterviewMode.RESUME_JD.value
            effective_resume_id = raw_resume_id
            effective_jd_id = raw_jd_id
            effective_role = raw_role if has_role else "Candidate"

        elif requested_mode == InterviewMode.RESUME_ROLE.value:
            if not has_resume or not raw_role:
                return {"error": "Resume + Role mode requires both resume_id and target role.", "validated_mode": "invalid"}
            validated_mode = InterviewMode.RESUME_ROLE.value
            effective_resume_id = raw_resume_id
            effective_role = raw_role

        elif requested_mode == InterviewMode.ROLE_JD.value:
            if not raw_role or not has_jd:
                return {"error": "Role + JD mode requires both target role and jd_id.", "validated_mode": "invalid"}
            validated_mode = InterviewMode.ROLE_JD.value
            effective_jd_id = raw_jd_id
            effective_role = raw_role

        elif requested_mode == InterviewMode.RESUME_JD_ROLE.value:
            if not has_resume or not has_jd or not raw_role:
                return {"error": "Resume + Role + JD mode requires resume_id, jd_id, and target role.", "validated_mode": "invalid"}
            validated_mode = InterviewMode.RESUME_JD_ROLE.value
            effective_resume_id = raw_resume_id
            effective_jd_id = raw_jd_id
            effective_role = raw_role

        elif requested_mode == InterviewMode.JD.value:
            if not has_jd:
                return {"error": "JD mode requires a valid jd_id and user_id.", "validated_mode": "invalid"}
            validated_mode = InterviewMode.JD.value
            effective_jd_id = raw_jd_id
            effective_role = raw_role if has_role else "JD Candidate"

    # Fallback auto-detection if mode was not explicitly supplied
    if not validated_mode:
        if has_resume and has_jd and has_role:
            validated_mode = InterviewMode.RESUME_JD_ROLE.value
            effective_resume_id = raw_resume_id
            effective_jd_id = raw_jd_id
            effective_role = raw_role
        elif has_resume and has_jd:
            validated_mode = InterviewMode.RESUME_JD.value
            effective_resume_id = raw_resume_id
            effective_jd_id = raw_jd_id
            effective_role = raw_role if has_role else "Candidate"
        elif has_resume and has_role:
            validated_mode = InterviewMode.RESUME_ROLE.value
            effective_resume_id = raw_resume_id
            effective_role = raw_role
        elif has_resume:
            validated_mode = InterviewMode.RESUME.value
            effective_resume_id = raw_resume_id
            effective_role = raw_role if has_role else "Resume Candidate"
        elif has_role and has_jd:
            validated_mode = InterviewMode.ROLE_JD.value
            effective_jd_id = raw_jd_id
            effective_role = raw_role
        elif has_jd:
            validated_mode = InterviewMode.JD.value
            effective_jd_id = raw_jd_id
            effective_role = raw_role if has_role else "JD Candidate"
        elif has_role:
            validated_mode = InterviewMode.ROLE.value
            effective_role = raw_role
        else:
            return {
                "error": "Insufficient context: please provide a resume, job description, or target role to start an interview.",
                "validated_mode": "invalid"
            }

    return {
        "validated_mode": validated_mode,
        "effective_user_id": user_id,
        "effective_resume_id": effective_resume_id,
        "effective_jd_id": effective_jd_id,
        "effective_role": effective_role,
        "error": None
    }


def plan_blueprint_node(state: QuestionState) -> Dict[str, Any]:
    """
    Benchmark-Guided Blueprint Planning Stage.
    Determines slot objective, category, and targeted focus topic
    calibrated strictly to candidate difficulty level.
    """
    if state.error:
        return {}

    turn_idx = len(state.history) + 1
    difficulty = state.difficulty or "beginner"
    effective_role = state.effective_role or "Software Engineer"

    # 1. Fetch benchmark slot for current difficulty and turn
    slot_info = get_benchmark_slot(difficulty, turn_idx)
    slot_objective = slot_info["slot_objective"]

    # 2. Dynamic Focus Topic Selection
    active_focus_topic = ""
    if state.focus_areas and len(state.focus_areas) > 0:
        active_focus_topic = state.focus_areas[(turn_idx - 1) % len(state.focus_areas)].strip()
    else:
        role_topics = get_role_default_topics(effective_role)
        active_focus_topic = role_topics[(turn_idx - 1) % len(role_topics)].strip()

    # Target search query for retrieval
    target_query = f"{active_focus_topic} {slot_objective}".strip()

    return {
        "turn_index": turn_idx,
        "slot_objective": slot_objective,
        "active_focus_topic": active_focus_topic,
        "target_search_query": target_query
    }


def retrieve_context_node(state: QuestionState) -> Dict[str, Any]:
    """
    Source-restricted context retrieval.
    Queries only the permitted stores for the validated mode.
    Tags evidence clearly into Candidate Experience vs Job Requirements.
    """
    if state.error or state.validated_mode == "invalid":
        return {"grounding_context": "", "insufficient_context": True}

    store = ChromaStore()
    context_chunks = []
    mode = state.validated_mode
    query = state.target_search_query or f"{state.effective_role} {state.active_focus_topic}"

    resume_chunks = []
    jd_chunks = []
    role_chunks = []

    try:
        # 1. Resume Context (only if permitted by mode)
        if mode in [
            InterviewMode.RESUME_JD_ROLE.value,
            InterviewMode.RESUME_JD.value,
            InterviewMode.RESUME_ROLE.value,
            InterviewMode.RESUME.value
        ] and state.effective_resume_id and state.effective_user_id:
            res_results = store.search(
                query=query,
                user_id=state.effective_user_id,
                document_id=state.effective_resume_id,
                top_k=3
            )
            if res_results and "documents" in res_results and res_results["documents"]:
                docs = res_results["documents"][0]
                metas = res_results.get("metadatas", [[]])[0] if "metadatas" in res_results and res_results["metadatas"] else [{}] * len(docs)
                for doc, meta in zip(docs, metas):
                    if doc and doc.strip():
                        sec = (meta or {}).get("section", "experience")
                        resume_chunks.append(f"[{sec.upper()}] {doc.strip()}")

        # 2. Job Description Context (only if permitted by mode)
        if mode in [
            InterviewMode.RESUME_JD_ROLE.value,
            InterviewMode.RESUME_JD.value,
            InterviewMode.ROLE_JD.value,
            InterviewMode.JD.value
        ] and state.effective_jd_id and state.effective_user_id:
            jd_results = store.search(
                query=query,
                user_id=state.effective_user_id,
                document_id=state.effective_jd_id,
                top_k=3
            )
            if jd_results and "documents" in jd_results and jd_results["documents"]:
                docs = jd_results["documents"][0]
                metas = jd_results.get("metadatas", [[]])[0] if "metadatas" in jd_results and jd_results["metadatas"] else [{}] * len(docs)
                for doc, meta in zip(docs, metas):
                    if doc and doc.strip():
                        sec = (meta or {}).get("section", "requirements")
                        jd_chunks.append(f"[{sec.upper()}] {doc.strip()}")

        # 3. Role Knowledge Base (only if permitted by mode)
        role_modes = [
            InterviewMode.RESUME_JD_ROLE.value,
            InterviewMode.RESUME_ROLE.value,
            InterviewMode.ROLE_JD.value,
            InterviewMode.ROLE.value
        ]
        if mode in role_modes and state.effective_role and state.effective_role.strip():
            target_role = state.effective_role.strip()
            role_results = store.search_role(
                query=query,
                role=target_role,
                top_k=3
            )
            if role_results and "documents" in role_results and role_results["documents"]:
                docs = role_results["documents"][0]
                metas = role_results.get("metadatas", [[]])[0] if "metadatas" in role_results and role_results["metadatas"] else [{}] * len(docs)
                for doc, meta in zip(docs, metas):
                    if doc and doc.strip():
                        sec = (meta or {}).get("section", "core_domain")
                        role_chunks.append(f"[{sec.upper()}] {doc.strip()}")

            if not role_chunks:
                role_chunks.append(f"[CORE DOMAIN] Standard engineering competencies and architectural best practices for {target_role}.")

    except Exception:
        pass

    # Build clearly demarcated context sections with section provenance
    if resume_chunks:
        context_chunks.append(
            "=== [Candidate Resume Experience - What candidate has done] ===\n" +
            "\n".join(f"- {c}" for c in resume_chunks)
        )
    if jd_chunks:
        context_chunks.append(
            "=== [Target Job Description Requirements - What employer expects] ===\n" +
            "\n".join(f"- {c}" for c in jd_chunks)
        )
    if role_chunks:
        context_chunks.append(
            f"=== [Standard Industry Best Practices for {state.effective_role}] ===\n" +
            "\n".join(f"- {c}" for c in role_chunks)
        )

    insufficient = False
    if not context_chunks:
        insufficient = True
        context_chunks.append(
            f"=== [Standard Knowledge for {state.effective_role}] ===\n"
            f"Assess core competencies in {state.active_focus_topic or state.effective_role}."
        )

    return {
        "grounding_context": "\n\n".join(context_chunks),
        "insufficient_context": insufficient
    }


def generate_question_node(state: QuestionState) -> Dict[str, Any]:
    """
    Generates structured question strictly grounded in retrieved evidence.
    Enforces non-repetition against previous turns and validates output schema.
    """
    if state.error:
        return {}

    llm = LLMClient().get_llm()
    role = state.effective_role or "Candidate"
    difficulty = state.difficulty or "beginner"
    turn_num = state.turn_index or (len(state.history) + 1)
    focus_topic = state.active_focus_topic or role
    slot_objective = state.slot_objective or "practical technical trade-offs"

    # Retrieve benchmark rubric specification for current difficulty and turn
    slot_info = get_benchmark_slot(difficulty, turn_num)
    benchmark_category = slot_info.get("category", "Technical Concept")
    benchmark_format = slot_info.get("format", "Scenario")
    type_name = slot_info.get("type_name", "Technical Concept")
    style_instructions = slot_info.get("style_instructions", "")
    interviewer_intent = slot_info.get("interviewer_intent", "")
    realistic_examples = slot_info.get("realistic_examples", [])
    lvl_key = normalize_level_key(difficulty)

    # Realistic few-shot examples for human interviewer tone
    examples_block = ""
    if realistic_examples:
        examples_block = (
            f"QUESTION STYLE BENCHMARKS (Style and tone guidance ONLY. Do NOT copy these questions verbatim; your question MUST focus on '{focus_topic}' for the '{role}' role):\n"
            + "\n".join(f'  - Reference Style: "{ex}"' for ex in realistic_examples[:2])
        )

    difficulty_rules = ""
    if lvl_key == "beginner":
        difficulty_rules = (
            "STRICT DIFFICULTY RULES FOR BEGINNER / JUNIOR LEVEL:\n"
            f"- Ask a direct, foundational technical question focused on {focus_topic}: core syntax, how things work under the hood, basic coding logic, common bugs/errors, or small component structure.\n"
            "- FORBIDDEN: Do NOT ask about microservices, distributed systems, high concurrency, CAP theorem, or architectural trade-offs.\n"
            "- The question MUST feel like an approachable, fair technical question for a junior engineer."
        )
    elif lvl_key == "intermediate":
        difficulty_rules = (
            "CALIBRATION FOR MID-LEVEL PROFESSIONAL:\n"
            f"- Ask about practical production implementation with {focus_topic}, framework internals (re-rendering, indexing, async event loop), subtle race conditions, error resilience, and engineering trade-offs.\n"
            "- FORBIDDEN: Do NOT ask trivial syntax definitions ('what is a variable') or exotic multi-region consensus algorithms."
        )
    else:
        difficulty_rules = (
            "CALIBRATION FOR SENIOR / STAFF ENGINEER:\n"
            f"- Ask about high-scale distributed systems, low-level concurrency/memory internals with {focus_topic}, cascading failure recovery, complex system design, and architectural leadership.\n"
            "- FORBIDDEN: Do NOT ask basic trivia or surface-level CRUD walkthroughs."
        )

    # Extract all previous question texts for prompt-level negative constraint
    previous_questions = []
    if state.history:
        for i, h in enumerate(state.history):
            q_text = h.get("question", "") if isinstance(h, dict) else getattr(h, "question", "")
            if q_text:
                status_note = " [Skipped by candidate]" if (isinstance(h, dict) and h.get("is_skipped")) else ""
                previous_questions.append(f"- Turn #{i+1}: {q_text}{status_note}")

    prev_questions_block = ""
    if previous_questions:
        prev_questions_block = (
            "QUESTIONS ALREADY ASKED IN THIS SESSION (STRICT RULE: NEVER repeat, rephrase, or re-test any of these concepts):\n"
            + "\n".join(previous_questions)
        )

    system_prompt = f"""You are PrepNova's senior technical interviewer conducting a realistic, adaptive mock interview.
Your goal is to generate exactly ONE targeted, natural-sounding, non-repeating interview question.

INTERVIEW BENCHMARK SPECIFICATION FOR TURN #{turn_num}:
- Target Category: {benchmark_category} ({type_name})
- Target Format: {benchmark_format}
- Slot Goal: {slot_objective}
- Interviewer Objective: {interviewer_intent}
- Style Instructions: {style_instructions}

{difficulty_rules}

{examples_block}

CRITICAL RULES:
1. SOUND LIKE A REAL HUMAN INTERVIEWER: Avoid robotic, academic essay prompts (e.g. NEVER ask 'what framework contracts do you treat as non-negotiable?'). Ask a direct, realistic question with practical context.
2. STRICT ORIGINALITY & TOPIC GROUNDING: Generate a fresh, original question specifically for '{role}' focused on '{focus_topic}'. NEVER copy, quote, or parrot the example questions.
3. STRICT NON-REPETITION: NEVER repeat or re-test any question or concept previously asked in this session.
4. GROUNDING: If resume context exists, weave in their actual experience. If JD context exists, relate to employer requirements without assuming candidate knows unmentioned tech.

You MUST respond strictly with valid JSON only matching this schema:
{{
  "question": "string containing the full, natural question text",
  "category": "{benchmark_category}",
  "format": "{benchmark_format}",
  "focus_topic": "{focus_topic}",
  "intent": "{interviewer_intent}",
  "expected_concepts": ["concept1", "concept2", "concept3"],
  "grounding_source": "resume | jd | role | general"
}}
Return valid JSON only with NO markdown fences and no extra explanation."""

    user_prompt = f"""Role: {role}
Difficulty Level: {difficulty}
Interview Mode: {state.validated_mode}
Session Turn: #{turn_num}
Question Type: {type_name} ({benchmark_category})
Target Topic: {focus_topic}
Slot Goal: {slot_objective}

{prev_questions_block}

Retrieved Grounding Evidence:
----------------------------------------
{state.grounding_context}
----------------------------------------

Generate the natural interview question for Turn #{turn_num} now."""

    embedding_service = get_shared_embedding_service()
    prev_question_texts = [
        (h.get("question", "") if isinstance(h, dict) else getattr(h, "question", "")).strip()
        for h in state.history if (h.get("question") if isinstance(h, dict) else getattr(h, "question", None))
    ]

    # Bounded generation & validation loop (up to 2 attempts)
    for attempt in range(2):
        try:
            response = llm.invoke([
                SystemMessage(content=system_prompt),
                HumanMessage(content=user_prompt if attempt == 0 else f"{user_prompt}\n\nATTEMPT 2: Previous attempt was too close to an earlier turn or inappropriate for {difficulty}. Generate a fresh question testing a completely different technical angle.")
            ])

            raw = response.content.replace("```json", "").replace("```", "").strip()
            data = json.loads(raw)

            candidate_q = data.get("question", "").strip()
            if not candidate_q:
                continue

            # Deterministic Repetition & Duplicate Check (tightened threshold 0.78)
            is_dup, score, reason = is_semantic_duplicate(
                candidate_question=candidate_q,
                previous_questions=prev_question_texts,
                embedding_service=embedding_service,
                similarity_threshold=0.78,
                jaccard_threshold=0.60
            )

            # Strict rejection: If duplicate detected on any attempt, do NOT accept it!
            if is_dup:
                if attempt == 0:
                    continue
                else:
                    break

            # Success: Assemble verified GeneratedQuestion
            generated = GeneratedQuestion(
                id=f"q_{turn_num}_{abs(hash(candidate_q))}",
                question=candidate_q,
                category=data.get("category", benchmark_category),
                format=data.get("format", benchmark_format),
                difficulty=difficulty,
                expected_concepts=data.get("expected_concepts", [focus_topic]),
                grounding_context=state.grounding_context[:450] if state.grounding_context else None,
                source="langgraph_rag",
                role=role,
                focus_topic=data.get("focus_topic", focus_topic),
                intent=data.get("intent", interviewer_intent or f"Assess {type_name} in {focus_topic}"),
                grounding_source=data.get("grounding_source", "context")
            )
            return {"output_question": generated}

        except Exception as e:
            logger.warning(f"[generate_question_node] Attempt {attempt} failed with error: {e}", exc_info=True)
            continue

    # Calibrated Benchmark Fallback: specifically tailored to difficulty and turn type
    distinct_fallback = get_calibrated_fallback_question(
        difficulty=difficulty,
        turn_index=turn_num,
        focus_topic=focus_topic,
        role=role
    )

    fallback_question = GeneratedQuestion(
        id=f"q_fallback_{turn_num}_{Date_now_id()}",
        question=distinct_fallback,
        category=benchmark_category,
        format=benchmark_format,
        difficulty=difficulty,
        expected_concepts=[focus_topic, type_name],
        grounding_context=state.grounding_context[:450] if state.grounding_context else None,
        source="calibrated_benchmark_fallback",
        role=role,
        focus_topic=focus_topic,
        intent=interviewer_intent or f"Assess {type_name} in {focus_topic}",
        grounding_source="benchmark"
    )
    return {"output_question": fallback_question}


def Date_now_id():
    import time
    return int(time.time() * 1000)


# Build Question Generation Graph
def build_question_graph():
    builder = StateGraph(QuestionState)
    builder.add_node("validate_mode", validate_interview_mode_node)
    builder.add_node("plan_blueprint", plan_blueprint_node)
    builder.add_node("retrieve_context", retrieve_context_node)
    builder.add_node("generate_question", generate_question_node)

    builder.add_edge(START, "validate_mode")
    builder.add_edge("validate_mode", "plan_blueprint")
    builder.add_edge("plan_blueprint", "retrieve_context")
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


def evaluate_full_session(request: EvaluateSessionRequest) -> SessionEvaluationResult:
    """
    Evaluates the entire interview transcript in a single LLM call.
    Drastically saves token usage and computes holistic feedback.
    """
    llm = LLMClient().get_llm()
    transcript = request.transcript or []

    if not transcript:
        return SessionEvaluationResult(
            overall_score=7.0,
            rating_label="Interview ready",
            category_scores={"correctness": 7.0, "clarity": 7.0, "depth": 7.0, "relevance": 7.0},
            feedback="No answers submitted in this session.",
            strengths=["Session initialized."],
            areas_of_improvement=["Submit answers to receive personalized feedback."],
            evaluations=[],
            source="empty_session"
        )

    transcript_lines = []
    for item in transcript:
        transcript_lines.append(
            f"Question #{item.question_index + 1} ({item.difficulty}): {item.question}\n"
            f"Candidate Answer: {item.answer or '[No Answer / Skipped]'}"
        )
    formatted_transcript = "\n\n".join(transcript_lines)

    system_prompt = """You are PrepNova's chief technical interviewer evaluating a completed technical interview session.
Review the complete candidate transcript across all questions.
Evaluate each question turn and compute the final overall scorecard.

You MUST output valid JSON strictly matching this schema:
{
  "overall_score": number (0 to 10 scale),
  "category_scores": {
    "correctness": number,
    "clarity": number,
    "depth": number,
    "relevance": number
  },
  "feedback": "3-4 sentences summarizing candidate's overall readiness, technical strengths, and main growth area",
  "strengths": ["specific strength 1", "specific strength 2", "specific strength 3"],
  "areas_of_improvement": ["actionable advice 1", "actionable advice 2"],
  "evaluations": [
    {
      "question_index": number (0-indexed integer matching the question index),
      "score": number (0 to 10),
      "feedback": "1-2 sentences on this specific answer",
      "correctness": number,
      "clarity": number,
      "depth": number
    }
  ]
}
Return JSON only without any markdown code fences."""

    user_prompt = f"""Role: {request.role}
Target Difficulty: {request.difficulty}
Total Questions Completed: {len(transcript)}

Full Interview Transcript:
===========================
{formatted_transcript}
===========================

Evaluate the complete interview session now."""

    try:
        response = llm.invoke([
            SystemMessage(content=system_prompt),
            HumanMessage(content=user_prompt)
        ])

        raw = response.content.replace("```json", "").replace("```", "").strip()
        data = json.loads(raw)

        overall = max(0.0, min(10.0, float(data.get("overall_score", 7.0))))
        cat_scores = data.get("category_scores", {})
        for k in ["correctness", "clarity", "depth", "relevance"]:
            if k not in cat_scores:
                cat_scores[k] = overall
            else:
                cat_scores[k] = round(max(0.0, min(10.0, float(cat_scores[k]))), 1)

        eval_turns = []
        raw_evals = data.get("evaluations", [])
        for idx, item in enumerate(raw_evals):
            q_idx = int(item.get("question_index", idx))
            sc = round(max(0.0, min(10.0, float(item.get("score", overall)))), 1)
            eval_turns.append(EvaluatedTurn(
                question_index=q_idx,
                score=sc,
                feedback=str(item.get("feedback", "Answer evaluated.")),
                correctness=round(float(item.get("correctness", sc)), 1),
                clarity=round(float(item.get("clarity", sc)), 1),
                depth=round(float(item.get("depth", sc)), 1)
            ))

        # Fallback if evaluations list was missing
        if not eval_turns and transcript:
            for idx, item in enumerate(transcript):
                eval_turns.append(EvaluatedTurn(
                    question_index=item.question_index,
                    score=overall,
                    feedback="Demonstrated technical familiarity with core concepts.",
                    correctness=overall,
                    clarity=overall,
                    depth=overall
                ))

        return SessionEvaluationResult(
            overall_score=round(overall, 1),
            rating_label=get_rating_label(overall),
            category_scores=cat_scores,
            feedback=data.get("feedback", f"Completed interview session for {request.role}."),
            strengths=data.get("strengths", ["Solid technical foundation."]),
            areas_of_improvement=data.get("areas_of_improvement", ["Continue practicing system trade-offs."]),
            evaluations=eval_turns,
            source="batch_llm"
        )

    except Exception as e:
        default_score = 7.0
        fallback_turns = [
            EvaluatedTurn(
                question_index=item.question_index,
                score=default_score,
                feedback="Good effort. Aim for more precise technical terminology and concrete examples.",
                correctness=7.0,
                clarity=7.0,
                depth=7.0
            ) for item in transcript
        ]
        return SessionEvaluationResult(
            overall_score=default_score,
            rating_label=get_rating_label(default_score),
            category_scores={"correctness": 7.0, "clarity": 7.0, "depth": 7.0, "relevance": 7.0},
            feedback=f"Candidate successfully completed {len(transcript)} questions for {request.role}.",
            strengths=["Consistent pacing", "Addressed problem prompts"],
            areas_of_improvement=["Provide deeper trade-off comparisons in system architecture"],
            evaluations=fallback_turns,
            source="fallback_batch"
        )
