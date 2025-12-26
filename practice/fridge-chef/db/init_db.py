"""Database initialization script."""
from db.database import engine
from db.models import Base


def init_database() -> None:
    """Create all database tables."""
    Base.metadata.create_all(bind=engine)
    print("Database initialized successfully!")


def drop_database() -> None:
    """Drop all database tables."""
    Base.metadata.drop_all(bind=engine)
    print("Database tables dropped!")


if __name__ == "__main__":
    init_database()
