"""Bounded bilingual title recall from permitted metadata only.

This is not clustering, fact verification, or a measure of independence.
The caller must establish that it may use each title before invoking it.
"""

from dataclasses import dataclass
from datetime import datetime, timezone
import re
from typing import Sequence, Tuple
from uuid import UUID


MAX_ARTICLES = 200
MAX_CANDIDATES = 1000
_WORDS = re.compile(r"[a-z0-9]+")
_STOPWORDS = frozenset({
    "the", "and", "for", "with", "from", "that", "this", "are", "was", "has", "have", "its", "will",
    "new", "says", "said", "after", "into", "over", "about", "how", "why", "what", "you", "your",
})


@dataclass(frozen=True)
class RecallArticle:
    article_id: UUID
    title: str
    observed_at: datetime


@dataclass(frozen=True)
class CandidatePair:
    first_id: UUID
    second_id: UUID
    shared_term_count: int


@dataclass(frozen=True)
class RecallResult:
    pairs: Tuple[CandidatePair, ...]
    total_matches: int
    truncated: bool


@dataclass(frozen=True)
class RecallPage:
    pairs: Tuple[CandidatePair, ...]
    total_matches: int
    next_offset: int


# Aliases are deliberately small; matches are suggestions, not proof of identity.
_ALIASES = {
    '人工智能':'ai', '机器人':'robot', '芯片':'chip', '半导体':'semiconductor',
    '模型':'model', '火箭':'rocket', '航天':'space', '电池':'battery',
    '量子':'quantum', '脑机接口':'bci', '无人机':'drone', '自动驾驶':'autonomous',
}
_ENGLISH_NORMAL = {'robots':'robot','chips':'chip','models':'model','rockets':'rocket',
                   'batteries':'battery','drones':'drone','semiconductors':'semiconductor'}

def _terms(title: str) -> frozenset:
    lowered=title.lower()
    words={_ENGLISH_NORMAL.get(word,word) for word in _WORDS.findall(lowered)
           if (len(word)>=3 or word=='ai') and word not in _STOPWORDS}
    words.update(alias for term,alias in _ALIASES.items() if term in lowered)
    return frozenset(words)


def _sorted_matches(articles: Sequence[RecallArticle]):
    if len(articles) > MAX_ARTICLES:
        raise ValueError("too many articles for one recall batch")
    prepared = []
    seen = set()
    for article in articles:
        if not isinstance(article.article_id, UUID) or article.article_id in seen:
            raise ValueError("article IDs must be unique UUIDs")
        if not isinstance(article.title, str) or not article.title.strip() or len(article.title) > 1000:
            raise ValueError("invalid title")
        if not isinstance(article.observed_at, datetime) or article.observed_at.tzinfo is None or article.observed_at.utcoffset() is None:
            raise ValueError("observed_at must include a timezone")
        seen.add(article.article_id)
        prepared.append((article.article_id, _terms(article.title), article.observed_at.astimezone(timezone.utc)))
    prepared.sort(key=lambda item: item[0].int)
    matches = []
    for index, (first_id, first_terms, first_time) in enumerate(prepared):
        for second_id, second_terms, second_time in prepared[index + 1:]:
            common = len(first_terms & second_terms)
            union = len(first_terms | second_terms)
            if common >= 2 and 3 * common >= union:
                matches.append(CandidatePair(first_id, second_id, common))
    matches.sort(key=lambda pair: (-pair.shared_term_count, pair.first_id.int, pair.second_id.int))
    return matches


def recall_candidates(articles: Sequence[RecallArticle]) -> RecallResult:
    """Return suggested pairs, never story membership or verified evidence.

    observed_at is the source publication time when available. Token overlap
    provide initial suggestions,
    and can miss related articles or suggest unrelated ones.
    """
    matches = _sorted_matches(articles)
    return RecallResult(tuple(matches[:MAX_CANDIDATES]), len(matches), len(matches) > MAX_CANDIDATES)


def recall_page(articles: Sequence[RecallArticle], offset: int, limit: int) -> RecallPage:
    """Return a deterministic page; callers must bind offsets to a snapshot."""
    if type(offset) is not int or offset < 0 or type(limit) is not int or not 1 <= limit <= 100:
        raise ValueError("invalid recall page")
    matches = _sorted_matches(articles)
    if offset > len(matches):
        raise ValueError("recall offset exceeds matches")
    end = min(offset + limit, len(matches))
    return RecallPage(tuple(matches[offset:end]), len(matches), end)
