// Values come from the same eligible public story used to render the page.
// Escape HTML-sensitive characters before embedding JSON in a script element.
import {siteNames} from './site-brand.mjs';
import {editorialDesk} from './editorial-desks.mjs';
/** @param {{title:string, summary:string, locale:string, channel?:string|null}} story @param {string|null} [origin] */
export function newsStructuredData(story, origin = null) {
  const desk=editorialDesk(story.channel);
  return JSON.stringify({
    '@context': 'https://schema.org',
    '@type': 'NewsArticle',
    headline: story.title,
    description: story.summary,
    inLanguage: story.locale,
    author: { '@type':'Organization', name:desk.name, ...(origin?{url:`${origin}/${story.locale==='zh'?'zh':'en'}/about#desk-${desk.channel}`}:{}) },
    publisher: { '@type': 'Organization', name: 'Newsroom',...(story.locale==='zh'?{alternateName:'科技简报'}:{}) },
  }).replace(/[<>&\u2028\u2029]/g, char => `\\u${char.charCodeAt(0).toString(16).padStart(4, '0')}`);
}

export function shareImages(origin) {
  return origin ? [{ url: `${origin}/share-card.png`, width: 1200, height: 630, alt: 'Newsroom' }] : undefined;
}

export function newsSocialMetadata(story, origin) {
  const image = shareImages(origin);
  return {
    openGraph: { type: 'article', title: story.title, description: story.summary, siteName:siteNames[story.locale==='zh'?'zh':'en'],locale: story.locale, ...(image ? { images: image } : {}) },
    twitter: { card: image ? 'summary_large_image' : 'summary', title: story.title, description: story.summary, ...(image ? { images: image.map(item => item.url) } : {}) },
  };
}
