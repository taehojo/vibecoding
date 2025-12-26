"""Tests for user recipe management service."""
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


class TestUserRecipeService:
    """Test cases for UserRecipeService."""

    def test_save_recipe(self, test_user, sample_recipe):
        """Test saving a recipe."""
        service = UserRecipeService(test_user.id)
        recipe_id = service.save_recipe(
            recipe_data=sample_recipe,
            tags=["한식", "간단요리"],
            notes="맛있었음"
        )

        assert recipe_id is not None
        assert isinstance(recipe_id, int)

    def test_get_saved_recipes(self, test_user, sample_recipe):
        """Test getting saved recipes."""
        service = UserRecipeService(test_user.id)
        service.save_recipe(sample_recipe, tags=["한식"])
        service.save_recipe(sample_recipe, tags=["일식"])

        recipes = service.get_saved_recipes()

        assert len(recipes) == 2

    def test_get_saved_recipes_with_tag_filter(self, test_user, sample_recipe):
        """Test filtering recipes by tag."""
        service = UserRecipeService(test_user.id)
        service.save_recipe(sample_recipe, tags=["한식"])
        service.save_recipe(sample_recipe, tags=["일식"])

        korean_recipes = service.get_saved_recipes(tag="한식")
        japanese_recipes = service.get_saved_recipes(tag="일식")

        assert len(korean_recipes) == 1
        assert len(japanese_recipes) == 1

    def test_get_recipe(self, test_user, sample_recipe):
        """Test getting a single recipe."""
        service = UserRecipeService(test_user.id)
        recipe_id = service.save_recipe(sample_recipe, notes="Test note")

        recipe = service.get_recipe(recipe_id)

        assert recipe is not None
        assert recipe["recipe_data"]["name"] == "테스트 요리"
        assert recipe["notes"] == "Test note"

    def test_update_recipe(self, test_user, sample_recipe):
        """Test updating a recipe."""
        service = UserRecipeService(test_user.id)
        recipe_id = service.save_recipe(sample_recipe)

        result = service.update_recipe(
            recipe_id,
            tags=["새로운태그"],
            notes="새로운 메모",
            rating=5,
            is_favorite=True
        )

        assert result is True

        recipe = service.get_recipe(recipe_id)
        assert recipe["tags"] == ["새로운태그"]
        assert recipe["notes"] == "새로운 메모"
        assert recipe["rating"] == 5
        assert recipe["is_favorite"] is True

    def test_delete_recipe(self, test_user, sample_recipe):
        """Test deleting a recipe."""
        service = UserRecipeService(test_user.id)
        recipe_id = service.save_recipe(sample_recipe)

        result = service.delete_recipe(recipe_id)

        assert result is True
        assert service.get_recipe(recipe_id) is None

    def test_get_all_tags(self, test_user, sample_recipe):
        """Test getting all unique tags."""
        service = UserRecipeService(test_user.id)
        service.save_recipe(sample_recipe, tags=["한식", "간단요리"])
        service.save_recipe(sample_recipe, tags=["일식", "간단요리"])

        tags = service.get_all_tags()

        assert len(tags) == 3
        assert "한식" in tags
        assert "일식" in tags
        assert "간단요리" in tags

    def test_empty_saved_recipes(self, test_user):
        """Test getting recipes when none exist."""
        service = UserRecipeService(test_user.id)
        recipes = service.get_saved_recipes()

        assert recipes == []

    def test_rating_bounds(self, test_user, sample_recipe):
        """Test rating is bounded between 1 and 5."""
        service = UserRecipeService(test_user.id)
        recipe_id = service.save_recipe(sample_recipe)

        # Test upper bound
        service.update_recipe(recipe_id, rating=10)
        recipe = service.get_recipe(recipe_id)
        assert recipe["rating"] == 5

        # Test lower bound
        service.update_recipe(recipe_id, rating=0)
        recipe = service.get_recipe(recipe_id)
        assert recipe["rating"] == 1
