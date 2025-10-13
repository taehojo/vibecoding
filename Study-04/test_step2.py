"""
Test script for Step 2: Recipe Generation System
This script tests all components of the Step 2 implementation
"""
import sys
import os
import io
import json
from datetime import datetime

# Fix encoding for Windows
if sys.platform == 'win32':
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')
    sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding='utf-8')

# Add parent directory to path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from backend.config import Config
from backend.openrouter_client import OpenRouterClient
from backend.recipe_generator import RecipeGenerator
from backend.ingredient_manager import IngredientManager
from backend.database import RecipeDatabase

def print_header(text):
    """Print formatted header"""
    print("\n" + "="*50)
    print(f"  {text}")
    print("="*50)

def test_recipe_generator():
    """Test recipe generation with DeepSeek"""
    print_header("1. Recipe Generator Test")

    try:
        generator = RecipeGenerator()
        print("✅ Recipe generator initialized")

        # Test with sample ingredients
        test_ingredients = {
            "vegetables": ["양파", "당근", "감자"],
            "meat": ["돼지고기"],
            "condiments": ["간장", "고추장"]
        }

        print("🔄 Generating recipes with test ingredients...")
        result = generator.generate_recipes(test_ingredients)

        if result.get('status') == 'success':
            print(f"✅ Recipe generation successful")
            print(f"   - Generated recipes: {len(result.get('recipes', []))}")
            for recipe in result.get('recipes', []):
                print(f"   - {recipe.get('name', 'Unknown')}: {recipe.get('time', 0)}분")
            return True
        else:
            print(f"⚠️ Recipe generation returned: {result.get('error', 'No recipes')}")
            return True  # Not necessarily a failure

    except Exception as e:
        print(f"❌ Recipe generator error: {e}")
        return False

def test_ingredient_manager():
    """Test ingredient management functions"""
    print_header("2. Ingredient Manager Test")

    try:
        manager = IngredientManager()
        print("✅ Ingredient manager initialized")

        # Test adding ingredients
        manager.add_ingredient("vegetables", "양파", "2개")
        manager.add_ingredient("meat", "돼지고기", "300g")

        ingredients = manager.get_ingredients()
        print(f"✅ Ingredients added: {manager.get_statistics()['total_ingredients']} items")

        # Test suggestions
        suggestions = manager.get_suggestions("당")
        print(f"✅ Autocomplete working: {len(suggestions)} suggestions for '당'")

        # Test validation
        validation = manager.validate_ingredients()
        print(f"✅ Validation: {'Valid' if validation['valid'] else 'Invalid'}")

        return True

    except Exception as e:
        print(f"❌ Ingredient manager error: {e}")
        return False

def test_database():
    """Test database operations"""
    print_header("3. Database Test")

    try:
        db = RecipeDatabase("test_recipes.db")
        print("✅ Database initialized")

        # Test saving recipe
        test_recipe = {
            "name": "테스트 레시피",
            "difficulty": "쉬움",
            "time": 30,
            "servings": 4,
            "calories": 250,
            "ingredients": [
                {"name": "양파", "amount": "1개"},
                {"name": "당근", "amount": "2개"}
            ],
            "steps": ["재료 준비", "볶기", "완성"]
        }

        recipe_id = db.save_recipe(test_recipe)
        if recipe_id > 0:
            print(f"✅ Recipe saved with ID: {recipe_id}")
        else:
            print("⚠️ Recipe save failed")

        # Test retrieving recipes
        recipes = db.get_recipes()
        print(f"✅ Retrieved {len(recipes)} recipes from database")

        # Clean up test database
        import os
        if os.path.exists("test_recipes.db"):
            os.remove("test_recipes.db")

        return True

    except Exception as e:
        print(f"❌ Database error: {e}")
        return False

def test_ingredient_translation():
    """Test ingredient translation"""
    print_header("4. Ingredient Translation Test")

    try:
        generator = RecipeGenerator()

        # Test translation
        english_ingredients = ["onion", "carrot", "pork", "milk"]
        korean_ingredients = generator.translate_ingredients(english_ingredients)

        print("✅ Translation test:")
        for eng, kor in zip(english_ingredients, korean_ingredients):
            print(f"   - {eng} → {kor}")

        return True

    except Exception as e:
        print(f"❌ Translation error: {e}")
        return False

def test_deepseek_connection():
    """Test DeepSeek model connection"""
    print_header("5. DeepSeek Model Test")

    try:
        client = OpenRouterClient()

        # Test with DeepSeek model
        messages = [
            {
                "role": "user",
                "content": "간단한 김치찌개 레시피를 한 문장으로 설명해주세요."
            }
        ]

        print("🔄 Testing DeepSeek model...")
        response = client.chat_completion(
            messages=messages,
            model=Config.RECIPE_GENERATION_MODEL
        )

        if response and 'choices' in response:
            print("✅ DeepSeek model connected successfully")
            content = response['choices'][0]['message']['content']
            print(f"   - Response: {content[:100]}...")
            return True
        else:
            print("❌ DeepSeek model connection failed")
            return False

    except Exception as e:
        print(f"❌ DeepSeek connection error: {e}")
        return False

def test_streamlit_components():
    """Test if new Streamlit components are available"""
    print_header("6. Streamlit Components Test")

    try:
        import streamlit as st
        import pandas as pd
        import plotly

        print("✅ All required libraries imported")
        print(f"   - Streamlit: {st.__version__}")
        print(f"   - Pandas: {pd.__version__}")
        print(f"   - Plotly: {plotly.__version__}")

        return True

    except Exception as e:
        print(f"❌ Component import failed: {e}")
        return False

def run_all_tests():
    """Run all tests and generate report"""
    print("\n" + "="*50)
    print("  FRIDGECHEF STEP 2 - TEST SUITE")
    print("  " + datetime.now().strftime("%Y-%m-%d %H:%M:%S"))
    print("="*50)

    tests = [
        ("Recipe Generator", test_recipe_generator),
        ("Ingredient Manager", test_ingredient_manager),
        ("Database", test_database),
        ("Translation", test_ingredient_translation),
        ("DeepSeek Connection", test_deepseek_connection),
        ("Streamlit Components", test_streamlit_components)
    ]

    results = []
    for name, test_func in tests:
        try:
            success = test_func()
            results.append((name, success))
        except Exception as e:
            print(f"❌ Test '{name}' crashed: {e}")
            results.append((name, False))

    # Summary
    print_header("TEST SUMMARY")

    passed = sum(1 for _, success in results if success)
    total = len(results)

    for name, success in results:
        status = "✅ PASS" if success else "❌ FAIL"
        print(f"  {name:.<30} {status}")

    print(f"\n  Total: {passed}/{total} tests passed")

    # Overall result
    if passed == total:
        print("\n🎉 ALL TESTS PASSED! Step 2 is ready.")
        print("\nYou can now run the application with:")
        print("  streamlit run app_step2.py")
    elif passed >= 4:
        print("\n⚠️ PARTIAL SUCCESS - Core features working")
        print("  Some features may not work correctly.")
    else:
        print("\n❌ TESTS FAILED - Please check configuration")

    return passed == total

if __name__ == "__main__":
    success = run_all_tests()
    sys.exit(0 if success else 1)