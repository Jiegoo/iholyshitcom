import type { Metadata } from "next";
import { Suspense } from 'react';
import { headers } from 'next/headers';
import { searchOrigin } from '../lib/search-config.mjs';
import SiteFooter from './site-footer';
import CookieConsent from './cookie-consent';
import SiteVisit from './site-visit';
import {googleTagBootstrap} from '../lib/google-tag.mjs';
import "./styles.css";
import {siteNames} from '../lib/site-brand.mjs';
import {shareImages} from '../lib/news-metadata.mjs';

export const dynamic = 'force-dynamic';

export async function generateMetadata(): Promise<Metadata> {
  const origin=searchOrigin(); const enabled = Boolean(origin); const images=shareImages(origin);
  const locale=(await headers()).get('x-iholy-locale')==='zh'?'zh':'en';
  return { title:siteNames[locale],applicationName:siteNames[locale], description: 'A daily discovery engine for the future.', icons: { icon: '/icon.svg?v=3d' }, robots: { index: enabled, follow: enabled }, ...(images?{openGraph:{images},twitter:{card:'summary_large_image' as const,images:images.map(image=>image.url)}}:{}) };
}

export default async function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const locale = (await headers()).get('x-iholy-locale') === 'zh' ? 'zh' : 'en';
  return <html lang={locale}><head>{searchOrigin() && <link rel="alternate" type="application/rss+xml" title={locale === 'zh' ? '科技简报 RSS' : 'Newsroom RSS'} href={locale === 'zh' ? '/feed/zh' : '/rss.xml'} />}<script dangerouslySetInnerHTML={{__html:googleTagBootstrap}} /></head><body>{children}<Suspense><SiteVisit/><SiteFooter initialLocale={locale} /><CookieConsent locale={locale} /></Suspense></body></html>;
}
