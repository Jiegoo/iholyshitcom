import { rssResponse } from '../../../../lib/publication-exports';
export const dynamic = 'force-dynamic';
export async function GET(_request: Request, { params }: { params: Promise<{ locale: string; channel: string }> }) {
  const { locale, channel } = await params;
  return rssResponse(locale, channel);
}
