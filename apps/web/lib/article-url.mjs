import { domainToASCII } from 'node:url';

/** Convert only a Unicode hostname; keep the original path, query and fragment.
 * This validates metadata and does not make a URL safe to fetch.
 * @param {string} value
 * @returns {string}
 */
export function normalizeManualUrl(value) {
  if (typeof value !== 'string' || !value || value.length > 2048 || value !== value.trim() || /[\s\u0000-\u001f\u007f\\]/u.test(value)) throw new Error('Invalid URL');
  const parts = /^https:\/\/([^/?#]+)(.*)$/iu.exec(value);
  if (!parts || parts[1].includes('@')) throw new Error('Invalid URL');
  const authority = parts[1];
  let outputAuthority = authority;
  if (!authority.startsWith('[')) {
    const hostParts = /^([^:]+)(:[0-9]*)?$/u.exec(authority);
    if (!hostParts || hostParts[1].includes('%')) throw new Error('Invalid URL');
    const host = hostParts[1];
    const isAscii = /^[\x00-\x7f]+$/u.test(host);
    const ascii = isAscii ? host : domainToASCII(host);
    if (!ascii || ascii.length > 253 || !/^[A-Za-z0-9.-]+$/u.test(ascii)) throw new Error('Invalid URL');
    if (!isAscii && /^[0-9.]+$/u.test(ascii)) throw new Error('Invalid URL');
    const labels = (ascii.endsWith('.') ? ascii.slice(0, -1) : ascii).split('.');
    if (labels.some(label => !/^[A-Za-z0-9](?:[A-Za-z0-9-]{0,61}[A-Za-z0-9])?$/u.test(label)
      || (label.slice(2, 4) === '--' && !label.toLowerCase().startsWith('xn--')))) throw new Error('Invalid URL');
    if (labels.some(label => label.toLowerCase().startsWith('xn--')) && !domainToASCII(ascii)) throw new Error('Invalid URL');
    outputAuthority = ascii + (hostParts[2] ?? '');
  }
  const result = `https://${outputAuthority}${parts[2]}`;
  if (result.length > 2048) throw new Error('Invalid URL');
  try {
    const parsed = new URL(result);
    if (parsed.protocol !== 'https:' || parsed.username || parsed.password) throw new Error('Invalid URL');
  } catch { throw new Error('Invalid URL'); }
  return result;
}
