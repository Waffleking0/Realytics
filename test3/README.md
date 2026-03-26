# MicroTrend Tracker — MVP

A Data & Automation SaaS that fetches articles from RSS feeds, summarises them with OpenAI, and displays the insights on a clean dashboard.

---

## Project Structure

```
test3/
├── app/
│   ├── main.py            # FastAPI app, table creation, middleware
│   ├── config.py          # Settings loaded from .env
│   ├── database.py        # SQLAlchemy engine + session
│   ├── models.py          # User & Insight ORM models
│   ├── schemas.py         # Pydantic request/response schemas
│   ├── routes/
│   │   ├── auth.py        # POST /api/auth/signup  POST /api/auth/login
│   │   └── insights.py    # GET /api/insights/     POST /api/insights/fetch
│   └── services/
│       ├── rss_fetcher.py # feedparser wrapper
│       └── summarizer.py  # OpenAI GPT summarisation
├── static/
│   ├── index.html         # Dashboard (protected)
│   ├── login.html         # Login / Signup page
│   ├── css/styles.css
│   └── js/
│       ├── auth.js        # Token storage, login/signup API calls
│       └── app.js         # Dashboard logic
├── run.py                 # Dev server launcher
├── requirements.txt
└── .env.example
```

---

## Setup & Run

### 1. Create a virtual environment

```bash
cd Desktop/python/test3
python -m venv venv

# Windows
venv\Scripts\activate

# macOS / Linux
source venv/bin/activate
```

### 2. Install dependencies

```bash
pip install -r requirements.txt
```

### 3. Configure environment variables

```bash
cp .env.example .env
```

Open `.env` and set:

| Variable | Description |
|---|---|
| `OPENAI_API_KEY` | Your OpenAI API key (get one at platform.openai.com) |
| `SECRET_KEY` | Random string used to sign JWT tokens |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | How long tokens stay valid (default 60) |
| `DATABASE_URL` | SQLite path — leave as default for local dev |

> **No OpenAI key?** The app still works — it just shows the first 300 characters of each article instead of a GPT summary.

### 4. Start the server

```bash
python run.py
```

The server starts at **http://localhost:8000**

### 5. Open the app

| URL | Description |
|---|---|
| http://localhost:8000/static/login.html | Sign up / Log in |
| http://localhost:8000/static/index.html | Dashboard |
| http://localhost:8000/docs | Interactive API explorer (Swagger) |

---

## API Endpoints

| Method | Path | Description |
|---|---|---|
| POST | `/api/auth/signup` | Register a new user |
| POST | `/api/auth/login` | Get JWT token |
| GET | `/api/insights/` | List all stored insights |
| POST | `/api/insights/fetch` | Fetch + summarise + store new articles |
| DELETE | `/api/insights/{id}` | Remove an insight |

---

## Customising RSS Feeds

Edit `app/config.py` → `DEFAULT_FEEDS` to add or remove sources:

```python
DEFAULT_FEEDS = [
    {"name": "My Blog", "url": "https://myblog.com/feed.xml"},
    ...
]
```

---

## Tech Stack

- **Backend** — FastAPI, SQLAlchemy, SQLite, feedparser, OpenAI SDK
- **Auth** — JWT (python-jose) + bcrypt (passlib)
- **Frontend** — Vanilla HTML / CSS / JS (no build step needed)
