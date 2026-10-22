import re
import difflib
from typing import List, Optional, Set, Dict, Any, Tuple

from app.schemas.resume import Resume
from app.schemas.jd import JobDescription
from app.schemas.role_validation import (
    RoleValidationResult,
    RoleValidationRequest,
    ValidationPrerequisite,
    RiskFlag,
    FitDimensions,
)

# Canonical domain expectations for supported roles
ROLE_CORE_EXPECTATIONS: Dict[str, Dict[str, Any]] = {
    "Frontend Engineer": {
        "domain": "frontend",
        "prerequisites": ["HTML/CSS/Web Standards", "JavaScript/TypeScript", "Modern UI Framework (React/Vue/Angular)", "State Management", "Responsive Design"],
        "core_keywords": {"react", "vue", "angular", "javascript", "typescript", "html", "css", "redux", "zustand", "tailwind", "nextjs", "webpack", "vite", "frontend", "ui", "ux", "browser", "dom", "accessibility", "responsive"},
    },
    "Backend Engineer": {
        "domain": "backend",
        "prerequisites": ["API Design (REST/GraphQL)", "Database Modeling (SQL/NoSQL)", "Server-side Languages (Python/Go/Node/Java)", "Authentication & Security", "Caching & Concurrency"],
        "core_keywords": {"python", "node", "nodejs", "go", "golang", "java", "c#", "fastapi", "express", "django", "spring", "sql", "postgres", "postgresql", "mysql", "mongodb", "redis", "rest", "graphql", "api", "backend", "docker", "microservices", "caching"},
    },
    "Fullstack Engineer": {
        "domain": "fullstack",
        "prerequisites": ["Client-Side UI Framework", "Server-Side API Development", "Database Management", "Client-Server Authentication", "End-to-End Deployment"],
        "core_keywords": {"react", "vue", "typescript", "javascript", "node", "python", "express", "fastapi", "sql", "postgres", "mongodb", "rest", "fullstack", "docker", "git", "api", "html", "css"},
    },
    "AI Engineer": {
        "domain": "ai_ml",
        "prerequisites": ["Python Deep Proficiency", "RAG & Vector Retrieval", "Prompt Engineering & LLM APIs", "Embeddings & Vector Databases", "Agent Workflows & Evaluation"],
        "core_keywords": {"python", "llm", "rag", "langchain", "langgraph", "chroma", "pinecone", "weaviate", "openai", "gemini", "anthropic", "embeddings", "agents", "pytorch", "huggingface", "ai", "machine learning", "nlp", "transformers"},
    },
    "DevOps Engineer": {
        "domain": "devops",
        "prerequisites": ["Containerization (Docker)", "Kubernetes Orchestration", "CI/CD Automation", "Infrastructure as Code (Terraform)", "Monitoring & Observability"],
        "core_keywords": {"docker", "kubernetes", "k8s", "terraform", "ansible", "ci/cd", "github actions", "gitlab", "aws", "gcp", "azure", "linux", "prometheus", "grafana", "helm", "devops", "sre", "bash", "jenkins", "infrastructure"},
    },
    "Data Scientist": {
        "domain": "data_science",
        "prerequisites": ["Statistical Modeling & Math", "Machine Learning Algorithms", "Python Data Stack (Pandas/NumPy/Scikit-Learn)", "SQL Data Extraction", "Model Evaluation & Metrics"],
        "core_keywords": {"python", "sql", "pandas", "numpy", "scikit-learn", "sklearn", "xgboost", "machine learning", "statistics", "data science", "pytorch", "tensorflow", "tableau", "power bi", "r", "analytics", "regression"},
    },
    "Cloud Engineer": {
        "domain": "cloud",
        "prerequisites": ["Cloud Architecture (AWS/Azure/GCP)", "VPC Networking & Security Groups", "IAM Least-Privilege Policies", "Serverless & Compute Management", "Disaster Recovery & High Availability"],
        "core_keywords": {"aws", "azure", "gcp", "vpc", "iam", "s3", "ec2", "lambda", "cloudformation", "terraform", "networking", "cloud", "security", "serverless", "storage"},
    },
    "QA Engineer": {
        "domain": "qa",
        "prerequisites": ["Test Automation Frameworks", "API Testing & Validation", "E2E Testing (Playwright/Cypress/Selenium)", "Bug Reporting & Lifecycle", "Performance / Load Testing"],
        "core_keywords": {"selenium", "playwright", "cypress", "pytest", "jest", "postman", "jmeter", "k6", "qa", "testing", "automation", "regression", "defect", "quality assurance", "unit tests", "integration tests"},
    },
}

# Standard Synonym & Normalization Dictionary (PDF §3)
TECH_SYNONYMS: Dict[str, Set[str]] = {
    "kubernetes": {"k8s", "kubernetes", "container orchestration"},
    "typescript": {"ts", "typescript"},
    "javascript": {"js", "javascript", "ecmascript"},
    "python": {"py", "python", "python3"},
    "nodejs": {"node", "nodejs", "node.js", "node js"},
    "express": {"express", "expressjs", "express.js", "node.js rest api", "node rest api"},
    "fastapi": {"fastapi", "python api", "python rest api"},
    "postgresql": {"postgres", "postgresql", "psql"},
    "mongodb": {"mongo", "mongodb", "document db"},
    "react": {"react", "react.js", "reactjs"},
    "vue": {"vue", "vue.js", "vuejs"},
    "angular": {"angular", "angularjs", "angular 2+"},
    "docker": {"docker", "containerization", "containers", "dockerfile"},
    "aws": {"aws", "amazon web services"},
    "gcp": {"gcp", "google cloud platform", "google cloud"},
    "azure": {"azure", "microsoft azure"},
    "ci/cd": {"ci/cd", "continuous integration", "github actions", "gitlab ci", "jenkins"},
    "sql": {"sql", "relational database", "rdbms"},
    "rest": {"rest", "restful", "rest api", "http api"},
    "graphql": {"graphql", "gql"},
}

# Transferable Skills Mapping (PDF §3, §9)
TRANSFERABLE_SKILL_PAIRS: List[Tuple[Set[str], Set[str], str]] = [
    ({"java", "spring"}, {"c#", "dotnet", ".net"}, "Object-oriented backend architecture and enterprise design patterns"),
    ({"react", "redux"}, {"vue", "vuex", "pinia"}, "Component-driven reactive UI architecture and state management"),
    ({"python", "django", "fastapi"}, {"ruby", "rails"}, "Dynamic server-side scripting and MVC web service architecture"),
    ({"postgres", "postgresql"}, {"mysql", "oracle", "sql server"}, "Relational schema modeling, indexing, and SQL query optimization"),
    ({"aws"}, {"gcp", "azure"}, "Cloud resource provisioning, VPC networking, IAM security, and serverless computing"),
    ({"express", "node"}, {"fastapi", "flask"}, "Microservice API routing, middleware chaining, and async request handling"),
]

# Standard User-Facing Messages (PDF §9)
STANDARD_MESSAGES = {
    "VERY_LOW_FIT": (
        "Your current resume appears to have limited alignment with this job description. "
        "Consider using a more relevant resume or reviewing the missing requirements before proceeding."
    ),
    "CRITICAL_GAPS": (
        "Your resume does not currently show evidence for these important requirements: {skills}. "
        "You can continue with a gap-focused practice interview or update your resume with genuine relevant experience."
    ),
    "RESUME_NEEDS_MORE_EVIDENCE": (
        "Your resume lists relevant skills, but it contains limited supporting project or work examples. "
        "Adding genuine contributions and outcomes can improve question personalization."
    ),
    "JD_INCOMPLETE": (
        "This job description contains limited technical detail. "
        "Upload a fuller description, or continue with a general interview based on the information available."
    ),
    "ROLE_JD_CONFLICT": (
        "The selected role and job description appear to target different responsibilities. "
        "Which should define this interview?"
    ),
    "ROLE_ONLY_MODE": (
        "This interview is based on the selected role. "
        "Because no resume or job description was provided, it cannot assess your individual resume–job alignment."
    ),
    "TRANSFERABLE_SKILLS": (
        "Some of your existing skills may transfer to this role. "
        "The interview will test those foundations while separately checking role-specific knowledge."
    ),
    "INSUFFICIENT_EVIDENCE": (
        "There is not enough reliable information to estimate alignment confidently. "
        "Add more detail or continue with a general interview."
    ),
    "USER_CHOOSES_TO_PROCEED": (
        "You can continue with practice despite the identified gaps. "
        "This session will focus on relevant fundamentals and missing competencies; it is not a prediction of hiring success."
    )
}

OVERLY_BROAD_ROLES = {"engineer", "developer", "programmer", "coder", "software", "specialist", "consultant"}


class RoleValidationService:
    """
    Unified Input Validation & 6-Stage Decision Layer.
    Implements all edge-case checks, 6 explainable fit dimensions,
    standardized user messages, and 7-combination routing.
    """

    def normalize_role(self, raw_role: Optional[str]) -> Tuple[str, Optional[str]]:
        """
        Normalizes role string, fixes minor misspellings, and checks for overly broad titles.
        Returns: (normalized_role, warning_or_clarification_message)
        """
        if not raw_role or not str(raw_role).strip():
            return "Software Engineer", None

        clean = str(raw_role).strip()
        lower = clean.lower()

        # Check for overly broad titles (PDF §4.3)
        if lower in OVERLY_BROAD_ROLES:
            return clean, f"'{clean}' is an overly broad title. Consider selecting a specialized track (e.g. Frontend, Backend, AI, DevOps) or proceeding with a general software interview."

        # Exact match or substring match against canonical list
        for canonical in ROLE_CORE_EXPECTATIONS.keys():
            if canonical.lower() == lower:
                return canonical, None

        # Fuzzy spell check for misspelled roles (e.g. 'Frontned Enginer', 'Pythn Devloper')
        matches = difflib.get_close_matches(clean, list(ROLE_CORE_EXPECTATIONS.keys()), n=1, cutoff=0.7)
        if matches:
            suggested = matches[0]
            if suggested.lower() != lower:
                return suggested, f"Role normalized to '{suggested}' from '{clean}'."

        return clean, None

    def _canonicalize_skill(self, skill: str) -> str:
        s = skill.strip().lower()
        for canonical, syns in TECH_SYNONYMS.items():
            if s in syns:
                return canonical
        return s

    def _extract_resume_details(self, resume: Any) -> Dict[str, Any]:
        """Extracts listed skills, demonstrated project skills, word count, and experience count."""
        if not resume:
            return {"listed_skills": set(), "project_skills": set(), "all_tokens": set(), "word_count": 0, "project_count": 0, "experience_count": 0}

        listed = set()
        demonstrated = set()
        all_tokens = set()
        word_count = 0

        # Listed Skills
        raw_skills = getattr(resume, "skills", None) if hasattr(resume, "skills") else (resume.get("skills") if isinstance(resume, dict) else None)
        if raw_skills:
            if hasattr(raw_skills, "model_dump"):
                raw_dict = raw_skills.model_dump()
            elif isinstance(raw_skills, dict):
                raw_dict = raw_skills
            elif isinstance(raw_skills, list):
                raw_dict = {"general": raw_skills}
            else:
                raw_dict = {}

            for _, vals in raw_dict.items():
                if isinstance(vals, list):
                    for v in vals:
                        canon = self._canonicalize_skill(str(v))
                        listed.add(canon)
                        all_tokens.add(canon)

        # Raw text if present
        raw_text = getattr(resume, "raw_text", "") if hasattr(resume, "raw_text") else (resume.get("raw_text", "") if isinstance(resume, dict) else "")
        if raw_text:
            rt_words = re.findall(r"\b[a-zA-Z0-9\+#\.-]{2,}\b", str(raw_text).lower())
            word_count += len(rt_words)
            for w in rt_words:
                all_tokens.add(w)

        # Experience
        exp_list = getattr(resume, "experience", None) if hasattr(resume, "experience") else (resume.get("experience") if isinstance(resume, dict) else None)
        exp_list = exp_list or []
        for exp in exp_list:
            if isinstance(exp, str):
                desc = exp
                techs = []
            else:
                techs = getattr(exp, "technologies", []) if hasattr(exp, "technologies") else (exp.get("technologies") if isinstance(exp, dict) else [])
                desc = getattr(exp, "description", "") if hasattr(exp, "description") else (exp.get("description", "") if isinstance(exp, dict) else "")
            
            for t in techs or []:
                c = self._canonicalize_skill(str(t))
                demonstrated.add(c)
                all_tokens.add(c)
            
            if isinstance(desc, list):
                desc = " ".join(desc)
            words = re.findall(r"\b[a-zA-Z0-9\+#\.-]{2,}\b", str(desc).lower())
            word_count += len(words)
            for w in words:
                all_tokens.add(w)
                # If a word is in listed skills, it is demonstrated in experience!
                if w in listed:
                    demonstrated.add(w)

        # Projects
        proj_list = getattr(resume, "projects", None) if hasattr(resume, "projects") else (resume.get("projects") if isinstance(resume, dict) else None)
        proj_list = proj_list or []
        for proj in proj_list:
            if isinstance(proj, str):
                desc = proj
                techs = []
            else:
                techs = getattr(proj, "technologies", []) if hasattr(proj, "technologies") else (proj.get("technologies") if isinstance(proj, dict) else [])
                desc = getattr(proj, "description", "") if hasattr(proj, "description") else (proj.get("description", "") if isinstance(proj, dict) else "")
            
            for t in techs or []:
                c = self._canonicalize_skill(str(t))
                demonstrated.add(c)
                all_tokens.add(c)
            
            if isinstance(desc, list):
                desc = " ".join(desc)
            words = re.findall(r"\b[a-zA-Z0-9\+#\.-]{2,}\b", str(desc).lower())
            word_count += len(words)
            for w in words:
                all_tokens.add(w)
                if w in listed:
                    demonstrated.add(w)

        return {
            "listed_skills": listed,
            "project_skills": demonstrated,
            "all_tokens": all_tokens,
            "word_count": word_count,
            "project_count": len(proj_list),
            "experience_count": len(exp_list)
        }

    def _extract_jd_details(self, jd: Any) -> Dict[str, Any]:
        """Extracts required skills, preferred skills, responsibilities, role title, and total word count."""
        if not jd:
            return {"required_skills": set(), "preferred_skills": set(), "role_title": "", "word_count": 0, "all_tokens": set()}

        req_skills = set()
        pref_skills = set()
        all_tokens = set()
        role_title = ""
        word_count = 0

        role_title = getattr(jd, "role_title", "") or (jd.get("role_title", "") if isinstance(jd, dict) else "")
        if not role_title:
            role_title = getattr(jd, "title", "") or (jd.get("title", "") if isinstance(jd, dict) else "")
        if not role_title:
            job_info = getattr(jd, "job_info", None) if hasattr(jd, "job_info") else (jd.get("job_info") if isinstance(jd, dict) else None)
            if job_info:
                role_title = getattr(job_info, "title", "") or (job_info.get("title", "") if isinstance(job_info, dict) else "")
        role_title = str(role_title or "").strip()

        # Raw text if present
        raw_text = getattr(jd, "raw_text", "") if hasattr(jd, "raw_text") else (jd.get("raw_text", "") if isinstance(jd, dict) else "")
        if raw_text:
            rt_words = re.findall(r"\b[a-zA-Z0-9\+#\.-]{2,}\b", str(raw_text).lower())
            word_count += len(rt_words)
            for w in rt_words:
                all_tokens.add(w)

        # Requirements
        direct_req = getattr(jd, "required_skills", None) if hasattr(jd, "required_skills") else (jd.get("required_skills") if isinstance(jd, dict) else None)
        if direct_req:
            for s in direct_req or []:
                c = self._canonicalize_skill(str(s))
                req_skills.add(c)
                all_tokens.add(c)

        direct_pref = getattr(jd, "preferred_skills", None) if hasattr(jd, "preferred_skills") else (jd.get("preferred_skills") if isinstance(jd, dict) else None)
        if direct_pref:
            for s in direct_pref or []:
                c = self._canonicalize_skill(str(s))
                pref_skills.add(c)
                all_tokens.add(c)

        requirements = getattr(jd, "requirements", None) if hasattr(jd, "requirements") else (jd.get("requirements") if isinstance(jd, dict) else None)
        if requirements:
            r_list = getattr(requirements, "required_skills", []) if hasattr(requirements, "required_skills") else (requirements.get("required_skills", []) if isinstance(requirements, dict) else [])
            for s in r_list or []:
                c = self._canonicalize_skill(str(s))
                req_skills.add(c)
                all_tokens.add(c)

            p_list = getattr(requirements, "preferred_skills", []) if hasattr(requirements, "preferred_skills") else (requirements.get("preferred_skills", []) if isinstance(requirements, dict) else [])
            for s in p_list or []:
                c = self._canonicalize_skill(str(s))
                pref_skills.add(c)
                all_tokens.add(c)

        # Fallback to general technologies or parsedData
        techs = getattr(jd, "technologies", []) if hasattr(jd, "technologies") else (jd.get("technologies", []) if isinstance(jd, dict) else [])
        for t in techs or []:
            c = self._canonicalize_skill(str(t))
            if c not in req_skills and c not in pref_skills:
                req_skills.add(c)
            all_tokens.add(c)

        # Responsibilities
        resp_obj = getattr(jd, "responsibilities", None) if hasattr(jd, "responsibilities") else (jd.get("responsibilities") if isinstance(jd, dict) else None)
        if resp_obj:
            if isinstance(resp_obj, list):
                items = resp_obj
            else:
                items = getattr(resp_obj, "items", []) if hasattr(resp_obj, "items") else (resp_obj.get("items", []) if isinstance(resp_obj, dict) else [])
            for item in items or []:
                words = re.findall(r"\b[a-zA-Z0-9\+#\.-]{2,}\b", str(item).lower())
                word_count += len(words)
                for w in words:
                    all_tokens.add(w)

        return {
            "required_skills": req_skills,
            "preferred_skills": pref_skills,
            "role_title": role_title,
            "word_count": word_count,
            "all_tokens": all_tokens
        }

    def _find_transferable_skills(self, candidate_skills: Set[str], target_skills: Set[str]) -> List[str]:
        """Detects skills possessed by candidate that transfer to target requirements."""
        transferable = []
        for group_a, group_b, explanation in TRANSFERABLE_SKILL_PAIRS:
            cand_has_a = bool(candidate_skills.intersection(group_a))
            target_needs_b = bool(target_skills.intersection(group_b))
            cand_has_b = bool(candidate_skills.intersection(group_b))
            target_needs_a = bool(target_skills.intersection(group_a))

            if cand_has_a and target_needs_b:
                matched_a = list(candidate_skills.intersection(group_a))[0]
                needed_b = list(target_skills.intersection(group_b))[0]
                transferable.append(f"{matched_a.capitalize()} transfers to {needed_b.capitalize()} ({explanation})")
            elif cand_has_b and target_needs_a:
                matched_b = list(candidate_skills.intersection(group_b))[0]
                needed_a = list(target_skills.intersection(group_a))[0]
                transferable.append(f"{matched_b.capitalize()} transfers to {needed_a.capitalize()} ({explanation})")

        return transferable

    def _detect_role_jd_conflict(self, role: str, jd_details: Dict[str, Any]) -> Optional[str]:
        """Detects material domain conflicts between selected role and JD (PDF §4.2, §4.3)."""
        jd_title = (jd_details.get("role_title") or "").lower()
        if not jd_title:
            return None

        role_lower = role.lower()
        # Find expected canonical domain
        role_domain = None
        for r_name, exp in ROLE_CORE_EXPECTATIONS.items():
            if r_name.lower() in role_lower or role_lower in r_name.lower():
                role_domain = exp["domain"]
                break

        if not role_domain:
            return None

        # Check if JD explicitly specifies a fundamentally different domain
        domain_keywords = {
            "frontend": ["frontend", "ui", "react developer", "angular developer"],
            "backend": ["backend", "api engineer", "server", "distributed systems"],
            "ai_ml": ["data scientist", "machine learning", "ml engineer", "ai engineer"],
            "data_science": ["data scientist", "data analyst", "bi engineer"],
            "devops": ["devops", "sre", "site reliability", "cloud infrastructure"],
            "cloud": ["cloud architect", "cloud engineer", "aws architect"],
            "qa": ["qa engineer", "quality assurance", "test automation"]
        }

        for dom, kws in domain_keywords.items():
            if dom != role_domain:
                if any(kw in jd_title for kw in kws):
                    # Direct contradiction
                    return f"Selected role '{role}' targets the {role_domain.upper()} domain, while the uploaded Job Description is for '{jd_details['role_title']}'."

        return None

    def validate_combination_and_fit(self, req: RoleValidationRequest) -> RoleValidationResult:
        """Helper that accepts a RoleValidationRequest and executes validation."""
        return self.validate(
            mode=req.mode,
            target_role=req.target_role,
            resume=req.resume,
            jd=req.jd
        )

    def validate(
        self,
        mode: str,
        target_role: Optional[str] = None,
        resume: Optional[Any] = None,
        jd: Optional[Any] = None,
    ) -> RoleValidationResult:
        """
        Executes unified 6-Stage Input Validation & Fit Assessment.
        """
        mode = mode or "role"
        effective_role, role_warning = self.normalize_role(target_role)

        resume_details = self._extract_resume_details(resume)
        jd_details = self._extract_jd_details(jd)

        candidate_all_skills = resume_details["listed_skills"].union(resume_details["project_skills"])
        jd_required = jd_details["required_skills"]
        jd_preferred = jd_details["preferred_skills"]
        all_jd_skills = jd_required.union(jd_preferred)

        # Match against canonical role profile
        role_profile = None
        for r_name, profile in ROLE_CORE_EXPECTATIONS.items():
            if r_name.lower() in effective_role.lower() or effective_role.lower() in r_name.lower():
                role_profile = profile
                effective_role = r_name
                break
        if not role_profile:
            role_profile = ROLE_CORE_EXPECTATIONS.get("Backend Engineer")

        prerequisites_eval: List[ValidationPrerequisite] = []
        risk_flags: List[RiskFlag] = []
        user_recommendations: List[str] = []
        conflicts: List[str] = []
        adjustments: List[str] = []
        decision_state = "READY"

        # Evaluate Prerequisites
        matched_prereqs = 0
        total_prereqs = len(role_profile["prerequisites"])
        for prereq in role_profile["prerequisites"]:
            prereq_words = {w.lower() for w in re.findall(r"\b[a-zA-Z0-9\+#]{3,}\b", prereq)}
            overlap = candidate_all_skills.intersection(prereq_words)
            if overlap or not candidate_all_skills:
                prerequisites_eval.append(ValidationPrerequisite(
                    name=prereq,
                    status="met" if candidate_all_skills else "partial",
                    details=f"Candidate demonstrates alignment on: {', '.join(overlap) if overlap else 'Assumed baseline from role selection'}"
                ))
                matched_prereqs += 1
            else:
                prerequisites_eval.append(ValidationPrerequisite(
                    name=prereq,
                    status="missing",
                    details=f"No direct evidence found in candidate profile for '{prereq}'."
                ))

        # Check Role Overlap
        role_overlap = candidate_all_skills.intersection(role_profile["core_keywords"])

        # -----------------------------------------------------------------
        # COMBINATION-SPECIFIC DECISION BRANCHING (PDF §2, §5, §10)
        # -----------------------------------------------------------------

        # Combination 1: Resume only
        if mode == "resume":
            has_structured_evidence = (
                len(resume_details["listed_skills"]) >= 2 and
                (resume_details["project_count"] > 0 or resume_details["experience_count"] > 0)
            )
            if not resume or (resume_details["word_count"] < 30 and not has_structured_evidence):
                decision_state = "INSUFFICIENT_EVIDENCE"
                user_recommendations.append(STANDARD_MESSAGES["INSUFFICIENT_EVIDENCE"])
            elif resume_details["project_count"] == 0 and len(resume_details["listed_skills"]) > 0:
                decision_state = "READY_WITH_WARNINGS"
                user_recommendations.append(STANDARD_MESSAGES["RESUME_NEEDS_MORE_EVIDENCE"])
                adjustments.append("Start with foundational verification questions for skills listed without project context.")

        # Combination 2: JD only
        elif mode == "jd":
            user_recommendations.append(
                "This interview is based on the job description. Because no resume was provided, candidate-specific fit cannot be assessed."
            )
            if jd_details["word_count"] < 30 and len(all_jd_skills) < 2:
                decision_state = "READY_WITH_WARNINGS"
                user_recommendations.append(STANDARD_MESSAGES["JD_INCOMPLETE"])
                adjustments.append("Use general software engineering questions with explicit assumptions.")

        # Combination 3: Role only
        elif mode == "role":
            user_recommendations.append(STANDARD_MESSAGES["ROLE_ONLY_MODE"])
            if role_warning:
                decision_state = "READY_WITH_WARNINGS"
                user_recommendations.append(role_warning)

        # Combination 6: JD + Role
        elif mode == "role_jd":
            conflict_msg = self._detect_role_jd_conflict(effective_role, jd_details)
            if conflict_msg:
                decision_state = "NEEDS_CLARIFICATION"
                conflicts.append(conflict_msg)
                user_recommendations.append(STANDARD_MESSAGES["ROLE_JD_CONFLICT"])
                user_recommendations.append(f"Note: {conflict_msg}")

        # Combination 4 or 7: Resume + JD (+ Role)
        elif mode in ["resume_jd", "resume_jd_role"]:
            # In Combination 7, check role vs JD consistency first! (PDF §2, §5)
            if mode == "resume_jd_role":
                conflict_msg = self._detect_role_jd_conflict(effective_role, jd_details)
                if conflict_msg:
                    decision_state = "NEEDS_CLARIFICATION"
                    conflicts.append(conflict_msg)
                    user_recommendations.append(STANDARD_MESSAGES["ROLE_JD_CONFLICT"])
                    user_recommendations.append(f"Conflict: {conflict_msg}")

            if jd_details["word_count"] < 30 and len(all_jd_skills) < 2:
                if decision_state == "READY":
                    decision_state = "READY_WITH_WARNINGS"
                user_recommendations.append(STANDARD_MESSAGES["JD_INCOMPLETE"])

        # -----------------------------------------------------------------
        # COMPUTE 6 EXPLAINABLE FIT DIMENSIONS (PDF §3.1)
        # -----------------------------------------------------------------
        critical_gaps = []
        if jd_required:
            for s in sorted(jd_required):
                if s not in candidate_all_skills and not any(s in syns and bool(candidate_all_skills.intersection(syns)) for syns in TECH_SYNONYMS.values()):
                    critical_gaps.append(s.capitalize())

        # 1. Skill Alignment
        if all_jd_skills:
            matched_skills = [s for s in all_jd_skills if s in candidate_all_skills or any(s in syns and bool(candidate_all_skills.intersection(syns)) for syns in TECH_SYNONYMS.values())]
            skill_alignment = round((len(matched_skills) / len(all_jd_skills)) * 100, 1)
        else:
            matched_skills = list(role_overlap)
            skill_alignment = round(min(1.0, len(role_overlap) / 5.0) * 100, 1) if role_overlap else (75.0 if not resume else 30.0)

        # 2. Experience Alignment
        exp_count = resume_details["experience_count"]
        experience_alignment = min(100.0, 50.0 + (exp_count * 20.0)) if resume else 80.0

        # 3. Project Evidence Ratio
        demonstrated_count = len(resume_details["project_skills"])
        listed_count = len(resume_details["listed_skills"])
        if listed_count > 0:
            project_evidence = round(min(100.0, (demonstrated_count / listed_count) * 100), 1)
        elif resume:
            project_evidence = 40.0
        else:
            project_evidence = 75.0

        # 4. Semantic Relevance
        semantic_relevance = round(min(100.0, skill_alignment * 1.05 + 5.0), 1) if resume and (jd or target_role) else 80.0

        # 5. Evidence Confidence
        if resume and resume_details["word_count"] > 100 and resume_details["project_count"] > 0:
            evidence_confidence = 90.0
        elif resume and resume_details["word_count"] > 40:
            evidence_confidence = 70.0
        elif resume:
            evidence_confidence = 35.0
        else:
            evidence_confidence = 80.0

        fit_dims = FitDimensions(
            skill_alignment=skill_alignment,
            experience_alignment=experience_alignment,
            project_evidence=project_evidence,
            critical_gaps_count=len(critical_gaps),
            semantic_relevance=semantic_relevance,
            evidence_confidence=evidence_confidence
        )

        # -----------------------------------------------------------------
        # OVERALL COMPATIBILITY SCORE CALCULATION
        # -----------------------------------------------------------------
        if resume and jd:
            req_ratio = len(candidate_all_skills.intersection(jd_required)) / max(len(jd_required), 1) if jd_required else (skill_alignment / 100.0)
            score = round((0.40 * req_ratio + 0.25 * (skill_alignment / 100.0) + 0.20 * (project_evidence / 100.0) + 0.15 * (matched_prereqs / max(total_prereqs, 1))) * 100, 1)
            # Penalty for critical gaps
            if len(critical_gaps) >= 3:
                score = max(15.0, score - 20.0)
        elif resume:
            score = round((0.60 * (skill_alignment / 100.0) + 0.40 * (matched_prereqs / max(total_prereqs, 1))) * 100, 1)
        elif jd:
            score = 85.0
        else:
            score = 80.0

        score = max(15.0, min(98.0, score))

        # Check for Transferable Skills
        transferable = self._find_transferable_skills(candidate_all_skills, all_jd_skills or role_profile["core_keywords"])
        if transferable:
            user_recommendations.append(STANDARD_MESSAGES["TRANSFERABLE_SKILLS"])
            adjustments.append(f"Acknowledge transferable foundations ({'; '.join(transferable[:2])}) while testing target stack directly.")

        # Check Critical Gaps Warning (PDF §3, §9)
        if critical_gaps and mode in ["resume_jd", "resume_jd_role"]:
            risk_flags.append(RiskFlag(
                code="CRITICAL_REQUIREMENTS_MISSING",
                severity="high" if len(critical_gaps) >= 2 else "medium",
                message=f"Missing evidence for essential requirements: {', '.join(critical_gaps[:5])}.",
                recommendation="Review missing skills or continue with a gap-focused practice interview."
            ))
            user_recommendations.append(
                STANDARD_MESSAGES["CRITICAL_GAPS"].format(skills=", ".join(critical_gaps[:4]))
            )
            adjustments.append(f"Allocate dedicated blueprint turns to assess gap adaptability on: {', '.join(critical_gaps[:3])}.")

        # Check Low Fit Warning (PDF §3, §9)
        if score < 35.0 and mode in ["resume_jd", "resume_jd_role"]:
            if decision_state != "NEEDS_CLARIFICATION":
                decision_state = "READY_WITH_WARNINGS"
            risk_flags.append(RiskFlag(
                code="EXTREMELY_LOW_SIMILARITY",
                severity="high",
                message=f"Compatibility score is {score}%. Resume exhibits limited technical alignment with target Job Description.",
                recommendation="Consider uploading a better-matched resume or proceed with a gap-focused practice interview."
            ))
            user_recommendations.append(STANDARD_MESSAGES["VERY_LOW_FIT"])
            user_recommendations.append(STANDARD_MESSAGES["USER_CHOOSES_TO_PROCEED"])
            adjustments.append("Label session as exploratory/gap-focused. Prioritize fundamentals and missing competencies.")

        # Check Keyword Stuffing (PDF §3, §9)
        if (listed_count >= 8 and demonstrated_count <= 2) or (listed_count > 0 and demonstrated_count == 0):
            risk_flags.append(RiskFlag(
                code="KEYWORD_STUFFING_SUSPECTED",
                severity="medium",
                message="Large skills list without supporting project or employment evidence.",
                recommendation="Weight project evidence over keyword count; start with foundational verification questions."
            ))
            user_recommendations.append(STANDARD_MESSAGES["RESUME_NEEDS_MORE_EVIDENCE"])
            adjustments.append("Begin with foundational verification questions for unproven claimed skills.")

        gap_focused_eligible = bool(critical_gaps or score < 50.0)

        # Final executive summary
        summary = (
            f"Evaluated mode '{mode}' for target role '{effective_role}'. "
            f"Decision State: {decision_state}. "
            f"Compatibility: {score}/100. "
            f"Critical Gaps: {len(critical_gaps)}. "
            f"Identified {len(matched_skills)} verified proficiencies and {len(transferable)} transferable skills."
        )

        return RoleValidationResult(
            is_valid=(decision_state != "INVALID_INPUT"),
            decision_state=decision_state,
            compatibility_score=score,
            target_role=effective_role,
            mode=mode,
            fit_dimensions=fit_dims,
            prerequisites=prerequisites_eval,
            risk_flags=risk_flags,
            skill_overlaps=list(candidate_all_skills.intersection(all_jd_skills or role_profile["core_keywords"]))[:10],
            missing_critical_skills=critical_gaps[:8],
            transferable_skills=transferable[:5],
            gap_focused_interview_eligible=gap_focused_eligible,
            user_recommendations=user_recommendations,
            conflicts=conflicts,
            summary=summary,
            recommended_adjustments=adjustments
        )
