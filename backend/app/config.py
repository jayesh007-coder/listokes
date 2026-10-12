"""
Listokes Backend — Application Configuration

Loads all settings from environment variables / .env file.
Includes automatic compatibility adapters for free cloud hosting platforms
(Render.com, Neon.tech, Supabase, Railway, Koyeb, Fly.io).
"""

import os
from pydantic_settings import BaseSettings
from pydantic import Field, field_validator


class Settings(BaseSettings):
    # ── App ──────────────────────────────────────────────
    APP_NAME: str = "Listokes"
    APP_VERSION: str = "1.0.0"
    DEBUG: bool = False
    PORT: int = Field(default=8000, description="Server port, automatically set by cloud hosts")

    # ── Database ─────────────────────────────────────────
    DATABASE_URL: str = Field(
        default="postgresql+asyncpg://postgres:postgres@localhost:5432/listokes",
        description="Async SQLAlchemy connection string",
    )

    # ── JWT / Auth ───────────────────────────────────────
    SECRET_KEY: str = Field(
        default="CHANGE-ME-in-production-use-openssl-rand-hex-32",
        description="Secret used to sign JWT tokens",
    )
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7

    # ── CORS ─────────────────────────────────────────────
    CORS_ORIGINS: list[str] = ["*"]

    @field_validator("DATABASE_URL", mode="before")
    @classmethod
    def assemble_db_url(cls, v: str | None) -> str:
        """
        Adapts cloud database URLs (Render, Neon, Supabase, Railway).
        Cloud hosts provide postgres:// or postgresql://, which SQLAlchemy asyncpg requires
        as postgresql+asyncpg://.
        """
        if not v:
            return "postgresql+asyncpg://postgres:postgres@localhost:5432/listokes"

        url = str(v).strip()

        # Handle postgres:// (Heroku/Render legacy format)
        if url.startswith("postgres://"):
            url = url.replace("postgres://", "postgresql+asyncpg://", 1)
        # Handle postgresql:// (Neon/Supabase format without driver)
        elif url.startswith("postgresql://") and not url.startswith("postgresql+asyncpg://"):
            url = url.replace("postgresql://", "postgresql+asyncpg://", 1)

        # asyncpg prefers ssl=require instead of sslmode=require
        if "sslmode=require" in url:
            url = url.replace("sslmode=require", "ssl=require")

        return url

    @field_validator("CORS_ORIGINS", mode="before")
    @classmethod
    def assemble_cors_origins(cls, v: str | list[str] | None) -> list[str]:
        if isinstance(v, str):
            if v.startswith("[") and v.endswith("]"):
                import json
                try:
                    return json.loads(v)
                except Exception:
                    pass
            return [origin.strip() for origin in v.split(",") if origin.strip()]
        if isinstance(v, list):
            return v
        return ["*"]

    model_config = {
        "env_file": ".env",
        "env_file_encoding": "utf-8",
        "case_sensitive": True,
        "extra": "ignore",
    }


settings = Settings()
