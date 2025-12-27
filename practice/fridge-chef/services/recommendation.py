"""Personalized recipe recommendation engine."""
import json
from datetime import datetime, timedelta
from typing import NamedTuple

from sqlalchemy import func
from sqlalchemy.orm import Session

from db.database import get_db
from db.models import SavedRecipe, CookingHistory, IngredientUsage, UserPreferences


class RecommendationScore(NamedTuple):
    """Recommendation with score."""
    recipe_id: int
    recipe_data: dict
    score: float
    reason: str


class RecommendationService:
    """Service for generating personalized recipe recommendations."""

    def __init__(self, user_id: int):
        """Initialize recommendation service.

        Args:
            user_id: User ID for personalization.
        """
        self.user_id = user_id

    def get_top_ingredients(self, limit: int = 10) -> list[tuple[str, int]]:
        """Get user's most frequently used ingredients.

        Args:
            limit: Maximum number of ingredients.

        Returns:
            List of (ingredient_name, usage_count) tuples.
        """
        with get_db() as session:
            results = session.query(
                IngredientUsage.ingredient_name,
                IngredientUsage.usage_count
            ).filter(
                IngredientUsage.user_id == self.user_id
            ).order_by(
                IngredientUsage.usage_count.desc()
            ).limit(limit).all()

            return [(r[0], r[1]) for r in results]

    def get_highly_rated_recipes(self, min_rating: int = 4) -> list[dict]:
        """Get user's highly rated recipes.

        Args:
            min_rating: Minimum rating threshold.

        Returns:
            List of recipe data dicts.
        """
        with get_db() as session:
            recipes = session.query(SavedRecipe).filter(
                SavedRecipe.user_id == self.user_id,
                SavedRecipe.rating >= min_rating
            ).all()

            return [r.get_recipe_data() for r in recipes]

    def get_cooking_stats(self) -> dict:
        """Get user's cooking statistics.

        Returns:
            Dict with cooking stats.

        Performance: Uses single query with subqueries instead of 4 separate queries.
        """
        with get_db() as session:
            # Combine all SavedRecipe stats in a single query
            saved_stats = session.query(
                func.count(SavedRecipe.id).label("saved_count"),
                func.avg(SavedRecipe.rating).filter(
                    SavedRecipe.rating.isnot(None)
                ).label("avg_rating"),
                func.count(SavedRecipe.id).filter(
                    SavedRecipe.is_favorite == 1
                ).label("favorite_count"),
            ).filter(
                SavedRecipe.user_id == self.user_id
            ).first()

            # Cooking count in separate query (different table)
            cooked_count = session.query(func.count(CookingHistory.id)).filter(
                CookingHistory.user_id == self.user_id
            ).scalar() or 0

            saved_count = saved_stats.saved_count or 0
            avg_rating = saved_stats.avg_rating or 0
            favorite_count = saved_stats.favorite_count or 0

            return {
                "saved_count": saved_count,
                "cooked_count": cooked_count,
                "avg_rating": round(avg_rating, 1) if avg_rating else 0,
                "favorite_count": favorite_count,
            }

    def get_cooking_calendar(self, year: int, month: int) -> dict[str, int]:
        """Get cooking activity for calendar heatmap.

        Args:
            year: Year.
            month: Month (1-12).

        Returns:
            Dict mapping date strings to cooking counts.
        """
        with get_db() as session:
            start_date = datetime(year, month, 1)
            if month == 12:
                end_date = datetime(year + 1, 1, 1)
            else:
                end_date = datetime(year, month + 1, 1)

            results = session.query(
                func.date(CookingHistory.cooked_at),
                func.count(CookingHistory.id)
            ).filter(
                CookingHistory.user_id == self.user_id,
                CookingHistory.cooked_at >= start_date,
                CookingHistory.cooked_at < end_date
            ).group_by(
                func.date(CookingHistory.cooked_at)
            ).all()

            return {str(r[0]): r[1] for r in results}

    def get_cuisine_distribution(self) -> dict[str, int]:
        """Get distribution of cuisines from saved recipes.

        Returns:
            Dict mapping cuisine to count.
        """
        with get_db() as session:
            recipes = session.query(SavedRecipe.tags).filter(
                SavedRecipe.user_id == self.user_id
            ).all()

            cuisine_count = {}
            for (tags_json,) in recipes:
                tags = json.loads(tags_json) if tags_json else []
                for tag in tags:
                    if tag in ["한식", "일식", "중식", "양식", "동남아", "기타"]:
                        cuisine_count[tag] = cuisine_count.get(tag, 0) + 1

            return cuisine_count

    def update_ingredient_usage(self, ingredients: list[str]) -> None:
        """Update ingredient usage counts.

        Args:
            ingredients: List of ingredient names used.
        """
        # Count occurrences of each ingredient
        from collections import Counter
        ingredient_counts = Counter(ingredients)

        with get_db() as session:
            for ingredient, count in ingredient_counts.items():
                existing = session.query(IngredientUsage).filter(
                    IngredientUsage.user_id == self.user_id,
                    IngredientUsage.ingredient_name == ingredient
                ).first()

                if existing:
                    existing.usage_count += count
                    existing.last_used = datetime.utcnow()
                else:
                    new_usage = IngredientUsage(
                        user_id=self.user_id,
                        ingredient_name=ingredient,
                        usage_count=count
                    )
                    session.add(new_usage)

            session.commit()

    def record_cooking(
        self,
        saved_recipe_id: int | None,
        recipe_name: str,
        ingredients: list[str],
        rating: int | None = None,
        notes: str | None = None,
    ) -> int:
        """Record a cooking event.

        Args:
            saved_recipe_id: Optional saved recipe ID.
            recipe_name: Name of the recipe.
            ingredients: Ingredients used.
            rating: Optional rating.
            notes: Optional notes.

        Returns:
            Created cooking history ID.
        """
        with get_db() as session:
            history = CookingHistory(
                user_id=self.user_id,
                saved_recipe_id=saved_recipe_id,
                recipe_name=recipe_name,
                rating=rating,
                notes=notes,
            )
            history.set_ingredients_used(ingredients)
            session.add(history)
            session.commit()

            # Update ingredient usage
            self.update_ingredient_usage(ingredients)

            return history.id

    def get_time_based_suggestion(self) -> str:
        """Get meal type suggestion based on current time.

        Returns:
            Meal type: 아침, 점심, 저녁, or 간식.
        """
        hour = datetime.now().hour

        if 6 <= hour < 10:
            return "아침"
        elif 11 <= hour < 14:
            return "점심"
        elif 17 <= hour < 21:
            return "저녁"
        else:
            return "간식"

    def get_cooking_streak(self) -> int:
        """Calculate consecutive days of cooking.

        Returns:
            Number of consecutive cooking days.
        """
        with get_db() as session:
            dates = session.query(
                func.date(CookingHistory.cooked_at)
            ).filter(
                CookingHistory.user_id == self.user_id
            ).distinct().order_by(
                func.date(CookingHistory.cooked_at).desc()
            ).all()

            if not dates:
                return 0

            streak = 0
            today = datetime.now().date()
            expected_date = today

            for (cook_date,) in dates:
                if isinstance(cook_date, str):
                    cook_date = datetime.strptime(cook_date, "%Y-%m-%d").date()

                if cook_date == expected_date:
                    streak += 1
                    expected_date = expected_date - timedelta(days=1)
                elif cook_date < expected_date:
                    break
                # Skip if future date

            return streak
