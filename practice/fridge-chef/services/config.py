"""Configuration management for Fridge Chef."""
import os
from dotenv import load_dotenv

load_dotenv()


class Config:
    """Application configuration."""

    OPENROUTER_API_KEY: str = os.getenv("OPENROUTER_API_KEY", "")
    OPENROUTER_BASE_URL: str = "https://openrouter.ai/api/v1/chat/completions"

    # AI Models
    VISION_MODEL: str = "nvidia/nemotron-nano-12b-v2-vl:free"
    RECIPE_MODEL: str = "nex-agi/deepseek-v3.1-nex-n1:free"

    # Image settings
    MAX_IMAGE_SIZE_MB: int = 10
    SUPPORTED_FORMATS: list[str] = ["jpg", "jpeg", "png", "webp"]

    # API settings
    API_TIMEOUT: int = 60

    @classmethod
    def validate(cls) -> bool:
        """Validate required configuration."""
        if not cls.OPENROUTER_API_KEY:
            return False
        return True
