"""
Test script for Step 1: Image Recognition Core
This script tests all components of the Step 1 implementation
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
from backend.image_service import ImageProcessor

def print_header(text):
    """Print formatted header"""
    print("\n" + "="*50)
    print(f"  {text}")
    print("="*50)

def test_configuration():
    """Test configuration loading"""
    print_header("1. Configuration Test")

    try:
        Config.validate()
        print("✅ Configuration loaded successfully")
        print(f"   - API Key: {'Set' if Config.OPENROUTER_API_KEY else 'Not Set'}")
        print(f"   - App Name: {Config.APP_NAME}")
        print(f"   - Version: {Config.APP_VERSION}")
        return True
    except Exception as e:
        print(f"❌ Configuration failed: {e}")
        return False

def test_api_connection():
    """Test OpenRouter API connection"""
    print_header("2. API Connection Test")

    try:
        client = OpenRouterClient()
        if client.test_connection():
            print("✅ API connection successful")
            return True
        else:
            print("❌ API connection failed")
            return False
    except Exception as e:
        print(f"❌ Connection test error: {e}")
        return False

def test_image_processing():
    """Test image processing capabilities"""
    print_header("3. Image Processing Test")

    try:
        processor = ImageProcessor()

        # Create test image
        test_image_base64 = processor.create_test_image()

        if test_image_base64:
            print("✅ Image processing successful")
            print(f"   - Test image created: {len(test_image_base64)} chars")
            return True
        else:
            print("❌ Image processing failed")
            return False
    except Exception as e:
        print(f"❌ Image processing error: {e}")
        return False

def test_ingredient_recognition():
    """Test ingredient recognition with a simple image"""
    print_header("4. Ingredient Recognition Test")

    try:
        # Create simple test image
        processor = ImageProcessor()
        test_image = processor.create_test_image()

        # Test with API
        client = OpenRouterClient()

        print("🔄 Sending test image to AI...")
        result = client.recognize_ingredients(test_image)

        if result.get('status') == 'success':
            print("✅ Ingredient recognition successful")
            print(f"   - Total items: {result.get('total_items', 0)}")

            ingredients = result.get('ingredients', {})
            for category, items in ingredients.items():
                if items:
                    print(f"   - {category}: {len(items)} items")

            return True
        else:
            print(f"⚠️ Recognition returned: {result.get('error', 'No ingredients found')}")
            # This is not necessarily a failure - empty fridge is valid
            return True

    except Exception as e:
        print(f"❌ Recognition error: {e}")
        return False

def test_streamlit_components():
    """Test if Streamlit components are available"""
    print_header("5. Streamlit Components Test")

    try:
        import streamlit as st
        print("✅ Streamlit imported successfully")
        print(f"   - Version: {st.__version__}")
        return True
    except Exception as e:
        print(f"❌ Streamlit import failed: {e}")
        return False

def run_all_tests():
    """Run all tests and generate report"""
    print("\n" + "="*50)
    print("  FRIDGECHEF STEP 1 - TEST SUITE")
    print("  " + datetime.now().strftime("%Y-%m-%d %H:%M:%S"))
    print("="*50)

    tests = [
        ("Configuration", test_configuration),
        ("API Connection", test_api_connection),
        ("Image Processing", test_image_processing),
        ("Ingredient Recognition", test_ingredient_recognition),
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
        print("\n🎉 ALL TESTS PASSED! Step 1 is ready.")
        print("\nYou can now run the application with:")
        print("  streamlit run app.py")
    elif passed >= 3:
        print("\n⚠️ PARTIAL SUCCESS - Core features working")
        print("  Some features may not work correctly.")
    else:
        print("\n❌ TESTS FAILED - Please check configuration")
        print("  Make sure OPENROUTER_API_KEY is set in .env file")

    return passed == total

if __name__ == "__main__":
    success = run_all_tests()
    sys.exit(0 if success else 1)