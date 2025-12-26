"""JSON response parser for recipe API responses."""
import json
import re


class RecipeParser:
    """Parser for recipe API JSON responses."""

    @staticmethod
    def extract_json(text: str) -> dict | None:
        """Extract JSON from text that may contain markdown or other content.

        Args:
            text: Raw text response that may contain JSON.

        Returns:
            Parsed JSON dict or None if parsing fails.
        """
        # Try to find JSON in markdown code blocks
        json_patterns = [
            r"```json\s*([\s\S]*?)\s*```",  # ```json ... ```
            r"```\s*([\s\S]*?)\s*```",  # ``` ... ```
            r"\{[\s\S]*\}",  # Raw JSON object
        ]

        for pattern in json_patterns:
            match = re.search(pattern, text)
            if match:
                json_str = match.group(1) if "```" in pattern else match.group(0)
                try:
                    return json.loads(json_str.strip())
                except json.JSONDecodeError:
                    continue

        # Last resort: try parsing the entire text
        try:
            return json.loads(text.strip())
        except json.JSONDecodeError:
            return None

    @staticmethod
    def validate_recipe_data(data: dict) -> bool:
        """Validate that recipe data has required fields.

        Args:
            data: Recipe dict to validate.

        Returns:
            True if valid, False otherwise.
        """
        required_fields = ["name", "difficulty", "cooking_time", "servings", "instructions"]
        return all(field in data for field in required_fields)

    @staticmethod
    def sanitize_recipe(data: dict) -> dict:
        """Sanitize and normalize recipe data.

        Args:
            data: Raw recipe dict.

        Returns:
            Sanitized recipe dict with defaults for missing optional fields.
        """
        # Ensure ingredients structure exists
        if "ingredients" not in data:
            data["ingredients"] = {}
        if "available" not in data["ingredients"]:
            data["ingredients"]["available"] = []
        if "additional_needed" not in data["ingredients"]:
            data["ingredients"]["additional_needed"] = []

        # Ensure other optional fields
        if "description" not in data:
            data["description"] = ""
        if "tips" not in data:
            data["tips"] = []

        # Normalize difficulty
        valid_difficulties = ["쉬움", "보통", "어려움"]
        if data.get("difficulty") not in valid_difficulties:
            data["difficulty"] = "보통"

        # Ensure cooking_time and servings are integers
        try:
            data["cooking_time"] = int(data.get("cooking_time", 30))
        except (ValueError, TypeError):
            data["cooking_time"] = 30

        try:
            data["servings"] = int(data.get("servings", 2))
        except (ValueError, TypeError):
            data["servings"] = 2

        return data
