"""
Recipe generation service using DeepSeek model
"""
import json
from typing import Dict, List, Optional
from backend.config import Config
from backend.openrouter_client import OpenRouterClient

class RecipeGenerator:
    """Service for generating recipes using DeepSeek model"""

    def __init__(self):
        self.client = OpenRouterClient()
        self.model = Config.RECIPE_GENERATION_MODEL

    def generate_recipes(
        self,
        ingredients: Dict[str, List[str]],
        preferences: Optional[Dict] = None
    ) -> Dict:
        """
        Generate recipes based on available ingredients

        Args:
            ingredients: Dictionary of ingredients by category
            preferences: Optional user preferences (difficulty, time, servings)

        Returns:
            Dictionary containing generated recipes
        """
        # Flatten ingredients for prompt
        all_ingredients = []
        for category, items in ingredients.items():
            all_ingredients.extend(items)

        # Default preferences
        if preferences is None:
            preferences = {
                'difficulty': '보통',
                'cooking_time': '30분 이내',
                'servings': 4,
                'cuisine': '한식'
            }

        # Create prompt
        prompt = self._create_recipe_prompt(all_ingredients, preferences)

        # Get response from DeepSeek
        messages = [
            {
                "role": "system",
                "content": "You are a professional chef specializing in Korean cuisine. You create practical and delicious recipes based on available ingredients."
            },
            {
                "role": "user",
                "content": prompt
            }
        ]

        response = self.client.chat_completion(
            messages=messages,
            model=self.model
        )

        if response and 'choices' in response:
            content = response['choices'][0]['message']['content']
            return self._parse_recipes(content)

        return {"error": "Failed to generate recipes", "recipes": []}

    def _create_recipe_prompt(
        self,
        ingredients: List[str],
        preferences: Dict
    ) -> str:
        """Create prompt for recipe generation"""

        # Translate ingredients to Korean if needed
        ingredients_text = "\n".join([f"- {ing}" for ing in ingredients])

        prompt = f"""다음 재료들로 만들 수 있는 한국 요리 레시피를 3개 추천해주세요.

사용 가능한 재료:
{ingredients_text}

요구사항:
- 난이도: {preferences.get('difficulty', '보통')}
- 조리 시간: {preferences.get('cooking_time', '30분 이내')}
- 인분: {preferences.get('servings', 4)}인분
- 요리 종류: {preferences.get('cuisine', '한식')}

각 레시피는 다음 형식으로 작성해주세요:

===레시피 1===
레시피명: [요리 이름]
난이도: [쉬움/보통/어려움]
조리시간: [분]
인분: [인분 수]
칼로리: [1인분 기준 칼로리]

필요한 재료:
- [재료명]: [양]
- [재료명]: [양]

조리법:
1. [첫 번째 단계]
2. [두 번째 단계]
3. [세 번째 단계]
(필요한 만큼 단계 추가)

요리 팁: [유용한 팁 1-2개]

===레시피 2===
(같은 형식으로 작성)

===레시피 3===
(같은 형식으로 작성)

주의사항:
1. 실제로 만들 수 있는 현실적인 레시피를 제공하세요.
2. 제공된 재료를 최대한 활용하되, 기본 양념(소금, 후추, 기름 등)은 추가 가능합니다.
3. 각 단계는 명확하고 따라하기 쉽게 설명하세요.
4. 한국 가정에서 쉽게 구할 수 있는 재료만 추가하세요."""

        return prompt

    def _parse_recipes(self, text: str) -> Dict:
        """
        Parse the AI response into structured recipe data

        Args:
            text: Raw text response from AI

        Returns:
            Structured dictionary of recipes
        """
        recipes = []

        # Split by recipe separator
        recipe_blocks = text.split('===레시피')

        for block in recipe_blocks[1:]:  # Skip first empty block
            if not block.strip():
                continue

            recipe = {}
            lines = block.strip().split('\n')

            current_section = None
            ingredients = []
            steps = []

            for line in lines:
                line = line.strip()

                if not line or line.startswith('==='):
                    continue

                # Parse recipe name
                if line.startswith('레시피명:'):
                    recipe['name'] = line.replace('레시피명:', '').strip()

                # Parse difficulty
                elif line.startswith('난이도:'):
                    recipe['difficulty'] = line.replace('난이도:', '').strip()

                # Parse cooking time
                elif line.startswith('조리시간:'):
                    time_str = line.replace('조리시간:', '').strip()
                    # Extract number from string like "30분"
                    import re
                    time_match = re.search(r'\d+', time_str)
                    recipe['time'] = int(time_match.group()) if time_match else 30

                # Parse servings
                elif line.startswith('인분:'):
                    servings_str = line.replace('인분:', '').strip()
                    import re
                    servings_match = re.search(r'\d+', servings_str)
                    recipe['servings'] = int(servings_match.group()) if servings_match else 4

                # Parse calories
                elif line.startswith('칼로리:'):
                    cal_str = line.replace('칼로리:', '').strip()
                    import re
                    cal_match = re.search(r'\d+', cal_str)
                    recipe['calories'] = int(cal_match.group()) if cal_match else 0

                # Section headers
                elif '필요한 재료' in line or '재료:' in line:
                    current_section = 'ingredients'

                elif '조리법' in line or '조리 방법' in line:
                    current_section = 'steps'

                elif '요리 팁' in line or '팁:' in line:
                    current_section = 'tips'

                # Parse content based on current section
                elif current_section == 'ingredients' and line.startswith('-'):
                    ingredient = line.lstrip('-').strip()
                    if ':' in ingredient:
                        ing_name, ing_amount = ingredient.split(':', 1)
                        ingredients.append({
                            'name': ing_name.strip(),
                            'amount': ing_amount.strip()
                        })
                    else:
                        ingredients.append({
                            'name': ingredient,
                            'amount': ''
                        })

                elif current_section == 'steps':
                    # Handle numbered steps
                    import re
                    step_match = re.match(r'^\d+\.\s*(.*)', line)
                    if step_match:
                        steps.append(step_match.group(1))

                elif current_section == 'tips' and line:
                    recipe['tips'] = line

            # Add parsed data to recipe
            if ingredients:
                recipe['ingredients'] = ingredients
            if steps:
                recipe['steps'] = steps

            # Set defaults if missing
            recipe.setdefault('name', '이름 없는 레시피')
            recipe.setdefault('difficulty', '보통')
            recipe.setdefault('time', 30)
            recipe.setdefault('servings', 4)
            recipe.setdefault('calories', 250)
            recipe.setdefault('ingredients', [])
            recipe.setdefault('steps', [])
            recipe.setdefault('tips', '')

            # Calculate match score based on available ingredients
            recipe['match_score'] = 85  # Default score

            if recipe['name'] != '이름 없는 레시피':
                recipes.append(recipe)

        return {
            "status": "success",
            "recipes": recipes[:3],  # Return top 3 recipes
            "total_recipes": len(recipes),
            "raw_text": text
        }

    def translate_ingredients(self, ingredients_en: List[str]) -> List[str]:
        """
        Translate English ingredients to Korean

        Args:
            ingredients_en: List of ingredients in English

        Returns:
            List of ingredients in Korean
        """
        # Common ingredient translations
        translation_dict = {
            'onion': '양파',
            'onions': '양파',
            'carrot': '당근',
            'carrots': '당근',
            'potato': '감자',
            'potatoes': '감자',
            'tomato': '토마토',
            'tomatoes': '토마토',
            'lettuce': '상추',
            'cabbage': '배추',
            'meat': '고기',
            'pork': '돼지고기',
            'beef': '소고기',
            'chicken': '닭고기',
            'fish': '생선',
            'egg': '계란',
            'eggs': '계란',
            'milk': '우유',
            'cheese': '치즈',
            'butter': '버터',
            'yogurt': '요거트',
            'rice': '쌀',
            'bread': '빵',
            'noodles': '면',
            'oil': '기름',
            'salt': '소금',
            'sugar': '설탕',
            'pepper': '후추',
            'garlic': '마늘',
            'ginger': '생강',
            'soy sauce': '간장',
            'kimchi': '김치',
            'apple': '사과',
            'apples': '사과',
            'orange': '오렌지',
            'oranges': '오렌지',
            'cucumber': '오이',
            'broccoli': '브로콜리',
            'juice': '주스'
        }

        translated = []
        for ingredient in ingredients_en:
            # Clean and lowercase
            clean_ing = ingredient.lower().strip()

            # Remove quantity if present
            import re
            clean_ing = re.sub(r'\d+\s*\w*', '', clean_ing).strip()

            # Translate if in dictionary, otherwise keep original
            if clean_ing in translation_dict:
                translated.append(translation_dict[clean_ing])
            else:
                # Try partial match
                found = False
                for eng, kor in translation_dict.items():
                    if eng in clean_ing or clean_ing in eng:
                        translated.append(kor)
                        found = True
                        break

                if not found:
                    translated.append(ingredient)  # Keep original if no translation

        return translated

    def calculate_match_score(
        self,
        recipe: Dict,
        available_ingredients: List[str]
    ) -> float:
        """
        Calculate how well a recipe matches available ingredients

        Args:
            recipe: Recipe dictionary
            available_ingredients: List of available ingredients

        Returns:
            Match score (0-100)
        """
        if not recipe.get('ingredients'):
            return 0

        recipe_ingredients = recipe['ingredients']
        total_ingredients = len(recipe_ingredients)
        matched = 0

        # Convert available ingredients to lowercase for matching
        available_lower = [ing.lower() for ing in available_ingredients]

        for ing_dict in recipe_ingredients:
            ing_name = ing_dict.get('name', '').lower()

            # Check for match
            for available in available_lower:
                if available in ing_name or ing_name in available:
                    matched += 1
                    break

        # Calculate base score
        match_score = (matched / total_ingredients) * 100 if total_ingredients > 0 else 0

        # Bonus points
        if recipe.get('difficulty') == '쉬움':
            match_score = min(match_score + 5, 100)

        if recipe.get('time', 60) <= 30:
            match_score = min(match_score + 5, 100)

        return round(match_score, 1)