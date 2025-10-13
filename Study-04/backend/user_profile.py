"""
User profile and recipe management
"""
import json
import os
from datetime import datetime
from typing import Dict, List, Optional

class UserProfileManager:
    """Manage user profiles and saved recipes"""

    def __init__(self, profile_db: str = "user_profiles.json", recipes_db: str = "saved_recipes.json"):
        self.profile_db = profile_db
        self.recipes_db = recipes_db
        self.profiles = self._load_data(profile_db)
        self.saved_recipes = self._load_data(recipes_db)

    def _load_data(self, filepath: str) -> Dict:
        """Load data from JSON file"""
        if os.path.exists(filepath):
            with open(filepath, 'r', encoding='utf-8') as f:
                return json.load(f)
        return {}

    def _save_data(self, data: Dict, filepath: str):
        """Save data to JSON file"""
        with open(filepath, 'w', encoding='utf-8') as f:
            json.dump(data, f, ensure_ascii=False, indent=2)

    def create_profile(self, user_id: str, profile_data: Dict) -> bool:
        """Create or update user profile"""
        self.profiles[user_id] = {
            "user_id": user_id,
            "nickname": profile_data.get('nickname', ''),
            "bio": profile_data.get('bio', ''),
            "profile_image": profile_data.get('profile_image', ''),
            "cooking_level": profile_data.get('cooking_level', '초보'),
            "dietary_preferences": profile_data.get('dietary_preferences', []),
            "allergies": profile_data.get('allergies', []),
            "favorite_cuisine": profile_data.get('favorite_cuisine', ['한식']),
            "household_size": profile_data.get('household_size', 2),
            "updated_at": datetime.now().isoformat()
        }
        self._save_data(self.profiles, self.profile_db)
        return True

    def get_profile(self, user_id: str) -> Optional[Dict]:
        """Get user profile"""
        return self.profiles.get(user_id)

    def update_profile(self, user_id: str, updates: Dict) -> bool:
        """Update user profile"""
        if user_id in self.profiles:
            self.profiles[user_id].update(updates)
            self.profiles[user_id]['updated_at'] = datetime.now().isoformat()
            self._save_data(self.profiles, self.profile_db)
            return True
        return False

    def save_recipe(self, user_id: str, recipe: Dict, folder: str = "default") -> str:
        """
        Save a recipe for user

        Args:
            user_id: User ID
            recipe: Recipe data
            folder: Folder name

        Returns:
            Save ID
        """
        if user_id not in self.saved_recipes:
            self.saved_recipes[user_id] = {
                "folders": {"default": []},
                "recipes": {}
            }

        # Generate save ID
        save_id = f"save_{user_id}_{len(self.saved_recipes[user_id]['recipes']) + 1:04d}"

        # Save recipe
        self.saved_recipes[user_id]['recipes'][save_id] = {
            "save_id": save_id,
            "recipe": recipe,
            "folder": folder,
            "saved_at": datetime.now().isoformat(),
            "notes": "",
            "rating": None,
            "cooked": False,
            "cooked_count": 0
        }

        # Add to folder
        if folder not in self.saved_recipes[user_id]['folders']:
            self.saved_recipes[user_id]['folders'][folder] = []

        self.saved_recipes[user_id]['folders'][folder].append(save_id)

        self._save_data(self.saved_recipes, self.recipes_db)
        return save_id

    def get_saved_recipes(self, user_id: str, folder: str = None) -> List[Dict]:
        """Get user's saved recipes"""
        if user_id not in self.saved_recipes:
            return []

        user_data = self.saved_recipes[user_id]
        recipes = []

        if folder:
            # Get recipes from specific folder
            save_ids = user_data['folders'].get(folder, [])
            for save_id in save_ids:
                if save_id in user_data['recipes']:
                    recipes.append(user_data['recipes'][save_id])
        else:
            # Get all recipes
            recipes = list(user_data['recipes'].values())

        # Sort by saved date (newest first)
        recipes.sort(key=lambda x: x['saved_at'], reverse=True)
        return recipes

    def delete_saved_recipe(self, user_id: str, save_id: str) -> bool:
        """Delete a saved recipe"""
        if user_id in self.saved_recipes:
            user_data = self.saved_recipes[user_id]

            if save_id in user_data['recipes']:
                # Get folder
                folder = user_data['recipes'][save_id]['folder']

                # Remove from folder
                if folder in user_data['folders']:
                    if save_id in user_data['folders'][folder]:
                        user_data['folders'][folder].remove(save_id)

                # Delete recipe
                del user_data['recipes'][save_id]

                self._save_data(self.saved_recipes, self.recipes_db)
                return True

        return False

    def create_folder(self, user_id: str, folder_name: str) -> bool:
        """Create a new recipe folder"""
        if user_id not in self.saved_recipes:
            self.saved_recipes[user_id] = {
                "folders": {},
                "recipes": {}
            }

        if folder_name not in self.saved_recipes[user_id]['folders']:
            self.saved_recipes[user_id]['folders'][folder_name] = []
            self._save_data(self.saved_recipes, self.recipes_db)
            return True

        return False

    def get_folders(self, user_id: str) -> List[Dict]:
        """Get user's recipe folders"""
        if user_id not in self.saved_recipes:
            return [{"name": "default", "count": 0}]

        folders = []
        for folder_name, recipe_ids in self.saved_recipes[user_id]['folders'].items():
            folders.append({
                "name": folder_name,
                "count": len(recipe_ids)
            })

        return folders

    def update_recipe_note(self, user_id: str, save_id: str, note: str) -> bool:
        """Update note for saved recipe"""
        if user_id in self.saved_recipes:
            if save_id in self.saved_recipes[user_id]['recipes']:
                self.saved_recipes[user_id]['recipes'][save_id]['notes'] = note
                self._save_data(self.saved_recipes, self.recipes_db)
                return True
        return False

    def rate_recipe(self, user_id: str, save_id: str, rating: int) -> bool:
        """Rate a saved recipe"""
        if user_id in self.saved_recipes:
            if save_id in self.saved_recipes[user_id]['recipes']:
                self.saved_recipes[user_id]['recipes'][save_id]['rating'] = rating
                self._save_data(self.saved_recipes, self.recipes_db)
                return True
        return False

    def mark_as_cooked(self, user_id: str, save_id: str) -> bool:
        """Mark recipe as cooked"""
        if user_id in self.saved_recipes:
            if save_id in self.saved_recipes[user_id]['recipes']:
                recipe_data = self.saved_recipes[user_id]['recipes'][save_id]
                recipe_data['cooked'] = True
                recipe_data['cooked_count'] += 1
                recipe_data['last_cooked'] = datetime.now().isoformat()
                self._save_data(self.saved_recipes, self.recipes_db)
                return True
        return False

    def get_statistics(self, user_id: str) -> Dict:
        """Get user statistics"""
        stats = {
            "total_saved": 0,
            "total_cooked": 0,
            "total_folders": 1,
            "favorite_cuisine": {},
            "avg_rating": 0,
            "total_rated": 0
        }

        if user_id in self.saved_recipes:
            user_data = self.saved_recipes[user_id]
            stats['total_saved'] = len(user_data['recipes'])
            stats['total_folders'] = len(user_data['folders'])

            ratings = []
            for recipe_data in user_data['recipes'].values():
                if recipe_data['cooked']:
                    stats['total_cooked'] += 1

                if recipe_data['rating']:
                    ratings.append(recipe_data['rating'])

                # Count cuisine types
                recipe = recipe_data.get('recipe', {})
                cuisine = recipe.get('cuisine', '한식')
                stats['favorite_cuisine'][cuisine] = stats['favorite_cuisine'].get(cuisine, 0) + 1

            if ratings:
                stats['avg_rating'] = sum(ratings) / len(ratings)
                stats['total_rated'] = len(ratings)

        return stats

    def get_recommendations(self, user_id: str, limit: int = 5) -> List[Dict]:
        """Get personalized recipe recommendations"""
        profile = self.get_profile(user_id)
        if not profile:
            return []

        # Get user preferences
        favorite_cuisine = profile.get('favorite_cuisine', ['한식'])
        dietary = profile.get('dietary_preferences', [])
        allergies = profile.get('allergies', [])
        skill_level = profile.get('cooking_level', '초보')

        # This would normally query a recipe database
        # For now, return sample recommendations
        recommendations = []

        # Map skill levels to difficulty
        skill_map = {
            '초보': '쉬움',
            '중급': '보통',
            '고급': '어려움',
            '전문가': '어려움'
        }

        difficulty = skill_map.get(skill_level, '보통')

        # Sample recommendations based on preferences
        sample_recipes = [
            {"name": "김치찌개", "cuisine": "한식", "difficulty": "쉬움", "time": 30},
            {"name": "된장찌개", "cuisine": "한식", "difficulty": "쉬움", "time": 25},
            {"name": "제육볶음", "cuisine": "한식", "difficulty": "보통", "time": 30},
            {"name": "비빔밥", "cuisine": "한식", "difficulty": "보통", "time": 20},
            {"name": "불고기", "cuisine": "한식", "difficulty": "보통", "time": 40},
        ]

        for recipe in sample_recipes:
            if recipe['cuisine'] in favorite_cuisine:
                if recipe['difficulty'] == difficulty or difficulty == '전문가':
                    recommendations.append(recipe)

        return recommendations[:limit]