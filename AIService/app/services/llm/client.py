from langchain_groq import ChatGroq
from app.core.config import settings

class LLMClient:

    def __init__(self):
        self.llm = ChatGroq(
            model=settings.groq_model,
            api_key=settings.groq_api_key,
            temperature=0,
            max_tokens=4096,
            max_retries=2,
        )

    def get_llm(self) -> ChatGroq:
        return self.llm
