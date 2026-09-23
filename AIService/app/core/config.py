from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):

    groq_api_key: str
    groq_model: str = "openai/gpt-oss-20b"
    tesseract_cmd: str | None = None

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False
    )

settings = Settings()