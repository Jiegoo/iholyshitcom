import 'server-only';
import { getBrowse, type Locale } from './public-stories';
import { isEditorialChannel } from './editorial-channels';
import { localFixtureMode } from './local-fixtures';
import { searchOrigin } from './search-config.mjs';
import { newsSitemapXml, rssXml } from './publication-xml.mjs';

const headers = { 'Cache-Control': 'private, no-store', 'X-Robots-Tag': 'noindex, nofollow', 'Content-Type': 'application/xml; charset=utf-8' };
function fixtureOrigin() {
  return localFixtureMode() && process.env.NEWS_EXPORT_FIXTURES === 'true' ? 'https://fixture.invalid' : null;
}
function unavailable() { return new Response('Not found', { status: 404, headers: { 'Cache-Control': 'private, no-store', 'X-Robots-Tag': 'noindex, nofollow' } }); }
export async function rssResponse(locale: string, channel: string | null) {
  if (process.env.NEWS_DEMO === 'true'
    || (locale !== 'zh' && locale !== 'en') || (channel !== null && !isEditorialChannel(channel))) return unavailable();
  const origin = fixtureOrigin() ?? searchOrigin();
  if (!origin) return unavailable();
  const items = await getBrowse({ query: '', category: channel, period: 'all', sort: 'latest', offset: 0 }, locale, process.env.NEWS_BILINGUAL_PUBLIC_READ === 'true');
  return new Response(rssXml(items.slice(0, 20), origin, locale, channel), { headers: { ...headers, 'Content-Type': 'application/rss+xml; charset=utf-8' } });
}

// List recent published articles for Google News discovery.
export async function newsSitemapResponse() {
  const origin = fixtureOrigin() ?? searchOrigin();
  if (!origin || process.env.NEWS_DEMO === 'true') return unavailable();
  const now = Date.now();
  const entries: { item: Awaited<ReturnType<typeof getBrowse>>[number]; locale: Locale }[] = [];
  for (const locale of ['zh', 'en'] as const) {
    let localeCount=0;
    for (let offset = 0; offset <= 504; offset += 21) {
      const rows = await getBrowse({ query: '', category: null, period: 'week', sort: 'latest', offset }, locale, process.env.NEWS_BILINGUAL_PUBLIC_READ === 'true');
      for (const item of rows) {
        const timestamp = Date.parse(item.published_at);
        if (!Number.isFinite(timestamp) || timestamp > now) throw new Error('Invalid public news date');
        if (now - timestamp <= 48 * 60 * 60 * 1000 && localeCount<500) { entries.push({ item, locale }); localeCount++; }
      }
      if (localeCount>=500 || rows.length < 21 || rows.some(item => now - Date.parse(item.published_at) > 48 * 60 * 60 * 1000)) break;
      if (offset === 504) throw new Error('News sitemap requires pagination');
    }
  }
  return new Response(newsSitemapXml(entries, origin, now), { headers: { 'Cache-Control': 'private, no-store', 'Content-Type': 'application/xml; charset=utf-8' } });
}
