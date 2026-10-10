from math import remainder
from typing import List
from app.schemas.document import InterviewDocument
from app.schemas.resume import Resume
from app.schemas.jd import JobDescription
from app.services.processing.normalizer import (
    normalize_list,
    normalize_text
)

def resume_to_documents(
    resume: Resume
)-> List[InterviewDocument]:

    documents: List[InterviewDocument] = []

    # Candidate Information
    candidate = getattr(resume, "candidate", None) or getattr(resume, "candidate_info", None)
    if candidate:
        content_parts = []
        name = getattr(candidate, "name", None)
        email = getattr(candidate, "email", None)
        phone = getattr(candidate, "phone", None)
        location = getattr(candidate, "location", None)

        if name:
            content_parts.append(f"Name: {name}")
        if email:
            content_parts.append(f"Email: {email}")
        if phone:
            content_parts.append(f"Phone: {phone}")
        if location:
            content_parts.append(f"Location: {location}")

        if content_parts:
            documents.append(
                InterviewDocument(
                    content=normalize_text("\n".join(content_parts)),
                    source="resume",
                    document_type="resume",
                    section="candidate_info",
                )
            )

    # Summary
    summary = getattr(resume, "summary", None)
    if summary and str(summary).strip():
        documents.append(
            InterviewDocument(
                content=normalize_text(f"Professional Summary: {summary}"),
                source="resume",
                document_type="resume",
                section="summary",
            )
        )
    
    # Education
    for index, education in enumerate(resume.education or []):
        content_parts = []
        degree = getattr(education, "degree", None)
        inst = getattr(education, "institution", None)
        field = getattr(education, "field", None) or getattr(education, "field_of_study", None)
        start = getattr(education, "start_year", None) or getattr(education, "start_date", None)
        end = getattr(education, "end_year", None) or getattr(education, "end_date", None)

        if degree:
            content_parts.append(f"Degree: {degree}")
        if inst:
            content_parts.append(f"Institution: {inst}")
        if field:
            content_parts.append(f"Field: {field}")
        if start or end:
            content_parts.append(f"Period: {start or ''} - {end or 'Present'}")

        if content_parts:
            documents.append(
                InterviewDocument(
                    content=normalize_text("\n".join(content_parts)),
                    source="resume",
                    document_type="resume",
                    section="education",
                    metadata={"education_index": index},
                )
            )
 
    # Experience
    for index, experience in enumerate(resume.experience or []):
        content_parts = []
        company = getattr(experience, "company", None)
        role = getattr(experience, "role", None)
        start = getattr(experience, "start_date", None)
        end = getattr(experience, "end_date", None)
        desc = getattr(experience, "description", None)
        techs = getattr(experience, "technologies", None)

        if company:
            content_parts.append(f"Company: {company}")
        if role:
            content_parts.append(f"Role: {role}")
        if start or end:
            content_parts.append(f"Dates: {start or ''} - {end or 'Present'}")
        if desc:
            if isinstance(desc, list):
                content_parts.append("Responsibilities: " + "; ".join(desc))
            else:
                content_parts.append(f"Description: {desc}")
        if techs:
            norm_techs = normalize_list(techs)
            if norm_techs:
                content_parts.append("Technologies: " + ", ".join(norm_techs))

        if content_parts:
            documents.append(
                InterviewDocument(
                    content=normalize_text("\n".join(content_parts)),
                    source="resume",
                    document_type="resume",
                    section="experience",
                    metadata={"experience_index": index},
                )
            )

    # =========================================================
    # Skills
    # =========================================================
    raw_skills = getattr(resume, "skills", None)
    all_skills = []
    if raw_skills:
        if hasattr(raw_skills, "__dict__") or hasattr(raw_skills, "model_dump"):
            skills_dict = raw_skills.model_dump() if hasattr(raw_skills, "model_dump") else raw_skills.__dict__
            for cat, val in skills_dict.items():
                if isinstance(val, list) and val:
                    all_skills.extend(val)
        elif isinstance(raw_skills, list):
            all_skills.extend(raw_skills)

    skills = normalize_list(all_skills)
    if skills:
        documents.append(
            InterviewDocument(
                content="Skills: " + ", ".join(skills),
                source="resume",
                document_type="resume",
                section="skills",
            )
        )

    # =========================================================
    # Certifications & Achievements
    # =========================================================
    certs = getattr(resume, "certifications", None)
    if certs:
        norm_certs = normalize_list(certs)
        if norm_certs:
            documents.append(
                InterviewDocument(
                    content="Certifications: " + ", ".join(norm_certs),
                    source="resume",
                    document_type="resume",
                    section="certifications",
                )
            )

    achievements = getattr(resume, "achievements", None)
    if achievements:
        norm_ach = normalize_list(achievements)
        if norm_ach:
            documents.append(
                InterviewDocument(
                    content="Achievements: " + ", ".join(norm_ach),
                    source="resume",
                    document_type="resume",
                    section="achievements",
                )
            )

    # =========================================================
    # Projects
    # =========================================================

    for index, project in enumerate(resume.projects or []):
        content_parts = []
        name = getattr(project, "name", None)
        desc = getattr(project, "description", None)
        techs = getattr(project, "technologies", None)
        resp = getattr(project, "responsibilities", None)

        if name:
            content_parts.append(f"Project: {name}")

        if desc:
            if isinstance(desc, list):
                content_parts.append("Description: " + "; ".join(desc))
            else:
                content_parts.append(f"Description: {desc}")

        if resp:
            if isinstance(resp, list):
                content_parts.append("Responsibilities: " + "; ".join(resp))
            else:
                content_parts.append(f"Responsibilities: {resp}")

        if techs:
            norm_techs = normalize_list(techs)
            if norm_techs:
                content_parts.append("Technologies: " + ", ".join(norm_techs))

        if content_parts:
            documents.append(
                InterviewDocument(
                    content=normalize_text("\n".join(content_parts)),
                    source="resume",
                    document_type="resume",
                    section="project",
                    metadata={"project_index": index},
                )
            )

    return documents


def jd_to_documents(
    jd: JobDescription,
) -> List[InterviewDocument]:

    documents: List[InterviewDocument] = []

    # =========================================================
    # Job information
    # =========================================================

    job_info = jd.job_info

    content_parts = []

    if job_info.title:
        content_parts.append(
            f"Job Title: {job_info.title}"
        )

    if job_info.company:
        content_parts.append(
            f"Company: {job_info.company}"
        )

    if job_info.location:
        content_parts.append(
            f"Location: {job_info.location}"
        )

    if job_info.employment_type:
        content_parts.append(
            f"Employment Type: "
            f"{job_info.employment_type}"
        )

    if content_parts:

        documents.append(
            InterviewDocument(
                content=normalize_text(
                    "\n".join(content_parts)
                ),
                source="jd",
                document_type="jd",
                section="job_info",
            )
        )

    # =========================================================
    # Required skills
    # =========================================================

    required_skills = normalize_list(
        jd.requirements.required_skills
    )

    if required_skills:

        documents.append(
            InterviewDocument(
                content=(
                    "Required Skills: "
                    + ", ".join(required_skills)
                ),
                source="jd",
                document_type="jd",
                section="required_skills",
            )
        )

    # =========================================================
    # Preferred skills
    # =========================================================

    preferred_skills = normalize_list(
        jd.requirements.preferred_skills
    )

    if preferred_skills:

        documents.append(
            InterviewDocument(
                content=(
                    "Preferred Skills: "
                    + ", ".join(preferred_skills)
                ),
                source="jd",
                document_type="jd",
                section="preferred_skills",
            )
        )

    # =========================================================
    # Education
    # =========================================================

    education = normalize_list(
        jd.requirements.education
    )

    if education:

        documents.append(
            InterviewDocument(
                content=(
                    "Education Requirements:\n"
                    + "\n".join(education)
                ),
                source="jd",
                document_type="jd",
                section="education",
            )
        )

    # =========================================================
    # Experience
    # =========================================================

    experience = normalize_list(
        jd.requirements.experience
    )

    if experience:

        documents.append(
            InterviewDocument(
                content=(
                    "Experience Requirements:\n"
                    + "\n".join(experience)
                ),
                source="jd",
                document_type="jd",
                section="experience",
            )
        )

    # =========================================================
    # Responsibilities
    # =========================================================

    responsibilities = normalize_list(
        jd.responsibilities.items
    )

    if responsibilities:

        documents.append(
            InterviewDocument(
                content=(
                    "Responsibilities:\n"
                    + "\n".join(responsibilities)
                ),
                source="jd",
                document_type="jd",
                section="responsibilities",
            )
        )

    # =========================================================
    # Technologies
    # =========================================================

    technologies = normalize_list(
        jd.technologies
    )

    if technologies:

        documents.append(
            InterviewDocument(
                content=(
                    "Technologies: "
                    + ", ".join(technologies)
                ),
                source="jd",
                document_type="jd",
                section="technologies",
            )
        )

    # =========================================================
    # Soft skills
    # =========================================================

    soft_skills = normalize_list(
        jd.soft_skills
    )

    if soft_skills:

        documents.append(
            InterviewDocument(
                content=(
                    "Soft Skills: "
                    + ", ".join(soft_skills)
                ),
                source="jd",
                document_type="jd",
                section="soft_skills",
            )
        )

    # =========================================================
    # Qualifications
    # =========================================================

    qualifications = normalize_list(
        jd.qualifications
    )

    if qualifications:

        documents.append(
            InterviewDocument(
                content=(
                    "Qualifications:\n"
                    + "\n".join(qualifications)
                ),
                source="jd",
                document_type="jd",
                section="qualifications",
            )
        )

    return documents
