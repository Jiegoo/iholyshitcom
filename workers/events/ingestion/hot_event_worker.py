"""Process published-article event jobs without restarting the paused RSS worker."""
import json
import os
import sys
from datetime import datetime
from uuid import UUID

import psycopg
from .candidate_recall import RecallArticle, recall_page
from .hot_event_model import propose_event
from .hot_event_rules import qualifies


def recall_anchor(articles):
    if not articles:
        return []
    by_uuid = {}
    prepared = []
    for row in articles:
        raw_id = row['id'].split(':', 1)[1]
        item_id = UUID(raw_id)
        if item_id in by_uuid:
            raise ValueError('article identities overlap')
        observed = datetime.fromisoformat(row['published_at'].replace('Z', '+00:00'))
        by_uuid[item_id] = row
        prepared.append(RecallArticle(item_id, row['title'], observed))
    anchor = prepared[0].article_id
    matches = set()
    for start in range(1, len(prepared), 199):
        batch = [prepared[0], *prepared[start:start + 199]]
        offset = 0
        while True:
            page = recall_page(batch, offset, 100)
            for pair in page.pairs:
                if pair.first_id == anchor:
                    matches.add(pair.second_id)
                elif pair.second_id == anchor:
                    matches.add(pair.first_id)
            if page.next_offset == page.total_matches:
                break
            offset = page.next_offset
    selected = [articles[0]] + [row for row in articles[1:] if UUID(row['id'].split(':', 1)[1]) in matches]
    if len(selected) > 200:
        raise ValueError('event candidate batch exceeds model limit')
    return selected



def process_one(connection, model, credential, propose=propose_event):
    with connection.cursor() as cursor:
        cursor.execute('select public.hot_event_claim()')
        job = cursor.fetchone()[0]
    if not job:
        return 'empty'
    job_id, attempt = job['job_id'], job['attempt']
    try:
        rows = job['articles']
        if not rows or rows[0]['id'] != job['anchor']:
            selected = []
        else:
            selected = recall_anchor(rows)
        eligible = [{'id':row['id'],'type':'article','published':True,
                     'published_at':datetime.fromisoformat(row['published_at'].replace('Z','+00:00')),
                     'score':row['score']} for row in selected]
        if not qualifies(eligible):
            with connection.cursor() as cursor:
                cursor.execute('select public.hot_event_finish_empty(%s,%s)', (job_id, attempt))
            return 'below_threshold'
        proposal = propose(selected, model, credential)
        if len(proposal['ids']) < 3:
            with connection.cursor() as cursor:
                cursor.execute('select public.hot_event_finish_empty(%s,%s)', (job_id, attempt))
            return 'not_same_event'
        with connection.cursor() as cursor:
            cursor.execute('select public.hot_event_apply(%s,%s,%s::jsonb)', (job_id, attempt, json.dumps(proposal, ensure_ascii=False)))
        return 'completed'
    except Exception:
        with connection.cursor() as cursor:
            cursor.execute('select public.hot_event_retry(%s,%s)', (job_id, attempt))
        raise


def main():
    if os.environ.get('NEWS_HOT_EVENTS_ENABLED') != 'enabled':
        print('Hot event processing disabled.', file=sys.stderr)
        return 2
    try:
        if any(name.startswith('PG') for name in os.environ):
            raise ValueError('ambient database configuration forbidden')
        model = os.environ['NEWS_HOT_EVENTS_MODEL']
        key = os.environ['NEWS_DEEPSEEK_API_KEY']
        password = os.environ['NEWS_ARTICLE_DB_PASSWORD']
        root = os.environ['NEWS_SUPABASE_CA_FILE']
        if not model or not key or not password or not root:
            raise ValueError('worker configuration missing')
        with psycopg.connect(host=os.environ['NEWS_DB_HOST'],port=int(os.environ.get('NEWS_DB_PORT','5432')),dbname=os.environ.get('NEWS_DB_NAME','postgres'),
                             user=os.environ['NEWS_DB_USER'],password=password,sslmode=os.environ.get('NEWS_DB_SSLMODE','verify-full'),
                             sslrootcert=root,connect_timeout=15,autocommit=True) as connection:
            outcomes = {}
            for _ in range(50):
                try:
                    outcome = process_one(connection, model, key)
                except Exception as exc:
                    print(json.dumps({'event':'hot_event_failure','exception':type(exc).__name__}),file=sys.stderr)
                    outcome = 'failed'
                if outcome == 'empty':
                    break
                outcomes[outcome] = outcomes.get(outcome, 0) + 1
        print(json.dumps(outcomes, sort_keys=True))
        return 1 if outcomes.get('failed') else 0
    except Exception as exc:
        print(json.dumps({'event':'hot_event_worker_failure','exception':type(exc).__name__}),file=sys.stderr)
        return 1

if __name__ == '__main__':
    raise SystemExit(main())
