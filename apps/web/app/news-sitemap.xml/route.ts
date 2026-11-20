import { newsSitemapResponse } from '../../lib/publication-exports';
export const dynamic = 'force-dynamic';
export async function GET() { return newsSitemapResponse(); }
