"""SQLite database connection and session management.

Performance optimizations:
- Connection pooling with QueuePool
- WAL mode for better concurrency
- Optimized SQLite pragmas
- Singleton engine pattern
"""
from pathlib import Path
from contextlib import contextmanager
from threading import Lock

from sqlalchemy import create_engine, event
from sqlalchemy.orm import sessionmaker, Session
from sqlalchemy.pool import QueuePool

# Database file path
DB_PATH = Path(__file__).parent.parent / "fridge_chef.db"
DATABASE_URL = f"sqlite:///{DB_PATH}"

# Thread-safe singleton for engine
_engine_lock = Lock()
_engine = None


def _configure_sqlite_pragmas(dbapi_connection, connection_record):
    """Configure SQLite pragmas for better performance."""
    cursor = dbapi_connection.cursor()
    # WAL mode for better concurrency
    cursor.execute("PRAGMA journal_mode=WAL")
    # Synchronous NORMAL for balanced safety/speed
    cursor.execute("PRAGMA synchronous=NORMAL")
    # Larger cache for better read performance
    cursor.execute("PRAGMA cache_size=10000")
    # Memory-mapped I/O (256MB)
    cursor.execute("PRAGMA mmap_size=268435456")
    # Temp store in memory
    cursor.execute("PRAGMA temp_store=MEMORY")
    cursor.close()


def get_engine():
    """Get or create the database engine (singleton pattern)."""
    global _engine
    if _engine is None:
        with _engine_lock:
            if _engine is None:
                _engine = create_engine(
                    DATABASE_URL,
                    connect_args={"check_same_thread": False},
                    echo=False,
                    poolclass=QueuePool,
                    pool_size=5,
                    max_overflow=10,
                    pool_timeout=30,
                    pool_pre_ping=True,  # Check connection health
                )
                # Register pragma configuration
                event.listen(_engine, "connect", _configure_sqlite_pragmas)
    return _engine


# Engine reference for backward compatibility
engine = get_engine()

# Session factory with optimized settings
SessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=engine,
    expire_on_commit=False,  # Don't expire objects after commit for reuse
)


def get_session() -> Session:
    """Get a new database session."""
    return SessionLocal()


@contextmanager
def get_db():
    """Context manager for database sessions.

    Usage:
        with get_db() as session:
            # Use session
            pass
    """
    session = SessionLocal()
    try:
        yield session
        session.commit()
    except Exception:
        session.rollback()
        raise
    finally:
        session.close()


def close_all_connections():
    """Close all database connections (for cleanup)."""
    global _engine
    if _engine is not None:
        _engine.dispose()
        _engine = None
