// Server-side only. No signup, admin link generation or role changes.
export const pendingEmailLinkCookie = '__Host-iholy-editor-email-link';
export function emailLinkConfig() {
  if (process.env.NEWS_EDITOR_MAGIC_LINK_ENABLED !== 'true' ||
      process.env.NEWS_EDITOR_MAGIC_LINK_LIMITS_REVIEWED !== 'true') return null;
  try {
    const origin = new URL(process.env.NEWS_AUTH_ORIGIN ?? '');
    const email = (process.env.NEWS_EDITOR_MAGIC_LINK_EMAIL ?? '').trim().toLowerCase();
    const userId = process.env.NEWS_EDITOR_MAGIC_LINK_USER_ID ?? '';
    if (origin.protocol !== 'https:' || origin.username || origin.password || origin.pathname !== '/' || origin.search || origin.hash ||
        !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254 ||
        !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(userId)) return null;
    return { origin: origin.origin, email, userId };
  } catch { return null; }
}
export function pendingEmailLink(raw: string | undefined) {
  if (!raw || !/^\d{13}$/.test(raw)) return null;
  const at = Number(raw);
  return at <= Date.now() && Date.now() - at < 600000 ? at : null;
}
