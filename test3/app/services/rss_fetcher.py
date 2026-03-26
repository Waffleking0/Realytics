"""
rss_fetcher.py — Fetches RSS feeds and filters to articles from the last 7 days,
sorted newest-first.
"""
import time
import requests
import feedparser
from datetime import datetime, timezone, timedelta
from app.config import SECTOR_FEEDS, ALL_FEEDS

HEADERS  = {"User-Agent": "Mozilla/5.0 MicroTrendTracker/1.0"}
TIMEOUT  = 12          # seconds per feed request
MAX_AGE  = 7           # days — only keep articles newer than this
MAX_ITEMS = 25         # articles to inspect per feed before date-filtering


def _parse_dt(entry) -> datetime | None:
    """Return a UTC-aware datetime from feedparser's published_parsed, or None."""
    t = getattr(entry, "published_parsed", None) or getattr(entry, "updated_parsed", None)
    if t is None:
        return None
    try:
        return datetime(*t[:6], tzinfo=timezone.utc)
    except Exception:
        return None


def _cutoff() -> datetime:
    return datetime.now(timezone.utc) - timedelta(days=MAX_AGE)


def fetch_feed(feed_name: str, feed_url: str, sector: str) -> list[dict]:
    """
    Parse one RSS feed.
    Returns articles published in the last 7 days, sorted newest-first.
    """
    try:
        resp   = requests.get(feed_url, headers=HEADERS, timeout=TIMEOUT)
        parsed = feedparser.parse(resp.text)
    except Exception:
        try:
            parsed = feedparser.parse(feed_url)
        except Exception:
            return []

    cutoff   = _cutoff()
    articles = []

    for entry in parsed.entries[:MAX_ITEMS]:
        url = entry.get("link", "").strip()
        if not url:
            continue

        pub_dt = _parse_dt(entry)

        # Skip articles older than 7 days (if we can parse the date)
        if pub_dt and pub_dt < cutoff:
            continue

        # Extract best available body text
        content = ""
        if hasattr(entry, "summary"):
            content = entry.summary
        elif hasattr(entry, "content"):
            content = entry.content[0].get("value", "")

        # Format the published date as a readable string
        pub_str = ""
        if pub_dt:
            pub_str = pub_dt.strftime("%Y-%m-%d %H:%M UTC")
        elif entry.get("published"):
            pub_str = entry.get("published", "")

        articles.append({
            "title":     entry.get("title", "No title").strip(),
            "url":       url,
            "content":   content,
            "published": pub_str,
            "pub_dt":    pub_dt,            # used for sorting, not stored in DB
            "source":    feed_name,
            "sector":    sector,
        })

    # Sort newest-first (articles with no date go to the end)
    articles.sort(key=lambda a: a["pub_dt"] or datetime.min.replace(tzinfo=timezone.utc), reverse=True)
    return articles


def fetch_by_sector(sector: str) -> list[dict]:
    feeds    = SECTOR_FEEDS.get(sector, [])
    articles = []
    for feed in feeds:
        articles.extend(fetch_feed(feed["name"], feed["url"], sector))
    # Re-sort the combined list newest-first
    articles.sort(key=lambda a: a["pub_dt"] or datetime.min.replace(tzinfo=timezone.utc), reverse=True)
    return articles


def fetch_all_sectors() -> list[dict]:
    articles = []
    for feed in ALL_FEEDS:
        articles.extend(fetch_feed(feed["name"], feed["url"], feed["sector"]))
    articles.sort(key=lambda a: a["pub_dt"] or datetime.min.replace(tzinfo=timezone.utc), reverse=True)
    return articles
