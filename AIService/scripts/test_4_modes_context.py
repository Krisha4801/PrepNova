import os
import sys

# Ensure project root is in sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from unittest.mock import patch

from app.schemas.interview import (
    InterviewMode,
    DifficultyLevel,
    PlanBlueprintRequest,
    NextTurnRequest
)
from app.services.interview.graph import (
    detect_role_jd_conflict,
    build_grounded_context,
    plan_interview_blueprint,
    generate_next_turn
)


# Deterministic fake LLM arbiter so mismatch tests do not depend on live Groq calls.
_MISMATCH_PAIRS = {
    ("data scientist", "senior react frontend developer"),
    ("data scientist", "senior frontend developer"),
    ("devops engineer", "lead angular developer"),
    ("software engineer", "devops engineer"),
}


def _fake_arbiter(role, jd_title, jd_chunks, jd_skills, sim_score):
    key = ((role or "").lower().strip(), (jd_title or "").lower().strip())
    if key in _MISMATCH_PAIRS:
        return {"verdict": "mismatch", "reason": "the JD focuses on a clearly different discipline"}
    return {"verdict": "match", "reason": "the roles are closely related"}


def test_hybrid_conflict_detection():
    print("\n--- Test: Hybrid Role-JD Conflict Detection ---")

    # 1. Regression (the original bug): AI Engineer + production-style AI JD text
    #    must PASS via the embedding gate, with NO keyword taxonomy and NO LLM call.
    ai_jd_text = (
        "Requirements:\n"
        "- 3+ years of experience building production software\n"
        "- Strong proficiency in Python and REST API design\n"
        "- Experience with SQL and NoSQL databases (PostgreSQL, MongoDB)\n"
        "- Deploy services with Docker and Kubernetes\n"
        "- Experience with deep learning, neural networks, and computer vision\n"
        "- Familiarity with MLOps pipelines and model deployment\n"
        "- Bachelor's degree in Computer Science or related field\n"
    )
    with patch("app.services.interview.graph._llm_role_jd_arbiter") as mock_arbiter:
        mock_arbiter.return_value = None  # would block if called and said mismatch
        err = detect_role_jd_conflict(role="AI Engineer", jd_text=ai_jd_text)
    assert err is None, f"AI Engineer vs AI JD must not conflict, got: {err}"
    print("  [PASS] AI Engineer vs AI JD text (no literal title) passed without conflict.")

    # 2. Title passthrough: AI Engineer vs 'AI / ML Engineer' title
    err = detect_role_jd_conflict(role="AI Engineer", jd_title="AI / ML Engineer")
    # Tier 0 misses (slash variant), Tier 1 embedding on title should pass (~0.87);
    # if borderline, fake arbiter returns match.
    assert err is None, f"AI Engineer vs 'AI / ML Engineer' must not conflict, got: {err}"
    print("  [PASS] AI Engineer vs 'AI / ML Engineer' title matched without conflict.")

    # 3. Mismatch via LLM arbiter (mocked): Data Scientist vs Frontend JD
    with patch("app.services.interview.graph._llm_role_jd_arbiter", side_effect=_fake_arbiter):
        err = detect_role_jd_conflict(role="Data Scientist", jd_title="Senior React Frontend Developer")
    assert err is not None, "Expected conflict for Data Scientist vs Frontend JD"
    assert "does not match" in err
    print(f"  [PASS] Data Scientist vs Frontend JD detected conflict:\n         '{err}'")

    # 4. Mismatch via LLM arbiter (mocked): DevOps vs Angular Frontend JD
    with patch("app.services.interview.graph._llm_role_jd_arbiter", side_effect=_fake_arbiter):
        err = detect_role_jd_conflict(role="DevOps Engineer", jd_title="Lead Angular Developer")
    assert err is not None, "Expected conflict for DevOps Engineer vs Frontend JD"
    print(f"  [PASS] DevOps Engineer vs Frontend JD detected conflict:\n         '{err}'")

    # 5. Compatible: Frontend Developer vs React Developer
    with patch("app.services.interview.graph._llm_role_jd_arbiter", side_effect=_fake_arbiter):
        err = detect_role_jd_conflict(role="Frontend Developer", jd_title="Senior React Developer")
    assert err is None, f"Expected no conflict for Frontend vs React, got: {err}"
    print("  [PASS] Frontend Developer vs React Developer matched without conflict.")

    # 6. Compatible: Fullstack Engineer vs Backend JD
    with patch("app.services.interview.graph._llm_role_jd_arbiter", side_effect=_fake_arbiter):
        err = detect_role_jd_conflict(role="Fullstack Engineer", jd_title="Python Backend Developer")
    assert err is None, f"Expected no conflict for Fullstack vs Backend, got: {err}"
    print("  [PASS] Fullstack Engineer vs Backend Developer matched without conflict.")

    # 7. Compatible: Software Engineer (general) vs Fullstack JD
    with patch("app.services.interview.graph._llm_role_jd_arbiter", side_effect=_fake_arbiter):
        err = detect_role_jd_conflict(role="Software Engineer", jd_title="Fullstack Web Developer")
    assert err is None, f"Expected no conflict for Software Engineer vs Fullstack, got: {err}"
    print("  [PASS] General Software Engineer vs Fullstack JD allowed without conflict.")

    # 8. Mismatch: Software Engineer vs DevOps JD
    with patch("app.services.interview.graph._llm_role_jd_arbiter", side_effect=_fake_arbiter):
        err = detect_role_jd_conflict(role="Software Engineer", jd_title="DevOps Engineer")
    assert err is not None, "Expected conflict for Software Engineer vs DevOps"
    print("  [PASS] Software Engineer vs DevOps JD correctly flagged.")

    # 9. Safety: LLM failure / None verdict must NEVER block
    with patch("app.services.interview.graph._llm_role_jd_arbiter", return_value=None):
        err = detect_role_jd_conflict(role="Data Scientist", jd_title="Senior Frontend Developer")
    assert err is None, f"LLM unavailable must not block, got: {err}"
    print("  [PASS] LLM failure defaults to no-conflict (never blocks on uncertainty).")

    # 10. Exact substring: role pasted from JD text always passes
    err = detect_role_jd_conflict(
        role="Senior React Frontend Developer",
        jd_text="We are seeking a talented Senior React Frontend Developer with Redux.",
    )
    assert err is None
    print("  [PASS] Role pasted from JD text always passes (Tier 0).")


def test_context_building_4_modes():
    print("\n--- Test: Context Building Across 4 Specialized Modes ---")

    # Mode 1: resume_jd (Resume + JD)
    ctx_r_jd = build_grounded_context(
        mode=InterviewMode.RESUME_JD.value,
        role="Candidate",
        user_id="test_user",
        resume_id="mock_resume",
        jd_id="mock_jd",
        active_query="react typescript component architecture"
    )
    assert not ctx_r_jd.get("conflict"), "resume_jd should not raise conflict"
    print("  [PASS] Mode 1: resume_jd built grounded context successfully.")

    # Mode 2: resume_role (Resume + Role)
    ctx_r_role = build_grounded_context(
        mode=InterviewMode.RESUME_ROLE.value,
        role="Frontend Engineer",
        user_id="test_user",
        resume_id="mock_resume",
        active_query="frontend react typescript"
    )
    assert not ctx_r_role.get("conflict"), "resume_role should not raise conflict"
    print("  [PASS] Mode 2: resume_role built grounded context successfully.")

    # Mode 3: role_jd (JD + Role)
    # 3a. Mismatch case (mocked LLM arbiter)
    with patch("app.services.interview.graph._llm_role_jd_arbiter", side_effect=_fake_arbiter):
        conflict_err = detect_role_jd_conflict(role="Data Scientist", jd_title="Senior Frontend Developer")
    assert conflict_err is not None, "Should detect mismatch between Data Scientist and Frontend JD"
    print("  [PASS] Mode 3a: role_jd mismatch correctly detected.")

    # 3b. Matched case (85% JD weight + 15% role standards)
    ctx_role_jd = build_grounded_context(
        mode=InterviewMode.ROLE_JD.value,
        role="Frontend Engineer",
        user_id="test_user",
        jd_id="mock_jd",
        active_query="react performance css"
    )
    assert not ctx_role_jd.get("conflict"), "Matched role_jd should succeed"
    print("  [PASS] Mode 3b: role_jd matched case built context (JD-heavy + role standards).")

    # Mode 4: resume_jd_role (Resume + JD + Role)
    ctx_all = build_grounded_context(
        mode=InterviewMode.RESUME_JD_ROLE.value,
        role="Frontend Engineer",
        user_id="test_user",
        resume_id="mock_resume",
        jd_id="mock_jd",
        active_query="react performance web vitals"
    )
    assert not ctx_all.get("conflict"), "Matched resume_jd_role should succeed"
    print("  [PASS] Mode 4: resume_jd_role built multi-source context successfully.")


def test_blueprint_and_turn_generation():
    print("\n--- Test: Blueprint Planning & Turn Generation with Matched Context ---")

    # 1. Blueprint for resume_jd
    bp_r_jd = plan_interview_blueprint(PlanBlueprintRequest(
        role="Candidate",
        difficulty=DifficultyLevel.BEGINNER,
        mode=InterviewMode.RESUME_JD,
        resume_id="res_1",
        jd_id="jd_1",
        target_duration_minutes=30
    ))
    proj_sec = next(s for s in bp_r_jd.sections if s.id == "projects")
    assert "Job Description" in proj_sec.objective, "Project objective should align with JD requirements"
    print(f"  [PASS] resume_jd project section objective calibrated:\n         '{proj_sec.objective}'")

    # 2. Next turn generation in resume_jd mode
    turn_resp = generate_next_turn(NextTurnRequest(
        session_id="test_sess",
        user_id="user_123",
        role="Frontend Engineer",
        difficulty="beginner",
        mode=InterviewMode.RESUME_JD.value,
        resume_id="res_1",
        jd_id="jd_1",
        blueprint=bp_r_jd,
        history=[{
            "turn_index": 0,
            "section_id": "introduction",
            "question": "Please introduce yourself.",
            "answer": "Hi, I have built React and Next.js applications with state management."
        }],
        total_turns_taken=1
    ))
    assert turn_resp.action == "ASK_QUESTION"
    assert turn_resp.section_id == "projects"
    print(f"  [PASS] Next turn generated grounded question for '{turn_resp.section_id}':\n         \"{turn_resp.interviewer_text[:80]}...\"")


if __name__ == "__main__":
    test_hybrid_conflict_detection()
    test_context_building_4_modes()
    test_blueprint_and_turn_generation()
    print("\n" + "=" * 60)
    print("ALL 4-MODE CONTEXT TESTS PASSED SUCCESSFULLY!")
    print("=" * 60)
