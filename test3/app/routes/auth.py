"""
auth.py — Signup, login, and JWT token endpoints.
Uses bcrypt directly (passlib is incompatible with Python 3.14).
"""
from datetime import datetime, timedelta
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from jose import jwt
import bcrypt

from app.database import get_db
from app.models import User
from app.schemas import UserCreate, UserOut, Token, LoginRequest
from app.config import SECRET_KEY, ACCESS_TOKEN_EXPIRE_MINUTES

router = APIRouter(prefix="/auth", tags=["auth"])

ALGORITHM = "HS256"


def _hash(password: str) -> str:
    return bcrypt.hashpw(password.encode(), bcrypt.gensalt()).decode()


def _verify(plain: str, hashed: str) -> bool:
    return bcrypt.checkpw(plain.encode(), hashed.encode())


def _create_token(data: dict) -> str:
    payload = data.copy()
    payload["exp"] = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    return jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)


# ── Routes ────────────────────────────────────────────────────────────────────

@router.post("/signup", response_model=UserOut, status_code=201)
def signup(body: UserCreate, db: Session = Depends(get_db)):
    """Register a new user. Email and username must be unique."""
    if db.query(User).filter(User.email == body.email).first():
        raise HTTPException(status_code=400, detail="Email already registered")
    if db.query(User).filter(User.username == body.username).first():
        raise HTTPException(status_code=400, detail="Username already taken")

    user = User(
        email=body.email,
        username=body.username,
        hashed_password=_hash(body.password),
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


@router.post("/login", response_model=Token)
def login(body: LoginRequest, db: Session = Depends(get_db)):
    """Authenticate and return a JWT bearer token."""
    user = db.query(User).filter(User.username == body.username).first()
    if not user or not _verify(body.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid username or password",
        )
    token = _create_token({"sub": str(user.id), "username": user.username})
    return {"access_token": token, "token_type": "bearer"}
