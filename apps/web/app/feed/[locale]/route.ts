import { rssResponse } from '../../../lib/publication-exports';
export const dynamic = 'force-dynamic';
export async function GET(_request: Request, { params }: { params: Promise<{ locale: string }> }) {
  return rssResponse((await params).locale, null);
}
