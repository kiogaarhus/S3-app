"""
Configuration settings for GIDAS Explorer.
Includes JWT and security settings.
"""
from pathlib import Path
from typing import Optional
from pydantic_settings import BaseSettings, SettingsConfigDict

# Find .env file in project root (parent of backend/)
PROJECT_ROOT = Path(__file__).parent.parent.parent
ENV_FILE = PROJECT_ROOT / ".env"


class Settings(BaseSettings):
    """Application settings."""

    # App info
    APP_NAME: str = "GIDAS Explorer"
    VERSION: str = "1.0.0"

    # Security
    SECRET_KEY: str = "development-secret-key-change-in-production-09f8e7d6c5b4a3"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 1440  # 24 hours

    # CORS
    CORS_ORIGINS: list = ["http://localhost:5173"]

    # Database
    DATABASE_URL: Optional[str] = None

    model_config = SettingsConfigDict(
        env_file=str(ENV_FILE),
        case_sensitive=True,
        extra="ignore"  # Ignore extra fields from .env
    )


# Global settings instance
settings = Settings()
