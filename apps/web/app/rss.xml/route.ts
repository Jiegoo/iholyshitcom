import { rssResponse } from '../../lib/publication-exports';

export const dynamic = 'force-dynamic';

export async function GET() {
  return rssResponse('en', null);
}
