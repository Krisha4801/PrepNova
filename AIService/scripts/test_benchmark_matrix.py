import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))

from app.services.interview.benchmark import (
    get_benchmark_slot,
    get_role_default_topics,
    get_calibrated_fallback_question,
    DIFFICULTY_BENCHMARKS,
    normalize_level_key
)
from app.services.interview.graph import (
    QuestionState,
    plan_blueprint_node,
    generate_question_node,
    is_semantic_duplicate
)
from app.services.embeddings.service import EmbeddingService


def test_difficulty_benchmark_matrix():
    print("\n--- Test 1: Benchmark Matrix Slots & Difficulty Differentiation ---")

    for diff in ["beginner", "intermediate", "advanced"]:
        print(f"\n  Checking level: {diff.upper()}")
        for turn in range(1, 7):
            slot = get_benchmark_slot(diff, turn)
            print(f"    Turn {turn}: [{slot['category']}] {slot['type_name']} -> Goal: {slot['slot_objective'][:50]}...")
            assert slot["turn"] == turn
            assert bool(slot["slot_objective"])
            assert bool(slot["style_instructions"])
            assert len(slot["realistic_examples"]) >= 2

            # Verify Beginner NEVER has forbidden topics in slot objective
            if diff == "beginner":
                obj = slot["slot_objective"].lower()
                assert "microservices" not in obj
                assert "distributed" not in obj
                assert "concurrency" not in obj or "async" in obj

    print("\n[PASS] Benchmark matrix properly configured across all 6 turns and 3 difficulty tiers.")


def test_role_default_topics():
    print("\n--- Test 2: Role Default Topic Rotation ---")
    roles = [
        "Frontend Engineer", "Backend Engineer", "Fullstack Engineer",
        "AI Engineer", "DevOps Engineer", "Data Scientist", "Cloud Engineer", "QA Engineer"
    ]
    for r in roles:
        topics = get_role_default_topics(r)
        assert len(topics) >= 5, f"Insufficient topics for {r}"
        print(f"  {r:20} -> Turn 1 Topic: '{topics[0]}', Turn 3 Topic: '{topics[2]}'")
    print("[PASS] Role topic trees verified for all supported platform roles.")


def test_blueprint_planning_with_benchmark():
    print("\n--- Test 3: Benchmark-Guided Blueprint Planning ---")

    # Beginner state
    state_beg = QuestionState(
        effective_role="Frontend Developer",
        difficulty="beginner",
        history=[]
    )
    bp_beg_1 = plan_blueprint_node(state_beg)
    assert bp_beg_1["turn_index"] == 1
    assert "syntax" in bp_beg_1["slot_objective"] or "fundamental" in bp_beg_1["slot_objective"]
    print(f"  Beginner Turn 1: Topic='{bp_beg_1['active_focus_topic']}', Objective='{bp_beg_1['slot_objective']}'")

    # Intermediate turn 3 (debugging)
    state_mid_3 = QuestionState(
        effective_role="Backend Developer",
        difficulty="intermediate",
        history=[{"question": "Q1"}, {"question": "Q2"}]
    )
    bp_mid_3 = plan_blueprint_node(state_mid_3)
    assert bp_mid_3["turn_index"] == 3
    assert "debugging" in bp_mid_3["slot_objective"].lower()
    print(f"  Intermediate Turn 3: Topic='{bp_mid_3['active_focus_topic']}', Objective='{bp_mid_3['slot_objective']}'")

    # Advanced turn 4 (system design)
    state_adv_4 = QuestionState(
        effective_role="Cloud Engineer",
        difficulty="advanced",
        history=[{"question": "Q1"}, {"question": "Q2"}, {"question": "Q3"}]
    )
    bp_adv_4 = plan_blueprint_node(state_adv_4)
    assert bp_adv_4["turn_index"] == 4
    assert "system design" in bp_adv_4["slot_objective"].lower() or "distributed" in bp_adv_4["slot_objective"].lower()
    print(f"  Advanced Turn 4: Topic='{bp_adv_4['active_focus_topic']}', Objective='{bp_adv_4['slot_objective']}'")

    print("[PASS] Blueprint planning dynamically rotates topics and calibrates objectives to difficulty.")


def test_calibrated_fallbacks():
    print("\n--- Test 4: Calibrated Fallback Questions ---")
    # Verify fallback for beginner is concrete and not high-level architecture
    beg_fb = get_calibrated_fallback_question("beginner", 1, "JavaScript Variables", "Frontend Developer")
    print(f"  Beginner Turn 1 Fallback:\n    -> \"{beg_fb}\"")
    assert "microservices" not in beg_fb.lower()
    assert "distributed" not in beg_fb.lower()

    # Verify fallback for advanced turn 4 is system design
    adv_fb = get_calibrated_fallback_question("advanced", 4, "Cloud Architecture", "Cloud Engineer")
    print(f"  Advanced Turn 4 Fallback:\n    -> \"{adv_fb}\"")
    assert "design" in adv_fb.lower() or "distributed" in adv_fb.lower()

    print("[PASS] Fallbacks are natural, realistic, and strictly calibrated to difficulty level.")


def test_duplicate_rejection_gate():
    print("\n--- Test 5: Strict Duplicate Rejection Gate ---")
    embedding_service = EmbeddingService()
    prev_questions = [
        "In JavaScript, what is the exact difference between '==' and '===', and can you give an example where unexpected type coercion leads to a bug?"
    ]

    # Exact duplicate
    is_dup1, _, _ = is_semantic_duplicate(
        candidate_question="In JavaScript, what is the exact difference between '==' and '===', and can you give an example where unexpected type coercion leads to a bug?",
        previous_questions=prev_questions,
        embedding_service=embedding_service,
        similarity_threshold=0.78,
        jaccard_threshold=0.60
    )
    assert is_dup1, "Exact duplicate must be rejected"

    # Paraphrased duplicate
    is_dup2, _, _ = is_semantic_duplicate(
        candidate_question="Can you explain the difference between double equals and triple equals in JavaScript with type coercion bugs?",
        previous_questions=prev_questions,
        embedding_service=embedding_service,
        similarity_threshold=0.78,
        jaccard_threshold=0.60
    )
    assert is_dup2, "Paraphrased duplicate must be rejected"

    # Distinct question
    is_dup3, _, _ = is_semantic_duplicate(
        candidate_question="How would you debug a 404 Not Found error returned by an Express API route?",
        previous_questions=prev_questions,
        embedding_service=embedding_service,
        similarity_threshold=0.78,
        jaccard_threshold=0.60
    )
    assert not is_dup3, "Distinct question must be accepted"

    print("[PASS] Duplicate detection gate successfully filters both exact and paraphrased repeats.")


if __name__ == "__main__":
    test_difficulty_benchmark_matrix()
    test_role_default_topics()
    test_blueprint_planning_with_benchmark()
    test_calibrated_fallbacks()
    test_duplicate_rejection_gate()
    print("\n=======================================================")
    print("  ALL 5 BENCHMARK & CALIBRATION TESTS PASSED (100%)!   ")
    print("=======================================================\n")
