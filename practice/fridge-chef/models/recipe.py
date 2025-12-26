"""Recipe data model."""
from dataclasses import dataclass, field


@dataclass
class Recipe:
    """Recipe data class."""

    name: str
    description: str
    difficulty: str
    cooking_time: int
    servings: int
    available_ingredients: list[str] = field(default_factory=list)
    additional_ingredients: list[str] = field(default_factory=list)
    instructions: list[str] = field(default_factory=list)
    tips: list[str] = field(default_factory=list)

    @classmethod
    def from_dict(cls, data: dict) -> "Recipe":
        """Create Recipe from dictionary."""
        ingredients = data.get("ingredients", {})
        return cls(
            name=data.get("name", ""),
            description=data.get("description", ""),
            difficulty=data.get("difficulty", "보통"),
            cooking_time=data.get("cooking_time", 30),
            servings=data.get("servings", 2),
            available_ingredients=ingredients.get("available", []),
            additional_ingredients=ingredients.get("additional_needed", []),
            instructions=data.get("instructions", []),
            tips=data.get("tips", []),
        )

    def to_dict(self) -> dict:
        """Convert to dictionary."""
        return {
            "name": self.name,
            "description": self.description,
            "difficulty": self.difficulty,
            "cooking_time": self.cooking_time,
            "servings": self.servings,
            "ingredients": {
                "available": self.available_ingredients,
                "additional_needed": self.additional_ingredients,
            },
            "instructions": self.instructions,
            "tips": self.tips,
        }
