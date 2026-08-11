import os
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base

# Read the DB connection string from an environment variable.
# In docker-compose.yml we'll set this to point at the postgres container.
# Locally it defaults to localhost if nothing is set.
DATABASE_URL = os.getenv(
    "DATABASE_URL",
    "postgresql://postgres:postgres@localhost:5432/userdb"
)

# The engine is the actual connection pool to the database
engine = create_engine(DATABASE_URL)

# SessionLocal is a factory that creates new DB sessions (think: a "conversation" with the DB)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Base is what our model classes (in models.py) will inherit from
Base = declarative_base()


def get_db():
    """
    This is a FastAPI dependency. FastAPI calls this for every request
    that needs DB access, gives the route a session, then closes it
    automatically afterwards - even if the request fails.
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
