"""
Ingredient management service for editing and managing ingredients
"""
from typing import Dict, List, Optional

class IngredientManager:
    """Service for managing and editing ingredients"""

    # Common Korean ingredients database
    INGREDIENT_DB = {
        "vegetables": [
            "양파", "당근", "감자", "무", "배추", "상추", "시금치", "콩나물",
            "파", "대파", "쪽파", "마늘", "생강", "고추", "피망", "파프리카",
            "브로콜리", "양배추", "토마토", "오이", "가지", "호박", "애호박",
            "단호박", "버섯", "표고버섯", "팽이버섯", "느타리버섯", "새송이버섯"
        ],
        "meat": [
            "돼지고기", "소고기", "닭고기", "오리고기", "양고기",
            "삼겹살", "목살", "갈비", "등심", "안심", "닭가슴살", "닭다리"
        ],
        "seafood": [
            "고등어", "갈치", "연어", "참치", "광어", "우럭", "조기",
            "새우", "오징어", "낙지", "문어", "굴", "조개", "홍합", "전복"
        ],
        "dairy": [
            "우유", "치즈", "요거트", "버터", "생크림", "사워크림",
            "모짜렐라", "체다치즈", "크림치즈", "파마산치즈"
        ],
        "condiments": [
            "간장", "된장", "고추장", "쌈장", "참기름", "들기름",
            "식용유", "올리브오일", "식초", "설탕", "소금", "후추",
            "고춧가루", "깨", "참깨", "들깨", "굴소스", "물엿"
        ],
        "grains": [
            "쌀", "찹쌀", "보리", "콩", "팥", "녹두", "검은콩",
            "밀가루", "부침가루", "튀김가루", "빵가루", "면", "파스타"
        ],
        "fruits": [
            "사과", "배", "포도", "딸기", "수박", "참외", "멜론",
            "오렌지", "귤", "레몬", "라임", "바나나", "키위", "망고"
        ],
        "processed": [
            "김치", "두부", "어묵", "햄", "소시지", "베이컨", "통조림",
            "라면", "만두", "떡", "김", "미역", "다시마", "멸치"
        ]
    }

    def __init__(self):
        self.current_ingredients = {}

    def set_ingredients(self, ingredients: Dict[str, List[str]]):
        """Set the current ingredients"""
        self.current_ingredients = ingredients.copy()

    def add_ingredient(self, category: str, ingredient: str, quantity: str = "") -> bool:
        """
        Add a new ingredient

        Args:
            category: Category of the ingredient
            ingredient: Name of the ingredient
            quantity: Optional quantity

        Returns:
            True if added successfully
        """
        if category not in self.current_ingredients:
            self.current_ingredients[category] = []

        # Format ingredient with quantity if provided
        if quantity:
            ingredient_text = f"{ingredient} ({quantity})"
        else:
            ingredient_text = ingredient

        if ingredient_text not in self.current_ingredients[category]:
            self.current_ingredients[category].append(ingredient_text)
            return True

        return False

    def remove_ingredient(self, category: str, ingredient: str) -> bool:
        """
        Remove an ingredient

        Args:
            category: Category of the ingredient
            ingredient: Name of the ingredient

        Returns:
            True if removed successfully
        """
        if category in self.current_ingredients:
            if ingredient in self.current_ingredients[category]:
                self.current_ingredients[category].remove(ingredient)

                # Remove category if empty
                if not self.current_ingredients[category]:
                    del self.current_ingredients[category]

                return True

        return False

    def update_ingredient(
        self,
        category: str,
        old_ingredient: str,
        new_ingredient: str,
        new_quantity: str = ""
    ) -> bool:
        """
        Update an existing ingredient

        Args:
            category: Category of the ingredient
            old_ingredient: Current ingredient name
            new_ingredient: New ingredient name
            new_quantity: New quantity

        Returns:
            True if updated successfully
        """
        if self.remove_ingredient(category, old_ingredient):
            return self.add_ingredient(category, new_ingredient, new_quantity)

        return False

    def get_ingredients(self) -> Dict[str, List[str]]:
        """Get current ingredients"""
        return self.current_ingredients.copy()

    def get_ingredients_flat(self) -> List[str]:
        """Get flat list of all ingredients"""
        flat_list = []
        for category, items in self.current_ingredients.items():
            flat_list.extend(items)
        return flat_list

    def get_suggestions(self, partial: str, category: str = None) -> List[str]:
        """
        Get ingredient suggestions based on partial input

        Args:
            partial: Partial ingredient name
            category: Optional category filter

        Returns:
            List of matching suggestions
        """
        suggestions = []
        partial_lower = partial.lower()

        if category and category in self.INGREDIENT_DB:
            # Search in specific category
            for item in self.INGREDIENT_DB[category]:
                if partial_lower in item.lower():
                    suggestions.append(item)
        else:
            # Search in all categories
            for cat, items in self.INGREDIENT_DB.items():
                for item in items:
                    if partial_lower in item.lower():
                        suggestions.append(item)

        # Remove duplicates and limit results
        suggestions = list(dict.fromkeys(suggestions))
        return suggestions[:10]

    def categorize_ingredient(self, ingredient: str) -> str:
        """
        Auto-categorize an ingredient

        Args:
            ingredient: Ingredient name

        Returns:
            Category name
        """
        ingredient_lower = ingredient.lower()

        for category, items in self.INGREDIENT_DB.items():
            for item in items:
                if item.lower() in ingredient_lower or ingredient_lower in item.lower():
                    return category

        # Default category if not found
        return "기타"

    def validate_ingredients(self) -> Dict:
        """
        Validate current ingredients

        Returns:
            Validation result with warnings/errors
        """
        result = {
            "valid": True,
            "warnings": [],
            "errors": []
        }

        # Check if there are any ingredients
        if not self.current_ingredients:
            result["valid"] = False
            result["errors"].append("재료가 없습니다")
            return result

        total_ingredients = sum(len(items) for items in self.current_ingredients.values())

        if total_ingredients == 0:
            result["valid"] = False
            result["errors"].append("재료가 없습니다")

        elif total_ingredients < 3:
            result["warnings"].append("재료가 너무 적습니다. 레시피 생성이 제한될 수 있습니다")

        elif total_ingredients > 30:
            result["warnings"].append("재료가 너무 많습니다. 일부 재료만 사용될 수 있습니다")

        return result

    def get_statistics(self) -> Dict:
        """Get statistics about current ingredients"""
        stats = {
            "total_categories": len(self.current_ingredients),
            "total_ingredients": sum(len(items) for items in self.current_ingredients.values()),
            "categories": {}
        }

        for category, items in self.current_ingredients.items():
            stats["categories"][category] = len(items)

        return stats

    def import_ingredients(self, text: str) -> Dict[str, List[str]]:
        """
        Import ingredients from text

        Args:
            text: Text containing ingredients

        Returns:
            Parsed ingredients dictionary
        """
        imported = {}
        lines = text.strip().split('\n')

        current_category = "기타"

        for line in lines:
            line = line.strip()

            if not line:
                continue

            # Check if it's a category header
            if ':' in line and not line.startswith('-'):
                current_category = line.split(':')[0].strip()
                if current_category not in imported:
                    imported[current_category] = []

            # Check if it's an ingredient
            elif line.startswith('-') or line.startswith('•'):
                ingredient = line.lstrip('-•').strip()
                if current_category not in imported:
                    imported[current_category] = []
                imported[current_category].append(ingredient)

            else:
                # Try to categorize standalone ingredient
                category = self.categorize_ingredient(line)
                if category not in imported:
                    imported[category] = []
                imported[category].append(line)

        return imported

    def export_ingredients(self, format: str = "text") -> str:
        """
        Export ingredients to different formats

        Args:
            format: Export format ('text', 'json', 'csv')

        Returns:
            Formatted string
        """
        if format == "json":
            import json
            return json.dumps(self.current_ingredients, ensure_ascii=False, indent=2)

        elif format == "csv":
            lines = ["Category,Ingredient,Quantity"]
            for category, items in self.current_ingredients.items():
                for item in items:
                    # Extract quantity if present
                    if '(' in item and ')' in item:
                        name = item[:item.index('(')].strip()
                        quantity = item[item.index('(')+1:item.index(')')].strip()
                    else:
                        name = item
                        quantity = ""
                    lines.append(f"{category},{name},{quantity}")
            return '\n'.join(lines)

        else:  # text format
            lines = []
            for category, items in self.current_ingredients.items():
                lines.append(f"{category}:")
                for item in items:
                    lines.append(f"  - {item}")
                lines.append("")  # Empty line between categories
            return '\n'.join(lines)