import json
import re

from app.schemas.resume import Resume
from app.services.llm.client import LLMClient
from langchain_core.output_parsers import PydanticOutputParser


class ResumeExtractor:

    def __init__(self):
        self.llm = LLMClient().get_llm()
        self.parser = PydanticOutputParser(pydantic_object=Resume)

    def extract(self, text: str) -> Resume:
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

        # 1. Primary: native structured output
        try:
            structured_llm = self.llm.with_structured_output(Resume)
            result = structured_llm.invoke(prompt)
            if isinstance(result, Resume):
                return result
            if isinstance(result, dict):
                return Resume.model_validate(result)
        except Exception:
            pass

        # 2. Resilient fallback: standard invoke with markdown fence removal
        response = self.llm.invoke(prompt)
        raw_content = response.content if hasattr(response, "content") else str(response)
        cleaned = re.sub(r"^```(?:json)?\s*", "", raw_content.strip(), flags=re.IGNORECASE)
        cleaned = re.sub(r"\s*```$", "", cleaned.strip())

        try:
            return self.parser.parse(cleaned)
        except Exception:
            parsed_dict = json.loads(cleaned)
            return Resume.model_validate(parsed_dict)