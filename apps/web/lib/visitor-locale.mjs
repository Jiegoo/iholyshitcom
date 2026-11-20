const locales = new Set(['zh', 'en']);
const chineseRegions = new Set(['CN', 'HK', 'MO', 'TW']);
export const localeCookie = 'ihs_locale';

export function initialVisitorLocale({country, acceptLanguage, preference, consented = false}) {
  if (consented && locales.has(preference)) return preference;
  const region = typeof country === 'string' ? country.trim().toUpperCase() : '';
  if (/^[A-Z]{2}$/.test(region) && region !== 'XX' && region !== 'ZZ') return chineseRegions.has(region) ? 'zh' : 'en';
  const accepted = (acceptLanguage ?? '').split(',').map((item, index) => {
    const match = item.trim().match(/^([a-z]{1,8}(?:-[a-z0-9]{1,8})*)(?:\s*;\s*q=(0(?:\.\d{0,3})?|1(?:\.0{0,3})?))?$/i);
    return match ? {locale: match[1].split('-')[0].toLowerCase(), weight: Number(match[2] ?? 1), index} : null;
  }).filter(item => item && item.weight > 0 && locales.has(item.locale));
  accepted.sort((a, b) => b.weight - a.weight || a.index - b.index);
  return accepted[0]?.locale ?? 'en';
}

export function unlocalizedPublicPage(path) {
  return /^\/(?:(?:story|manual)\/[a-z0-9-]+|category\/[a-z0-9-]+(?:\/[a-z0-9-]+)?|events(?:\/[a-z0-9-]+)?|search|about|methodology|corrections|privacy|terms)?\/?$/.test(path);
}

// A language preference is written only after the visitor has accepted cookies.
export function rememberLocale(locale, doc = document) {
  try {
    if (!locales.has(locale) || !doc.cookie.split(';').some(item => item.trim() === 'ihs_cookie_consent=accepted')) return false;
    doc.cookie = `${localeCookie}=${locale}; Path=/; Max-Age=${180 * 86400}; SameSite=Lax${doc.location.protocol === 'https:' ? '; Secure' : ''}`;
    return true;
  } catch { return false; }
}
