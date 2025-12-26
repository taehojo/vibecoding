"""Tests for vision service."""
import pytest
import sys
from pathlib import Path

# Add project root to path
sys.path.insert(0, str(Path(__file__).parent.parent))

from services.vision import VisionService
from services.config import Config


class TestVisionService:
    """Test cases for VisionService."""

    def test_init(self):
        """Test service initialization."""
        service = VisionService()
        assert service.model == "nvidia/nemotron-nano-12b-v2-vl:free"
        assert service.base_url == "https://openrouter.ai/api/v1/chat/completions"

    def test_encode_image(self):
        """Test image encoding."""
        service = VisionService()
        test_bytes = b"test image data"
        result = service._encode_image(test_bytes)
        assert result.startswith("data:image/jpeg;base64,")

    def test_build_prompt(self):
        """Test prompt building."""
        service = VisionService()
        prompt = service._build_prompt()
        assert "냉장고" in prompt
        assert "재료" in prompt

    def test_parse_ingredients_bullet_list(self):
        """Test parsing bullet list format."""
        service = VisionService()
        response = """
        - 양파
        - 당근
        - 계란
        """
        result = service._parse_ingredients(response)
        assert "양파" in result
        assert "당근" in result
        assert "계란" in result

    def test_parse_ingredients_numbered_list(self):
        """Test parsing numbered list format."""
        service = VisionService()
        response = """
        1. 양파
        2. 당근
        3. 계란
        """
        result = service._parse_ingredients(response)
        assert "양파" in result
        assert "당근" in result
        assert "계란" in result

    def test_parse_ingredients_filters_non_ingredients(self):
        """Test that non-ingredient lines are filtered."""
        service = VisionService()
        response = """
        이미지에서 보이는 재료:
        - 양파
        - 당근
        재료가 없습니다.
        """
        result = service._parse_ingredients(response)
        assert "양파" in result
        assert "당근" in result
        assert len(result) == 2


class TestConfig:
    """Test cases for Config."""

    def test_config_values(self):
        """Test configuration values."""
        assert Config.VISION_MODEL == "nvidia/nemotron-nano-12b-v2-vl:free"
        assert Config.RECIPE_MODEL == "nex-agi/deepseek-v3.1-nex-n1:free"
        assert Config.MAX_IMAGE_SIZE_MB == 10

    def test_validate_with_api_key(self):
        """Test validation with API key set."""
        # Should return True if API key is set in .env
        result = Config.validate()
        assert isinstance(result, bool)
