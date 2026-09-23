"""
Configuration Module

This module handles environment variables and configuration settings.
"""

import os

from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")


def _csv_setting(name: str, default: str) -> list[str]:
    return [value.strip() for value in os.getenv(name, default).split(",") if value.strip()]


CORS_ORIGINS = _csv_setting(
    "CORS_ORIGINS",
    "http://localhost:3000,http://127.0.0.1:3000",
)
ENABLE_RETRIEVAL = os.getenv("ENABLE_RETRIEVAL", "false").lower() in {"1", "true", "yes"}
