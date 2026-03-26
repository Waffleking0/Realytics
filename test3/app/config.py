"""
config.py — App-wide settings loaded from .env
"""
from dotenv import load_dotenv
import os

load_dotenv()

OPENAI_API_KEY: str = os.getenv("OPENAI_API_KEY", "")
SECRET_KEY: str = os.getenv("SECRET_KEY", "change-me-in-production")
ACCESS_TOKEN_EXPIRE_MINUTES: int = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "60"))
DATABASE_URL: str = os.getenv("DATABASE_URL", "sqlite:///./microtrend.db")

# RSS feeds organised by sector
SECTOR_FEEDS: dict[str, list[dict]] = {
    "Tech": [
        {"name": "TechCrunch",  "url": "https://techcrunch.com/feed/"},
        {"name": "Hacker News", "url": "https://news.ycombinator.com/rss"},
        {"name": "The Verge",   "url": "https://www.theverge.com/rss/index.xml"},
        {"name": "Wired",       "url": "https://www.wired.com/feed/rss"},
    ],
    "AI": [
        {"name": "VentureBeat AI", "url": "https://venturebeat.com/category/ai/feed/"},
        {"name": "MIT AI News",    "url": "https://news.mit.edu/rss/topic/artificial-intelligence2"},
        {"name": "The Batch",      "url": "https://www.deeplearning.ai/the-batch/feed/"},
    ],
    "Finance": [
        {"name": "Reuters Business", "url": "https://feeds.reuters.com/reuters/businessNews"},
        {"name": "CNBC",             "url": "https://www.cnbc.com/id/10000664/device/rss/rss.html"},
        {"name": "MarketWatch",      "url": "https://feeds.marketwatch.com/marketwatch/topstories/"},
    ],
    "Pharma": [
        {"name": "FiercePharma",  "url": "https://www.fiercepharma.com/rss/xml"},
        {"name": "BioPharma Dive","url": "https://www.biopharmadive.com/feeds/news/"},
        {"name": "STAT News",     "url": "https://www.statnews.com/feed/"},
    ],
    "Aerospace": [
        {"name": "Space.com", "url": "https://www.space.com/feeds/all"},
        {"name": "NASA News", "url": "https://www.nasa.gov/rss/dyn/breaking_news.rss"},
        {"name": "SpaceNews", "url": "https://spacenews.com/feed/"},
    ],
    "Energy": [
        {"name": "OilPrice.com",    "url": "https://oilprice.com/rss/main"},
        {"name": "Renewables Now",  "url": "https://renewablesnow.com/rss/"},
        {"name": "Energy Monitor",  "url": "https://www.energymonitor.ai/feed/"},
    ],
    "Science": [
        {"name": "Science Daily", "url": "https://www.sciencedaily.com/rss/all.xml"},
        {"name": "New Scientist",  "url": "https://www.newscientist.com/feed/home/?cmpid=RSS|NSNS-2012-global|newscientist.com-global"},
        {"name": "Nature News",   "url": "https://www.nature.com/nature.rss"},
    ],
}

# Flat list of all feeds (used when fetching "All" sectors)
ALL_FEEDS: list[dict] = [
    {**feed, "sector": sector}
    for sector, feeds in SECTOR_FEEDS.items()
    for feed in feeds
]

# Key stocks per sector (used on the Stocks dashboard)
SECTOR_STOCKS: dict[str, list[str]] = {
    "Tech":      ["AAPL", "MSFT", "GOOGL", "META", "NVDA", "AMD", "ORCL", "CRM"],
    "AI":        ["NVDA", "PLTR", "AI",    "MSFT", "GOOGL", "IBM", "SMCI", "SNOW"],
    "Finance":   ["JPM",  "BAC",  "GS",    "MS",   "WFC",  "BRK-B", "V",  "MA"],
    "Pharma":    ["JNJ",  "PFE",  "MRK",   "ABBV", "BMY",  "LLY",  "AMGN","GILD"],
    "Aerospace": ["BA",   "LMT",  "RTX",   "NOC",  "GD",   "HII",  "TDG", "AXON"],
    "Energy":    ["XOM",  "CVX",  "COP",   "SLB",  "EOG",  "NEE",  "FSLR","ENPH"],
    "Science":   ["TMO",  "DHR",  "A",     "ZTS",  "ILMN", "REGN", "MRNA","VRTX"],
}
