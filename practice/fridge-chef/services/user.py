"""User recipe management service."""
import json
from datetime import datetime

from db.database import get_db
from db.models import SavedRecipe, CookingHistory


class UserRecipeService:
    """Service for managing user's saved recipes."""

    def __init__(self, user_id: int):
        """Initialize service.

        Args:
            user_id: User ID.
        """
        self.user_id = user_id

    def save_recipe(
        self,
        recipe_data: dict,
        tags: list[str] | None = None,
        notes: str | None = None,
    ) -> int:
        """Save a recipe to user's collection.

        Args:
            recipe_data: Recipe data dict.
            tags: Optional tags.
            notes: Optional notes.

        Returns:
            Saved recipe ID.
        """
        with get_db() as session:
            saved = SavedRecipe(user_id=self.user_id)
            saved.set_recipe_data(recipe_data)
            if tags:
                saved.set_tags(tags)
            if notes:
                saved.notes = notes

            session.add(saved)
            session.commit()
            return saved.id

    def get_saved_recipes(
        self,
        tag: str | None = None,
        sort_by: str = "saved_at",
        ascending: bool = False,
    ) -> list[dict]:
        """Get user's saved recipes.

        Args:
            tag: Filter by tag.
            sort_by: Sort field (saved_at, rating, name).
            ascending: Sort order.

        Returns:
            List of saved recipe dicts.
        """
        with get_db() as session:
            query = session.query(SavedRecipe).filter(
                SavedRecipe.user_id == self.user_id
            )

            # Apply sorting
            if sort_by == "rating":
                order = SavedRecipe.rating.asc() if ascending else SavedRecipe.rating.desc()
            elif sort_by == "name":
                # Sort by name requires loading recipe_data
                order = SavedRecipe.saved_at.desc()  # Fallback
            else:
                order = SavedRecipe.saved_at.asc() if ascending else SavedRecipe.saved_at.desc()

            recipes = query.order_by(order).all()

            result = []
            for r in recipes:
                recipe_data = r.get_recipe_data()
                tags = r.get_tags()

                # Filter by tag if specified
                if tag and tag not in tags:
                    continue

                result.append({
                    "id": r.id,
                    "recipe_data": recipe_data,
                    "tags": tags,
                    "notes": r.notes,
                    "rating": r.rating,
                    "is_favorite": r.is_favorite == 1,
                    "share_id": r.share_id,
                    "saved_at": r.saved_at.isoformat() if r.saved_at else None,
                })

            return result

    def get_recipe(self, recipe_id: int) -> dict | None:
        """Get a single saved recipe.

        Args:
            recipe_id: Saved recipe ID.

        Returns:
            Recipe dict or None.
        """
        with get_db() as session:
            r = session.query(SavedRecipe).filter(
                SavedRecipe.id == recipe_id,
                SavedRecipe.user_id == self.user_id
            ).first()

            if not r:
                return None

            return {
                "id": r.id,
                "recipe_data": r.get_recipe_data(),
                "tags": r.get_tags(),
                "notes": r.notes,
                "rating": r.rating,
                "is_favorite": r.is_favorite == 1,
                "share_id": r.share_id,
                "saved_at": r.saved_at.isoformat() if r.saved_at else None,
            }

    def update_recipe(
        self,
        recipe_id: int,
        tags: list[str] | None = None,
        notes: str | None = None,
        rating: int | None = None,
        is_favorite: bool | None = None,
    ) -> bool:
        """Update a saved recipe.

        Args:
            recipe_id: Saved recipe ID.
            tags: New tags.
            notes: New notes.
            rating: New rating (1-5).
            is_favorite: Favorite status.

        Returns:
            True if updated.
        """
        with get_db() as session:
            r = session.query(SavedRecipe).filter(
                SavedRecipe.id == recipe_id,
                SavedRecipe.user_id == self.user_id
            ).first()

            if not r:
                return False

            if tags is not None:
                r.set_tags(tags)
            if notes is not None:
                r.notes = notes
            if rating is not None:
                r.rating = max(1, min(5, rating))
            if is_favorite is not None:
                r.is_favorite = 1 if is_favorite else 0

            session.commit()
            return True

    def delete_recipe(self, recipe_id: int) -> bool:
        """Delete a saved recipe.

        Args:
            recipe_id: Saved recipe ID.

        Returns:
            True if deleted.
        """
        with get_db() as session:
            r = session.query(SavedRecipe).filter(
                SavedRecipe.id == recipe_id,
                SavedRecipe.user_id == self.user_id
            ).first()

            if not r:
                return False

            session.delete(r)
            session.commit()
            return True

    def get_all_tags(self) -> list[str]:
        """Get all unique tags used by user.

        Returns:
            List of unique tags.
        """
        with get_db() as session:
            recipes = session.query(SavedRecipe.tags).filter(
                SavedRecipe.user_id == self.user_id
            ).all()

            all_tags = set()
            for (tags_json,) in recipes:
                tags = json.loads(tags_json) if tags_json else []
                all_tags.update(tags)

            return sorted(list(all_tags))

    def get_cooking_count(self, recipe_id: int) -> int:
        """Get number of times a recipe was cooked.

        Args:
            recipe_id: Saved recipe ID.

        Returns:
            Cooking count.
        """
        with get_db() as session:
            count = session.query(CookingHistory).filter(
                CookingHistory.saved_recipe_id == recipe_id
            ).count()
            return count
