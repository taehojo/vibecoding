"""SQLAlchemy ORM models for Fridge Chef."""
import json
from datetime import datetime

from sqlalchemy import (
    Column, Integer, String, Text, DateTime, ForeignKey, Index
)
from sqlalchemy.orm import declarative_base, relationship

Base = declarative_base()


class User(Base):
    """User account model."""
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, autoincrement=True)
    username = Column(String(50), unique=True, nullable=False)
    password_hash = Column(String(255), nullable=False)
    nickname = Column(String(50))
    skill_level = Column(String(20), default="beginner")
    created_at = Column(DateTime, default=lambda: datetime.now())
    updated_at = Column(DateTime, default=lambda: datetime.now(), onupdate=lambda: datetime.now())

    # Relationships
    preferences = relationship("UserPreferences", back_populates="user", uselist=False, cascade="all, delete-orphan")
    saved_recipes = relationship("SavedRecipe", back_populates="user", cascade="all, delete-orphan")
    cooking_history = relationship("CookingHistory", back_populates="user", cascade="all, delete-orphan")
    ingredient_usage = relationship("IngredientUsage", back_populates="user", cascade="all, delete-orphan")


class UserPreferences(Base):
    """User dietary preferences and settings."""
    __tablename__ = "user_preferences"

    id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), unique=True)
    dietary_preferences = Column(Text, default="[]")
    allergies = Column(Text, default="[]")
    favorite_cuisines = Column(Text, default="[]")
    excluded_ingredients = Column(Text, default="[]")

    # Relationships
    user = relationship("User", back_populates="preferences")

    def get_dietary_preferences(self) -> list[str]:
        """Get dietary preferences as list."""
        return json.loads(self.dietary_preferences or "[]")

    def set_dietary_preferences(self, values: list[str]) -> None:
        """Set dietary preferences from list."""
        self.dietary_preferences = json.dumps(values, ensure_ascii=False)

    def get_allergies(self) -> list[str]:
        """Get allergies as list."""
        return json.loads(self.allergies or "[]")

    def set_allergies(self, values: list[str]) -> None:
        """Set allergies from list."""
        self.allergies = json.dumps(values, ensure_ascii=False)

    def get_favorite_cuisines(self) -> list[str]:
        """Get favorite cuisines as list."""
        return json.loads(self.favorite_cuisines or "[]")

    def set_favorite_cuisines(self, values: list[str]) -> None:
        """Set favorite cuisines from list."""
        self.favorite_cuisines = json.dumps(values, ensure_ascii=False)

    def get_excluded_ingredients(self) -> list[str]:
        """Get excluded ingredients as list."""
        return json.loads(self.excluded_ingredients or "[]")

    def set_excluded_ingredients(self, values: list[str]) -> None:
        """Set excluded ingredients from list."""
        self.excluded_ingredients = json.dumps(values, ensure_ascii=False)


class SavedRecipe(Base):
    """Saved recipe model."""
    __tablename__ = "saved_recipes"

    id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"))
    recipe_data = Column(Text, nullable=False)
    tags = Column(Text, default="[]")
    notes = Column(Text)
    rating = Column(Integer)
    is_favorite = Column(Integer, default=0)
    share_id = Column(String(20), unique=True)
    saved_at = Column(DateTime, default=lambda: datetime.now())

    # Relationships
    user = relationship("User", back_populates="saved_recipes")
    cooking_history = relationship("CookingHistory", back_populates="saved_recipe")

    # Indexes for optimized queries
    __table_args__ = (
        Index("idx_saved_recipes_user", "user_id"),
        # Index for share_id lookups
        Index("idx_saved_recipes_share_id", "share_id"),
        # Index for user + rating queries (dashboard)
        Index("idx_saved_recipes_user_rating", "user_id", "rating"),
        # Index for user + saved_at queries (sorting)
        Index("idx_saved_recipes_user_saved_at", "user_id", "saved_at"),
    )

    def get_recipe_data(self) -> dict:
        """Get recipe data as dict."""
        return json.loads(self.recipe_data)

    def set_recipe_data(self, data: dict) -> None:
        """Set recipe data from dict."""
        self.recipe_data = json.dumps(data, ensure_ascii=False)

    def get_tags(self) -> list[str]:
        """Get tags as list."""
        return json.loads(self.tags or "[]")

    def set_tags(self, values: list[str]) -> None:
        """Set tags from list."""
        self.tags = json.dumps(values, ensure_ascii=False)


class CookingHistory(Base):
    """Cooking history model."""
    __tablename__ = "cooking_history"

    id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"))
    saved_recipe_id = Column(Integer, ForeignKey("saved_recipes.id", ondelete="SET NULL"))
    recipe_name = Column(String(200), nullable=False)
    ingredients_used = Column(Text, default="[]")
    cooked_at = Column(DateTime, default=lambda: datetime.now())
    rating = Column(Integer)
    notes = Column(Text)

    # Relationships
    user = relationship("User", back_populates="cooking_history")
    saved_recipe = relationship("SavedRecipe", back_populates="cooking_history")

    # Indexes
    __table_args__ = (
        Index("idx_cooking_history_user", "user_id"),
        Index("idx_cooking_history_date", "cooked_at"),
    )

    def get_ingredients_used(self) -> list[str]:
        """Get ingredients used as list."""
        return json.loads(self.ingredients_used or "[]")

    def set_ingredients_used(self, values: list[str]) -> None:
        """Set ingredients used from list."""
        self.ingredients_used = json.dumps(values, ensure_ascii=False)


class IngredientUsage(Base):
    """Ingredient usage tracking for recommendations."""
    __tablename__ = "ingredient_usage"

    id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"))
    ingredient_name = Column(String(100), nullable=False)
    usage_count = Column(Integer, default=1)
    last_used = Column(DateTime, default=lambda: datetime.now())

    # Relationships
    user = relationship("User", back_populates="ingredient_usage")

    # Indexes for optimized queries
    __table_args__ = (
        Index("idx_ingredient_usage_user", "user_id"),
        # Composite index for filtering by user and ingredient
        Index("idx_ingredient_usage_user_ingredient", "user_id", "ingredient_name"),
        # Index for sorting by usage count
        Index("idx_ingredient_usage_count", "user_id", "usage_count"),
    )
