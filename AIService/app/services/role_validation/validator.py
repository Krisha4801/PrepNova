import re
from typing import List, Optional, Set, Dict, Any

from app.schemas.resume import Resume
from app.schemas.jd import JobDescription
from app.schemas.role_validation import (
    RoleValidationResult,
    ValidationPrerequisite,
    RiskFlag,
)

# Canonical domain expectations for supported roles
ROLE_CORE_EXPECTATIONS: Dict[str, Dict[str, Any]] = {
    "Frontend Engineer": {
        "prerequisites": ["HTML/CSS/Web Standards", "JavaScript/TypeScript", "Modern UI Framework (React/Vue/Angular)", "State Management", "Responsive Design"],
        "core_keywords": {"react", "vue", "angular", "javascript", "typescript", "html", "css", "redux", "zustand", "tailwind", "nextjs", "webpack", "vite", "frontend", "ui", "ux"},
    },
    "Backend Engineer": {
        "prerequisites": ["API Design (REST/GraphQL)", "Database Modeling (SQL/NoSQL)", "Server-side Languages (Python/Go/Node/Java)", "Authentication & Security", "Caching & Concurrency"],
        "core_keywords": {"python", "node", "nodejs", "go", "golang", "java", "c#", "fastapi", "express", "django", "spring", "sql", "postgres", "postgresql", "mysql", "mongodb", "redis", "rest", "graphql", "api", "backend", "docker"},
    },
    "Fullstack Engineer": {
        "prerequisites": ["Client-Side UI Framework", "Server-Side API Development", "Database Management", "Client-Server Authentication", "End-to-End Deployment"],
        "core_keywords": {"react", "vue", "typescript", "javascript", "node", "python", "express", "fastapi", "sql", "postgres", "mongodb", "rest", "fullstack", "docker", "git"},
    },
    "AI Engineer": {
        "prerequisites": ["Python Deep Proficiency", "RAG & Vector Retrieval", "Prompt Engineering & LLM APIs", "Embeddings & Vector Databases", "Agent Workflows & Evaluation"],
        "core_keywords": {"python", "llm", "rag", "langchain", "langgraph", "chroma", "pinecone", "weaviate", "openai", "gemini", "anthropic", "embeddings", "agents", "pytorch", "huggingface", "ai"},
    },
    "DevOps Engineer": {
        "prerequisites": ["Containerization (Docker)", "Kubernetes Orchestration", "CI/CD Automation", "Infrastructure as Code (Terraform)", "Monitoring & Observability"],
        "core_keywords": {"docker", "kubernetes", "k8s", "terraform", "ansible", "ci/cd", "github actions", "gitlab", "aws", "gcp", "azure", "linux", "prometheus", "grafana", "helm", "devops", "sre"},
    },
    "Data Scientist": {
        "prerequisites": ["Statistical Modeling & Math", "Machine Learning Algorithms", "Python Data Stack (Pandas/NumPy/Scikit-Learn)", "SQL Data Extraction", "Model Evaluation & Metrics"],
        "core_keywords": {"python", "sql", "pandas", "numpy", "scikit-learn", "sklearn", "xgboost", "machine learning", "statistics", "data science", "pytorch", "tensorflow", "tableau", "power bi"},
    },
    "Cloud Engineer": {
        "prerequisites": ["Cloud Architecture (AWS/Azure/GCP)", "VPC Networking & Security Groups", "IAM Least-Privilege Policies", "Serverless & Compute Management", "Disaster Recovery & High Availability"],
        "core_keywords": {"aws", "azure", "gcp", "vpc", "iam", "s3", "ec2", "lambda", "cloudformation", "terraform", "networking", "cloud", "security"},
    },
    "QA Engineer": {
        "prerequisites": ["Test Automation Frameworks", "API Testing & Validation", "E2E Testing (Playwright/Cypress/Selenium)", "Bug Reporting & Lifecycle", "Performance / Load Testing"],
        "core_keywords": {"selenium", "playwright", "cypress", "pytest", "jest", "postman", "jmeter", "k6", "qa", "testing", "automation", "regression", "defect", "quality assurance"},
    },
}


class RoleValidationService:
    """
    Phase 4: Role & Context Validation Service.
    Validates alignment between Candidate Resume, Target Job Description, and Standard Role Knowledge.
    """

    def _extract_resume_keywords(self, resume: Resume) -> Set[str]:
        keywords = set()
        # Skills
        raw_skills = getattr(resume, "skills", None)
        if raw_skills:
            if hasattr(raw_skills, "model_dump"):
                for _, vals in raw_skills.model_dump().items():
                    if isinstance(vals, list):
                        for v in vals:
                            keywords.add(str(v).strip().lower())
            elif isinstance(raw_skills, list):
                for v in raw_skills:
                    keywords.add(str(v).strip().lower())

        # Experience & Projects technologies
        for exp in resume.experience or []:
            for t in getattr(exp, "technologies", []) or []:
                keywords.add(str(t).strip().lower())
            desc = getattr(exp, "description", "")
            if isinstance(desc, list):
                desc = " ".join(desc)
            for word in re.findall(r"\b[a-zA-Z0-9\+#\.-]{2,}\b", str(desc).lower()):
                keywords.add(word)

        for proj in resume.projects or []:
            for t in getattr(proj, "technologies", []) or []:
                keywords.add(str(t).strip().lower())

        return keywords

    def _extract_jd_requirements(self, jd: JobDescription) -> Set[str]:
        reqs = set()
        if hasattr(jd, "requirements") and jd.requirements:
            for s in getattr(jd.requirements, "technical_skills", []) or []:
                reqs.add(str(s).strip().lower())
            for s in getattr(jd.requirements, "required_skills", []) or []:
                reqs.add(str(s).strip().lower())
            for s in getattr(jd.requirements, "tools_and_technologies", []) or []:
                reqs.add(str(s).strip().lower())
        return reqs

    def validate(
        self,
        mode: str,
        target_role: Optional[str] = None,
        resume: Optional[Resume] = None,
        jd: Optional[JobDescription] = None,
    ) -> RoleValidationResult:
        effective_role = target_role or "Software Engineer"
        # Match against canonical roles
        role_profile = None
        for r_name, profile in ROLE_CORE_EXPECTATIONS.items():
            if r_name.lower() in effective_role.lower() or effective_role.lower() in r_name.lower():
                role_profile = profile
                effective_role = r_name
                break

        if not role_profile:
            role_profile = ROLE_CORE_EXPECTATIONS.get("Backend Engineer")

        prerequisites_eval = []
        risk_flags = []
        skill_overlaps = []
        missing_skills = []
        adjustments = []

        candidate_keywords = self._extract_resume_keywords(resume) if resume else set()
        jd_requirements = self._extract_jd_requirements(jd) if jd else set()

        # 1. Evaluate Prerequisites against candidate profile (if resume present)
        matched_prereqs = 0
        total_prereqs = len(role_profile["prerequisites"])

        for prereq in role_profile["prerequisites"]:
            prereq_words = {w.lower() for w in re.findall(r"\b[a-zA-Z0-9\+#]{3,}\b", prereq)}
            overlap = candidate_keywords.intersection(prereq_words)
            if overlap or not candidate_keywords:
                prerequisites_eval.append(ValidationPrerequisite(
                    name=prereq,
                    status="met" if candidate_keywords else "partial",
                    details=f"Candidate demonstrates alignment on: {', '.join(overlap) if overlap else 'Assumed baseline from role selection'}"
                ))
                matched_prereqs += 1
            else:
                prerequisites_eval.append(ValidationPrerequisite(
                    name=prereq,
                    status="missing",
                    details=f"No direct evidence found in candidate profile for '{prereq}'."
                ))
                missing_skills.append(prereq)

        # 2. Check Role ↔ Resume Semantic Overlap
        role_overlap = candidate_keywords.intersection(role_profile["core_keywords"])
        if candidate_keywords:
            skill_overlaps.extend(sorted(role_overlap))

        # 3. Check JD Requirements Alignment
        if jd_requirements and candidate_keywords:
            jd_overlap = candidate_keywords.intersection(jd_requirements)
            jd_missing = jd_requirements - candidate_keywords
            for item in sorted(jd_overlap):
                if item not in skill_overlaps:
                    skill_overlaps.append(item)
            for item in sorted(jd_missing):
                if item not in missing_skills:
                    missing_skills.append(item)

        # 4. Calculate Compatibility Score
        if resume and jd:
            req_match_ratio = len(candidate_keywords.intersection(jd_requirements)) / max(len(jd_requirements), 1)
            role_match_ratio = min(1.0, len(role_overlap) / 4.0) if role_overlap else 0.0
            prereq_ratio = matched_prereqs / max(total_prereqs, 1)
            score = round((0.45 * req_match_ratio + 0.35 * role_match_ratio + 0.20 * prereq_ratio) * 100, 1)
            score = max(25.0, min(98.0, score + 15.0))
        elif resume:
            role_match_ratio = min(1.0, len(role_overlap) / 4.0) if role_overlap else 0.0
            prereq_ratio = matched_prereqs / max(total_prereqs, 1)
            score = round((0.55 * role_match_ratio + 0.45 * prereq_ratio) * 100, 1)
            score = max(20.0, min(98.0, score))
        elif jd:
            score = 85.0
        else:
            score = 80.0

        # 5. Risk Flag Detection
        if resume and candidate_keywords and not role_overlap:
            risk_flags.append(RiskFlag(
                code="MAJOR_DOMAIN_MISMATCH",
                severity="high",
                message=f"Candidate's uploaded resume exhibits near-zero technical overlap with target role '{effective_role}'.",
                recommendation="Calibrate interview blueprint to assess fundamental cross-domain problem solving before advancing to specialized architectural questions."
            ))
            adjustments.append(f"Start with fundamental competencies in {effective_role} rather than advanced edge-case scenarios.")

        if jd_requirements and candidate_keywords and len(candidate_keywords.intersection(jd_requirements)) == 0:
            risk_flags.append(RiskFlag(
                code="JD_CORE_SKILLS_MISSING",
                severity="medium",
                message="Candidate profile lacks explicit keywords matching key required skills from the Job Description.",
                recommendation="Target questions on adaptability and capacity to learn missing JD technologies."
            ))
            adjustments.append("Include at least one question evaluating candidate's methodology for ramping up on new tech stacks.")

        if score < 40.0:
            adjustments.append("Reduce question difficulty to foundational level and probe core concepts.")
        elif score > 80.0:
            adjustments.append("Introduce challenging architectural scenarios and trade-off discussions.")

        summary = (
            f"Role alignment evaluated for '{effective_role}' under mode '{mode}'. "
            f"Compatibility score: {score}/100. "
            f"Matched {len(skill_overlaps)} technical proficiencies; identified {len(missing_skills)} gaps."
        )

        return RoleValidationResult(
            is_valid=True,
            compatibility_score=score,
            target_role=effective_role,
            mode=mode,
            prerequisites=prerequisites_eval,
            risk_flags=risk_flags,
            skill_overlaps=skill_overlaps[:10],
            missing_critical_skills=missing_skills[:8],
            summary=summary,
            recommended_adjustments=adjustments,
        )
