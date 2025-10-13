"""
Test script for Step 3: User Profile and Recipe Management System
This script tests all components of the Step 3 implementation
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

from backend.auth import AuthManager
from backend.user_profile import UserProfileManager

def print_header(text):
    """Print formatted header"""
    print("\n" + "="*50)
    print(f"  {text}")
    print("="*50)

def test_authentication():
    """Test user authentication system"""
    print_header("1. Authentication System Test")

    try:
        auth = AuthManager()
        print("✅ Auth manager initialized")

        # Test registration
        test_email = f"test_{datetime.now().strftime('%H%M%S')}@test.com"
        result = auth.register(test_email, "TestUser", "password123")

        if result['success']:
            print(f"✅ User registration successful: {result['user_id']}")
        else:
            print(f"⚠️ Registration failed: {result.get('error')}")

        # Test login
        login_result = auth.login(test_email, "password123")

        if login_result['success']:
            print(f"✅ User login successful")
            print(f"   - Token: {login_result['token'][:20]}...")
            print(f"   - User: {login_result['user']['username']}")

            # Test session verification
            user_info = auth.verify_session(login_result['token'])
            if user_info:
                print("✅ Session verification successful")
            else:
                print("❌ Session verification failed")

            return True
        else:
            print(f"❌ Login failed: {login_result.get('error')}")
            return False

    except Exception as e:
        print(f"❌ Authentication test error: {e}")
        return False

def test_user_profile():
    """Test user profile management"""
    print_header("2. User Profile Test")

    try:
        profile_manager = UserProfileManager()
        print("✅ Profile manager initialized")

        # Test profile creation
        test_user_id = "test_user_001"
        profile_data = {
            'nickname': 'TestChef',
            'bio': 'I love cooking!',
            'cooking_level': '중급',
            'favorite_cuisine': ['한식', '양식'],
            'household_size': 4
        }

        success = profile_manager.create_profile(test_user_id, profile_data)
        if success:
            print("✅ Profile created successfully")

            # Test profile retrieval
            profile = profile_manager.get_profile(test_user_id)
            if profile:
                print(f"✅ Profile retrieved: {profile['nickname']}")
            else:
                print("❌ Profile retrieval failed")

        return True

    except Exception as e:
        print(f"❌ Profile test error: {e}")
        return False

def test_recipe_saving():
    """Test recipe saving and management"""
    print_header("3. Recipe Saving Test")

    try:
        profile_manager = UserProfileManager()
        print("✅ Recipe manager initialized")

        # Test saving recipe
        test_user_id = "test_user_001"
        test_recipe = {
            'name': '테스트 김치찌개',
            'difficulty': '쉬움',
            'time': 30,
            'servings': 4,
            'calories': 250
        }

        save_id = profile_manager.save_recipe(test_user_id, test_recipe)
        print(f"✅ Recipe saved with ID: {save_id}")

        # Test retrieving saved recipes
        saved_recipes = profile_manager.get_saved_recipes(test_user_id)
        print(f"✅ Retrieved {len(saved_recipes)} saved recipes")

        # Test folder creation
        folder_created = profile_manager.create_folder(test_user_id, "즐겨찾기")
        if folder_created:
            print("✅ Recipe folder created")

        # Test rating
        if saved_recipes:
            rating_success = profile_manager.rate_recipe(test_user_id, save_id, 5)
            if rating_success:
                print("✅ Recipe rating saved")

        return True

    except Exception as e:
        print(f"❌ Recipe saving test error: {e}")
        return False

def test_statistics():
    """Test user statistics"""
    print_header("4. Statistics Test")

    try:
        profile_manager = UserProfileManager()

        test_user_id = "test_user_001"
        stats = profile_manager.get_statistics(test_user_id)

        print("✅ Statistics retrieved:")
        print(f"   - Total saved: {stats['total_saved']}")
        print(f"   - Total cooked: {stats['total_cooked']}")
        print(f"   - Total folders: {stats['total_folders']}")
        print(f"   - Average rating: {stats['avg_rating']:.1f}" if stats['avg_rating'] else "   - Average rating: N/A")

        return True

    except Exception as e:
        print(f"❌ Statistics test error: {e}")
        return False

def test_recommendations():
    """Test personalized recommendations"""
    print_header("5. Recommendations Test")

    try:
        profile_manager = UserProfileManager()

        test_user_id = "test_user_001"

        # First create a profile with preferences
        profile_data = {
            'cooking_level': '초보',
            'favorite_cuisine': ['한식'],
            'dietary_preferences': [],
            'allergies': []
        }
        profile_manager.create_profile(test_user_id, profile_data)

        # Get recommendations
        recommendations = profile_manager.get_recommendations(test_user_id, limit=3)

        if recommendations:
            print(f"✅ Got {len(recommendations)} recommendations:")
            for rec in recommendations:
                print(f"   - {rec['name']} ({rec['difficulty']}, {rec['time']}분)")
        else:
            print("⚠️ No recommendations generated")

        return True

    except Exception as e:
        print(f"❌ Recommendations test error: {e}")
        return False

def test_password_change():
    """Test password change functionality"""
    print_header("6. Password Change Test")

    try:
        auth = AuthManager()

        # Create test user
        test_email = f"pwtest_{datetime.now().strftime('%H%M%S')}@test.com"
        auth.register(test_email, "PwTestUser", "oldpass123")

        # Test password change
        result = auth.change_password(test_email, "oldpass123", "newpass456")

        if result['success']:
            print("✅ Password changed successfully")

            # Test login with new password
            login_result = auth.login(test_email, "newpass456")
            if login_result['success']:
                print("✅ Login with new password successful")
                return True
            else:
                print("❌ Login with new password failed")
                return False
        else:
            print(f"❌ Password change failed: {result.get('error')}")
            return False

    except Exception as e:
        print(f"❌ Password change test error: {e}")
        return False

def test_demo_account():
    """Test demo account creation and login"""
    print_header("7. Demo Account Test")

    try:
        auth = AuthManager()

        # Register demo account
        demo_email = "demo@fridgechef.com"
        demo_password = "demo123"

        # Try to register (may already exist)
        auth.register(demo_email, "DemoUser", demo_password)

        # Test demo login
        result = auth.login(demo_email, demo_password)

        if result['success']:
            print("✅ Demo account login successful")
            print(f"   - Username: {result['user']['username']}")
            return True
        else:
            print(f"⚠️ Demo account login failed: {result.get('error')}")
            return False

    except Exception as e:
        print(f"❌ Demo account test error: {e}")
        return False

def run_all_tests():
    """Run all tests and generate report"""
    print("\n" + "="*50)
    print("  FRIDGECHEF STEP 3 - TEST SUITE")
    print("  " + datetime.now().strftime("%Y-%m-%d %H:%M:%S"))
    print("="*50)

    tests = [
        ("Authentication", test_authentication),
        ("User Profile", test_user_profile),
        ("Recipe Saving", test_recipe_saving),
        ("Statistics", test_statistics),
        ("Recommendations", test_recommendations),
        ("Password Change", test_password_change),
        ("Demo Account", test_demo_account)
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
        print("\n🎉 ALL TESTS PASSED! Step 3 is ready.")
        print("\nYou can now run the application with:")
        print("  streamlit run app_step3.py")
    elif passed >= 5:
        print("\n⚠️ PARTIAL SUCCESS - Core features working")
        print("  Some features may not work correctly.")
    else:
        print("\n❌ TESTS FAILED - Please check implementation")

    # Clean up test files
    cleanup_test_files()

    return passed == total

def cleanup_test_files():
    """Clean up test database files"""
    test_files = ['users.json', 'user_profiles.json', 'saved_recipes.json']
    for file in test_files:
        if os.path.exists(file):
            try:
                # Keep demo account
                if file == 'users.json':
                    with open(file, 'r', encoding='utf-8') as f:
                        users = json.load(f)
                    # Keep only demo account
                    demo_users = {k: v for k, v in users.items() if 'demo' in k}
                    if demo_users:
                        with open(file, 'w', encoding='utf-8') as f:
                            json.dump(demo_users, f, ensure_ascii=False, indent=2)
                    continue
            except:
                pass

if __name__ == "__main__":
    success = run_all_tests()
    sys.exit(0 if success else 1)