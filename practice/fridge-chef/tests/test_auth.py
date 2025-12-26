"""Tests for authentication service."""
import pytest
import sys
from pathlib import Path

# Add project root to path
sys.path.insert(0, str(Path(__file__).parent.parent))

from db.init_db import init_database
from db.database import engine
from db.models import Base
from services.auth import AuthService


@pytest.fixture(autouse=True)
def setup_database():
    """Set up and tear down test database."""
    # Create tables
    Base.metadata.create_all(bind=engine)
    yield
    # Drop tables after test
    Base.metadata.drop_all(bind=engine)


class TestAuthService:
    """Test cases for AuthService."""

    def test_hash_password(self):
        """Test password hashing."""
        password = "test_password123"
        hashed = AuthService.hash_password(password)

        assert hashed != password
        assert len(hashed) > 20
        assert hashed.startswith("$2b$")  # bcrypt prefix

    def test_verify_password_correct(self):
        """Test password verification with correct password."""
        password = "test_password123"
        hashed = AuthService.hash_password(password)

        assert AuthService.verify_password(password, hashed) is True

    def test_verify_password_incorrect(self):
        """Test password verification with incorrect password."""
        password = "test_password123"
        hashed = AuthService.hash_password(password)

        assert AuthService.verify_password("wrong_password", hashed) is False

    def test_register_success(self):
        """Test successful user registration."""
        user = AuthService.register(
            username="testuser",
            password="password123",
            nickname="Test User"
        )

        assert user is not None
        assert user.username == "testuser"
        assert user.nickname == "Test User"
        assert user.skill_level == "beginner"

    def test_register_duplicate_username(self):
        """Test registration with duplicate username."""
        AuthService.register("testuser", "password123", "User1")
        result = AuthService.register("testuser", "password456", "User2")

        assert result is None

    def test_login_success(self):
        """Test successful login."""
        AuthService.register("loginuser", "password123", "Login User")
        user = AuthService.login("loginuser", "password123")

        assert user is not None
        assert user.username == "loginuser"

    def test_login_wrong_password(self):
        """Test login with wrong password."""
        AuthService.register("loginuser2", "password123", "Login User 2")
        user = AuthService.login("loginuser2", "wrongpassword")

        assert user is None

    def test_login_nonexistent_user(self):
        """Test login with non-existent user."""
        user = AuthService.login("nonexistent", "password123")

        assert user is None

    def test_get_user_by_id(self):
        """Test getting user by ID."""
        created_user = AuthService.register("iduser", "password123", "ID User")
        fetched_user = AuthService.get_user_by_id(created_user.id)

        assert fetched_user is not None
        assert fetched_user.username == "iduser"

    def test_get_user_by_invalid_id(self):
        """Test getting user with invalid ID."""
        user = AuthService.get_user_by_id(99999)

        assert user is None

    def test_update_profile(self):
        """Test profile update."""
        user = AuthService.register("updateuser", "password123", "Update User")
        result = AuthService.update_profile(
            user.id,
            nickname="New Nickname",
            skill_level="intermediate"
        )

        assert result is True

        updated_user = AuthService.get_user_by_id(user.id)
        assert updated_user.nickname == "New Nickname"
        assert updated_user.skill_level == "intermediate"

    def test_update_preferences(self):
        """Test preferences update."""
        user = AuthService.register("prefuser", "password123", "Pref User")
        result = AuthService.update_preferences(
            user.id,
            dietary_preferences=["채식", "저염"],
            allergies=["땅콩"],
            favorite_cuisines=["한식", "일식"],
            excluded_ingredients=["고수"]
        )

        assert result is True

        prefs = AuthService.get_preferences(user.id)
        assert prefs["dietary_preferences"] == ["채식", "저염"]
        assert prefs["allergies"] == ["땅콩"]
        assert prefs["favorite_cuisines"] == ["한식", "일식"]
        assert prefs["excluded_ingredients"] == ["고수"]

    def test_get_preferences_default(self):
        """Test getting default preferences."""
        user = AuthService.register("defaultuser", "password123", "Default User")
        prefs = AuthService.get_preferences(user.id)

        assert prefs["dietary_preferences"] == []
        assert prefs["allergies"] == []
        assert prefs["favorite_cuisines"] == []
        assert prefs["excluded_ingredients"] == []

    def test_delete_account(self):
        """Test account deletion."""
        user = AuthService.register("deleteuser", "password123", "Delete User")
        result = AuthService.delete_account(user.id)

        assert result is True
        assert AuthService.get_user_by_id(user.id) is None
