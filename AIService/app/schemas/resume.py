from pydantic import BaseModel, Field

class CandidateInfo(BaseModel):
    name: str | None = None
    email: str | None = None
    phone: str | None = None
    location: str | None = None


class Education(BaseModel):
    degree: str | None = None
    institution: str | None = None
    field: str | None = None
    start_year: str | None = None
    end_year: str | None = None


class Experience(BaseModel):
    company: str | None = None
    role: str | None = None
    start_date: str | None = None
    end_date: str | None = None
    description: list[str] | None = Field(default_factory=list)
    technologies: list[str] | None = Field(default_factory=list)


class Skills(BaseModel):
    programming_languages: list[str] | None = Field(default_factory=list)
    frameworks: list[str] | None = Field(default_factory=list)
    databases: list[str] | None = Field(default_factory=list)
    cloud: list[str] | None = Field(default_factory=list)
    ai_ml: list[str] | None = Field(default_factory=list)
    tools: list[str] | None = Field(default_factory=list)
    other: list[str] | None = Field(default_factory=list)


class Project(BaseModel):
    name: str | None = None
    description: str | None = None
    technologies: list[str] | None = Field(default_factory=list)
    responsibilities: list[str] | None = Field(default_factory=list)


class Resume(BaseModel):
    candidate: CandidateInfo
    summary: str | None = None
    education: list[Education] | None = Field(default_factory=list)
    experience: list[Experience] | None = Field(default_factory=list)
    skills: Skills | None = None
    projects: list[Project] | None = Field(default_factory=list)
    certifications: list[str] | None = Field(default_factory=list)
    achievements: list[str] | None = Field(default_factory=list)
    links: list[str] | None = Field(default_factory=list)
