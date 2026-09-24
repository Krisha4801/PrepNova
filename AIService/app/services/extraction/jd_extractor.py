from app.schemas.jd import JobDescription
from app.services.llm.client import LLMClient

from app.schemas.jd import JobDescription
from app.services.llm.client import LLMClient


class JDExtractor:

    def __init__(self):
        self.llm = LLMClient().get_llm()

    def extract(self, text: str) -> JobDescription:

        structured_llm = self.llm.with_structured_output(
            JobDescription
        )

        prompt = f"""
You are a job description information extraction system.

Extract information from the job description and return it
according to the provided JobDescription schema.

Rules:

1. Extract only information explicitly present in the JD.
2. Never invent skills, technologies, responsibilities,
   qualifications, companies, or experience requirements.
3. Separate required skills and preferred skills when the
   JD explicitly distinguishes them.
4. Extract technologies and tools mentioned in the JD.
5. Extract responsibilities as individual items.
6. Extract education and experience requirements.
7. Extract soft skills only when explicitly mentioned.
8. If information is missing, return null where allowed
   and empty arrays where appropriate.
9. Preserve the meaning of the original JD.

Job Description:

--- JD START ---

{text}

--- JD END ---
"""

        result = structured_llm.invoke(prompt)

        return result
