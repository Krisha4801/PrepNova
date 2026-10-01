from app.schemas.jd import JobDescription
from app.services.llm.client import LLMClient
from langchain_core.output_parsers import PydanticOutputParser
from app.schemas.jd import JobDescription
from app.services.llm.client import LLMClient


class JDExtractor:

    def __init__(self):
        self.llm = LLMClient().get_llm()
        self.parser = PydanticOutputParser(pydantic_object=JobDescription)


    def extract(self, text: str) -> JobDescription:

        structured_llm = self.llm.with_structured_output(
            JobDescription
        )

        prompt = f"""
You are an expert job description information extraction system.
Extract information from the job description and format it strictly as a single JSON object matching the schema below.
{self.parser.get_format_instructions()}
Rules:
1. Extract only information explicitly present in the JD.
2. Never invent skills, technologies, responsibilities, qualifications, companies, or experience requirements.
3. Separate required skills and preferred skills when the JD explicitly distinguishes them.
4. Extract technologies and tools mentioned in the JD.
5. Extract responsibilities as individual items.
6. Extract education and experience requirements.
7. Extract soft skills only when explicitly mentioned.
8. If information is missing, return null or empty lists as specified in schema.
9. Output valid JSON only, without markdown formatting wrappers or duplicate keys.
Job Description:
--- JD START ---
{text}
--- JD END ---
"""
        response = self.llm.invoke(prompt)
        result = self.parser.parse(response.content)
        return result
