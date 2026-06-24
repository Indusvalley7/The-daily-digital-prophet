import os
from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    # Supabase settings
    SUPABASE_URL: str = ""
    SUPABASE_KEY: str = ""
    
    # ChromaDB settings
    CHROMA_DB_DIR: str = "./chroma_data"
    
    # LLM Settings
    LLM_PROVIDER: str = "groq"  # "ollama" or "groq"
    OLLAMA_BASE_URL: str = "http://localhost:11434"
    LLM_MODEL: str = "mistral"
    
    # Cloud providers
    GROQ_API_KEY: str = ""
    
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

settings = Settings()
