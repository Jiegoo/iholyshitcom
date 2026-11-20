import { test } from 'node:test';
import assert from 'node:assert/strict';
import { newsSocialMetadata, newsStructuredData } from '../lib/news-metadata.mjs';
import {editorialDesks,editorialDesk} from '../lib/editorial-desks.mjs';

test('structured news data uses public text without allowing script breakout or inventing dates', () => {
  const story = { title: 'Test </script><script>alert(1)</script> & \u2028', summary: 'Fictional summary', locale: 'zh' };
  const json = newsStructuredData(story);
  assert.doesNotMatch(json, /[<>&\u2028\u2029]/);
  const data = JSON.parse(json);
  assert.equal(data.headline, story.title);
  assert.equal(data.inLanguage, 'zh');
  assert.equal(data['@type'], 'NewsArticle');
  assert.equal(data.publisher.alternateName,'科技简报');
  assert.equal('datePublished' in data, false);
  assert.deepEqual(data.author,{'@type':'Organization',name:'Newsroom Editorial Desk'});
  const withDesk=JSON.parse(newsStructuredData({...story,channel:'ai'},'https://news.launch-fixture.com'));
  assert.deepEqual(withDesk.author,{'@type':'Organization',name:'Newsroom AI Desk',url:'https://news.launch-fixture.com/zh/about#desk-ai'});
});

test('each channel has a distinct editorial label and an honest fallback',()=>{
  assert.equal(editorialDesks.length,6);
  assert.equal(new Set(editorialDesks.map(desk=>desk.name)).size,6);
  for(const desk of editorialDesks) assert.equal(editorialDesk(desk.channel).name,desk.name);
  assert.equal(editorialDesk('unknown').name,'Newsroom Editorial Desk');
});

test('social image is absolute only when the canonical origin is available', () => {
  const story = { title: 'Title', summary: 'Summary', locale: 'en' };
  const offline = newsSocialMetadata(story, null);
  assert.equal(offline.openGraph.images, undefined);
  assert.equal(offline.twitter.card, 'summary');
  const ready = newsSocialMetadata(story, 'https://news.launch-fixture.com');
  assert.equal(ready.openGraph.images[0].url, 'https://news.launch-fixture.com/share-card.png');
  assert.equal(ready.openGraph.images[0].width, 1200);assert.equal(ready.openGraph.images[0].height, 630);
  assert.equal(ready.twitter.card, 'summary_large_image');
  assert.equal(newsSocialMetadata({...story,locale:'zh'},null).openGraph.siteName,'科技简报');
});
