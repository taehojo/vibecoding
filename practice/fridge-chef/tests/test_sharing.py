"""Tests for sharing service."""
import pytest
import sys
from pathlib import Path

# Add project root to path
sys.path.insert(0, str(Path(__file__).parent.parent))

from db.init_db import init_database
from db.database import engine
from db.models import Base
from services.auth import AuthService
from services.user import UserRecipeService
from services.sharing import SharingService


@pytest.fixture(autouse=True)
def setup_database():
    """Set up and tear down test database."""
    Base.metadata.create_all(bind=engine)
    yield
    Base.metadata.drop_all(bind=engine)


@pytest.fixture
def test_user():
    """Create a test user."""
    user = AuthService.register("testuser", "password123", "Test User")
    return user


@pytest.fixture
def sample_recipe():
    """Sample recipe data."""
    return {
        "name": "테스트 요리",
        "description": "맛있는 테스트 요리입니다",
        "difficulty": "쉬움",
        "cooking_time": 15,
        "servings": 2,
        "ingredients": {
            "available": ["양파", "당근"],
            "additional_needed": ["소금"]
        },
        "instructions": ["1. 준비하기", "2. 요리하기"],
        "tips": ["팁입니다"]
    }


class TestSharingService:
    """Test cases for SharingService."""

    def test_generate_share_id(self):
        """Test share ID generation."""
        share_id1 = SharingService.generate_share_id()
        share_id2 = SharingService.generate_share_id()

        assert share_id1 is not None
        assert share_id2 is not None
        assert share_id1 != share_id2
        assert len(share_id1) >= 8

    def test_create_share_link(self):
        """Test share link creation."""
        share_id = "abc123"
        link = SharingService.create_share_link(share_id)

        assert "abc123" in link
        assert link.startswith("http")

    def test_generate_qr_code(self):
        """Test QR code generation."""
        url = "https://example.com/recipe"
        qr_buffer = SharingService.generate_qr_code(url)

        assert qr_buffer is not None
        # Should be a valid PNG
        qr_buffer.seek(0)
        png_header = qr_buffer.read(8)
        assert png_header[:4] == b"\x89PNG"

    def test_format_recipe_for_sharing(self, sample_recipe):
        """Test recipe text formatting."""
        formatted = SharingService.format_recipe_for_sharing(sample_recipe)

        assert "테스트 요리" in formatted
        assert "15분" in formatted
        assert "쉬움" in formatted
        assert "2인분" in formatted
        assert "양파" in formatted
        assert "준비하기" in formatted
        assert "Fridge Chef" in formatted

    def test_enable_sharing(self, test_user, sample_recipe):
        """Test enabling sharing for a recipe."""
        user_service = UserRecipeService(test_user.id)
        recipe_id = user_service.save_recipe(sample_recipe)

        share_id = SharingService.enable_sharing(recipe_id)

        assert share_id is not None
        assert len(share_id) >= 8

    def test_enable_sharing_returns_same_id(self, test_user, sample_recipe):
        """Test that enabling sharing returns same ID if already enabled."""
        user_service = UserRecipeService(test_user.id)
        recipe_id = user_service.save_recipe(sample_recipe)

        share_id1 = SharingService.enable_sharing(recipe_id)
        share_id2 = SharingService.enable_sharing(recipe_id)

        assert share_id1 == share_id2

    def test_get_shared_recipe(self, test_user, sample_recipe):
        """Test getting a shared recipe."""
        user_service = UserRecipeService(test_user.id)
        recipe_id = user_service.save_recipe(sample_recipe)
        share_id = SharingService.enable_sharing(recipe_id)

        shared_recipe = SharingService.get_shared_recipe(share_id)

        assert shared_recipe is not None
        assert shared_recipe["name"] == "테스트 요리"

    def test_get_shared_recipe_invalid_id(self):
        """Test getting recipe with invalid share ID."""
        recipe = SharingService.get_shared_recipe("invalid_id")

        assert recipe is None

    def test_disable_sharing(self, test_user, sample_recipe):
        """Test disabling sharing."""
        user_service = UserRecipeService(test_user.id)
        recipe_id = user_service.save_recipe(sample_recipe)
        share_id = SharingService.enable_sharing(recipe_id)

        # Verify sharing works
        assert SharingService.get_shared_recipe(share_id) is not None

        # Disable sharing
        result = SharingService.disable_sharing(recipe_id)
        assert result is True

        # Verify sharing no longer works
        assert SharingService.get_shared_recipe(share_id) is None

    def test_enable_sharing_nonexistent_recipe(self):
        """Test enabling sharing for non-existent recipe."""
        share_id = SharingService.enable_sharing(99999)

        assert share_id is None
