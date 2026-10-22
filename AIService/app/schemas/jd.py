from pydantic import BaseModel, Field
from typing import List, Optional, Union


class JobInfo(BaseModel):
    title: Optional[str] = None
    company: Optional[str] = None
    location: Optional[str] = None
    employment_type: Optional[str] = None


class Requirements(BaseModel):
    required_skills: Optional[Union[List[str], str]] = Field(default_factory=list)
    preferred_skills: Optional[Union[List[str], str]] = Field(default_factory=list)
    education: Optional[Union[List[str], str]] = Field(default_factory=list)
    experience: Optional[Union[List[str], str]] = Field(default_factory=list)


class Responsibilities(BaseModel):
    items: Optional[Union[List[str], str]] = Field(default_factory=list)


class JobDescription(BaseModel):
    title: Optional[str] = None
    role_title: Optional[str] = None
    job_info: Optional[JobInfo] = Field(default_factory=JobInfo)
    requirements: Optional[Requirements] = Field(default_factory=Requirements)
    responsibilities: Optional[Union[Responsibilities, List[str], str]] = Field(default_factory=Responsibilities)
    technologies: Optional[Union[List[str], str]] = Field(default_factory=list)
    required_skills: Optional[Union[List[str], str]] = Field(default_factory=list)
    preferred_skills: Optional[Union[List[str], str]] = Field(default_factory=list)
    soft_skills: Optional[Union[List[str], str]] = Field(default_factory=list)
    qualifications: Optional[Union[List[str], str]] = Field(default_factory=list)
    raw_text: Optional[str] = None