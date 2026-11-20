import { NextResponse, type NextRequest } from 'next/server';
import { cookies } from 'next/headers';
import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { isConfigured } from '../../../../lib/supabase';
import { emailLinkConfig, pendingEmailLink, pendingEmailLinkCookie } from '../../../../lib/editor-email-link';
export const dynamic = 'force-dynamic';
export async function GET(request: NextRequest) {
  const config = emailLinkConfig();
  const store = await cookies();
  const codes = request.nextUrl.searchParams.getAll('code');
  const cookieState = new Map(store.getAll().map(({ name, value }) => [name, value]));
  const staged: { name: string; value: string; options: CookieOptions }[] = [];
  let allowed = false;
  if (config && isConfigured() && request.nextUrl.origin === config.origin &&
      pendingEmailLink(store.get(pendingEmailLinkCookie)?.value) !== null &&
      !request.nextUrl.searchParams.has('error') && codes.length === 1 && codes[0].length > 0 && codes[0].length <= 2048) {
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
    try {
      const exchange = await client.auth.exchangeCodeForSession(codes[0]);
      if (!exchange.error) {
        const { data, error } = await client.auth.getUser();
        if (!error && data.user?.id === config.userId && data.user.email?.toLowerCase() === config.email) {
          const check = await client.rpc('editor_list_stories');
          allowed = !check.error && Array.isArray(check.data);
        }
        if (!allowed) await client.auth.signOut({ scope: 'local' });
      }
    } catch { allowed = false; } // Never log code, token, URL or provider errors.
  }
  const response = new NextResponse(null, { status: 303, headers: {
    Location: allowed ? '/editor' : '/editor/email-link?status=invalid',
    'Cache-Control': 'private, no-store', 'Referrer-Policy': 'no-referrer', 'X-Robots-Tag': 'noindex, nofollow',
  } });
  response.cookies.delete(pendingEmailLinkCookie);
  // Authentication alone grants nothing: commit browser session only after the
  // existing UUID/email and live active-editor RPC all pass. No fragment intake.
  if (allowed) for (const cookie of staged) response.cookies.set(cookie.name, cookie.value, cookie.options);
  return response;
}
