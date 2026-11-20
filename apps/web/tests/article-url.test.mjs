import { readFile } from 'node:fs/promises';
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { normalizeManualUrl } from '../lib/article-url.mjs';

test('manual URLs convert internationalized hostnames without rewriting paths or queries', async () => {
  const cases = JSON.parse(await readFile(new URL('../../../fixtures/idna_url_cases.json', import.meta.url), 'utf8'));
  for (const item of cases) assert.equal(normalizeManualUrl(item.input), item.manual);
  assert.equal(normalizeManualUrl('https://EXAMPLE.invalid:443/a?x=2#part'), 'https://EXAMPLE.invalid:443/a?x=2#part');
  assert.notEqual(normalizeManualUrl('https://faß.de/'), normalizeManualUrl('https://fass.de/'));
});

test('manual URLs reject invalid hosts, credentials, spaces, and ambiguous numeric IDNs', () => {
  for (const value of ['http://example.invalid/', 'https://user:password@example.invalid/', 'https://example.invalid/a b', 'https://example.invalid\\@evil.invalid/', 'https://１２７.０.０.１/', 'https://foo..example/', 'https://example.invalid:99999/']) {
    assert.throws(() => normalizeManualUrl(value), /Invalid URL/);
  }
});
