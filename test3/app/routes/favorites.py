"""
favorites.py — Add, remove, and list a user's favorite companies/stocks.
"""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional

from app.database import get_db
from app.models import Favorite
from app.auth_utils import get_current_user_id

router = APIRouter(prefix="/favorites", tags=["favorites"])


class FavoriteIn(BaseModel):
    ticker: str
    name:   Optional[str] = None
    sector: Optional[str] = None


@router.get("/")
def list_favorites(
    user_id: int = Depends(get_current_user_id),
    db: Session = Depends(get_db)
):
    return db.query(Favorite).filter(Favorite.user_id == user_id)\
             .order_by(Favorite.added_at.desc()).all()


@router.post("/", status_code=201)
def add_favorite(
    body: FavoriteIn,
    user_id: int = Depends(get_current_user_id),
    db: Session = Depends(get_db)
):
    existing = db.query(Favorite).filter(
        Favorite.user_id == user_id,
        Favorite.ticker  == body.ticker.upper()
    ).first()
    if existing:
        raise HTTPException(status_code=400, detail="Already in favorites")

    fav = Favorite(
        user_id=user_id,
        ticker=body.ticker.upper(),
        name=body.name,
        sector=body.sector,
    )
    db.add(fav)
    db.commit()
    db.refresh(fav)
    return fav


@router.delete("/{ticker}", status_code=204)
def remove_favorite(
    ticker: str,
    user_id: int = Depends(get_current_user_id),
    db: Session = Depends(get_db)
):
    fav = db.query(Favorite).filter(
        Favorite.user_id == user_id,
        Favorite.ticker  == ticker.upper()
    ).first()
    if not fav:
        raise HTTPException(status_code=404, detail="Not in favorites")
    db.delete(fav)
    db.commit()


@router.get("/tickers")
def list_favorite_tickers(
    user_id: int = Depends(get_current_user_id),
    db: Session = Depends(get_db)
):
    """Return just the list of ticker strings for quick lookup."""
    rows = db.query(Favorite.ticker).filter(Favorite.user_id == user_id).all()
    return [r[0] for r in rows]
