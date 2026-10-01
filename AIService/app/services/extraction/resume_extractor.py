from langchain_core import prompt_values
import json

from app.schemas.resume import Resume
from app.services.llm.client import LLMClient
from langchain_core.output_parsers import PydanticOutputParser


class ResumeExtractor:

    def __init__(self):
        self.llm = LLMClient().get_llm()
        self.parser = PydanticOutputParser(pydantic_object=Resume) 

    def extract(self, text: str) -> Resume:

        structured_llm = self.llm.with_structured_output(
            Resume,
            method="json_mode"
        )

        prompt = f"""
You are an expert resume information extraction system.
Extract the resume content and format it strictly as a single JSON object matching the schema below.
{self.parser.get_format_instructions()}
Rules:
1. Extract only information explicitly present in the resume.
2. Never invent skills, companies, dates, projects, or qualifications.
3. If information is missing, return null or empty lists as specified in schema.
4. Output valid JSON only, without any markdown formatting wrappers or duplicate keys.
Resume:
--- RESUME START ---
{text}
--- RESUME END ---
"""

        response = self.llm.invoke(prompt)
        result = self.parser.parse(response.content)
        return result