"""Tests for recipe service and parser."""
import pytest
import sys
from pathlib import Path

# Add project root to path
sys.path.insert(0, str(Path(__file__).parent.parent))

from models.recipe import Recipe
from utils.parser import RecipeParser
from services.recipe import RecipeService
from services.config import Config


class TestRecipe:
    """Test cases for Recipe data class."""

    def test_recipe_creation(self):
        """Test creating a Recipe instance."""
        recipe = Recipe(
            name="테스트 요리",
            description="테스트 설명",
            difficulty="쉬움",
            cooking_time=15,
            servings=2,
            available_ingredients=["양파", "당근"],
            additional_ingredients=["소금"],
            instructions=["1. 준비하기", "2. 요리하기"],
            tips=["팁입니다"],
        )
        assert recipe.name == "테스트 요리"
        assert recipe.difficulty == "쉬움"
        assert recipe.cooking_time == 15
        assert len(recipe.available_ingredients) == 2

    def test_recipe_from_dict(self):
        """Test creating Recipe from dictionary."""
        data = {
            "name": "볶음밥",
            "description": "맛있는 볶음밥",
            "difficulty": "보통",
            "cooking_time": 20,
            "servings": 2,
            "ingredients": {
                "available": ["밥", "계란"],
                "additional_needed": ["참기름"],
            },
            "instructions": ["1. 밥 볶기", "2. 계란 추가"],
            "tips": ["찬밥 사용"],
        }
        recipe = Recipe.from_dict(data)
        assert recipe.name == "볶음밥"
        assert recipe.available_ingredients == ["밥", "계란"]
        assert recipe.additional_ingredients == ["참기름"]

    def test_recipe_to_dict(self):
        """Test converting Recipe to dictionary."""
        recipe = Recipe(
            name="테스트",
            description="설명",
            difficulty="쉬움",
            cooking_time=10,
            servings=1,
            available_ingredients=["재료1"],
            additional_ingredients=["재료2"],
            instructions=["단계1"],
            tips=["팁1"],
        )
        result = recipe.to_dict()
        assert result["name"] == "테스트"
        assert result["ingredients"]["available"] == ["재료1"]
        assert result["ingredients"]["additional_needed"] == ["재료2"]


class TestRecipeParser:
    """Test cases for RecipeParser."""

    def test_extract_json_from_markdown(self):
        """Test extracting JSON from markdown code block."""
        text = """
Here is the recipe:

```json
{
  "recipes": [{"name": "테스트"}]
}
```
"""
        result = RecipeParser.extract_json(text)
        assert result is not None
        assert "recipes" in result
        assert result["recipes"][0]["name"] == "테스트"

    def test_extract_json_plain(self):
        """Test extracting plain JSON."""
        text = '{"recipes": [{"name": "테스트"}]}'
        result = RecipeParser.extract_json(text)
        assert result is not None
        assert result["recipes"][0]["name"] == "테스트"

    def test_extract_json_invalid(self):
        """Test handling invalid JSON."""
        text = "This is not JSON at all"
        result = RecipeParser.extract_json(text)
        assert result is None

    def test_validate_recipe_data_valid(self):
        """Test validating valid recipe data."""
        data = {
            "name": "테스트",
            "difficulty": "쉬움",
            "cooking_time": 15,
            "servings": 2,
            "instructions": ["단계1"],
        }
        assert RecipeParser.validate_recipe_data(data) is True

    def test_validate_recipe_data_missing_field(self):
        """Test validating recipe data with missing field."""
        data = {
            "name": "테스트",
            "difficulty": "쉬움",
            # missing cooking_time, servings, instructions
        }
        assert RecipeParser.validate_recipe_data(data) is False

    def test_sanitize_recipe_adds_defaults(self):
        """Test sanitizing recipe adds default values."""
        data = {
            "name": "테스트",
            "difficulty": "invalid",
            "cooking_time": "not_a_number",
            "servings": 2,
            "instructions": ["단계1"],
        }
        result = RecipeParser.sanitize_recipe(data)
        assert result["difficulty"] == "보통"  # normalized
        assert result["cooking_time"] == 30  # default
        assert result["description"] == ""  # added
        assert result["tips"] == []  # added
        assert "ingredients" in result

    def test_sanitize_recipe_preserves_valid(self):
        """Test sanitizing preserves valid data."""
        data = {
            "name": "테스트",
            "description": "설명",
            "difficulty": "쉬움",
            "cooking_time": 15,
            "servings": 2,
            "instructions": ["단계1"],
            "tips": ["팁1"],
            "ingredients": {
                "available": ["재료1"],
                "additional_needed": ["재료2"],
            },
        }
        result = RecipeParser.sanitize_recipe(data)
        assert result["difficulty"] == "쉬움"
        assert result["cooking_time"] == 15
        assert result["description"] == "설명"


class TestRecipeService:
    """Test cases for RecipeService."""

    def test_init(self):
        """Test service initialization."""
        if Config.validate():
            service = RecipeService()
            assert service.model == "nex-agi/deepseek-v3.1-nex-n1:free"

    def test_build_prompt(self):
        """Test prompt building."""
        if Config.validate():
            service = RecipeService()
            prompt = service._build_prompt(
                ingredients=["양파", "당근"],
                difficulty="쉬움",
                max_time=30,
                dietary=["채식"],
                exclude=["고기"],
            )
            assert "양파, 당근" in prompt
            assert "쉬움" in prompt
            assert "30분" in prompt
            assert "채식" in prompt
            assert "고기" in prompt

    def test_build_prompt_no_restrictions(self):
        """Test prompt building without restrictions."""
        if Config.validate():
            service = RecipeService()
            prompt = service._build_prompt(
                ingredients=["계란"],
                difficulty="보통",
                max_time=15,
            )
            assert "계란" in prompt
            assert "없음" in prompt  # dietary and exclude should be "없음"

    def test_parse_response_valid(self):
        """Test parsing valid response."""
        if Config.validate():
            service = RecipeService()
            content = """
```json
{
  "recipes": [
    {
      "name": "계란 볶음",
      "description": "간단한 계란 요리",
      "difficulty": "쉬움",
      "cooking_time": 10,
      "servings": 1,
      "ingredients": {
        "available": ["계란"],
        "additional_needed": ["소금"]
      },
      "instructions": ["1. 계란 풀기", "2. 볶기"],
      "tips": ["약불에서 조리"]
    }
  ]
}
```
"""
            recipes = service._parse_response(content)
            assert len(recipes) == 1
            assert recipes[0].name == "계란 볶음"
            assert recipes[0].difficulty == "쉬움"

    def test_parse_response_invalid(self):
        """Test parsing invalid response."""
        if Config.validate():
            service = RecipeService()
            content = "This is not valid JSON"
            recipes = service._parse_response(content)
            assert recipes == []

    def test_generate_empty_ingredients(self):
        """Test generating with empty ingredients returns empty list."""
        if Config.validate():
            service = RecipeService()
            recipes = service.generate_recipes(ingredients=[])
            assert recipes == []
