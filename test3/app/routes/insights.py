"""
insights.py — Fetch, store, list, and delete insights.
"""
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import Insight
from app.schemas import InsightOut, FetchRequest
from app.services.rss_fetcher import fetch_by_sector, fetch_all_sectors
from app.services.summarizer import summarize
from app.config import SECTOR_FEEDS

router = APIRouter(prefix="/insights", tags=["insights"])


@router.get("/sectors")
def list_sectors():
    """Return all available sector names."""
    return list(SECTOR_FEEDS.keys())


@router.get("/", response_model=list[InsightOut])
def list_insights(
    sector: Optional[str] = None,
    skip: int = 0,
    limit: int = 200,
    db: Session = Depends(get_db)
):
    """List stored insights. Optionally filter by sector."""
    q = db.query(Insight).order_by(Insight.fetched_at.desc())
    if sector and sector != "All":
        q = q.filter(Insight.sector == sector)
    return q.offset(skip).limit(limit).all()


@router.post("/fetch-all", response_model=dict)
def fetch_all_background(db: Session = Depends(get_db)):
    """
    Fetch articles from ALL sectors at once (called on first page load).
    Returns counts per sector so the frontend can show progress.
    """
    articles = fetch_all_sectors()
    counts   = {}
    for article in articles:
        if db.query(Insight).filter(Insight.url == article["url"]).first():
            continue
        summary_text = summarize(title=article["title"], content=article["content"])
        insight = Insight(
            title=article["title"], source=article["source"],
            sector=article["sector"], url=article["url"],
            summary=summary_text, published=article["published"],
        )
        db.add(insight)
        counts[article["sector"]] = counts.get(article["sector"], 0) + 1
    db.commit()
    return {"added": counts, "total": sum(counts.values())}


@router.post("/fetch", response_model=list[InsightOut])
def fetch_and_store(body: FetchRequest = FetchRequest(), db: Session = Depends(get_db)):
    """
    Pull articles from RSS feeds, summarise with OpenAI, store new ones.
    Pass sector='Tech' to fetch only that sector, or omit for all.
    """
    if body.sector and body.sector != "All":
        articles = fetch_by_sector(body.sector)
    else:
        articles = fetch_all_sectors()

    if not articles:
        raise HTTPException(status_code=502, detail="Could not fetch any articles")

    new_insights = []
    for article in articles:
        if db.query(Insight).filter(Insight.url == article["url"]).first():
            continue

        summary_text = summarize(title=article["title"], content=article["content"])

        insight = Insight(
            title=article["title"],
            source=article["source"],
            sector=article["sector"],
            url=article["url"],
            summary=summary_text,
            published=article["published"],
        )
        db.add(insight)
        new_insights.append(insight)

    db.commit()
    for ins in new_insights:
        db.refresh(ins)

    return new_insights


@router.delete("/{insight_id}", status_code=204)
def delete_insight(insight_id: int, db: Session = Depends(get_db)):
    insight = db.query(Insight).filter(Insight.id == insight_id).first()
    if not insight:
        raise HTTPException(status_code=404, detail="Insight not found")
    db.delete(insight)
    db.commit()
