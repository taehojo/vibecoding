"""Database initialization script.

Performance optimization:
- Uses singleton pattern to avoid repeated initialization
- Thread-safe initialization
"""
from threading import Lock

from db.database import engine
from db.models import Base

# Thread-safe singleton for initialization
_init_lock = Lock()
_initialized = False


def init_database() -> None:
    """Create all database tables (singleton - only runs once).

    This function is safe to call multiple times from different modules.
    The actual initialization only happens once.
    """
    global _initialized

    # Fast path - already initialized
    if _initialized:
        return

    # Thread-safe initialization
    with _init_lock:
        if not _initialized:
            Base.metadata.create_all(bind=engine)
            _initialized = True


def drop_database() -> None:
    """Drop all database tables."""
    global _initialized
    Base.metadata.drop_all(bind=engine)
    _initialized = False
    print("Database tables dropped!")


def is_initialized() -> bool:
    """Check if database has been initialized."""
    return _initialized


if __name__ == "__main__":
    init_database()
    print("Database initialized successfully!")
