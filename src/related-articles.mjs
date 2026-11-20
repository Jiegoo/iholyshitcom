// Search only concrete labels; generic technology words rarely identify an event.
const generic = new Set(['ai','人工智能','科技','技术','news','technology','tech','software','internet','app','apps','the','how','what','why','this','that','new','first']);
export function relatedTerms(tags, title = '') {
  const names = title.match(/\b(?:[A-Z]{2,}[0-9]*|[A-Z][a-z]+(?:[A-Z][A-Za-z0-9]*)+|[A-Z][a-z]{3,})\b/g) ?? [];
  const terms = [...(Array.isArray(tags) ? tags : []), ...names];
  const unique = new Map();
  for (const raw of terms) {
    if (typeof raw !== 'string') continue;
    const term = raw.trim(); const key = term.toLocaleLowerCase();
    if (term.length < 3 || term.length > 50 || generic.has(key) || /^\d+$/.test(term)) continue;
    if (!unique.has(key)) unique.set(key, term);
  }
  return [...unique.values()].slice(0, 3);
}

export async function findRelatedArticles({slug, type, tags, title}, search) {
  const terms = relatedTerms(tags, title);
  if (!terms.length) return [];
  const found = await Promise.allSettled(terms.map(term => search(term)));
  const candidates = new Map();
  for (const result of found) {
    if (result.status !== 'fulfilled' || !Array.isArray(result.value)) continue;
    for (const item of result.value) {
      const kind = item.content_type ?? 'story';
      if (kind === type && item.slug === slug) continue;
      const key = `${kind}:${item.slug}`;
      if (!candidates.has(key)) candidates.set(key, item);
    }
  }
  const score = item => terms.filter(term => item.title.toLocaleLowerCase().includes(term.toLocaleLowerCase())).length;
  return [...candidates.values()].filter(item => score(item) > 0)
    .sort((a,b) => score(b) - score(a) || Date.parse(b.published_at) - Date.parse(a.published_at) || a.slug.localeCompare(b.slug)).slice(0,3);
}
