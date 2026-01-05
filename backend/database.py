from sqlalchemy import create_engine, Column, Integer, String, Float, Text, Boolean, JSON
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
import os

# CHANGED LINE: PostgreSQL → SQLite
DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./botsuinsure.db")

engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()