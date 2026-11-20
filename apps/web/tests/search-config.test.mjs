import { test } from 'node:test';
import assert from 'node:assert/strict';
import { bilingualPageSearchMetadata, pageSearchMetadata, searchOrigin } from '../lib/search-config.mjs';

test('indexing requires an explicit production deployment and a safe canonical origin', () => {
  const valid={VERCEL_ENV:'production',SITE_INDEXING_ENABLED:'true',SITE_CANONICAL_ORIGIN:'https://news.launch-fixture.com/'};
  assert.equal(searchOrigin(valid),'https://news.launch-fixture.com');
  assert.deepEqual(pageSearchMetadata('/story/one-event',valid),{alternates:{canonical:'https://news.launch-fixture.com/story/one-event'}});
  const planned={...valid,SITE_CANONICAL_ORIGIN:'https://news.launch-fixture.com'};
  assert.equal(searchOrigin(planned),'https://news.launch-fixture.com');
  assert.deepEqual(pageSearchMetadata('/story/one-event',planned),{alternates:{canonical:'https://news.launch-fixture.com/story/one-event'}});
  assert.equal(searchOrigin({...planned,VERCEL_ENV:'preview'}),null);
  assert.equal(searchOrigin({...planned,SITE_INDEXING_ENABLED:'false'}),null);
  assert.equal(searchOrigin({...planned,NEWS_DEMO:'true'}),null);
  // A bad remote URL does not make an explicitly enabled fixture flag safe to index.
  assert.equal(searchOrigin({...planned,NEWS_LOCAL_FIXTURES:'true',SUPABASE_URL:'https://remote.invalid'}),null);
  assert.deepEqual(pageSearchMetadata('/story/one-event',{...planned,NEWS_LOCAL_FIXTURES:'true'}),{});
  for (const env of [
    {}, {...valid,VERCEL_ENV:'preview'}, {...valid,VERCEL_ENV:'development'}, {...valid,SITE_INDEXING_ENABLED:'false'},
    ...['http://news.launch-fixture.com','https://localhost','https://127.0.0.1','https://[::1]',
      'https://user@news.launch-fixture.com','https://news.launch-fixture.com/path','https://news.launch-fixture.com?x=1',
      'https://news.launch-fixture.com:8443','https://example.com','https://something.invalid',' https://news.launch-fixture.com'].map(SITE_CANONICAL_ORIGIN=>({...valid,SITE_CANONICAL_ORIGIN})),
  ]) assert.equal(searchOrigin(env),null,JSON.stringify(env));
  assert.deepEqual(pageSearchMetadata('/about',{}),{});
  assert.throws(()=>pageSearchMetadata('/story/../editor',valid),/Invalid canonical path/);
});

test('bilingual canonical and alternates are locale-specific and remain gated', () => {
  const env={VERCEL_ENV:'production',SITE_INDEXING_ENABLED:'true',SITE_CANONICAL_ORIGIN:'https://news.launch-fixture.com'};
  assert.deepEqual(bilingualPageSearchMetadata('/story/one', 'zh', env), {alternates:{canonical:'https://news.launch-fixture.com/zh/story/one',languages:{zh:'https://news.launch-fixture.com/zh/story/one',en:'https://news.launch-fixture.com/en/story/one','x-default':'https://news.launch-fixture.com/en/story/one'}}});
  assert.deepEqual(bilingualPageSearchMetadata('/story/one', 'en', {...env,SITE_INDEXING_ENABLED:'false'}), {});
  assert.throws(()=>bilingualPageSearchMetadata('/story/../editor','zh',env),/Invalid canonical path/);
  assert.throws(()=>bilingualPageSearchMetadata('/','fr',env),/Invalid locale/);
});
