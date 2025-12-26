"""Authentication service with bcrypt password hashing."""
import bcrypt
from sqlalchemy.orm import Session, make_transient

from db.models import User, UserPreferences
from db.database import get_db


class AuthService:
    """Authentication service for user registration and login."""

    COST_FACTOR = 12

    @staticmethod
    def hash_password(password: str) -> str:
        """Hash password using bcrypt."""
        salt = bcrypt.gensalt(rounds=AuthService.COST_FACTOR)
        return bcrypt.hashpw(password.encode("utf-8"), salt).decode("utf-8")

    @staticmethod
    def verify_password(password: str, password_hash: str) -> bool:
        """Verify password against hash."""
        return bcrypt.checkpw(
            password.encode("utf-8"),
            password_hash.encode("utf-8")
        )

    @staticmethod
    def register(
        username: str,
        password: str,
        nickname: str | None = None,
    ) -> User | None:
        """Register a new user.

        Args:
            username: Unique username.
            password: Plain text password.
            nickname: Optional display name.

        Returns:
            Created User object or None if registration fails.
        """
        with get_db() as session:
            # Check if username exists
            existing = session.query(User).filter(User.username == username).first()
            if existing:
                return None

            # Create user
            user = User(
                username=username,
                password_hash=AuthService.hash_password(password),
                nickname=nickname or username,
                skill_level="beginner",
            )
            session.add(user)
            session.flush()

            # Create default preferences
            preferences = UserPreferences(user_id=user.id)
            session.add(preferences)

            session.commit()
            session.refresh(user)
            # Make a copy of attributes before expunging
            make_transient(user)
            return user

    @staticmethod
    def login(username: str, password: str) -> User | None:
        """Authenticate user.

        Args:
            username: Username.
            password: Plain text password.

        Returns:
            User object if credentials are valid, None otherwise.
        """
        with get_db() as session:
            user = session.query(User).filter(User.username == username).first()
            if user and AuthService.verify_password(password, user.password_hash):
                # Make transient for use outside session
                make_transient(user)
                return user
            return None

    @staticmethod
    def get_user_by_id(user_id: int) -> User | None:
        """Get user by ID.

        Args:
            user_id: User ID.

        Returns:
            User object or None.
        """
        with get_db() as session:
            user = session.query(User).filter(User.id == user_id).first()
            if user:
                make_transient(user)
            return user

    @staticmethod
    def update_profile(
        user_id: int,
        nickname: str | None = None,
        skill_level: str | None = None,
    ) -> bool:
        """Update user profile.

        Args:
            user_id: User ID.
            nickname: New nickname.
            skill_level: New skill level.

        Returns:
            True if updated successfully.
        """
        with get_db() as session:
            user = session.query(User).filter(User.id == user_id).first()
            if not user:
                return False

            if nickname:
                user.nickname = nickname
            if skill_level:
                user.skill_level = skill_level

            session.commit()
            return True

    @staticmethod
    def update_preferences(
        user_id: int,
        dietary_preferences: list[str] | None = None,
        allergies: list[str] | None = None,
        favorite_cuisines: list[str] | None = None,
        excluded_ingredients: list[str] | None = None,
    ) -> bool:
        """Update user preferences.

        Args:
            user_id: User ID.
            dietary_preferences: Dietary restrictions.
            allergies: Allergy list.
            favorite_cuisines: Preferred cuisines.
            excluded_ingredients: Ingredients to exclude.

        Returns:
            True if updated successfully.
        """
        with get_db() as session:
            prefs = session.query(UserPreferences).filter(
                UserPreferences.user_id == user_id
            ).first()

            if not prefs:
                prefs = UserPreferences(user_id=user_id)
                session.add(prefs)

            if dietary_preferences is not None:
                prefs.set_dietary_preferences(dietary_preferences)
            if allergies is not None:
                prefs.set_allergies(allergies)
            if favorite_cuisines is not None:
                prefs.set_favorite_cuisines(favorite_cuisines)
            if excluded_ingredients is not None:
                prefs.set_excluded_ingredients(excluded_ingredients)

            session.commit()
            return True

    @staticmethod
    def get_preferences(user_id: int) -> dict:
        """Get user preferences.

        Args:
            user_id: User ID.

        Returns:
            Dict with preference data.
        """
        with get_db() as session:
            prefs = session.query(UserPreferences).filter(
                UserPreferences.user_id == user_id
            ).first()

            if not prefs:
                return {
                    "dietary_preferences": [],
                    "allergies": [],
                    "favorite_cuisines": [],
                    "excluded_ingredients": [],
                }

            return {
                "dietary_preferences": prefs.get_dietary_preferences(),
                "allergies": prefs.get_allergies(),
                "favorite_cuisines": prefs.get_favorite_cuisines(),
                "excluded_ingredients": prefs.get_excluded_ingredients(),
            }

    @staticmethod
    def delete_account(user_id: int) -> bool:
        """Delete user account and all related data.

        Args:
            user_id: User ID.

        Returns:
            True if deleted successfully.
        """
        with get_db() as session:
            user = session.query(User).filter(User.id == user_id).first()
            if not user:
                return False

            session.delete(user)
            session.commit()
            return True
