import unittest
from datetime import datetime, timedelta, timezone
from ingestion.hot_event_rules import qualifies

NOW = datetime(2026, 11, 19, tzinfo=timezone.utc)

def article(n, age=1, score=80, published=True):
    return {'id':str(n), 'type':'manual', 'published_at':NOW-timedelta(days=age), 'score':score, 'published':published}

class HotEventRulesTests(unittest.TestCase):
    def test_threshold(self):
        self.assertTrue(qualifies([article(1),article(2),article(3)], NOW))
        self.assertFalse(qualifies([article(1),article(2)], NOW))
        self.assertFalse(qualifies([article(n,score=79) for n in range(3)], NOW))
    def test_window_publication_and_duplicate(self):
        self.assertFalse(qualifies([article(1),article(2),article(3,age=8)], NOW))
        self.assertFalse(qualifies([article(1),article(2),article(2)], NOW))
        self.assertFalse(qualifies([article(1),article(2),article(3,published=False)], NOW))
        self.assertTrue(qualifies([article(1),article(2),article(3,age=7)], NOW))

if __name__ == '__main__': unittest.main()
