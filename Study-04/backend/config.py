"""
Configuration management for FridgeChef application
"""
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

class Config:
    """Application configuration"""

    # OpenRouter API
    OPENROUTER_API_KEY = os.getenv('OPENROUTER_API_KEY')
    OPENROUTER_BASE_URL = "https://openrouter.ai/api/v1"

    # Model configurations
    IMAGE_RECOGNITION_MODEL = "meta-llama/llama-4-maverick:free"
    RECIPE_GENERATION_MODEL = "deepseek/deepseek-chat-v3.1:free"

    # Image settings
    MAX_IMAGE_SIZE = 10 * 1024 * 1024  # 10MB
    ALLOWED_EXTENSIONS = {'jpg', 'jpeg', 'png', 'webp'}
    IMAGE_MAX_DIMENSION = 1024

    # Application settings
    APP_NAME = "FridgeChef"
    APP_VERSION = "1.0.0"
    DEBUG = os.getenv('DEBUG', 'False').lower() == 'true'

    # Paths
    TEMP_FOLDER = "data/temp"
    TEST_IMAGES_FOLDER = "tests/test_images"

    # API settings
    REQUEST_TIMEOUT = 30  # seconds
    MAX_RETRIES = 3

    @classmethod
    def validate(cls):
        """Validate required configuration"""
        if not cls.OPENROUTER_API_KEY:
            raise ValueError("OPENROUTER_API_KEY is not set in environment variables")

        # Create folders if they don't exist
        os.makedirs(cls.TEMP_FOLDER, exist_ok=True)
        os.makedirs(cls.TEST_IMAGES_FOLDER, exist_ok=True)

        return True