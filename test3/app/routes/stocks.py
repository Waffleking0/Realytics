"""
stocks.py — Real-time stock data via yfinance (Yahoo Finance).
No API key required.
"""
from typing import Optional
from fastapi import APIRouter, HTTPException, Query
import yfinance as yf

from app.config import SECTOR_STOCKS

router = APIRouter(prefix="/stocks", tags=["stocks"])


def _fmt_large(n) -> str:
    """Format large numbers: 3.71T, 94.5B, 1.2M, etc."""
    if n is None:
        return "N/A"
    n = float(n)
    if n >= 1e12:  return f"${n/1e12:.2f}T"
    if n >= 1e9:   return f"${n/1e9:.2f}B"
    if n >= 1e6:   return f"${n/1e6:.2f}M"
    return f"${n:,.0f}"


def _build_stock_card(ticker_str: str) -> dict:
    """Fetch all data for one ticker and return a structured dict."""
    try:
        t = yf.Ticker(ticker_str.upper())
        info = t.info

        # Price & change
        price    = info.get("currentPrice") or info.get("regularMarketPrice")
        prev     = info.get("previousClose") or info.get("regularMarketPreviousClose")
        change   = round(price - prev, 2)         if price and prev else None
        change_p = round((change / prev) * 100, 2) if change and prev else None

        # News (max 6 items)
        news = []
        try:
            raw_news = t.news or []
            for n in raw_news[:6]:
                content = n.get("content", {})
                title   = content.get("title") or n.get("title", "")
                url     = content.get("canonicalUrl", {}).get("url") or n.get("link", "")
                provider = content.get("provider", {}).get("displayName") or n.get("publisher", "")
                if title and url:
                    news.append({"title": title, "url": url, "provider": provider})
        except Exception:
            pass

        return {
            "ticker":        ticker_str.upper(),
            "name":          info.get("shortName") or info.get("longName", ticker_str),
            "sector":        info.get("sector", "N/A"),
            "industry":      info.get("industry", "N/A"),
            "price":         price,
            "change":        change,
            "change_pct":    change_p,
            "market_cap":    _fmt_large(info.get("marketCap")),
            "pe_ratio":      round(info.get("trailingPE"), 2) if info.get("trailingPE") else "N/A",
            "forward_pe":    round(info.get("forwardPE"), 2)  if info.get("forwardPE")  else "N/A",
            "eps":           info.get("trailingEps", "N/A"),
            "revenue":       _fmt_large(info.get("totalRevenue")),
            "gross_margin":  f"{round(info.get('grossMargins',0)*100,1)}%" if info.get("grossMargins") else "N/A",
            "dividend_yield":f"{round(info.get('dividendYield',0)*100,2)}%" if info.get("dividendYield") else "N/A",
            "beta":          round(info.get("beta"), 2) if info.get("beta") else "N/A",
            "week_52_high":  info.get("fiftyTwoWeekHigh", "N/A"),
            "week_52_low":   info.get("fiftyTwoWeekLow",  "N/A"),
            "avg_volume":    f"{info.get('averageVolume', 0):,}" if info.get("averageVolume") else "N/A",
            "description":   info.get("longBusinessSummary", "No description available."),
            "website":       info.get("website", ""),
            "employees":     f"{info.get('fullTimeEmployees',0):,}" if info.get("fullTimeEmployees") else "N/A",
            "news":          news,
        }
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"Could not fetch data for {ticker_str}: {e}")


# ── Endpoints ─────────────────────────────────────────────────────────────────

@router.get("/quote/{ticker}")
def get_quote(ticker: str):
    """Full data for a single ticker (e.g. AAPL, TSLA, NVDA)."""
    return _build_stock_card(ticker)


@router.get("/sector/{sector_name}")
def get_sector_stocks(sector_name: str):
    """Return stock cards for all tickers in a given sector."""
    tickers = SECTOR_STOCKS.get(sector_name)
    if not tickers:
        raise HTTPException(status_code=404, detail=f"No stocks mapped for sector '{sector_name}'")

    results = []
    for t in tickers:
        try:
            results.append(_build_stock_card(t))
        except Exception:
            pass   # skip any that fail rather than crashing the whole request
    return results


@router.get("/search")
def search_ticker(q: str = Query(..., min_length=1)):
    """
    Search Yahoo Finance for tickers matching the query.
    Returns up to 8 suggestions.
    """
    try:
        results = yf.Search(q, max_results=8)
        quotes  = results.quotes or []
        return [
            {
                "ticker":   item.get("symbol", ""),
                "name":     item.get("shortname") or item.get("longname", ""),
                "exchange": item.get("exchange", ""),
                "type":     item.get("quoteType", ""),
            }
            for item in quotes
            if item.get("symbol")
        ]
    except Exception as e:
        raise HTTPException(status_code=502, detail=str(e))


@router.get("/sectors")
def list_stock_sectors():
    """Return all sectors that have mapped stock tickers."""
    return list(SECTOR_STOCKS.keys())
