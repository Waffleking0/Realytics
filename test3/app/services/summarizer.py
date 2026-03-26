"""
summarizer.py — Calls OpenAI to produce a 2-3 sentence summary of an article.
Falls back gracefully if the API key is missing or a call fails.
"""
from openai import OpenAI
from app.config import OPENAI_API_KEY

# Initialise the client once (reused across requests)
_client = OpenAI(api_key=OPENAI_API_KEY) if OPENAI_API_KEY else None


def summarize(title: str, content: str) -> str:
    """
    Return a concise 2-3 sentence summary of the article.
    If OpenAI is unavailable, returns a truncated version of the raw content.
    """
    if not _client:
        # Graceful fallback — no API key configured
        return content[:300] + ("…" if len(content) > 300 else "")

    prompt = (
        f"Title: {title}\n\n"
        f"Content: {content[:3000]}\n\n"
        "Write a concise 2-3 sentence summary of this article. "
        "Focus on the key insight or trend it describes."
    )

    try:
        response = _client.chat.completions.create(
            model="gpt-3.5-turbo",
            messages=[{"role": "user", "content": prompt}],
            max_tokens=150,
            temperature=0.5,
        )
        return response.choices[0].message.content.strip()
    except Exception as exc:
        # Return truncated content rather than crashing the whole fetch
        return f"[Summary unavailable: {exc}] {content[:200]}"
