"""Recipe generation service using OpenRouter API.

Performance optimizations:
- Connection pooling via shared session
- Retry logic with exponential backoff
- Validated response parsing
"""
import sys
from pathlib import Path

# Add project root to path for imports
sys.path.insert(0, str(Path(__file__).parent.parent))

from models.recipe import Recipe
from services.config import Config
from services.api_utils import (
    get_api_session,
    validate_openrouter_response,
    retry_with_backoff,
    APIError,
)
from utils.parser import RecipeParser


class RecipeService:
    """Service for generating recipes via OpenRouter API."""

    def __init__(self):
        """Initialize the recipe service."""
        if not Config.validate():
            raise ValueError("OPENROUTER_API_KEY not configured")

        self.api_key = Config.OPENROUTER_API_KEY
        self.base_url = Config.OPENROUTER_BASE_URL
        self.model = Config.RECIPE_MODEL
        self._session = get_api_session()

    def _build_prompt(
        self,
        ingredients: list[str],
        difficulty: str = "보통",
        max_time: int = 30,
        dietary: list[str] | None = None,
        exclude: list[str] | None = None,
    ) -> str:
        """Build the recipe generation prompt.

        Args:
            ingredients: List of available ingredients.
            difficulty: Desired difficulty level.
            max_time: Maximum cooking time in minutes.
            dietary: Dietary restrictions (채식, 저염, 다이어트).
            exclude: Ingredients to exclude.

        Returns:
            Formatted prompt string.
        """
        ingredients_str = ", ".join(ingredients)
        dietary_str = ", ".join(dietary) if dietary else "없음"
        exclude_str = ", ".join(exclude) if exclude else "없음"

        return f"""당신은 한국 요리 전문 셰프입니다.
주어진 재료로 만들 수 있는 레시피를 추천해주세요.

사용 가능한 재료: {ingredients_str}

요구사항:
- 난이도: {difficulty}
- 최대 조리 시간: {max_time}분
- 식이 제한: {dietary_str}
- 제외 재료: {exclude_str}

다음 JSON 형식으로 정확히 3개의 레시피를 제공해주세요:

```json
{{
  "recipes": [
    {{
      "name": "요리 이름",
      "description": "한 줄 설명",
      "difficulty": "쉬움/보통/어려움 중 하나",
      "cooking_time": 15,
      "servings": 2,
      "ingredients": {{
        "available": ["보유한 재료들"],
        "additional_needed": ["추가로 필요한 재료들"]
      }},
      "instructions": [
        "1. 첫 번째 단계",
        "2. 두 번째 단계"
      ],
      "tips": ["요리 팁"]
    }}
  ]
}}
```

반드시 유효한 JSON 형식으로만 응답해주세요. 다른 설명 없이 JSON만 출력하세요."""

    @retry_with_backoff(max_retries=3, initial_delay=1.0)
    def generate_recipes(
        self,
        ingredients: list[str],
        difficulty: str = "보통",
        max_time: int = 30,
        dietary: list[str] | None = None,
        exclude: list[str] | None = None,
    ) -> list[Recipe]:
        """Generate recipes based on available ingredients.

        Args:
            ingredients: List of available ingredients.
            difficulty: Desired difficulty level.
            max_time: Maximum cooking time in minutes.
            dietary: Dietary restrictions.
            exclude: Ingredients to exclude.

        Returns:
            List of Recipe objects.

        Raises:
            APIError: If API call fails after retries.
            ValueError: If response cannot be parsed.
        """
        if not ingredients:
            return []

        prompt = self._build_prompt(
            ingredients=ingredients,
            difficulty=difficulty,
            max_time=max_time,
            dietary=dietary,
            exclude=exclude,
        )

        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json",
        }

        payload = {
            "model": self.model,
            "messages": [
                {
                    "role": "user",
                    "content": prompt,
                }
            ],
            "temperature": 0.7,
            "max_tokens": 4096,
        }

        response = self._session.post(
            self.base_url,
            headers=headers,
            json=payload,
            timeout=Config.API_TIMEOUT,
        )
        response.raise_for_status()

        result = response.json()

        # Validate and extract content using utility
        content = validate_openrouter_response(result)

        return self._parse_response(content)

    def _parse_response(self, content: str) -> list[Recipe]:
        """Parse API response into Recipe objects.

        Args:
            content: Raw response content.

        Returns:
            List of Recipe objects.
        """
        data = RecipeParser.extract_json(content)

        if not data or "recipes" not in data:
            return []

        recipes = []
        for recipe_data in data["recipes"]:
            if RecipeParser.validate_recipe_data(recipe_data):
                sanitized = RecipeParser.sanitize_recipe(recipe_data)
                recipes.append(Recipe.from_dict(sanitized))

        return recipes
