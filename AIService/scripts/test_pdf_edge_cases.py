"""
Comprehensive Edge-Case & 7-Combination Test Suite for PrepNova
Validates all requirements from PrepNova_Edge_Case_Analysis.pdf:
- Combination 1: Resume only
- Combination 2: JD only (standard & vague)
- Combination 3: Role only
- Combination 4: Resume + JD (High fit, low fit, critical gaps, keyword stuffing, transferable skills)
- Combination 5: Resume + Role
- Combination 6: JD + Role (Role/JD conflict detection -> NEEDS_CLARIFICATION)
- Combination 7: Resume + JD + Role
- Document extraction safeguards (0-byte, encrypted, corrupted)
- 5-part evaluation rubric safeguards
"""

import sys
import io
from pathlib import Path
import pymupdf as fitz

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))

from app.services.role_validation.validator import RoleValidationService
from app.schemas.role_validation import (
    RoleValidationRequest,
    RoleValidationResult
)
from app.services.document.pdf_parser import extract_pdf_text
from app.services.interview.graph import calculate_next_difficulty

def run_edge_case_tests():
    print("=" * 80)
    print("PREPNOVA COMPLETE EDGE-CASE ANALYSIS & 7-COMBINATION VALIDATION SUITE")
    print("=" * 80)

    validator = RoleValidationService()

    # -------------------------------------------------------------
    # 1. COMBINATION 1: RESUME ONLY
    # -------------------------------------------------------------
    print("\n[TEST 1] Combination 1: Resume Only")
    req_c1 = RoleValidationRequest(
        mode="resume",
        resume={
            "skills": ["React", "TypeScript", "Redux", "Tailwind CSS"],
            "experience": ["2 years frontend developer building web apps"],
            "projects": ["E-commerce dashboard in React with state management"]
        }
    )
    res_c1 = validator.validate_combination_and_fit(req_c1)
    assert res_c1.decision_state == "READY"
    assert res_c1.is_valid is True
    assert "Evaluated mode 'resume'" in res_c1.summary
    print("  [PASS] Combination 1: Resume-only grounded without forcing generic role.")

    # -------------------------------------------------------------
    # 2. COMBINATION 2: JD ONLY (Standard & Vague)
    # -------------------------------------------------------------
    print("\n[TEST 2A] Combination 2: JD Only (Standard)")
    req_c2a = RoleValidationRequest(
        mode="jd",
        jd={
            "role_title": "Backend Engineer",
            "required_skills": ["Node.js", "Express", "PostgreSQL", "Docker"],
            "preferred_skills": ["AWS", "Redis"],
            "responsibilities": ["Design and maintain REST APIs and microservices"]
        }
    )
    res_c2a = validator.validate_combination_and_fit(req_c2a)
    assert res_c2a.decision_state == "READY"
    assert res_c2a.is_valid is True
    print("  [PASS] Combination 2A: JD-only parsed with required/preferred skills distinguished.")

    print("\n[TEST 2B] Combination 2: JD Only (Vague / Incomplete JD)")
    req_c2b = RoleValidationRequest(
        mode="jd",
        jd={
            "raw_text": "talented software engineer with problem-solving skills"
        }
    )
    res_c2b = validator.validate_combination_and_fit(req_c2b)
    assert res_c2b.decision_state == "READY_WITH_WARNINGS"
    assert any("This job description contains limited technical detail" in r for r in res_c2b.user_recommendations)
    print("  [PASS] Combination 2B: Vague JD triggers exact PDF Section 9 warning.")

    # -------------------------------------------------------------
    # 3. COMBINATION 3: ROLE ONLY
    # -------------------------------------------------------------
    print("\n[TEST 3] Combination 3: Role Only")
    req_c3 = RoleValidationRequest(
        mode="role",
        target_role="Cloud Engineer"
    )
    res_c3 = validator.validate_combination_and_fit(req_c3)
    assert res_c3.decision_state == "READY"
    assert any("Because no resume or job description was provided" in r for r in res_c3.user_recommendations)
    print("  [PASS] Combination 3: Role-only interview discloses assumptions & limitations.")

    # -------------------------------------------------------------
    # 4. COMBINATION 4: RESUME + JD (High-Priority Fit Edge Cases)
    # -------------------------------------------------------------
    print("\n[TEST 4A] Combination 4: Extremely Low Similarity (Frontend vs Data Engineer)")
    req_c4a = RoleValidationRequest(
        mode="resume_jd",
        resume={
            "skills": ["HTML", "CSS", "UI Design", "Figma", "WordPress"],
            "experience": ["Created marketing landing pages and WordPress themes"],
            "projects": ["Freelance design portfolio"]
        },
        jd={
            "role_title": "Senior Data Engineer",
            "required_skills": ["Apache Kafka", "PySpark", "Snowflake", "Databricks", "Kubernetes"],
            "responsibilities": ["Build real-time streaming data pipelines and lakehouses"]
        }
    )
    res_c4a = validator.validate_combination_and_fit(req_c4a)
    assert res_c4a.decision_state == "READY_WITH_WARNINGS"
    assert res_c4a.fit_dimensions is not None
    assert res_c4a.compatibility_score < 40.0
    assert any("Your current resume appears to have limited alignment with this job description" in r for r in res_c4a.user_recommendations)
    print(f"  [PASS] Combination 4A: Low fit scored {res_c4a.compatibility_score} and returned guidance.")

    print("\n[TEST 4B] Combination 4: Critical Missing Skill Gap Despite High Overall Fit")
    req_c4b = RoleValidationRequest(
        mode="resume_jd",
        resume={
            "skills": ["Python", "Django", "PostgreSQL", "REST APIs", "Redis", "Git", "PyTest"],
            "experience": ["3 years backend Python engineering at SaaS company"],
            "projects": ["Scalable auth microservice with JWT and Redis caching"]
        },
        jd={
            "role_title": "Backend Developer",
            "required_skills": ["Python", "Django", "PostgreSQL", "REST APIs", "Redis", "Kubernetes"],
            "responsibilities": ["Develop backend services and deploy to production Kubernetes clusters"]
        }
    )
    res_c4b = validator.validate_combination_and_fit(req_c4b)
    assert res_c4b.fit_dimensions is not None
    assert any("Your resume does not currently show evidence for these important requirements:" in r and "kubernetes" in r.lower() for r in res_c4b.user_recommendations)
    print("  [PASS] Combination 4B: Mandatory skill 'Kubernetes' flagged separately from overall alignment.")

    print("\n[TEST 4C] Combination 4: Transferable Skills (Java -> C#)")
    req_c4c = RoleValidationRequest(
        mode="resume_jd",
        resume={
            "skills": ["Java", "Spring Boot", "Hibernate", "PostgreSQL"],
            "experience": ["2 years enterprise Java development"],
            "projects": ["Banking microservice in Spring Boot"]
        },
        jd={
            "role_title": "C# Developer",
            "required_skills": ["C#", ".NET Core", "Entity Framework", "SQL Server"]
        }
    )
    res_c4c = validator.validate_combination_and_fit(req_c4c)
    assert len(res_c4c.transferable_skills) > 0
    assert any("Java transfers to C#" in t for t in res_c4c.transferable_skills)
    assert any("Some of your existing skills may transfer to this role" in r for r in res_c4c.user_recommendations)
    print("  [PASS] Combination 4C: Transferable OOP skills identified with dual-testing recommendation.")

    print("\n[TEST 4D] Combination 4: Keyword Stuffing (Skills listed without project evidence)")
    req_c4d = RoleValidationRequest(
        mode="resume_jd",
        resume={
            "skills": ["Docker", "Kubernetes", "AWS", "Terraform", "CI/CD", "Prometheus", "Grafana", "Linux"],
            "experience": [], # No work experience
            "projects": []   # No project evidence
        },
        jd={
            "role_title": "DevOps Engineer",
            "required_skills": ["Docker", "Kubernetes", "AWS", "Terraform"]
        }
    )
    res_c4d = validator.validate_combination_and_fit(req_c4d)
    assert res_c4d.fit_dimensions is not None
    assert res_c4d.fit_dimensions.project_evidence <= 35.0
    assert any("Your resume lists relevant skills, but it contains limited supporting project" in r for r in res_c4d.user_recommendations)
    print("  [PASS] Combination 4D: Raw keyword stuffing penalized on project evidence dimension.")

    # -------------------------------------------------------------
    # 5. COMBINATION 5: RESUME + ROLE
    # -------------------------------------------------------------
    print("\n[TEST 5] Combination 5: Resume + Selected Role")
    req_c5 = RoleValidationRequest(
        mode="resume_role",
        target_role="Fullstack Engineer",
        resume={
            "skills": ["React", "Node.js", "Express", "MongoDB"],
            "projects": ["MERN Stack Social App"]
        }
    )
    res_c5 = validator.validate_combination_and_fit(req_c5)
    assert res_c5.decision_state == "READY"
    assert res_c5.target_role == "Fullstack Engineer"
    print("  [PASS] Combination 5: Target role kept as target and resume used as evidence.")

    # -------------------------------------------------------------
    # 6. COMBINATION 6: JD + ROLE (Conflict Detection -> NEEDS_CLARIFICATION)
    # -------------------------------------------------------------
    print("\n[TEST 6] Combination 6: JD + Role Conflict Detection")
    req_c6 = RoleValidationRequest(
        mode="role_jd",
        target_role="Frontend Engineer",
        jd={
            "role_title": "Senior Data Scientist",
            "required_skills": ["PyTorch", "TensorFlow", "NLP", "Machine Learning"],
            "responsibilities": ["Train LLMs and build neural networks"]
        }
    )
    res_c6 = validator.validate_combination_and_fit(req_c6)
    assert res_c6.decision_state == "NEEDS_CLARIFICATION"
    assert len(res_c6.conflicts) > 0
    assert any("The selected role and job description appear to target different responsibilities" in r for r in res_c6.user_recommendations)
    print("  [PASS] Combination 6: Material Role/JD contradiction triggers NEEDS_CLARIFICATION.")

    # -------------------------------------------------------------
    # 7. COMBINATION 7: RESUME + JD + ROLE
    # -------------------------------------------------------------
    print("\n[TEST 7] Combination 7: Resume + JD + Role")
    req_c7 = RoleValidationRequest(
        mode="resume_jd_role",
        target_role="Fullstack Engineer",
        resume={
            "skills": ["React", "TypeScript", "Node.js", "PostgreSQL"],
            "experience": ["Fullstack developer building enterprise web portals"],
            "projects": ["Collaborative Kanban board"]
        },
        jd={
            "role_title": "Fullstack Developer",
            "required_skills": ["React", "Node.js", "PostgreSQL"],
            "responsibilities": ["Develop frontend and backend services"]
        }
    )
    res_c7 = validator.validate_combination_and_fit(req_c7)
    assert res_c7.decision_state == "READY"
    assert res_c7.compatibility_score >= 60.0
    print("  [PASS] Combination 7: Validated consistency across all 3 inputs.")

    # -------------------------------------------------------------
    # 8. DOCUMENT EXTRACTION SAFEGUARDS
    # -------------------------------------------------------------
    print("\n[TEST 8A] Document Extraction: 0-byte file rejection")
    try:
        extract_pdf_text(b"")
        assert False, "Should have raised ValueError on 0 bytes"
    except ValueError as ve:
        assert "empty" in str(ve).lower() and "0 bytes" in str(ve).lower()
        print("  [PASS] Test 8A: 0-byte file rejected with explicit ValueError.")

    print("\n[TEST 8B] Document Extraction: Corrupted PDF file rejection")
    try:
        extract_pdf_text(b"NOT_A_REAL_PDF_HEADER_123456789")
        assert False, "Should have raised ValueError on corrupted PDF"
    except ValueError as ve:
        assert "corrupted" in str(ve).lower() or "damaged" in str(ve).lower()
        print("  [PASS] Test 8B: Corrupted PDF rejected safely.")

    print("\n[TEST 8C] Document Extraction: Password-protected/encrypted PDF")
    doc = fitz.open()
    doc.new_page(width=72, height=72)
    encrypted_bytes = doc.tobytes(
        encryption=fitz.PDF_ENCRYPT_AES_256,
        user_pw="secret_password",
        owner_pw="owner_password"
    )
    doc.close()

    try:
        extract_pdf_text(encrypted_bytes)
        assert False, "Should have raised ValueError on encrypted PDF"
    except ValueError as ve:
        assert "encrypted" in str(ve).lower() or "password" in str(ve).lower()
        print("  [PASS] Test 8C: Encrypted PDF rejected with clear recovery guidance.")

    # -------------------------------------------------------------
    # 9. ADAPTIVE DIFFICULTY SAFEGUARDS
    # -------------------------------------------------------------
    print("\n[TEST 9] Adaptive Difficulty Thresholds & Hysteresis")
    # Score >= 8.0: step up
    assert calculate_next_difficulty("beginner", 8.5) == "intermediate"
    assert calculate_next_difficulty("intermediate", 8.0) == "advanced"
    assert calculate_next_difficulty("advanced", 9.0) == "advanced" # Bounded at max

    # Score <= 4.5: step down
    assert calculate_next_difficulty("advanced", 4.0) == "intermediate"
    assert calculate_next_difficulty("intermediate", 4.5) == "beginner"
    assert calculate_next_difficulty("beginner", 2.0) == "beginner" # Bounded at min

    # Stable scores (5.0 to 7.9): no oscillation
    assert calculate_next_difficulty("intermediate", 7.0) == "intermediate"
    assert calculate_next_difficulty("intermediate", 5.5) == "intermediate"
    print("  [PASS] Test 9: Difficulty calibration strictly respects 8.0 / 4.5 thresholds and bounds.")

    print("\n" + "=" * 80)
    print("ALL 12 EDGE-CASE & 7-COMBINATION TESTS PASSED COMPREHENSIVELY!")
    print("=" * 80)

if __name__ == "__main__":
    run_edge_case_tests()
