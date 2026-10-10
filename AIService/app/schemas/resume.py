from pydantic import BaseModel, Field
from typing import List, Optional, Union

class CandidateInfo(BaseModel):
    name: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    location: Optional[str] = None


class Education(BaseModel):
    degree: Optional[str] = None
    institution: Optional[str] = None
    field: Optional[str] = None
    start_year: Optional[str] = None
    end_year: Optional[str] = None


class Experience(BaseModel):
    company: Optional[str] = None
    role: Optional[str] = None
    start_date: Optional[str] = None
    end_date: Optional[str] = None
    description: Optional[Union[List[str], str]] = Field(default_factory=list)
    technologies: Optional[Union[List[str], str]] = Field(default_factory=list)


class Skills(BaseModel):
    programming_languages: Optional[Union[List[str], str]] = Field(default_factory=list)
    frameworks: Optional[Union[List[str], str]] = Field(default_factory=list)
    databases: Optional[Union[List[str], str]] = Field(default_factory=list)
    cloud: Optional[Union[List[str], str]] = Field(default_factory=list)
    ai_ml: Optional[Union[List[str], str]] = Field(default_factory=list)
    tools: Optional[Union[List[str], str]] = Field(default_factory=list)
    other: Optional[Union[List[str], str]] = Field(default_factory=list)


class Project(BaseModel):
    name: Optional[str] = None
    description: Optional[Union[List[str], str]] = None
    technologies: Optional[Union[List[str], str]] = Field(default_factory=list)
    responsibilities: Optional[Union[List[str], str]] = Field(default_factory=list)


class Resume(BaseModel):
    candidate: Optional[CandidateInfo] = Field(default_factory=CandidateInfo)
    summary: Optional[Union[str, List[str]]] = None
    education: Optional[List[Education]] = Field(default_factory=list)
    experience: Optional[List[Experience]] = Field(default_factory=list)
    skills: Optional[Union[Skills, dict, List[str]]] = None
    projects: Optional[List[Project]] = Field(default_factory=list)
    certifications: Optional[Union[List[str], str]] = Field(default_factory=list)
    achievements: Optional[Union[List[str], str]] = Field(default_factory=list)
    links: Optional[Union[List[str], str]] = Field(default_factory=list)
