"""
Optimized database management with connection pooling and performance improvements
"""
import sqlite3
import json
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Any
import os
import threading
from queue import Queue
import time
from contextlib import contextmanager
import logging

logger = logging.getLogger(__name__)

class ConnectionPool:
    """Thread-safe SQLite connection pool"""

    def __init__(self, db_path: str, max_connections: int = 10):
        self.db_path = db_path
        self.max_connections = max_connections
        self._pool = Queue(maxsize=max_connections)
        self._lock = threading.Lock()
        self._created_connections = 0

        # Pre-create minimum connections
        for _ in range(min(3, max_connections)):
            self._create_connection()

    def _create_connection(self) -> sqlite3.Connection:
        """Create a new database connection with optimizations"""
        conn = sqlite3.connect(self.db_path, check_same_thread=False)

        # Enable WAL mode for better concurrency
        conn.execute("PRAGMA journal_mode=WAL")

        # Optimize for performance
        conn.execute("PRAGMA synchronous=NORMAL")
        conn.execute("PRAGMA cache_size=10000")
        conn.execute("PRAGMA temp_store=MEMORY")
        conn.execute("PRAGMA mmap_size=30000000000")

        # Enable foreign keys
        conn.execute("PRAGMA foreign_keys=ON")

        self._created_connections += 1
        return conn

    @contextmanager
    def get_connection(self, timeout: float = 5.0):
        """Get a connection from the pool"""
        connection = None
        try:
            # Try to get existing connection
            if not self._pool.empty():
                connection = self._pool.get(timeout=timeout)
            else:
                # Create new connection if under limit
                with self._lock:
                    if self._created_connections < self.max_connections:
                        connection = self._create_connection()
                    else:
                        connection = self._pool.get(timeout=timeout)

            yield connection

        finally:
            # Return connection to pool
            if connection:
                try:
                    # Test connection is still valid
                    connection.execute("SELECT 1")
                    self._pool.put(connection)
                except:
                    # Connection is broken, create new one
                    try:
                        connection.close()
                    except:
                        pass
                    with self._lock:
                        self._created_connections -= 1

    def close_all(self):
        """Close all connections in the pool"""
        while not self._pool.empty():
            try:
                conn = self._pool.get_nowait()
                conn.close()
            except:
                pass
        self._created_connections = 0


class OptimizedRecipeDatabase:
    """Optimized SQLite database manager with connection pooling and caching"""

    # Cache configuration
    _cache = {}
    _cache_timestamps = {}
    _cache_ttl = 300  # 5 minutes

    def __init__(self, db_path: str = "recipes.db", pool_size: int = 10):
        self.db_path = db_path
        self.pool = ConnectionPool(db_path, pool_size)
        self._init_lock = threading.Lock()
        self._write_lock = threading.Lock()
        self.init_database()

    def init_database(self):
        """Initialize database with required tables and indexes"""
        with self._init_lock:
            with self.pool.get_connection() as conn:
                cursor = conn.cursor()

                # Create recipes table with optimized schema
                cursor.execute("""
                    CREATE TABLE IF NOT EXISTS recipes (
                        id INTEGER PRIMARY KEY AUTOINCREMENT,
                        name TEXT NOT NULL,
                        difficulty TEXT,
                        cooking_time INTEGER,
                        servings INTEGER,
                        calories INTEGER,
                        cuisine TEXT,
                        match_score REAL,
                        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                        raw_data TEXT
                    )
                """)

                # Create indexes for frequently queried columns
                cursor.execute("""
                    CREATE INDEX IF NOT EXISTS idx_recipes_cuisine
                    ON recipes(cuisine)
                """)
                cursor.execute("""
                    CREATE INDEX IF NOT EXISTS idx_recipes_difficulty
                    ON recipes(difficulty)
                """)
                cursor.execute("""
                    CREATE INDEX IF NOT EXISTS idx_recipes_cooking_time
                    ON recipes(cooking_time)
                """)
                cursor.execute("""
                    CREATE INDEX IF NOT EXISTS idx_recipes_match_score
                    ON recipes(match_score DESC)
                """)
                cursor.execute("""
                    CREATE INDEX IF NOT EXISTS idx_recipes_created_at
                    ON recipes(created_at DESC)
                """)

                # Create ingredients table
                cursor.execute("""
                    CREATE TABLE IF NOT EXISTS ingredients (
                        id INTEGER PRIMARY KEY AUTOINCREMENT,
                        name TEXT UNIQUE NOT NULL,
                        category TEXT,
                        name_kr TEXT
                    )
                """)

                # Index for ingredient lookups
                cursor.execute("""
                    CREATE INDEX IF NOT EXISTS idx_ingredients_name
                    ON ingredients(name)
                """)
                cursor.execute("""
                    CREATE INDEX IF NOT EXISTS idx_ingredients_category
                    ON ingredients(category)
                """)

                # Create recipe_ingredients table
                cursor.execute("""
                    CREATE TABLE IF NOT EXISTS recipe_ingredients (
                        id INTEGER PRIMARY KEY AUTOINCREMENT,
                        recipe_id INTEGER,
                        ingredient_id INTEGER,
                        amount TEXT,
                        FOREIGN KEY (recipe_id) REFERENCES recipes(id) ON DELETE CASCADE,
                        FOREIGN KEY (ingredient_id) REFERENCES ingredients(id)
                    )
                """)

                # Composite index for recipe ingredient lookups
                cursor.execute("""
                    CREATE INDEX IF NOT EXISTS idx_recipe_ingredients_recipe_id
                    ON recipe_ingredients(recipe_id)
                """)
                cursor.execute("""
                    CREATE INDEX IF NOT EXISTS idx_recipe_ingredients_ingredient_id
                    ON recipe_ingredients(ingredient_id)
                """)

                # Create cooking_steps table
                cursor.execute("""
                    CREATE TABLE IF NOT EXISTS cooking_steps (
                        id INTEGER PRIMARY KEY AUTOINCREMENT,
                        recipe_id INTEGER,
                        step_number INTEGER,
                        description TEXT,
                        FOREIGN KEY (recipe_id) REFERENCES recipes(id) ON DELETE CASCADE
                    )
                """)

                # Index for step lookups
                cursor.execute("""
                    CREATE INDEX IF NOT EXISTS idx_cooking_steps_recipe_id
                    ON cooking_steps(recipe_id, step_number)
                """)

                # Create user_sessions table with expiry
                cursor.execute("""
                    CREATE TABLE IF NOT EXISTS user_sessions (
                        id INTEGER PRIMARY KEY AUTOINCREMENT,
                        session_id TEXT UNIQUE,
                        recognized_ingredients TEXT,
                        generated_recipes TEXT,
                        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                        expires_at TIMESTAMP
                    )
                """)

                # Indexes for session management
                cursor.execute("""
                    CREATE INDEX IF NOT EXISTS idx_user_sessions_session_id
                    ON user_sessions(session_id)
                """)
                cursor.execute("""
                    CREATE INDEX IF NOT EXISTS idx_user_sessions_expires_at
                    ON user_sessions(expires_at)
                """)
                cursor.execute("""
                    CREATE INDEX IF NOT EXISTS idx_user_sessions_created_at
                    ON user_sessions(created_at DESC)
                """)

                conn.commit()

    def _invalidate_cache(self, cache_key: Optional[str] = None):
        """Invalidate cache entries"""
        if cache_key:
            self._cache.pop(cache_key, None)
            self._cache_timestamps.pop(cache_key, None)
        else:
            self._cache.clear()
            self._cache_timestamps.clear()

    def _get_from_cache(self, cache_key: str) -> Optional[Any]:
        """Get value from cache if valid"""
        if cache_key in self._cache:
            timestamp = self._cache_timestamps.get(cache_key, 0)
            if time.time() - timestamp < self._cache_ttl:
                return self._cache[cache_key]
            else:
                # Expired, remove from cache
                self._cache.pop(cache_key, None)
                self._cache_timestamps.pop(cache_key, None)
        return None

    def _set_cache(self, cache_key: str, value: Any):
        """Set cache value"""
        self._cache[cache_key] = value
        self._cache_timestamps[cache_key] = time.time()

    def save_recipe_batch(self, recipes: List[Dict]) -> List[int]:
        """Save multiple recipes in a single transaction"""
        recipe_ids = []

        with self._write_lock:
            with self.pool.get_connection() as conn:
                cursor = conn.cursor()

                try:
                    for recipe_data in recipes:
                        # Insert recipe
                        cursor.execute("""
                            INSERT INTO recipes (name, difficulty, cooking_time, servings,
                                                calories, cuisine, match_score, raw_data)
                            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                        """, (
                            recipe_data.get('name'),
                            recipe_data.get('difficulty'),
                            recipe_data.get('time'),
                            recipe_data.get('servings'),
                            recipe_data.get('calories'),
                            recipe_data.get('cuisine', '한식'),
                            recipe_data.get('match_score', 0),
                            json.dumps(recipe_data, ensure_ascii=False)
                        ))

                        recipe_id = cursor.lastrowid
                        recipe_ids.append(recipe_id)

                        # Batch insert ingredients
                        ingredients_data = []
                        for ing in recipe_data.get('ingredients', []):
                            cursor.execute("""
                                INSERT OR IGNORE INTO ingredients (name, category)
                                VALUES (?, ?)
                            """, (ing['name'], ing.get('category', 'misc')))

                            cursor.execute("SELECT id FROM ingredients WHERE name = ?", (ing['name'],))
                            ing_id = cursor.fetchone()[0]

                            ingredients_data.append((recipe_id, ing_id, ing.get('amount', '')))

                        if ingredients_data:
                            cursor.executemany("""
                                INSERT INTO recipe_ingredients (recipe_id, ingredient_id, amount)
                                VALUES (?, ?, ?)
                            """, ingredients_data)

                        # Batch insert cooking steps
                        steps_data = [
                            (recipe_id, idx, step)
                            for idx, step in enumerate(recipe_data.get('steps', []), 1)
                        ]

                        if steps_data:
                            cursor.executemany("""
                                INSERT INTO cooking_steps (recipe_id, step_number, description)
                                VALUES (?, ?, ?)
                            """, steps_data)

                    conn.commit()
                    self._invalidate_cache()  # Clear cache after write

                except Exception as e:
                    conn.rollback()
                    logger.error(f"Error saving recipes batch: {e}")
                    return []

        return recipe_ids

    def save_recipe(self, recipe_data: Dict) -> int:
        """Save a single recipe"""
        result = self.save_recipe_batch([recipe_data])
        return result[0] if result else -1

    def get_recipes(self, filters: Optional[Dict] = None, limit: int = 100) -> List[Dict]:
        """Get recipes with caching and optimized queries"""
        # Generate cache key
        cache_key = f"recipes_{json.dumps(filters or {}, sort_keys=True)}_{limit}"

        # Check cache
        cached_result = self._get_from_cache(cache_key)
        if cached_result is not None:
            return cached_result

        with self.pool.get_connection() as conn:
            conn.row_factory = sqlite3.Row
            cursor = conn.cursor()

            # Build optimized query
            query_parts = ["SELECT * FROM recipes WHERE 1=1"]
            params = []

            if filters:
                if filters.get('cuisine'):
                    query_parts.append("AND cuisine = ?")
                    params.append(filters['cuisine'])

                if filters.get('difficulty'):
                    query_parts.append("AND difficulty = ?")
                    params.append(filters['difficulty'])

                if filters.get('max_time'):
                    query_parts.append("AND cooking_time <= ?")
                    params.append(filters['max_time'])

                if filters.get('min_score'):
                    query_parts.append("AND match_score >= ?")
                    params.append(filters['min_score'])

            query_parts.append("ORDER BY match_score DESC, created_at DESC")
            query_parts.append(f"LIMIT {limit}")

            query = " ".join(query_parts)
            cursor.execute(query, params)

            recipes = []
            for row in cursor.fetchall():
                recipe = dict(row)

                # Parse raw_data if available
                if recipe.get('raw_data'):
                    try:
                        recipe.update(json.loads(recipe['raw_data']))
                    except:
                        pass

                recipes.append(recipe)

            # Cache the result
            self._set_cache(cache_key, recipes)

            return recipes

    def get_recipe_by_id(self, recipe_id: int) -> Optional[Dict]:
        """Get a single recipe by ID with caching"""
        cache_key = f"recipe_{recipe_id}"

        # Check cache
        cached_result = self._get_from_cache(cache_key)
        if cached_result is not None:
            return cached_result

        with self.pool.get_connection() as conn:
            conn.row_factory = sqlite3.Row
            cursor = conn.cursor()

            # Use single query with JOINs for better performance
            cursor.execute("""
                SELECT
                    r.*,
                    GROUP_CONCAT(DISTINCT i.name || '::' || ri.amount) as ingredients_str,
                    GROUP_CONCAT(DISTINCT cs.step_number || '::' || cs.description) as steps_str
                FROM recipes r
                LEFT JOIN recipe_ingredients ri ON r.id = ri.recipe_id
                LEFT JOIN ingredients i ON ri.ingredient_id = i.id
                LEFT JOIN cooking_steps cs ON r.id = cs.recipe_id
                WHERE r.id = ?
                GROUP BY r.id
            """, (recipe_id,))

            row = cursor.fetchone()

            if row:
                recipe = dict(row)

                # Parse ingredients
                recipe['ingredients'] = []
                if recipe.get('ingredients_str'):
                    for item in recipe['ingredients_str'].split(','):
                        if '::' in item:
                            name, amount = item.split('::', 1)
                            recipe['ingredients'].append({'name': name, 'amount': amount})

                # Parse steps
                recipe['steps'] = []
                if recipe.get('steps_str'):
                    steps_list = []
                    for item in recipe['steps_str'].split(','):
                        if '::' in item:
                            num, desc = item.split('::', 1)
                            steps_list.append((int(num), desc))

                    # Sort by step number
                    steps_list.sort(key=lambda x: x[0])
                    recipe['steps'] = [desc for _, desc in steps_list]

                # Clean up temporary fields
                recipe.pop('ingredients_str', None)
                recipe.pop('steps_str', None)

                # Cache the result
                self._set_cache(cache_key, recipe)

                return recipe

            return None

    def cleanup_expired_sessions(self):
        """Clean up expired sessions automatically"""
        with self.pool.get_connection() as conn:
            cursor = conn.cursor()

            cursor.execute("""
                DELETE FROM user_sessions
                WHERE expires_at < datetime('now')
                OR created_at < datetime('now', '-7 days')
            """)

            deleted_count = cursor.rowcount
            conn.commit()

            if deleted_count > 0:
                logger.info(f"Cleaned up {deleted_count} expired sessions")

    def save_session(self, session_data: Dict) -> int:
        """Save a user session with automatic expiry"""
        with self.pool.get_connection() as conn:
            cursor = conn.cursor()

            # Set expiry time (24 hours from now)
            expires_at = (datetime.now() + timedelta(hours=24)).isoformat()

            cursor.execute("""
                INSERT INTO user_sessions (session_id, recognized_ingredients,
                                         generated_recipes, expires_at)
                VALUES (?, ?, ?, ?)
            """, (
                session_data.get('session_id'),
                json.dumps(session_data.get('ingredients', {}), ensure_ascii=False),
                json.dumps(session_data.get('recipes', []), ensure_ascii=False),
                expires_at
            ))

            session_id = cursor.lastrowid
            conn.commit()

            return session_id

    def get_popular_ingredients(self, limit: int = 20) -> List[Dict]:
        """Get most commonly used ingredients with caching"""
        cache_key = f"popular_ingredients_{limit}"

        # Check cache
        cached_result = self._get_from_cache(cache_key)
        if cached_result is not None:
            return cached_result

        with self.pool.get_connection() as conn:
            cursor = conn.cursor()

            cursor.execute("""
                SELECT i.name, i.category, COUNT(ri.id) as usage_count
                FROM ingredients i
                JOIN recipe_ingredients ri ON i.id = ri.ingredient_id
                GROUP BY i.id
                ORDER BY usage_count DESC
                LIMIT ?
            """, (limit,))

            ingredients = [
                {'name': row[0], 'category': row[1], 'usage_count': row[2]}
                for row in cursor.fetchall()
            ]

            # Cache for longer as this data changes slowly
            self._set_cache(cache_key, ingredients)

            return ingredients

    def close(self):
        """Close all database connections"""
        self.pool.close_all()

    def __del__(self):
        """Cleanup on deletion"""
        try:
            self.close()
        except:
            pass