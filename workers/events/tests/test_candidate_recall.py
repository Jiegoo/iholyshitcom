import unittest
from datetime import datetime, timedelta, timezone
from uuid import UUID

from ingestion.candidate_recall import MAX_ARTICLES, MAX_CANDIDATES, RecallArticle, recall_candidates, recall_page


NOW = datetime(2026, 11, 7, tzinfo=timezone.utc)


def article(number, title, observed_at=NOW):
    return RecallArticle(UUID(int=number), title, observed_at)


class CandidateRecallTests(unittest.TestCase):
    def test_related_titles_return_sorted_ids_without_proving_a_story(self):
        first = article(1, "Orbital robotics company tests lunar lander")
        second = article(2, "Lunar lander tested by orbital robotics team", NOW + timedelta(hours=2))
        unrelated = article(3, "Quantum computing chip enters production")
        result = recall_candidates([second, unrelated, first])
        self.assertEqual([(p.first_id, p.second_id) for p in result.pairs], [(first.article_id, second.article_id)])
        self.assertEqual(result.total_matches, 1)
        self.assertFalse(result.truncated)
        self.assertFalse(hasattr(result.pairs[0], "confidence"))

    def test_short_generic_titles_do_not_match_but_distant_titles_can(self):
        baseline = article(1, "The new announcement")
        generic = article(2, "The new announcement")
        distant = article(3, "Orbital robotics lunar lander", NOW + timedelta(hours=73))
        current = article(4, "Orbital robotics lunar lander")
        self.assertEqual(recall_candidates([baseline, generic, distant, current]).total_matches, 1)

    def test_matching_has_no_time_window_and_converts_timezone(self):
        first = article(1, "Orbital robotics lunar lander")
        at_boundary = article(2, "Lunar lander orbital robotics", (NOW + timedelta(hours=24)).astimezone(timezone(timedelta(hours=8))))
        self.assertEqual(recall_candidates([first, at_boundary]).total_matches, 1)
        outside = article(3, at_boundary.title, NOW + timedelta(hours=24, microseconds=1))
        self.assertEqual(recall_candidates([first, outside]).total_matches, 1)

    def test_invalid_and_duplicate_identifiers_or_dates_are_rejected(self):
        first = article(1, "Fixture headline words")
        for items in ([first, first], [article(2, "Fixture headline words", datetime(2026, 11, 7))], [article(3, " ")]):
            with self.subTest(items=items), self.assertRaises(ValueError):
                recall_candidates(items)
        with self.assertRaises(ValueError):
            recall_candidates([article(i + 1, "fixture headline words") for i in range(MAX_ARTICLES + 1)])

    def test_output_limit_is_explicit_and_deterministic(self):
        items = [article(i + 1, "orbital robotics lunar lander") for i in range(60)]
        first = recall_candidates(items)
        second = recall_candidates(list(reversed(items)))
        self.assertEqual(first, second)
        self.assertTrue(first.truncated)
        self.assertEqual(first.total_matches, 60 * 59 // 2)
        self.assertEqual(len(first.pairs), MAX_CANDIDATES)
        second_page = recall_page(items, 1000, 100)
        self.assertEqual(len(second_page.pairs), 100)
        self.assertEqual(second_page.total_matches, first.total_matches)
        self.assertEqual(second_page.next_offset, 1100)
        self.assertFalse(set(first.pairs) & set(second_page.pairs))
        all_pairs = []
        offset = 0
        while True:
            page = recall_page(items, offset, 100)
            all_pairs.extend(page.pairs)
            offset = page.next_offset
            if offset == page.total_matches:
                break
        self.assertEqual(len(all_pairs), first.total_matches)
        self.assertEqual(len(set(all_pairs)), first.total_matches)

    def test_paging_rejects_invalid_offsets(self):
        items = [article(1, "orbital robotics lunar lander"), article(2, "orbital robotics lunar lander")]
        for offset, limit in ((-1, 100), (0, 0), (0, 101), (2, 100)):
            with self.subTest(offset=offset, limit=limit), self.assertRaises(ValueError):
                recall_page(items, offset, limit)


if __name__ == "__main__":
    unittest.main()

class BilingualRecallTests(unittest.TestCase):
 def test_shared_named_entity_and_technology_match_across_languages(self):
  from ingestion.candidate_recall import RecallArticle,recall_candidates
  from datetime import datetime, timezone
  from uuid import uuid4
  now=datetime.now(timezone.utc)
  items=[RecallArticle(uuid4(),'OpenAI 发布机器人模型',now),RecallArticle(uuid4(),'OpenAI launches new robot model',now)]
  self.assertEqual(len(recall_candidates(items).pairs),1)
 def test_older_than_24_hours_can_be_matched(self):
  from ingestion.candidate_recall import RecallArticle,recall_candidates
  from datetime import datetime, timezone,timedelta
  from uuid import uuid4
  now=datetime.now(timezone.utc)
  items=[RecallArticle(uuid4(),'OpenAI robot model',now),RecallArticle(uuid4(),'OpenAI robot model',now-timedelta(hours=25))]
  self.assertTrue(recall_candidates(items).pairs)
