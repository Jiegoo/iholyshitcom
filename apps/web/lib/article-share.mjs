// Plain share links: no platform SDKs, tracking parameters or network requests.
export function articleShareLinks(url, title) {
  const link = (base, params) => `${base}?${new URLSearchParams(params)}`;
  return [
    {id: 'x', label: 'X', href: link('https://x.com/intent/tweet', {url, text: title})},
    {id: 'facebook', label: 'Facebook', href: link('https://www.facebook.com/sharer/sharer.php', {u: url})},
    {id: 'linkedin', label: 'LinkedIn', href: link('https://www.linkedin.com/sharing/share-offsite/', {url})},
    {id: 'reddit', label: 'Reddit', href: link('https://www.reddit.com/submit', {url, title})},
    {id: 'whatsapp', label: 'WhatsApp', href: link('https://wa.me/', {text: `${title}\n${url}`})},
    {id: 'telegram', label: 'Telegram', href: link('https://t.me/share/url', {url, text: title})},
    {id: 'weibo', label: 'Weibo', href: link('https://service.weibo.com/share/share.php', {url, title})},
  ];
}

export async function copyArticleLink(url, nav = navigator, doc = document) {
  try {
    await nav.clipboard.writeText(url);
    return true;
  } catch { /* A blocked clipboard can still allow a user-initiated copy. */ }
  const input = doc.createElement('textarea');
  input.value = url;
  input.readOnly = true;
  input.style.cssText = 'position:fixed;top:0;left:0;opacity:0;pointer-events:none';
  const active = doc.activeElement;
  const selection = doc.getSelection?.();
  const ranges = selection ? Array.from({length: selection.rangeCount}, (_, i) => selection.getRangeAt(i).cloneRange()) : [];
  try {
    doc.body.appendChild(input);
    input.select();
    return doc.execCommand('copy');
  } catch {
    return false;
  } finally {
    input.remove();
    active?.focus?.({preventScroll: true});
    if (selection) { selection.removeAllRanges(); ranges.forEach(range => selection.addRange(range)); }
  }
}
