import json

from app.schemas.resume import Resume
from app.services.llm.client import LLMClient


class ResumeExtractor:

    def __init__(self):
        self.llm = LLMClient().get_llm()

    def extract(self, text: str) -> Resume:

        structured_llm = self.llm.with_structured_output(
            Resume
        )

        prompt = f"""
You are a resume information extraction system.

Extract information from the resume and return it
according to the provided Resume schema.

Rules:

1. Extract only information explicitly present in the resume.
2. Never invent skills, companies, dates, projects, or qualifications.
3. If information is missing, return null where allowed.
4. Return empty arrays when no items are available.
5. Preserve the meaning of the original resume.
6. Do not infer technologies that are not mentioned.

Resume:

--- RESUME START ---

{text}

--- RESUME END ---
"""

        result = structured_llm.invoke(prompt)

        return result