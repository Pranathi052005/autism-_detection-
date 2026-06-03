from pydantic_settings import BaseSettings
from functools import lru_cache

class Settings(BaseSettings):
    DATABASE_URL: str = "sqlite:///./autismdetect.db"
    SECRET_KEY: str = "your-super-secret-key-that-should-be-at-least-32-chars"
    OPENAI_API_KEY: str = "sk-placeholder"
    UPLOAD_DIR: str = "uploads"
    ENVIRONMENT: str = "development"
    GEMINI_API_KEY: str = ""
    GEMINI_MODEL: str = "gemini-1.5-flash"
    
    class Config:
        env_file = ".env"
        extra = "ignore"

@lru_cache()
def get_settings():
    return Settings()
