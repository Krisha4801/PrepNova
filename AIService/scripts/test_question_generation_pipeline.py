"""
Automated Comprehensive Test Suite for PrepNova Question Generation Architecture.
Validates:
1. Deterministic mode validation and source policy enforcement across all context combinations.
2. Cross-source pollution prevention (ensuring unpermitted IDs cannot leak).
3. Lightweight blueprint planning and slot rotation.
4. Exact and semantic duplicate detection (token Jaccard + embedding cosine similarity).
5. Schema compliance and graceful error handling.
"""

import sys
from pathlib import Path

# Add project root to path
ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))

from app.schemas.interview import InterviewMode, DifficultyLevel, GeneratedQuestion
from app.services.interview.graph import (
    question_workflow,
    QuestionState,
    validate_interview_mode_node,
    plan_blueprint_node,
    is_semantic_duplicate,
    normalize_text_tokens,
    compute_jaccard_similarity,
    compute_cosine_similarity
)
from app.services.embeddings.service import EmbeddingService


def run_tests():
    print("=" * 70)
    print("RUNNING PREPNOVA QUESTION GENERATION PIPELINE AUDIT TEST SUITE")
    print("=" * 70)

    embedding_service = EmbeddingService()
    passed = 0
    total = 0

    def check(name: str, condition: bool, detail: str = ""):
        nonlocal passed, total
        total += 1
        if condition:
            passed += 1
            print(f"  [PASS] {name}")
        else:
            print(f"  [FAIL] {name}: {detail}")

    # =========================================================
    # TEST SUITE 1: SOURCE MODE ENFORCEMENT & POLLUTION GUARDS
    # =========================================================
    print("\n--- Test Suite 1: Source Policy & Mode Enforcement ---")

    # 1.1 Role mode with accidental resume_id and jd_id
    state_role = QuestionState(
        mode=InterviewMode.ROLE.value,
        role="Backend Engineer",
        user_id="user_123",
        resume_id="polluted_resume_id",
        jd_id="polluted_jd_id"
    )
    res_role = validate_interview_mode_node(state_role)
    check(
        "1.1 Role Mode: strictly isolates role and zeros out resume/JD",
        res_role.get("validated_mode") == InterviewMode.ROLE.value and
        res_role.get("effective_resume_id") is None and
        res_role.get("effective_jd_id") is None and
        res_role.get("effective_role") == "Backend Engineer"
    )

    # 1.2 Resume mode with accidental jd_id and role
    state_resume = QuestionState(
        mode=InterviewMode.RESUME.value,
        role="Accidental Role",
        user_id="user_123",
        resume_id="valid_resume_id",
        jd_id="polluted_jd_id"
    )
    res_resume = validate_interview_mode_node(state_resume)
    check(
        "1.2 Resume Mode: isolates resume and strips unpermitted JD",
        res_resume.get("validated_mode") == InterviewMode.RESUME.value and
        res_resume.get("effective_resume_id") == "valid_resume_id" and
        res_resume.get("effective_jd_id") is None
    )

    # 1.3 Resume + JD mode
    state_r_jd = QuestionState(
        mode=InterviewMode.RESUME_JD.value,
        user_id="user_123",
        resume_id="res_1",
        jd_id="jd_1"
    )
    res_r_jd = validate_interview_mode_node(state_r_jd)
    check(
        "1.3 Resume + JD Mode: enables both documents",
        res_r_jd.get("validated_mode") == InterviewMode.RESUME_JD.value and
        res_r_jd.get("effective_resume_id") == "res_1" and
        res_r_jd.get("effective_jd_id") == "jd_1"
    )

    # 1.4 Resume + Role mode
    state_r_role = QuestionState(
        mode=InterviewMode.RESUME_ROLE.value,
        role="Frontend Developer",
        user_id="user_123",
        resume_id="res_1"
    )
    res_r_role = validate_interview_mode_node(state_r_role)
    check(
        "1.4 Resume + Role Mode: enables resume and role while excluding JD",
        res_r_role.get("validated_mode") == InterviewMode.RESUME_ROLE.value and
        res_r_role.get("effective_resume_id") == "res_1" and
        res_r_role.get("effective_jd_id") is None and
        res_r_role.get("effective_role") == "Frontend Developer"
    )

    # 1.5 Role + JD mode
    state_role_jd = QuestionState(
        mode=InterviewMode.ROLE_JD.value,
        role="DevOps Engineer",
        user_id="user_123",
        jd_id="jd_1",
        resume_id="polluted_resume_id"
    )
    res_role_jd = validate_interview_mode_node(state_role_jd)
    check(
        "1.5 Role + JD Mode: enables role and JD while stripping resume",
        res_role_jd.get("validated_mode") == InterviewMode.ROLE_JD.value and
        res_role_jd.get("effective_jd_id") == "jd_1" and
        res_role_jd.get("effective_resume_id") is None and
        res_role_jd.get("effective_role") == "DevOps Engineer"
    )

    # 1.6 Resume + JD + Role mode
    state_all = QuestionState(
        mode=InterviewMode.RESUME_JD_ROLE.value,
        role="Fullstack Engineer",
        user_id="user_123",
        resume_id="res_1",
        jd_id="jd_1"
    )
    res_all = validate_interview_mode_node(state_all)
    check(
        "1.6 Resume + JD + Role Mode: permits all 3 sources",
        res_all.get("validated_mode") == InterviewMode.RESUME_JD_ROLE.value and
        res_all.get("effective_resume_id") == "res_1" and
        res_all.get("effective_jd_id") == "jd_1" and
        res_all.get("effective_role") == "Fullstack Engineer"
    )

    # 1.7 JD only mode
    state_jd = QuestionState(
        mode=InterviewMode.JD.value,
        user_id="user_123",
        jd_id="jd_1"
    )
    res_jd = validate_interview_mode_node(state_jd)
    check(
        "1.7 JD Mode: isolates JD document",
        res_jd.get("validated_mode") == InterviewMode.JD.value and
        res_jd.get("effective_jd_id") == "jd_1" and
        res_jd.get("effective_resume_id") is None
    )

    # 1.8 Missing required inputs returns controlled error
    state_invalid = QuestionState(
        mode=InterviewMode.RESUME.value,
        user_id="user_123",
        resume_id=None
    )
    res_invalid = validate_interview_mode_node(state_invalid)
    check(
        "1.8 Missing required input yields controlled failure message",
        bool(res_invalid.get("error")) and res_invalid.get("validated_mode") == "invalid"
    )

    # =========================================================
    # TEST SUITE 2: LIGHTWEIGHT BLUEPRINT PLANNING
    # =========================================================
    print("\n--- Test Suite 2: Blueprint Planning & Slot Rotation ---")

    skills = ["React.js", "TypeScript", "State Management", "Performance Optimization"]
    state_bp1 = QuestionState(
        effective_role="Frontend Developer",
        focus_areas=skills,
        history=[]
    )
    bp1 = plan_blueprint_node(state_bp1)

    state_bp2 = QuestionState(
        effective_role="Frontend Developer",
        focus_areas=skills,
        history=[{"question": "Q1"}]
    )
    bp2 = plan_blueprint_node(state_bp2)

    state_bp3 = QuestionState(
        effective_role="Frontend Developer",
        focus_areas=skills,
        history=[{"question": "Q1"}, {"question": "Q2"}]
    )
    bp3 = plan_blueprint_node(state_bp3)

    check(
        "2.1 Slot 1 assigns first focus topic and initial architectural objective",
        bp1["active_focus_topic"] == "React.js" and bp1["turn_index"] == 1
    )
    check(
        "2.2 Slot 2 deterministically shifts to second focus topic and deeper mechanics",
        bp2["active_focus_topic"] == "TypeScript" and bp2["turn_index"] == 2 and
        bp1["slot_objective"] != bp2["slot_objective"]
    )
    check(
        "2.3 Slot 3 deterministically shifts to third topic and failure/debugging objective",
        bp3["active_focus_topic"] == "State Management" and bp3["turn_index"] == 3 and
        "debugging" in bp3["slot_objective"]
    )

    # =========================================================
    # TEST SUITE 3: IN-SESSION REPETITION & DUPLICATE GATE
    # =========================================================
    print("\n--- Test Suite 3: In-Session Duplicate Detection ---")

    previous_questions = [
        "How does React's virtual DOM reconciliation work, and what are the trade-offs of using keys in lists?",
        "Explain how database indexes improve SELECT query performance and their impact on write operations.",
        "Describe a time when you diagnosed a memory leak in a Node.js application under load."
    ]

    # 3.1 Exact Duplicate
    is_dup_exact, score_exact, reason_exact = is_semantic_duplicate(
        candidate_question="How does React's virtual DOM reconciliation work, and what are the trade-offs of using keys in lists?",
        previous_questions=previous_questions,
        embedding_service=embedding_service
    )
    check(
        "3.1 Exact Duplicate Detected",
        is_dup_exact and score_exact == 1.0,
        f"Score: {score_exact}, Reason: {reason_exact}"
    )

    # 3.2 High token overlap / near-exact paraphrase
    near_dup = "Explain how React's virtual DOM reconciliation functions, and describe the trade-offs of using keys in list elements."
    is_dup_near, score_near, reason_near = is_semantic_duplicate(
        candidate_question=near_dup,
        previous_questions=previous_questions,
        embedding_service=embedding_service
    )
    check(
        "3.2 Near-Exact Paraphrase Detected via Jaccard/Cosine",
        is_dup_near and score_near >= 0.70,
        f"Score: {score_near}, Reason: {reason_near}"
    )

    # 3.3 Semantic Equivalent
    semantic_dup = "What happens under the hood during the diffing algorithm in React, and why do keys matter when rendering arrays?"
    is_dup_sem, score_sem, reason_sem = is_semantic_duplicate(
        candidate_question=semantic_dup,
        previous_questions=previous_questions,
        embedding_service=embedding_service,
        similarity_threshold=0.80
    )
    check(
        "3.3 Semantic Duplicate Detected via BGE Embedding Cosine Similarity",
        is_dup_sem and score_sem >= 0.80,
        f"Score: {score_sem}, Reason: {reason_sem}"
    )

    # 3.4 Distinct Question on New Topic passes cleanly
    distinct_q = "How do you configure Redis caching to mitigate cache stampede and optimize read latency?"
    is_dup_dist, score_dist, reason_dist = is_semantic_duplicate(
        candidate_question=distinct_q,
        previous_questions=previous_questions,
        embedding_service=embedding_service
    )
    check(
        "3.4 Truly Distinct Question Passes Validation Gate",
        not is_dup_dist and score_dist < 0.70,
        f"Score: {score_dist}, Reason: {reason_dist}"
    )

    # =========================================================
    # TEST SUITE 4: END-TO-END WORKFLOW INVOCATION
    # =========================================================
    print("\n--- Test Suite 4: End-to-End Workflow Invocation ---")

    e2e_input = QuestionState(
        mode=InterviewMode.ROLE.value,
        role="Frontend Engineer",
        difficulty="intermediate",
        focus_areas=["React Hooks", "State Management"],
        history=[
            {"question": "How do you optimize rendering performance in large React applications?"}
        ]
    )

    final_state = question_workflow.invoke(e2e_input)
    output_q = final_state.get("output_question")

    check(
        "4.1 LangGraph execution returns a valid output_question",
        output_q is not None and isinstance(output_q, GeneratedQuestion)
    )
    if output_q:
        check(
            "4.2 Generated question includes question text, category, and expected concepts",
            bool(output_q.question) and bool(output_q.category) and len(output_q.expected_concepts) > 0
        )
        check(
            "4.3 Generated question preserves difficulty and role metadata",
            output_q.difficulty == "intermediate" and "Frontend" in output_q.role
        )
        print(f"\n      -> Generated Question: \"{output_q.question[:90]}...\"")
        print(f"      -> Category: {output_q.category} | Topic: {output_q.focus_topic} | Source: {output_q.source}")

    print("\n" + "=" * 70)
    print(f"TEST RESULTS: {passed} / {total} CHECKS PASSED ({(passed / total) * 100:.1f}%)")
    print("=" * 70)

    if passed == total:
        print("[SUCCESS] All pipeline audit and improvement tests PASSED successfully.")
        return 0
    else:
        print("[FAILURE] Some checks failed.")
        return 1


if __name__ == "__main__":
    sys.exit(run_tests())
