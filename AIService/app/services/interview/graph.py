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
    EvaluateAnswerRequest,
    EvaluateSessionRequest,
    SessionEvaluationResult,
    EvaluatedTurn
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

    # All 7 Context Combinations:
    if has_resume and has_jd and has_role:
        mode = InterviewMode.RESUME_JD_ROLE.value
    elif has_resume and has_jd:
        mode = InterviewMode.RESUME_JD.value
    elif has_resume and has_role:
        mode = InterviewMode.RESUME_ROLE.value
    elif has_resume:
        mode = InterviewMode.RESUME.value
    elif has_role and has_jd:
        mode = InterviewMode.ROLE_JD.value
    elif has_jd:
        mode = InterviewMode.JD.value
    elif has_role:
        mode = InterviewMode.ROLE.value
    else:
        return {
            "error": "Insufficient context: please provide a resume, job description, or target role to start an interview.",
            "validated_mode": "invalid"
        }

    return {"validated_mode": mode, "error": None}


def retrieve_context_node(state: QuestionState) -> Dict[str, Any]:
    if state.error or state.validated_mode == "invalid":
        return {"grounding_context": ""}

    store = ChromaStore()
    context_chunks = []
    mode = state.validated_mode

    # Dynamic search theme by turn to prevent repetitive chunk retrieval
    turn_index = len(state.history) + 1
    themes = [
        "core technical architecture, systems, and primary stack responsibilities",
        "hands-on implementation, debugging edge cases, and framework trade-offs",
        "production workflows, testing, continuous integration, and performance optimization",
        "resilience, scalability, distributed patterns, and complex technical challenges"
    ]
    current_theme = themes[(turn_index - 1) % len(themes)]

    query = f"{state.role or ''} {' '.join(state.focus_areas)} {current_theme}".strip()

    try:
        # 1. Resume Context (if resume present in mode)
        if mode in [
            InterviewMode.RESUME_JD_ROLE.value,
            InterviewMode.RESUME_JD.value,
            InterviewMode.RESUME_ROLE.value,
            InterviewMode.RESUME.value
        ]:
            if state.user_id and state.resume_id:
                results = store.search(
                    query=query,
                    user_id=state.user_id,
                    document_id=state.resume_id,
                    top_k=4
                )
                if results and "documents" in results and results["documents"]:
                    for doc in results["documents"][0]:
                        context_chunks.append(f"[Resume Context]: {doc}")

        # 2. Job Description Context (if JD present in mode)
        if mode in [
            InterviewMode.RESUME_JD_ROLE.value,
            InterviewMode.RESUME_JD.value,
            InterviewMode.ROLE_JD.value,
            InterviewMode.JD.value
        ]:
            if state.user_id and state.jd_id:
                jd_results = store.search(
                    query=query,
                    user_id=state.user_id,
                    document_id=state.jd_id,
                    top_k=4
                )
                if jd_results and "documents" in jd_results and jd_results["documents"]:
                    for doc in jd_results["documents"][0]:
                        context_chunks.append(f"[Job Description Context]: {doc}")

        # 3. Role Knowledge Base (if role present in mode, or as fallback)
        if mode in [
            InterviewMode.RESUME_JD_ROLE.value,
            InterviewMode.RESUME_ROLE.value,
            InterviewMode.ROLE_JD.value,
            InterviewMode.ROLE.value
        ] or not context_chunks:
            target_role = state.role or "Software Engineer"
            role_results = store.search_role(
                query=query,
                role=target_role,
                top_k=3
            )
            if role_results and "documents" in role_results and role_results["documents"]:
                for doc in role_results["documents"][0]:
                    context_chunks.append(f"[Role Knowledge]: {doc}")

    except Exception as e:
        context_chunks.append(f"[Fallback Context]: Core skills, architecture, and responsibilities for {state.role or 'Candidate'}")

    grounding_text = "\n\n".join(context_chunks)
    return {"grounding_context": grounding_text}


def generate_question_node(state: QuestionState) -> Dict[str, Any]:
    if state.error:
        return {}

    llm = LLMClient().get_llm()
    role = state.role or "Candidate"
    difficulty = state.difficulty or "beginner"
    turn_num = len(state.history) + 1

    # Include ALL previously asked questions to strictly enforce non-repetition
    previous_questions_text = ""
    if state.history:
        prev_list = [f"- Turn {i+1}: {h.get('question', '')}" for i, h in enumerate(state.history) if h.get("question")]
        previous_questions_text = "Questions ALREADY asked in this session (NEVER repeat or closely rephrase any of these):\n" + "\n".join(prev_list)

    system_prompt = f"""You are PrepNova's senior technical interviewer conducting an adaptive interview.
Your goal is to generate a realistic, targeted, and clear interview question strictly grounded in the provided context, role, and difficulty level.

STRICT NON-REPETITION RULES:
- Never repeat a topic, question, or scenario that was already asked in this session.
- If previous questions asked about architecture, transition into practical debugging, implementation trade-offs, or system edge cases.
- Progress the interview logically like an experienced interviewer.

You MUST output valid JSON only matching this schema:
{{
  "question": "string containing the interview question text",
  "category": "Resume-Based | JD-Based | Technical Concept | Scenario-Based | System Design | Debugging | Behavioral",
  "format": "Scenario | Coding | Short Answer | Behavioral",
  "expected_concepts": ["keyword1", "keyword2", "keyword3"],
  "sample_answer_points": "brief description of what a good answer covers"
}}
Return JSON only with no markdown formatting."""

    user_prompt = f"""Role: {role}
Difficulty Level: {difficulty}
Interview Mode: {state.validated_mode}
Session Turn: #{turn_num}
Focus Areas: {', '.join(state.focus_areas) if state.focus_areas else 'Core technical skills and responsibilities'}

{previous_questions_text}

Retrieved Grounding Context:
---
{state.grounding_context if state.grounding_context else f'Standard industry responsibilities and expectations for {role}.'}
---

Generate exactly one new, non-repeating interview question for Turn #{turn_num}."""

    try:
        response = llm.invoke([
            SystemMessage(content=system_prompt),
            HumanMessage(content=user_prompt)
        ])

        raw_content = response.content.replace("```json", "").replace("```", "").strip()
        data = json.loads(raw_content)

        generated = GeneratedQuestion(
            id=f"q_{turn_num}_{abs(hash(data.get('question', '')))}",
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
        fallback_pool = [
            f"In your work with {role}, how do you approach debugging production failures and ensuring system reliability under pressure?",
            f"Walk me through a technical trade-off you had to make in a recent {role} project regarding performance versus simplicity.",
            f"How do you design scalable data flow and state management when building applications for {role}?",
            f"Can you discuss a scenario where you identified a performance bottleneck or memory leak, and explain how you resolved it?",
            f"What automated testing and code review practices do you consider essential for high-velocity teams in {role}?",
            f"How do you handle breaking API changes or backward compatibility when evolving existing systems in {role}?"
        ]
        fallback_text = fallback_pool[(turn_num - 1) % len(fallback_pool)]

        fallback_question = GeneratedQuestion(
            id=f"q_fallback_{turn_num}_{Date_now_id()}",
            question=fallback_text,
            category="Scenario-Based",
            format="Scenario",
            difficulty=difficulty,
            expected_concepts=[role, "architecture", "trade-offs"],
            grounding_context=state.grounding_context[:400] if state.grounding_context else None,
            source="fallback_diverse",
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
