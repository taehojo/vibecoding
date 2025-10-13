"""
Optimized user authentication with session cleanup and thread safety
"""
import hashlib
import secrets
import json
import threading
import time
from datetime import datetime, timedelta
from typing import Dict, Optional, Set
import os
import sqlite3
from collections import OrderedDict
import logging

logger = logging.getLogger(__name__)

class SessionManager:
    """Thread-safe session manager with automatic cleanup"""

    def __init__(self, max_sessions: int = 10000, session_ttl: int = 86400):
        self.max_sessions = max_sessions
        self.session_ttl = session_ttl  # 24 hours default

        # Use OrderedDict for LRU cache behavior
        self.sessions = OrderedDict()

        # Thread safety
        self._lock = threading.RLock()

        # Cleanup thread
        self._cleanup_thread = None
        self._stop_cleanup = threading.Event()

        # Start automatic cleanup
        self._start_cleanup_thread()

    def _start_cleanup_thread(self):
        """Start background thread for session cleanup"""
        def cleanup_worker():
            while not self._stop_cleanup.is_set():
                try:
                    self.cleanup_expired_sessions()
                    # Run cleanup every 5 minutes
                    self._stop_cleanup.wait(300)
                except Exception as e:
                    logger.error(f"Session cleanup error: {e}")

        self._cleanup_thread = threading.Thread(target=cleanup_worker)
        self._cleanup_thread.daemon = True
        self._cleanup_thread.start()

    def create_session(self, user_id: str, user_data: Dict) -> str:
        """Create a new session with automatic expiry"""
        with self._lock:
            # Generate secure token
            token = secrets.token_urlsafe(32)

            # Enforce max sessions limit (LRU eviction)
            if len(self.sessions) >= self.max_sessions:
                # Remove oldest session
                self.sessions.popitem(last=False)

            # Create session data
            self.sessions[token] = {
                'user_id': user_id,
                'user_data': user_data,
                'created_at': time.time(),
                'last_accessed': time.time(),
                'expires_at': time.time() + self.session_ttl
            }

            # Move to end (most recently used)
            self.sessions.move_to_end(token)

            return token

    def get_session(self, token: str) -> Optional[Dict]:
        """Get session data if valid"""
        with self._lock:
            session = self.sessions.get(token)

            if not session:
                return None

            # Check expiration
            if time.time() > session['expires_at']:
                del self.sessions[token]
                return None

            # Update last accessed time
            session['last_accessed'] = time.time()

            # Move to end (most recently used)
            self.sessions.move_to_end(token)

            return session['user_data']

    def delete_session(self, token: str) -> bool:
        """Delete a session"""
        with self._lock:
            if token in self.sessions:
                del self.sessions[token]
                return True
            return False

    def cleanup_expired_sessions(self) -> int:
        """Remove expired sessions"""
        with self._lock:
            current_time = time.time()
            expired_tokens = []

            for token, session in self.sessions.items():
                if current_time > session['expires_at']:
                    expired_tokens.append(token)

            for token in expired_tokens:
                del self.sessions[token]

            if expired_tokens:
                logger.info(f"Cleaned up {len(expired_tokens)} expired sessions")

            return len(expired_tokens)

    def get_active_sessions_count(self) -> int:
        """Get count of active sessions"""
        with self._lock:
            return len(self.sessions)

    def extend_session(self, token: str, additional_seconds: int = 3600) -> bool:
        """Extend session expiration time"""
        with self._lock:
            if token in self.sessions:
                self.sessions[token]['expires_at'] += additional_seconds
                self.sessions.move_to_end(token)
                return True
            return False

    def stop_cleanup(self):
        """Stop the cleanup thread"""
        self._stop_cleanup.set()
        if self._cleanup_thread:
            self._cleanup_thread.join(timeout=1)


class OptimizedAuthManager:
    """Optimized authentication manager with SQLite backend and caching"""

    def __init__(self, db_path: str = "users.db"):
        self.db_path = db_path

        # Thread safety
        self._lock = threading.RLock()
        self._write_lock = threading.Lock()

        # Session manager
        self.session_manager = SessionManager()

        # User cache for frequently accessed users
        self._user_cache = OrderedDict()
        self._cache_max_size = 100
        self._cache_ttl = 300  # 5 minutes

        # Rate limiting for registration/login attempts
        self._attempt_tracker = {}
        self._max_attempts = 5
        self._lockout_duration = 300  # 5 minutes

        # Initialize database
        self._init_database()

    def _init_database(self):
        """Initialize SQLite database with optimized schema"""
        with sqlite3.connect(self.db_path) as conn:
            cursor = conn.cursor()

            # Enable WAL mode for better concurrency
            cursor.execute("PRAGMA journal_mode=WAL")

            # Create users table
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS users (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    user_id TEXT UNIQUE NOT NULL,
                    email TEXT UNIQUE NOT NULL,
                    username TEXT UNIQUE NOT NULL,
                    password_hash TEXT NOT NULL,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    profile_json TEXT,
                    stats_json TEXT,
                    is_active BOOLEAN DEFAULT 1
                )
            """)

            # Create indexes for fast lookups
            cursor.execute("""
                CREATE INDEX IF NOT EXISTS idx_users_email
                ON users(email)
            """)
            cursor.execute("""
                CREATE INDEX IF NOT EXISTS idx_users_username
                ON users(username)
            """)
            cursor.execute("""
                CREATE INDEX IF NOT EXISTS idx_users_user_id
                ON users(user_id)
            """)

            # Create login attempts table for security
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS login_attempts (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    email TEXT NOT NULL,
                    ip_address TEXT,
                    attempt_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    success BOOLEAN DEFAULT 0
                )
            """)

            # Index for login attempts
            cursor.execute("""
                CREATE INDEX IF NOT EXISTS idx_login_attempts_email
                ON login_attempts(email, attempt_time DESC)
            """)

            conn.commit()

    def _hash_password(self, password: str, salt: Optional[str] = None) -> str:
        """Hash password with salt"""
        if not salt:
            salt = secrets.token_hex(16)

        # Use PBKDF2 for better security than simple SHA256
        key = hashlib.pbkdf2_hmac(
            'sha256',
            password.encode(),
            salt.encode(),
            100000  # iterations
        )

        return f"{salt}${key.hex()}"

    def _verify_password(self, password: str, password_hash: str) -> bool:
        """Verify password against hash"""
        try:
            salt, _ = password_hash.split('$', 1)
            return self._hash_password(password, salt) == password_hash
        except:
            return False

    def _check_rate_limit(self, identifier: str) -> Tuple[bool, str]:
        """Check if identifier is rate limited"""
        current_time = time.time()

        with self._lock:
            if identifier in self._attempt_tracker:
                attempts = self._attempt_tracker[identifier]

                # Clean old attempts
                attempts = [t for t in attempts if current_time - t < self._lockout_duration]
                self._attempt_tracker[identifier] = attempts

                if len(attempts) >= self._max_attempts:
                    wait_time = int(self._lockout_duration - (current_time - attempts[0]))
                    return False, f"Too many attempts. Try again in {wait_time} seconds"

            return True, ""

    def _record_attempt(self, identifier: str):
        """Record a login/registration attempt"""
        with self._lock:
            if identifier not in self._attempt_tracker:
                self._attempt_tracker[identifier] = []

            self._attempt_tracker[identifier].append(time.time())

    def register(self, email: str, username: str, password: str) -> Dict:
        """
        Register a new user with thread safety and validation

        Returns:
            Result dictionary with success status
        """
        # Rate limiting check
        can_proceed, error = self._check_rate_limit(email)
        if not can_proceed:
            return {"success": False, "error": error}

        # Validation
        if not email or '@' not in email or len(email) > 255:
            return {"success": False, "error": "Invalid email format"}

        if not username or len(username) < 3 or len(username) > 50:
            return {"success": False, "error": "Username must be 3-50 characters"}

        if len(password) < 8:
            return {"success": False, "error": "Password must be at least 8 characters"}

        # Thread-safe registration
        with self._write_lock:
            try:
                with sqlite3.connect(self.db_path) as conn:
                    cursor = conn.cursor()

                    # Check if email/username exists
                    cursor.execute("""
                        SELECT COUNT(*) FROM users
                        WHERE email = ? OR username = ?
                    """, (email, username))

                    if cursor.fetchone()[0] > 0:
                        self._record_attempt(email)
                        return {"success": False, "error": "Email or username already exists"}

                    # Generate user ID
                    user_id = f"user_{int(time.time())}_{secrets.token_hex(4)}"

                    # Hash password
                    password_hash = self._hash_password(password)

                    # Default profile
                    profile = {
                        "nickname": username,
                        "bio": "",
                        "cooking_level": "beginner",
                        "dietary_preferences": [],
                        "allergies": [],
                        "favorite_cuisine": ["Korean"],
                        "household_size": 2
                    }

                    # Default stats
                    stats = {
                        "recipes_saved": 0,
                        "recipes_cooked": 0,
                        "total_time_saved": 0,
                        "money_saved": 0
                    }

                    # Insert user
                    cursor.execute("""
                        INSERT INTO users (user_id, email, username, password_hash,
                                         profile_json, stats_json)
                        VALUES (?, ?, ?, ?, ?, ?)
                    """, (
                        user_id, email, username, password_hash,
                        json.dumps(profile), json.dumps(stats)
                    ))

                    conn.commit()

                    return {
                        "success": True,
                        "user_id": user_id,
                        "message": "Registration successful"
                    }

            except Exception as e:
                logger.error(f"Registration error: {e}")
                return {"success": False, "error": "Registration failed"}

    def login(self, email: str, password: str, ip_address: Optional[str] = None) -> Dict:
        """
        Login user with rate limiting

        Returns:
            Result dictionary with session token
        """
        # Rate limiting check
        can_proceed, error = self._check_rate_limit(email)
        if not can_proceed:
            return {"success": False, "error": error}

        try:
            with sqlite3.connect(self.db_path) as conn:
                conn.row_factory = sqlite3.Row
                cursor = conn.cursor()

                # Get user
                cursor.execute("""
                    SELECT * FROM users
                    WHERE email = ? AND is_active = 1
                """, (email,))

                user_row = cursor.fetchone()

                if not user_row:
                    self._record_attempt(email)
                    self._log_login_attempt(email, ip_address, False)
                    return {"success": False, "error": "Invalid credentials"}

                user = dict(user_row)

                # Verify password
                if not self._verify_password(password, user['password_hash']):
                    self._record_attempt(email)
                    self._log_login_attempt(email, ip_address, False)
                    return {"success": False, "error": "Invalid credentials"}

                # Log successful attempt
                self._log_login_attempt(email, ip_address, True)

                # Parse profile and stats
                profile = json.loads(user.get('profile_json', '{}'))
                stats = json.loads(user.get('stats_json', '{}'))

                # Create session
                user_data = {
                    'id': user['user_id'],
                    'email': email,
                    'username': user['username'],
                    'profile': profile,
                    'stats': stats
                }

                token = self.session_manager.create_session(user['user_id'], user_data)

                # Cache user data
                self._cache_user(user['user_id'], user_data)

                return {
                    "success": True,
                    "token": token,
                    "user": user_data
                }

        except Exception as e:
            logger.error(f"Login error: {e}")
            return {"success": False, "error": "Login failed"}

    def _log_login_attempt(self, email: str, ip_address: Optional[str], success: bool):
        """Log login attempt for security monitoring"""
        try:
            with sqlite3.connect(self.db_path) as conn:
                cursor = conn.cursor()
                cursor.execute("""
                    INSERT INTO login_attempts (email, ip_address, success)
                    VALUES (?, ?, ?)
                """, (email, ip_address, success))
                conn.commit()
        except Exception as e:
            logger.error(f"Error logging login attempt: {e}")

    def logout(self, token: str) -> bool:
        """Logout user by removing session"""
        return self.session_manager.delete_session(token)

    def verify_session(self, token: str) -> Optional[Dict]:
        """Verify session token and return user data"""
        return self.session_manager.get_session(token)

    def _cache_user(self, user_id: str, user_data: Dict):
        """Cache user data for quick access"""
        with self._lock:
            # Enforce cache size limit
            if len(self._user_cache) >= self._cache_max_size:
                # Remove oldest entry
                self._user_cache.popitem(last=False)

            self._user_cache[user_id] = {
                'data': user_data,
                'cached_at': time.time()
            }

            # Move to end
            self._user_cache.move_to_end(user_id)

    def get_user_by_id(self, user_id: str) -> Optional[Dict]:
        """Get user by ID with caching"""
        # Check cache first
        with self._lock:
            if user_id in self._user_cache:
                cached = self._user_cache[user_id]

                # Check if cache is still valid
                if time.time() - cached['cached_at'] < self._cache_ttl:
                    # Move to end (LRU)
                    self._user_cache.move_to_end(user_id)
                    return cached['data']

        # Load from database
        try:
            with sqlite3.connect(self.db_path) as conn:
                conn.row_factory = sqlite3.Row
                cursor = conn.cursor()

                cursor.execute("""
                    SELECT * FROM users
                    WHERE user_id = ? AND is_active = 1
                """, (user_id,))

                user_row = cursor.fetchone()

                if user_row:
                    user = dict(user_row)
                    user_data = {
                        'id': user['user_id'],
                        'email': user['email'],
                        'username': user['username'],
                        'profile': json.loads(user.get('profile_json', '{}')),
                        'stats': json.loads(user.get('stats_json', '{}'))
                    }

                    # Cache the result
                    self._cache_user(user_id, user_data)

                    return user_data

        except Exception as e:
            logger.error(f"Error getting user: {e}")

        return None

    def update_profile(self, user_id: str, profile_data: Dict) -> bool:
        """Update user profile"""
        with self._write_lock:
            try:
                with sqlite3.connect(self.db_path) as conn:
                    cursor = conn.cursor()

                    # Get current profile
                    cursor.execute("""
                        SELECT profile_json FROM users WHERE user_id = ?
                    """, (user_id,))

                    row = cursor.fetchone()
                    if not row:
                        return False

                    # Merge profile data
                    current_profile = json.loads(row[0])
                    current_profile.update(profile_data)

                    # Update database
                    cursor.execute("""
                        UPDATE users
                        SET profile_json = ?, updated_at = CURRENT_TIMESTAMP
                        WHERE user_id = ?
                    """, (json.dumps(current_profile), user_id))

                    conn.commit()

                    # Invalidate cache
                    with self._lock:
                        self._user_cache.pop(user_id, None)

                    return True

            except Exception as e:
                logger.error(f"Error updating profile: {e}")
                return False

    def cleanup_old_data(self, days: int = 30):
        """Clean up old login attempts and inactive users"""
        try:
            with sqlite3.connect(self.db_path) as conn:
                cursor = conn.cursor()

                # Clean old login attempts
                cursor.execute("""
                    DELETE FROM login_attempts
                    WHERE attempt_time < datetime('now', '-{} days')
                """.format(days))

                conn.commit()

                logger.info(f"Cleaned up old login attempts")

        except Exception as e:
            logger.error(f"Cleanup error: {e}")

    def get_stats(self) -> Dict:
        """Get authentication system stats"""
        stats = {
            'active_sessions': self.session_manager.get_active_sessions_count(),
            'cached_users': len(self._user_cache),
            'rate_limited_identifiers': len(self._attempt_tracker)
        }

        try:
            with sqlite3.connect(self.db_path) as conn:
                cursor = conn.cursor()

                cursor.execute("SELECT COUNT(*) FROM users WHERE is_active = 1")
                stats['total_users'] = cursor.fetchone()[0]

                cursor.execute("""
                    SELECT COUNT(*) FROM login_attempts
                    WHERE attempt_time > datetime('now', '-1 hour')
                """)
                stats['recent_login_attempts'] = cursor.fetchone()[0]

        except:
            pass

        return stats

    def close(self):
        """Clean shutdown"""
        self.session_manager.stop_cleanup()

    def __del__(self):
        """Cleanup on deletion"""
        try:
            self.close()
        except:
            pass