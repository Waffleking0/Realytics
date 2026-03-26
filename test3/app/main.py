"""
main.py — FastAPI app entry point.
"""
from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import RedirectResponse

from app.database import engine, Base
from app.routes import auth, insights, stocks, favorites

Base.metadata.create_all(bind=engine)

app = FastAPI(title="MicroTrend Tracker", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router,      prefix="/api")
app.include_router(insights.router,  prefix="/api")
app.include_router(stocks.router,    prefix="/api")
app.include_router(favorites.router, prefix="/api")

app.mount("/static", StaticFiles(directory="static", html=True), name="static")

@app.get("/")
def root():
    return RedirectResponse(url="/static/login.html")
