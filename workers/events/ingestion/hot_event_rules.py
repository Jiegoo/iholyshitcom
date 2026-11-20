"""Eligibility rules for a hot event; the homepage freshness rule is separate."""
from datetime import datetime, timedelta, timezone


def eligible_members(articles, now=None):
    now = now or datetime.now(timezone.utc)
    if now.tzinfo is None:
        raise ValueError('timezone required')
    seen = set()
    selected = []
    for article in articles:
        identity = (article['type'], article['id'])
        date = article['published_at']
        score = article.get('score')
        if identity in seen or not isinstance(date, datetime) or date.tzinfo is None:
            continue
        seen.add(identity)
        if (article.get('published') is True and now - timedelta(days=7) <= date <= now
                and (score is None or type(score) is int and 0 <= score <= 100)):
            selected.append(article)
    return selected


def qualifies(articles, now=None):
    selected = eligible_members(articles, now)
    return len(selected) >= 3 and max((a.get('score') or 0 for a in selected), default=0) >= 80
