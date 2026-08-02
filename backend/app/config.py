from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    DATABASE_URL: str = "postgresql://user:password@host:port/database"
    GITHUB_TOKEN: str = "your_github_token"
    LLM_API_KEY: str = "your_llm_api_key"
    REDIS_URL: str = ""
    OPENAI_API_KEY: str = ""
    CHROMA_PERSIST_DIR: str = "./chroma_data"
    LLM_MODEL: str = "gemini-3.5-flash"
    EMBEDDING_MODEL: str = "text-embedding-004"

    model_config = SettingsConfigDict(env_file=".env", env_file_encoding='utf-8')

settings = Settings()
