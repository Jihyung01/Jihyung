# script to run Alembic migrations
import sys
from sqlalchemy import create_engine
from sqlalchemy.engine import Engine
from models import db, User, Note, Task, Source, GraphEdge, UserPreference

def create_database_if_not_exists():
    """Create database tables if they don't exist."""
    from app import create_app
    
    app = create_app()
    with app.app_context():
        # Create all tables
        db.create_all()
        print("Database tables created successfully!")

if __name__ == "__main__":
    create_database_if_not_exists()