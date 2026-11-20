import { isIP } from 'node:net';

// Indexing is an explicit production release action. Preview, development,
// missing configuration and malformed origins stay closed by default.
export function searchOrigin(env = process.env) {
  if (env.VERCEL_ENV !== 'production' || env.SITE_INDEXING_ENABLED !== 'true'
    || env.NEWS_DEMO === 'true' || env.NEWS_LOCAL_FIXTURES === 'true') return null;
  const raw = env.SITE_CANONICAL_ORIGIN;
  if (typeof raw !== 'string' || !raw || raw !== raw.trim()) return null;
  try {
    const url = new URL(raw);
    const host = url.hostname;
    if (url.protocol !== 'https:' || url.username || url.password || url.port || url.pathname !== '/' || url.search || url.hash
      || isIP(host) || !host.includes('.') || host.endsWith('.') || /(^|\.)(localhost|local|invalid|test|example)$/.test(host)
      || /(^|\.)example\.(com|org|net)$/.test(host)) return null;
    return url.origin;
  } catch { return null; }
}

export function pageSearchMetadata(path, env = process.env) {
  const origin = searchOrigin(env);
  if (!origin) return {};
  if (!/^\/(?:[a-z0-9]+(?:-[a-z0-9]+)*\/?)*$/.test(path)) throw new Error('Invalid canonical path');
  return { alternates: { canonical: `${origin}${path}` } };
}

// Localized pages use language-specific canonical URLs and alternates.
export function bilingualPageSearchMetadata(path, locale, env = process.env) {
  if (locale !== 'zh' && locale !== 'en') throw new Error('Invalid locale');
  const base = pageSearchMetadata(path, env).alternates?.canonical;
  const origin = searchOrigin(env);
  if (!base || !origin) return {};
  const link = language => `${origin}/${language}${path === '/' ? '' : path}`;
  return { alternates: { canonical: link(locale), languages: { zh: link('zh'), en: link('en'), 'x-default': link('en') } } };
}
