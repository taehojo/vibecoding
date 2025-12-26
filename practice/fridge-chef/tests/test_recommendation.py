"""Tests for recommendation service."""
import pytest
import sys
from pathlib import Path
from datetime import datetime

# Add project root to path
sys.path.insert(0, str(Path(__file__).parent.parent))

from db.init_db import init_database
from db.database import engine
from db.models import Base
from services.auth import AuthService
from services.recommendation import RecommendationService


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


class TestRecommendationService:
    """Test cases for RecommendationService."""

    def test_get_top_ingredients_empty(self, test_user):
        """Test getting top ingredients when none exist."""
        service = RecommendationService(test_user.id)
        ingredients = service.get_top_ingredients()

        assert ingredients == []

    def test_update_ingredient_usage(self, test_user):
        """Test updating ingredient usage."""
        service = RecommendationService(test_user.id)
        service.update_ingredient_usage(["양파", "당근", "양파"])

        top_ingredients = service.get_top_ingredients(limit=5)

        assert len(top_ingredients) == 2
        # 양파 should be first with count 2
        assert top_ingredients[0][0] == "양파"
        assert top_ingredients[0][1] == 2
        assert top_ingredients[1][0] == "당근"
        assert top_ingredients[1][1] == 1

    def test_get_cooking_stats_empty(self, test_user):
        """Test getting stats when none exist."""
        service = RecommendationService(test_user.id)
        stats = service.get_cooking_stats()

        assert stats["saved_count"] == 0
        assert stats["cooked_count"] == 0
        assert stats["avg_rating"] == 0
        assert stats["favorite_count"] == 0

    def test_record_cooking(self, test_user):
        """Test recording a cooking event."""
        service = RecommendationService(test_user.id)
        history_id = service.record_cooking(
            saved_recipe_id=None,
            recipe_name="테스트 요리",
            ingredients=["양파", "당근"],
            rating=5,
            notes="맛있었음"
        )

        assert history_id is not None

        stats = service.get_cooking_stats()
        assert stats["cooked_count"] == 1

    def test_get_cooking_calendar(self, test_user):
        """Test getting cooking calendar data."""
        service = RecommendationService(test_user.id)
        now = datetime.now()

        # Record some cooking
        service.record_cooking(
            saved_recipe_id=None,
            recipe_name="요리1",
            ingredients=["양파"]
        )
        service.record_cooking(
            saved_recipe_id=None,
            recipe_name="요리2",
            ingredients=["당근"]
        )

        calendar_data = service.get_cooking_calendar(now.year, now.month)

        # Should have at least one entry for today
        today_str = now.strftime("%Y-%m-%d")
        assert today_str in calendar_data
        assert calendar_data[today_str] >= 2

    def test_get_time_based_suggestion(self, test_user):
        """Test time-based meal suggestion."""
        service = RecommendationService(test_user.id)
        suggestion = service.get_time_based_suggestion()

        assert suggestion in ["아침", "점심", "저녁", "간식"]

    def test_get_cuisine_distribution_empty(self, test_user):
        """Test cuisine distribution when empty."""
        service = RecommendationService(test_user.id)
        distribution = service.get_cuisine_distribution()

        assert distribution == {}

    def test_get_cooking_streak(self, test_user):
        """Test cooking streak calculation."""
        service = RecommendationService(test_user.id)

        # Should be 0 when no cooking
        streak = service.get_cooking_streak()
        assert streak == 0

        # Record cooking for today
        service.record_cooking(
            saved_recipe_id=None,
            recipe_name="오늘 요리",
            ingredients=["양파"]
        )

        # Streak should be 1 now
        streak = service.get_cooking_streak()
        assert streak == 1

    def test_get_highly_rated_recipes_empty(self, test_user):
        """Test getting highly rated recipes when empty."""
        service = RecommendationService(test_user.id)
        recipes = service.get_highly_rated_recipes()

        assert recipes == []
