"""
schemas.py — Pydantic request/response models
"""
from datetime import datetime
from typing import Optional
from pydantic import BaseModel


# ── Auth ─────────────────────────────────────────────────────────────────────

class UserCreate(BaseModel):
    email: str
    username: str
    password: str

class UserOut(BaseModel):
    id: int
    email: str
    username: str
    is_active: bool
    created_at: datetime
    model_config = {"from_attributes": True}

class Token(BaseModel):
    access_token: str
    token_type: str

class LoginRequest(BaseModel):
    username: str
    password: str


# ── Insights ──────────────────────────────────────────────────────────────────

class InsightOut(BaseModel):
    id: int
    title: str
    source: str
    sector: str
    url: str
    summary: Optional[str]
    published: Optional[str]
    fetched_at: datetime
    model_config = {"from_attributes": True}

class FetchRequest(BaseModel):
    sector: Optional[str] = None   # None = fetch all sectors
