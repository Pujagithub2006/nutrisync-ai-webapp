from pydantic_settings import BaseSettings
from pydantic import ConfigDict
from functools import lru_cache


class Settings(BaseSettings):
    app_env: str = "development"
    database_url: str = ""
    gemini_api_key: str = ""
    redis_url: str = ""
    firebase_credentials_path: str = "./firebase-credentials.json"

    model_config = ConfigDict(
        env_file=".env",
        case_sensitive=False,
        extra="allow"
    )


@lru_cache()
def get_settings():
    return Settings()