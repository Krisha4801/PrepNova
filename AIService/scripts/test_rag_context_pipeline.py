import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))

from app.services.role_knowledge.loader import RoleKnowledgeLoader
from app.services.role_knowledge.chunker import RoleKnowledgeChunker
from app.services.role_knowledge.seed import seed_role_knowledge
from app.services.vectorstore.chroma_store import ChromaStore
from app.services.role_validation.validator import RoleValidationService
from app.schemas.resume import Resume, CandidateInfo, Experience, Project, Education
from app.schemas.jd import JobDescription, JobInfo, Requirements
from app.services.processing.chunker import resume_to_documents
from app.services.interview.graph import question_workflow, QuestionState


def test_role_knowledge_coverage():
    print("\n--- Test 1: Role Knowledge Base Coverage (All 8 Roles) ---")
    loader = RoleKnowledgeLoader()
    raw_docs = loader.load()
    roles = sorted({d.metadata["role"] for d in raw_docs})
    print(f"Loaded {len(raw_docs)} documents across roles: {roles}")
    expected_roles = [
        "AI Engineer", "Backend Engineer", "Cloud Engineer",
        "Data Scientist", "DevOps Engineer", "Frontend Engineer",
        "Fullstack Engineer", "QA Engineer"
    ]
    for r in expected_roles:
        assert r in roles, f"Missing role: {r}"
    print("[PASS] All 8 expected roles are present in knowledge base.")


def test_chroma_role_search_and_alias():
    print("\n--- Test 2: Chroma Role Retrieval & Alias Resolution ---")
    store = ChromaStore()
    test_queries = [
        ("Frontend Developer", "react state component architecture"),
        ("Frontend Engineer", "web performance core vitals"),
        ("Backend Developer", "API database design indexing"),
        ("DevOps Engineer", "kubernetes container pod deployment"),
        ("Cloud Architect", "AWS VPC networking security"),
        ("Data Scientist", "machine learning classification evaluation"),
        ("QA Engineer", "test automation playwright cypress"),
        ("Fullstack Developer", "client server authentication REST"),
        ("AI Engineer", "RAG vector embeddings LLM"),
    ]

    for role_input, query in test_queries:
        res = store.search_role(query=query, role=role_input, top_k=2)
        assert res and res.get("documents") and res["documents"][0], f"Zero chunks retrieved for {role_input}"
        sample = res["documents"][0][0][:70].replace("\n", " ")
        print(f"  [OK] {role_input:22} -> Retrieved: {sample}...")
    print("[PASS] ChromaDB role retrieval and alias normalization verified.")


def test_chunker_noise_filtering():
    print("\n--- Test 3: Processing Chunker Noise & Education Consolidation ---")
    sample_resume = Resume(
        candidate=CandidateInfo(name="Alice Doe", email="alice@test.com", phone="123-456-7890", location="Seattle, WA"),
        summary="Senior Backend Engineer with 5 years experience.",
        education=[
            {"degree": "BS CS", "institution": "Tech University", "start_year": "2015", "end_year": "2019"},
            {"degree": "MS SE", "institution": "State College", "start_year": "2019", "end_year": "2021"}
        ],
        experience=[
            Experience(company="Acme Corp", role="Senior Engineer", description="Built FastAPI microservices and distributed queues.")
        ],
        projects=[
            Project(name="PrepNova", description="AI Mock interview platform using ChromaDB and LangGraph.")
        ],
        skills=["Python", "FastAPI", "Docker", "PostgreSQL"]
    )
    docs = resume_to_documents(sample_resume)
    sections = [d.section for d in docs]
    print(f"Generated {len(docs)} documents with sections: {sections}")

    # Verify no PII chunk exists
    assert "candidate_info" not in sections, "candidate_info should not be vectorized as a standalone chunk"
    # Verify education is consolidated into exactly 1 document
    assert sections.count("education") == 1, "Education should be consolidated into a single document"
    print("[PASS] Candidate contact info excluded and education consolidated into 1 clean chunk.")


def test_role_validation_service():
    print("\n--- Test 4: Phase 4 Role Validation Service ---")
    validator = RoleValidationService()

    # Case A: Good Match (Python backend engineer applying for Backend Engineer)
    backend_resume = Resume(
        summary="Backend developer specializing in Python and PostgreSQL.",
        experience=[Experience(company="Alpha", role="Backend Dev", technologies=["python", "fastapi", "postgresql", "redis"])],
        skills=["Python", "FastAPI", "PostgreSQL", "Docker", "REST"]
    )
    result_a = validator.validate(mode="role", target_role="Backend Engineer", resume=backend_resume)
    print(f"  [Case A - Backend on Backend] Score: {result_a.compatibility_score}/100, Flags: {len(result_a.risk_flags)}")
    assert result_a.compatibility_score >= 70.0

    # Case B: Domain Mismatch (Frontend designer applying for DevOps / Cloud role)
    frontend_resume = Resume(
        summary="UI Designer with HTML and Figma experience.",
        skills=["Figma", "HTML", "CSS", "Photoshop"]
    )
    result_b = validator.validate(mode="role", target_role="DevOps Engineer", resume=frontend_resume)
    print(f"  [Case B - UI Designer on DevOps] Score: {result_b.compatibility_score}/100, Flags: {[f.code for f in result_b.risk_flags]}")
    assert any(f.code == "MAJOR_DOMAIN_MISMATCH" for f in result_b.risk_flags)
    assert len(result_b.missing_critical_skills) > 0
    print("[PASS] RoleValidationService correctly assesses compatibility and flags severe domain gaps.")


def test_context_retrieval_with_provenance():
    print("\n--- Test 5: LangGraph Context Retrieval & Provenance Demarcation ---")
    from app.services.interview.graph import validate_interview_mode_node, retrieve_context_node

    state = QuestionState(
        user_id="test_user_qa",
        role="Frontend Developer",
        difficulty="intermediate",
        mode="role",
        active_focus_topic="State Management",
        target_search_query="Frontend Developer State Management"
    )
    val_updates = validate_interview_mode_node(state)
    for k, v in val_updates.items():
        setattr(state, k, v)

    updated_state = retrieve_context_node(state)
    ctx = updated_state.get("grounding_context", "")

    print(f"Retrieved Context Preview:\n{ctx[:250]}...\n")
    assert "=== [Standard Industry Best Practices for Frontend Developer] ===" in ctx
    assert "[COMPONENT_ARCHITECTURE]" in ctx or "[STATE_MANAGEMENT]" in ctx or "[PERFORMANCE_OPTIMIZATION]" in ctx
    print("[PASS] Context correctly demarcated with section provenance and industry best practices.")


if __name__ == "__main__":
    test_role_knowledge_coverage()
    test_chroma_role_search_and_alias()
    test_chunker_noise_filtering()
    test_role_validation_service()
    test_context_retrieval_with_provenance()
    print("\n=======================================================")
    print("  ALL 5 PIPELINE INTEGRATION TESTS COMPLETED SUCCESSFULLY! ")
    print("=======================================================\n")
