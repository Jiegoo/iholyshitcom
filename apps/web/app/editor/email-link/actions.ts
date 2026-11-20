'use server';
import { cookies, headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { isConfigured } from '../../../lib/supabase';
import { emailLinkConfig, pendingEmailLink, pendingEmailLinkCookie } from '../../../lib/editor-email-link';
export async function sendEditorMagicLink(form: FormData) {
  const config = emailLinkConfig();
  if (!config || !isConfigured() || (await headers()).get('origin') !== config.origin) redirect('/editor/email-link?status=unavailable');
  const email = form.get('email');
  if (typeof email !== 'string' || email.trim().toLowerCase() !== config.email) redirect('/editor/email-link?status=sent');
  const store = await cookies();
  const prior = pendingEmailLink(store.get(pendingEmailLinkCookie)?.value);
  if (prior !== null && Date.now() - prior < 60000) redirect('/editor/email-link?status=sent');
  // This browser cooldown is UX only. Supabase Auth limits/SMTP quotas are the
  // authoritative cross-instance controls, reviewed separately before enabling.
  const cookieState = new Map(store.getAll().map(({ name, value }) => [name, value]));
  const staged: { name: string; value: string; options: CookieOptions }[] = [];
  let sent = false;
  try {
    const client = createServerClient(process.env.SUPABASE_URL!, process.env.SUPABASE_PUBLISHABLE_KEY!, {
      auth: { flowType: 'pkce' },
      cookies: {
        getAll: () => Array.from(cookieState, ([name, value]) => ({ name, value })),
        setAll: (values) => {
          for (const { name, value } of values) cookieState.set(name, value);
          staged.push(...values);
        },
      },
    });
    const result = await client.auth.signInWithOtp({ email: config.email, options: {
      shouldCreateUser: false, emailRedirectTo: `${config.origin}/editor/email-link/callback`,
    } });
    sent = !result.error;
  } catch { /* No auth errors, callback URLs or token data in logs. */ }
  if (sent) {
    // Only PKCE challenge state is established here, not a new login session.
    for (const cookie of staged) store.set(cookie.name, cookie.value, cookie.options);
    store.set(pendingEmailLinkCookie, String(Date.now()), { httpOnly: true, secure: true, sameSite: 'lax', path: '/', maxAge: 600 });
  }
  redirect(`/editor/email-link?status=${sent ? 'sent' : 'unavailable'}`);
}
