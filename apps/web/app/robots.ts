import type { MetadataRoute } from 'next';
import { searchOrigin } from '../lib/search-config.mjs';

export const dynamic = 'force-dynamic';

export default function robots(): MetadataRoute.Robots {
  const origin = searchOrigin();
  if (!origin) return { rules: { userAgent: '*', disallow: '/' } };
  // Crawlers may fetch /editor to see its noindex tag; it is never in sitemap.
  return { rules: { userAgent: '*', allow: '/' }, sitemap: `${origin}/sitemap.xml` };
}
