import {publicArticleSlug} from './historical-article-slugs.mjs';
import {siteNames} from './site-brand.mjs';
const slugPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export function xml(value) {
  return String(value).replace(/[^\u0009\u000a\u000d\u0020-\ud7ff\ue000-\ufffd\u{10000}-\u{10ffff}]/gu, '')
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&apos;');
}

export function checkedItem(item, origin, locale) {
  if (!item || typeof item.slug !== 'string' || item.slug.length > 200 || !slugPattern.test(item.slug)
    || typeof item.title !== 'string' || !item.title || typeof item.summary !== 'string'
    || typeof item.published_at !== 'string' || !Number.isFinite(Date.parse(item.published_at))) {
    throw new Error('Invalid public export item');
  }
  return { ...item, url: `${origin}/${locale}/${item.content_type === 'manual' ? '' : 'story/'}${publicArticleSlug(item.content_type, item.slug)}`, date: new Date(item.published_at) };
}

export function rssXml(items, origin, locale, channel) {
  const brand=siteNames[locale==='zh'?'zh':'en'];
  const name = channel ? `${brand} — ${channel}` : brand;
  const entries = items.map(raw => {
    const item = checkedItem(raw, origin, locale);
    return `<item><title>${xml(item.title)}</title><link>${xml(item.url)}</link><guid isPermaLink="true">${xml(item.url)}</guid><description>${xml(item.summary)}</description><pubDate>${item.date.toUTCString()}</pubDate></item>`;
  }).join('');
  return `<?xml version="1.0" encoding="UTF-8"?><rss version="2.0"><channel><title>${xml(name)}</title><link>${xml(`${origin}/${locale}`)}</link><description>${xml(name)}</description><language>${locale}</language>${entries}</channel></rss>`;
}

export function newsSitemapXml(entries, origin, now = Date.now()) {
  if (entries.length > 1000) throw new Error('News sitemap exceeds URL limit');
  const seen = new Set();
  const urls = entries.map(({ item: raw, locale }) => {
    if (locale !== 'zh' && locale !== 'en') throw new Error('Invalid news locale');
    const item = checkedItem(raw, origin, locale);
    const age = now - item.date.getTime();
    if (age < 0 || age > 48 * 60 * 60 * 1000 || seen.has(item.url)) throw new Error('Invalid news sitemap date or duplicate');
    seen.add(item.url);
    return `<url><loc>${xml(item.url)}</loc><news:news><news:publication><news:name>${xml(siteNames[locale])}</news:name><news:language>${locale === 'zh' ? 'zh-cn' : 'en'}</news:language></news:publication><news:publication_date>${item.date.toISOString()}</news:publication_date><news:title>${xml(item.title)}</news:title></news:news></url>`;
  }).join('');
  return `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:news="http://www.google.com/schemas/sitemap-news/0.9">${urls}</urlset>`;
}
