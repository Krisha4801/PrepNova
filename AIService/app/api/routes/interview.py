from fastapi import APIRouter, HTTPException, status
from app.schemas.interview import (
    GenerateQuestionRequest,
    GeneratedQuestion,
    EvaluateAnswerRequest,
    AnswerEvaluation,
    EvaluateSessionRequest,
    SessionEvaluationResult
)
from app.services.interview.graph import (
    question_workflow,
    evaluation_workflow,
    evaluate_full_session,
    QuestionState,
    EvaluationState
)

router = APIRouter(
    prefix="/interview",
    tags=["Interview Engine"],
)


@router.post("/generate-question", response_model=GeneratedQuestion)
async def generate_interview_question(request: GenerateQuestionRequest):
    """
    Executes LangGraph workflow to retrieve relevant resume/JD/role context
    and generate a context-grounded question for the requested difficulty.
    """
    state_input = QuestionState(
        user_id=request.user_id,
        role=request.role,
        difficulty=request.difficulty.value if hasattr(request.difficulty, "value") else str(request.difficulty),
        mode=request.mode.value if request.mode and hasattr(request.mode, "value") else (str(request.mode) if request.mode else None),
        resume_id=request.resume_id,
        jd_id=request.jd_id,
        history=[h.model_dump() if hasattr(h, "model_dump") else h for h in request.history],
        asked_question_ids=request.asked_question_ids,
        focus_areas=request.focus_areas,
    )

    try:
        final_state = question_workflow.invoke(state_input)
        
        if final_state.get("error"):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=final_state["error"]
            )

        output_q = final_state.get("output_question")
        if not output_q:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to generate question from LangGraph workflow."
            )

        return output_q

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"LangGraph execution error: {str(e)}"
        )


@router.post("/evaluate-answer", response_model=AnswerEvaluation)
async def evaluate_interview_answer(request: EvaluateAnswerRequest):
    """
    Executes LangGraph workflow to evaluate candidate answer against the 5-part rubric.
    """
    state_input = EvaluationState(
        role=request.role,
        difficulty=request.difficulty,
        question=request.question,
        answer=request.answer,
        grounding_context=request.grounding_context,
        format=request.format or "Scenario",
        expected_concepts=request.expected_concepts or []
    )

    try:
        final_state = evaluation_workflow.invoke(state_input)
        output_eval = final_state.get("evaluation")

        if not output_eval:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to evaluate answer from LangGraph workflow."
            )

        return output_eval

    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"LangGraph evaluation error: {str(e)}"
        )


@router.post("/evaluate-session", response_model=SessionEvaluationResult)
async def evaluate_interview_session(request: EvaluateSessionRequest):
    """
    Evaluates an entire interview session in a single batch LLM call.
    Reduces token usage, avoids turn-by-turn wait times, and provides a holistic scorecard.
    """
    try:
        return evaluate_full_session(request)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Session evaluation error: {str(e)}"
        )
