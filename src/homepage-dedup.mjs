export const articleKey = item => `${item.content_type ?? 'story'}:${item.slug}`;

export function excludeFeatured(items, featuredKeys) {
  const excluded = new Set(featuredKeys);
  return items.filter(item => !excluded.has(articleKey(item)));
}

export function displayedFeaturedKeys(headline, picks, picksRecent, mode) {
  return [...new Set([...(headline ? [headline] : []), ...(mode === 'recent' ? picksRecent : picks)].map(articleKey))];
}
