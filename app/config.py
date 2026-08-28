from pathlib import Path

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    app_name: str = "Sarathi Next API"
    environment: str = "development"
    database_url: str
    secret_key: str
    cors_origins: str = "http://localhost:3000"
    local_storage_path: Path = Path(".local/private-documents")


settings = Settings()