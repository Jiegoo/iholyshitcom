// No credentials, request bodies, provider errors or callback URLs are logged here.
export const callbackPath = '/editor/auth/callback';
export function recoveryOrigin(env = process.env) {
  if (env.NEWS_PASSWORD_RECOVERY_ENABLED !== 'true') return null;
  try {
    const url = new URL(env.NEWS_AUTH_ORIGIN ?? '');
    if (url.username || url.password || url.pathname !== '/' || url.search || url.hash) return null;
    const local = ['localhost', '127.0.0.1', '[::1]'].includes(url.hostname);
    if (url.protocol !== 'https:' && !(local && url.protocol === 'http:' && env.NODE_ENV !== 'production')) return null;
    return url.origin;
  } catch { return null; }
}
export function validPassword(password, confirmation) {
  // Preserve whitespace. Match this minimum with Supabase's configured policy.
  return typeof password === 'string' && password.length >= 12 && password.length <= 128 && password === confirmation;
}
/** @param {any} client @param {unknown} email @param {string} origin */
export async function requestRecovery(client, email, origin) {
  if (typeof email !== 'string' || email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) return 'invalid';
  try {
    const { error } = await client.auth.resetPasswordForEmail(email.trim(), { redirectTo: origin + callbackPath });
    return error ? 'unavailable' : 'sent';
  } catch { return 'unavailable'; }
}
/** @param {any} client @param {URL} url */
export async function exchangeRecovery(client, url) {
  const codes = url.searchParams.getAll('code');
  if (url.searchParams.has('error') || codes.length !== 1 || !codes[0] || codes[0].length > 2048) return false;
  try { const { error } = await client.auth.exchangeCodeForSession(codes[0]); return !error; }
  catch { return false; }
}
/** @param {any} client @param {unknown} password @param {unknown} confirmation */
export async function changeRecoveredPassword(client, password, confirmation) {
  if (!validPassword(password, confirmation)) return 'invalid';
  try {
    const { data, error } = await client.auth.getUser();
    if (error || !data.user) return 'expired';
    const result = await client.auth.updateUser({ password });
    if (result.error) return 'rejected';
    // Do not report failure and encourage another password update if only logout failed.
    try {
      const signout = await client.auth.signOut({ scope: 'global' });
      return signout.error ? 'saved-signout-failed' : 'saved';
    } catch { return 'saved-signout-failed'; }
  } catch { return 'unavailable'; }
}
