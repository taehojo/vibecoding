"""
User authentication and session management
"""
import hashlib
import secrets
import json
from datetime import datetime, timedelta
from typing import Dict, Optional
import os

class AuthManager:
    """Manage user authentication and sessions"""

    def __init__(self, db_path: str = "users.json"):
        self.db_path = db_path
        self.users = self._load_users()
        self.sessions = {}

    def _load_users(self) -> Dict:
        """Load users from JSON file"""
        if os.path.exists(self.db_path):
            with open(self.db_path, 'r', encoding='utf-8') as f:
                return json.load(f)
        return {}

    def _save_users(self):
        """Save users to JSON file"""
        with open(self.db_path, 'w', encoding='utf-8') as f:
            json.dump(self.users, f, ensure_ascii=False, indent=2)

    def _hash_password(self, password: str) -> str:
        """Hash password using SHA256"""
        return hashlib.sha256(password.encode()).hexdigest()

    def register(self, email: str, username: str, password: str) -> Dict:
        """
        Register a new user

        Args:
            email: User email
            username: Username
            password: Plain password

        Returns:
            Result dictionary with success status
        """
        # Validate email
        if not email or '@' not in email:
            return {"success": False, "error": "유효하지 않은 이메일입니다"}

        # Check if email already exists
        if email in self.users:
            return {"success": False, "error": "이미 등록된 이메일입니다"}

        # Check username uniqueness
        for user in self.users.values():
            if user.get('username') == username:
                return {"success": False, "error": "이미 사용 중인 사용자명입니다"}

        # Validate password
        if len(password) < 6:
            return {"success": False, "error": "비밀번호는 6자 이상이어야 합니다"}

        # Create user
        user_id = f"user_{len(self.users) + 1:04d}"
        self.users[email] = {
            "id": user_id,
            "email": email,
            "username": username,
            "password": self._hash_password(password),
            "created_at": datetime.now().isoformat(),
            "profile": {
                "nickname": username,
                "bio": "",
                "cooking_level": "초보",
                "dietary_preferences": [],
                "allergies": [],
                "favorite_cuisine": ["한식"],
                "household_size": 2
            },
            "stats": {
                "recipes_saved": 0,
                "recipes_cooked": 0,
                "total_time_saved": 0,
                "money_saved": 0
            }
        }

        self._save_users()
        return {"success": True, "user_id": user_id, "message": "회원가입이 완료되었습니다"}

    def login(self, email: str, password: str) -> Dict:
        """
        Login user

        Args:
            email: User email
            password: Plain password

        Returns:
            Result dictionary with session token
        """
        # Check if user exists
        if email not in self.users:
            return {"success": False, "error": "이메일 또는 비밀번호가 일치하지 않습니다"}

        # Verify password
        user = self.users[email]
        if user['password'] != self._hash_password(password):
            return {"success": False, "error": "이메일 또는 비밀번호가 일치하지 않습니다"}

        # Create session
        session_token = secrets.token_urlsafe(32)
        self.sessions[session_token] = {
            "user_id": user['id'],
            "email": email,
            "username": user['username'],
            "login_time": datetime.now().isoformat(),
            "expires_at": (datetime.now() + timedelta(days=7)).isoformat()
        }

        return {
            "success": True,
            "token": session_token,
            "user": {
                "id": user['id'],
                "email": email,
                "username": user['username'],
                "profile": user.get('profile', {})
            }
        }

    def logout(self, token: str) -> bool:
        """Logout user by removing session"""
        if token in self.sessions:
            del self.sessions[token]
            return True
        return False

    def verify_session(self, token: str) -> Optional[Dict]:
        """
        Verify session token

        Args:
            token: Session token

        Returns:
            User info if valid, None otherwise
        """
        if token not in self.sessions:
            return None

        session = self.sessions[token]

        # Check expiration
        expires_at = datetime.fromisoformat(session['expires_at'])
        if datetime.now() > expires_at:
            del self.sessions[token]
            return None

        # Return user info
        email = session['email']
        user = self.users.get(email)

        if user:
            return {
                "id": user['id'],
                "email": email,
                "username": user['username'],
                "profile": user.get('profile', {}),
                "stats": user.get('stats', {})
            }

        return None

    def update_profile(self, email: str, profile_data: Dict) -> bool:
        """Update user profile"""
        if email in self.users:
            self.users[email]['profile'].update(profile_data)
            self._save_users()
            return True
        return False

    def update_stats(self, email: str, stat_type: str, value: int = 1) -> bool:
        """Update user statistics"""
        if email in self.users:
            if stat_type in self.users[email]['stats']:
                self.users[email]['stats'][stat_type] += value
                self._save_users()
                return True
        return False

    def get_user_by_email(self, email: str) -> Optional[Dict]:
        """Get user by email"""
        return self.users.get(email)

    def get_user_by_id(self, user_id: str) -> Optional[Dict]:
        """Get user by ID"""
        for user in self.users.values():
            if user['id'] == user_id:
                return user
        return None

    def delete_user(self, email: str) -> bool:
        """Delete user account"""
        if email in self.users:
            del self.users[email]
            self._save_users()
            return True
        return False

    def change_password(self, email: str, old_password: str, new_password: str) -> Dict:
        """Change user password"""
        if email not in self.users:
            return {"success": False, "error": "사용자를 찾을 수 없습니다"}

        user = self.users[email]

        # Verify old password
        if user['password'] != self._hash_password(old_password):
            return {"success": False, "error": "현재 비밀번호가 일치하지 않습니다"}

        # Validate new password
        if len(new_password) < 6:
            return {"success": False, "error": "새 비밀번호는 6자 이상이어야 합니다"}

        # Update password
        self.users[email]['password'] = self._hash_password(new_password)
        self._save_users()

        return {"success": True, "message": "비밀번호가 변경되었습니다"}