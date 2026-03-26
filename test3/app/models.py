"""
models.py — ORM table definitions
"""
from datetime import datetime
from sqlalchemy import Column, Integer, String, Text, DateTime, Boolean, ForeignKey, UniqueConstraint
from app.database import Base


class User(Base):
    __tablename__ = "users"
    id               = Column(Integer, primary_key=True, index=True)
    email            = Column(String, unique=True, index=True, nullable=False)
    username         = Column(String, unique=True, index=True, nullable=False)
    hashed_password  = Column(String, nullable=False)
    is_active        = Column(Boolean, default=True)
    created_at       = Column(DateTime, default=datetime.utcnow)


class Insight(Base):
    __tablename__ = "insights"
    id         = Column(Integer, primary_key=True, index=True)
    title      = Column(String, nullable=False)
    source     = Column(String, nullable=False)
    sector     = Column(String, nullable=False, default="Tech", index=True)
    url        = Column(String, nullable=False, unique=True)
    summary    = Column(Text, nullable=True)
    published  = Column(String, nullable=True)
    fetched_at = Column(DateTime, default=datetime.utcnow)


class Favorite(Base):
    """A user's saved company/stock."""
    __tablename__ = "favorites"
    id         = Column(Integer, primary_key=True, index=True)
    user_id    = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    ticker     = Column(String, nullable=False)       # e.g. "AAPL"
    name       = Column(String, nullable=True)         # e.g. "Apple Inc."
    sector     = Column(String, nullable=True)         # e.g. "Tech"
    added_at   = Column(DateTime, default=datetime.utcnow)
    __table_args__ = (UniqueConstraint("user_id", "ticker", name="uq_user_ticker"),)
