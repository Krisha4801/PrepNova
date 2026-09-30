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
    if resume.candidate.info:
        candidate = resume.candidate_info

        content_parts = []

        if candidate.name:
            content_parts.append(
                f"Name: {candidate.name}"
            )

        if candidate.email:
            content_parts.append(
                f"Email: {candidate.email}"
            )

        if candidate.phone:
            content_parts.append(
                f"Phone: {candidate.phone}"
            )

        if content_parts:

            documents.append(
                InterviewDocument(
                    content=normalize_text(
                        "\n".join(content_parts)
                    ),
                    source="resume",
                    document_type="resume",
                    section="candidate_info",
                )
            )
    
    # Education
    for index, education in enumerate(
        resume.education or []
    ):

        content_parts = []

        if education.degree:
            content_parts.append(
                f"Degree: {education.degree}"
            )

        if education.field_of_study:
            content_parts.append(
                f"Field of Study: "
                f"{education.field_of_study}"
            )

        if education.start_date:
            content_parts.append(
                f"Start Date: "
                f"{education.start_date}"
            )

        if education.end_date:
            content_parts.append(
                f"End Date: "
                f"{education.end_date}"
            )

        if content_parts:

            documents.append(
                InterviewDocument(
                    content=normalize_text(
                        "\n".join(content_parts)
                    ),
                    source="resume",
                    document_type="resume",
                    section="education",
                    metadata={
                        "education_index": index
                    },
                )
            )
 
    # Experience
    for index, experience in enumerate(
        resume.experience or []
    ):

        content_parts = []

        if experience.company:
            content_parts.append(
                f"Company: {experience.company}"
            )

        if experience.role:
            content_parts.append(
                f"Role: {experience.role}"
            )

        if experience.start_date:
            content_parts.append(
                f"Start Date: "
                f"{experience.start_date}"
            )

        if experience.end_date:
            content_parts.append(
                f"End Date: "
                f"{experience.end_date}"
            )

        if experience.description:
            content_parts.append(
                f"Description: "
                f"{experience.description}"
            )

        if content_parts:

            documents.append(
                InterviewDocument(
                    content=normalize_text(
                        "\n".join(content_parts)
                    ),
                    source="resume",
                    document_type="resume",
                    section="experience",
                    metadata={
                        "experience_index": index
                    },
                )
            )

    # =========================================================
    # Skills
    # =========================================================

    skills = normalize_list(
        resume.skills
    )

    if skills:

        documents.append(
            InterviewDocument(
                content=(
                    "Skills: "
                    + ", ".join(skills)
                ),
                source="resume",
                document_type="resume",
                section="skills",
            )
        )

    # =========================================================
    # Projects
    # =========================================================

    for index, project in enumerate(
        resume.projects or []
    ):

        content_parts = []

        if project.name:
            content_parts.append(
                f"Project: {project.name}"
            )

        if project.description:
            content_parts.append(
                f"Description: "
                f"{project.description}"
            )

        if project.technologies:

            technologies = normalize_list(
                project.technologies
            )

            if technologies:

                content_parts.append(
                    "Technologies: "
                    + ", ".join(technologies)
                )

        if content_parts:

            documents.append(
                InterviewDocument(
                    content=normalize_text(
                        "\n".join(content_parts)
                    ),
                    source="resume",
                    document_type="resume",
                    section="project",
                    metadata={
                        "project_index": index
                    },
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
