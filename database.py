from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base

SQLAlCHEMY_DATABASE_URL = "sqlite:///./todo.db"  

# Create Engine
engine = create_engine(SQLAlCHEMY_DATABASE_URL, connect_args={"check_same_thread": False})

# Create Session
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()
