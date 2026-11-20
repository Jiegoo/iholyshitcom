import { NextResponse, type NextRequest } from 'next/server';
import { createClient, isConfigured } from '../../../../lib/supabase';
import { recoveryOrigin, exchangeRecovery } from '../../../../lib/password-recovery.mjs';
export const dynamic = 'force-dynamic';
export async function GET(request: NextRequest) {
  const origin = recoveryOrigin();
  // Fixed local redirect destinations; never follow caller-supplied next/redirect URLs.
  let path = '/editor/forgot-password?status=expired';
  if (origin && isConfigured()) {
    if (await exchangeRecovery(await createClient(), request.nextUrl)) path = '/editor/update-password';
  }
  const response = new NextResponse(null, { status: 303, headers: { Location: path } });
  response.headers.set('Cache-Control', 'private, no-store');
  response.headers.set('Referrer-Policy', 'no-referrer');
  response.headers.set('X-Robots-Tag', 'noindex, nofollow');
  return response;
}
