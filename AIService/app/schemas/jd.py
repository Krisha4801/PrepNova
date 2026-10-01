from pydantic import BaseModel, Field
from typing import List, Optional


class JobInfo(BaseModel):
    title: Optional[str] = None
    company: Optional[str] = None
    location: Optional[str] = None
    employment_type: Optional[str] = None


class Requirements(BaseModel):
    required_skills: List[str] = Field(default_factory=list)
    preferred_skills: List[str] = Field(default_factory=list)
    education: List[str] = Field(default_factory=list)
    experience: List[str] = Field(default_factory=list)


class Responsibilities(BaseModel):
    items: List[str] = Field(default_factory=list)


class JobDescription(BaseModel):
    job_info: Optional[JobInfo] = Field(default_factory=JobInfo)
    requirements: Optional[Requirements] = Field(default_factory=Requirements)
    responsibilities: Optional[Responsibilities] = Field(default_factory=Responsibilities)
    technologies: List[str] = Field(default_factory=list)
    soft_skills: List[str] = Field(default_factory=list)
    qualifications: List[str] = Field(default_factory=list)