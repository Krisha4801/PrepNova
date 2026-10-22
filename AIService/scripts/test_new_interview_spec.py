import sys
from pathlib import Path
ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))

from app.schemas.interview import (
    PlanBlueprintRequest,
    NextTurnRequest,
    EvaluateSessionRequest,
    SessionQAPair,
    DifficultyLevel
)
from app.services.interview.graph import (
    plan_interview_blueprint,
    generate_next_turn,
    evaluate_full_session
)

def run_tests():
    print("=" * 70)
    print("AUDITING NEW INTERVIEW SPECIFICATION CONTRACTS")
    print("=" * 70)

    # TEST 1: Blueprint Generation
    print("\n--- Test 1: Blueprint Generation ---")
    req = PlanBlueprintRequest(
        role="Frontend Engineer",
        difficulty=DifficultyLevel.INTERMEDIATE,
        target_duration_minutes=30
    )
    blueprint = plan_interview_blueprint(req)
    assert blueprint.version == 1, "Blueprint version must be 1"
    assert len(blueprint.sections) >= 5, f"Expected at least 5 sections, got {len(blueprint.sections)}"
    assert blueprint.sections[0].id == "introduction", "First section must always be introduction"
    assert blueprint.sections[0].target_question_count == 1
    assert blueprint.global_rules.get("evaluateOnlyAfterCompletion") is True
    print(f"  [PASS] Blueprint created with {len(blueprint.sections)} sections. First section is: {blueprint.sections[0].title}")

    # TEST 2: Turn 0 - Opening Introduction
    print("\n--- Test 2: Turn 0 - Opening Introduction ---")
    next_turn_req_0 = NextTurnRequest(
        session_id="test_sess_1",
        role="Frontend Engineer",
        difficulty="intermediate",
        blueprint=blueprint,
        history=[],
        max_turns=5
    )
    turn_0 = generate_next_turn(next_turn_req_0)
    assert turn_0.action == "ASK_QUESTION"
    assert turn_0.section_id == "introduction"
    assert turn_0.question_type == "primary"
    assert "introduce yourself" in turn_0.interviewer_text.lower()
    assert turn_0.is_complete is False
    print(f"  [PASS] Turn 0 correctly returns open introduction: \"{turn_0.interviewer_text[:60]}...\"")

    # TEST 3: Turn 1 - Advance from Introduction (NO follow-up on intro)
    print("\n--- Test 3: Turn 1 - Transition from Introduction to Next Section ---")
    next_turn_req_1 = NextTurnRequest(
        session_id="test_sess_1",
        role="Frontend Engineer",
        difficulty="intermediate",
        blueprint=blueprint,
        history=[
            {
                "questionId": "q_0",
                "section_id": "introduction",
                "question_type": "primary",
                "question": turn_0.interviewer_text,
                "answer": "Hi, I am a frontend developer with 2 years of experience using React, Redux, and TypeScript."
            }
        ],
        total_turns_taken=1,
        max_turns=5
    )
    turn_1 = generate_next_turn(next_turn_req_1)
    assert turn_1.action == "ASK_QUESTION"
    assert turn_1.section_id != "introduction", f"Must transition to next section, got {turn_1.section_id}"
    assert turn_1.question_type == "primary", "Transition to new section must be a primary question"
    print(f"  [PASS] Turn 1 correctly transitioned to section '{turn_1.section_id}': \"{turn_1.interviewer_text[:60]}...\"")

    # TEST 4: Turn Completion Limit
    print("\n--- Test 4: Turn Limit Completion ---")
    next_turn_req_max = NextTurnRequest(
        session_id="test_sess_1",
        role="Frontend Engineer",
        difficulty="intermediate",
        blueprint=blueprint,
        history=[{"question": "q", "answer": "a", "section_id": "projects"}],
        total_turns_taken=5,
        max_turns=5
    )
    turn_end = generate_next_turn(next_turn_req_max)
    assert turn_end.action == "COMPLETE"
    assert turn_end.is_complete is True
    print(f"  [PASS] Turn limit reached correctly returns COMPLETE action: \"{turn_end.interviewer_text}\"")

    # TEST 5: End-Only Evaluation with Introduction Evaluation
    print("\n--- Test 5: End-Only Holistic Session Evaluation ---")
    eval_req = EvaluateSessionRequest(
        role="Frontend Engineer",
        difficulty="intermediate",
        transcript=[
            SessionQAPair(
                question_index=0,
                section_id="introduction",
                question="To get started, please introduce yourself and highlight experiences relevant to this role.",
                answer="I am a React developer with 2 years experience building ecommerce platforms. I optimized checkout latency by 35% using code splitting and memoization.",
                difficulty="intermediate"
            ),
            SessionQAPair(
                question_index=1,
                section_id="projects",
                question="Tell me about a challenging project and how you resolved state management bottlenecks.",
                answer="In our checkout funnel, multiple re-renders caused jank. We decoupled form state using Zustand and selective subscriptions.",
                difficulty="intermediate"
            )
        ]
    )
    eval_res = evaluate_full_session(eval_req)
    assert eval_res.overall_score >= 0.0 and eval_res.overall_score <= 10.0
    assert eval_res.intro_evaluation is not None, "intro_evaluation must be present"
    assert eval_res.intro_evaluation.score >= 0.0
    assert len(eval_res.intro_evaluation.strengths) > 0
    assert len(eval_res.category_scores) >= 5, f"Expected 5 category scores, got {eval_res.category_scores.keys()}"
    assert "correctness" in eval_res.category_scores
    assert "clarity" in eval_res.category_scores
    assert "depth" in eval_res.category_scores
    assert "relevance" in eval_res.category_scores
    assert "completeness" in eval_res.category_scores
    assert len(eval_res.preparation_plan) > 0
    print(f"  [PASS] End-only session evaluated successfully!")
    print(f"         Overall score: {eval_res.overall_score}/10 ({eval_res.rating_label})")
    print(f"         Intro score: {eval_res.intro_evaluation.score}/10")
    print(f"         Intro strengths: {eval_res.intro_evaluation.strengths}")
    print(f"         Prep plan actions: {len(eval_res.preparation_plan)}")

    print("\n" + "=" * 70)
    print("ALL 5 SPECIFICATION TESTS PASSED SUCCESSFULLY!")
    print("=" * 70)

if __name__ == "__main__":
    run_tests()
