"""
Database management for recipes and ingredients
"""
import sqlite3
import json
from datetime import datetime
from typing import Dict, List, Optional
import os

class RecipeDatabase:
    """SQLite database manager for recipes"""

    def __init__(self, db_path: str = "recipes.db"):
        self.db_path = db_path
        self.init_database()

    def init_database(self):
        """Initialize database with required tables"""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()

        # Create recipes table
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

        # Create ingredients table
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS ingredients (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT UNIQUE NOT NULL,
                category TEXT,
                name_kr TEXT
            )
        """)

        # Create recipe_ingredients table
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS recipe_ingredients (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                recipe_id INTEGER,
                ingredient_id INTEGER,
                amount TEXT,
                FOREIGN KEY (recipe_id) REFERENCES recipes(id),
                FOREIGN KEY (ingredient_id) REFERENCES ingredients(id)
            )
        """)

        # Create cooking_steps table
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS cooking_steps (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                recipe_id INTEGER,
                step_number INTEGER,
                description TEXT,
                FOREIGN KEY (recipe_id) REFERENCES recipes(id)
            )
        """)

        # Create user_sessions table for history
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS user_sessions (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                session_id TEXT,
                recognized_ingredients TEXT,
                generated_recipes TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)

        conn.commit()
        conn.close()

    def save_recipe(self, recipe_data: Dict) -> int:
        """
        Save a recipe to the database

        Args:
            recipe_data: Dictionary containing recipe information

        Returns:
            Recipe ID
        """
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()

        try:
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

            # Save ingredients
            for ing in recipe_data.get('ingredients', []):
                # First, add ingredient to ingredients table if not exists
                cursor.execute("""
                    INSERT OR IGNORE INTO ingredients (name, category)
                    VALUES (?, ?)
                """, (ing['name'], ing.get('category', 'misc')))

                # Get ingredient ID
                cursor.execute("SELECT id FROM ingredients WHERE name = ?", (ing['name'],))
                ing_id = cursor.fetchone()[0]

                # Link recipe and ingredient
                cursor.execute("""
                    INSERT INTO recipe_ingredients (recipe_id, ingredient_id, amount)
                    VALUES (?, ?, ?)
                """, (recipe_id, ing_id, ing.get('amount', '')))

            # Save cooking steps
            for idx, step in enumerate(recipe_data.get('steps', []), 1):
                cursor.execute("""
                    INSERT INTO cooking_steps (recipe_id, step_number, description)
                    VALUES (?, ?, ?)
                """, (recipe_id, idx, step))

            conn.commit()
            return recipe_id

        except Exception as e:
            conn.rollback()
            print(f"Error saving recipe: {e}")
            return -1

        finally:
            conn.close()

    def get_recipes(self, filters: Optional[Dict] = None) -> List[Dict]:
        """
        Get recipes from database with optional filters

        Args:
            filters: Optional filters (cuisine, difficulty, max_time, etc.)

        Returns:
            List of recipe dictionaries
        """
        conn = sqlite3.connect(self.db_path)
        conn.row_factory = sqlite3.Row
        cursor = conn.cursor()

        query = "SELECT * FROM recipes WHERE 1=1"
        params = []

        if filters:
            if filters.get('cuisine'):
                query += " AND cuisine = ?"
                params.append(filters['cuisine'])

            if filters.get('difficulty'):
                query += " AND difficulty = ?"
                params.append(filters['difficulty'])

            if filters.get('max_time'):
                query += " AND cooking_time <= ?"
                params.append(filters['max_time'])

            if filters.get('min_score'):
                query += " AND match_score >= ?"
                params.append(filters['min_score'])

        query += " ORDER BY match_score DESC, created_at DESC"

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

        conn.close()
        return recipes

    def get_recipe_by_id(self, recipe_id: int) -> Optional[Dict]:
        """Get a single recipe by ID"""
        conn = sqlite3.connect(self.db_path)
        conn.row_factory = sqlite3.Row
        cursor = conn.cursor()

        cursor.execute("SELECT * FROM recipes WHERE id = ?", (recipe_id,))
        row = cursor.fetchone()

        if row:
            recipe = dict(row)

            # Get ingredients
            cursor.execute("""
                SELECT i.name, ri.amount
                FROM recipe_ingredients ri
                JOIN ingredients i ON ri.ingredient_id = i.id
                WHERE ri.recipe_id = ?
            """, (recipe_id,))

            recipe['ingredients'] = [
                {'name': row[0], 'amount': row[1]}
                for row in cursor.fetchall()
            ]

            # Get steps
            cursor.execute("""
                SELECT description FROM cooking_steps
                WHERE recipe_id = ?
                ORDER BY step_number
            """, (recipe_id,))

            recipe['steps'] = [row[0] for row in cursor.fetchall()]

            conn.close()
            return recipe

        conn.close()
        return None

    def save_session(self, session_data: Dict) -> int:
        """Save a user session for history"""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()

        cursor.execute("""
            INSERT INTO user_sessions (session_id, recognized_ingredients, generated_recipes)
            VALUES (?, ?, ?)
        """, (
            session_data.get('session_id'),
            json.dumps(session_data.get('ingredients', {}), ensure_ascii=False),
            json.dumps(session_data.get('recipes', []), ensure_ascii=False)
        ))

        session_id = cursor.lastrowid
        conn.commit()
        conn.close()

        return session_id

    def get_recent_sessions(self, limit: int = 5) -> List[Dict]:
        """Get recent user sessions"""
        conn = sqlite3.connect(self.db_path)
        conn.row_factory = sqlite3.Row
        cursor = conn.cursor()

        cursor.execute("""
            SELECT * FROM user_sessions
            ORDER BY created_at DESC
            LIMIT ?
        """, (limit,))

        sessions = []
        for row in cursor.fetchall():
            session = dict(row)

            # Parse JSON fields
            try:
                session['ingredients'] = json.loads(session.get('recognized_ingredients', '{}'))
                session['recipes'] = json.loads(session.get('generated_recipes', '[]'))
            except:
                pass

            sessions.append(session)

        conn.close()
        return sessions

    def get_popular_ingredients(self, limit: int = 20) -> List[Dict]:
        """Get most commonly used ingredients"""
        conn = sqlite3.connect(self.db_path)
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

        conn.close()
        return ingredients

    def clear_old_sessions(self, days: int = 7):
        """Clear sessions older than specified days"""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()

        cursor.execute("""
            DELETE FROM user_sessions
            WHERE created_at < datetime('now', '-{} days')
        """.format(days))

        conn.commit()
        conn.close()