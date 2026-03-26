"""
auth_utils.py — JWT verification dependency used by protected routes.
"""
from fastapi import Header, HTTPException
from jose import jwt, JWTError
from app.config import SECRET_KEY

ALGORITHM = "HS256"


def get_current_user_id(authorization: str = Header(default=None)) -> int:
    """FastAPI dependency — extracts user_id from Bearer token."""
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Not authenticated")
    token = authorization.split(" ", 1)[1]
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        return int(payload["sub"])
    except (JWTError, KeyError, ValueError):
        raise HTTPException(status_code=401, detail="Invalid or expired token")
