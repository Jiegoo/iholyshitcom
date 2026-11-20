import {createClient} from '@supabase/supabase-js';
import {NextResponse, type NextRequest} from 'next/server';
import {createClient as createSessionClient} from '../../../lib/supabase';
import {isCommentAllowed} from '../../../lib/comment-moderation';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function validArticle(type: unknown, slug: unknown) {
  return (type === 'manual' || type === 'story') &&
    typeof slug === 'string' && slug.length <= 200 &&
    /^[a-z0-9]+(-[a-z0-9]+)*$/.test(slug);
}

export async function GET(request: NextRequest) {
  const type = request.nextUrl.searchParams.get('type');
  const slug = request.nextUrl.searchParams.get('slug');
  const offset = request.nextUrl.searchParams.get('offset') ?? '0';
  if (!validArticle(type, slug) || !/^\d{1,6}$/.test(offset) || Number(offset) > 100000) {
    return new Response(null, {status: 400});
  }
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return new Response(null, {status: 503});

  try {
    const db = createClient(url, key, {auth: {persistSession: false, autoRefreshToken: false}});
    const {data, error} = await db.rpc('list_article_comments_v2', {
      p_type: type, p_slug: slug, p_offset: Number(offset),
    });
    if (error || !Array.isArray(data)) return new Response(null, {status: 503});
    const page = data.slice(0, 20);
    return NextResponse.json({
      comments: page.filter(comment => typeof comment.body === 'string' && isCommentAllowed(comment.body)).map(comment=>({...comment,display_name:typeof comment.display_name==='string'&&isCommentAllowed(comment.display_name)?comment.display_name:null})),
      hasMore: data.length > 20,
      // Advance over filtered rows too, otherwise pagination repeats or skips rows.
      nextOffset: Number(offset) + page.length,
    }, {headers: {'Cache-Control': 'no-store'}});
  } catch {
    return new Response(null, {status: 503});
  }
}

export async function POST(request: NextRequest) {
  try {
    const origin = new URL(request.headers.get('origin') ?? '');
    if (!['http:', 'https:'].includes(origin.protocol) || origin.host !== request.headers.get('host')) {
      return new Response(null, {status: 403});
    }
  } catch {
    return new Response(null, {status: 403});
  }
  if (Number(request.headers.get('content-length') ?? 0) > 4096) return new Response(null, {status: 413});
  let value: {type?: unknown; slug?: unknown; body?: unknown};
  try {
    const raw = await request.text();
    if (Buffer.byteLength(raw) > 4096) return new Response(null, {status: 413});
    value = JSON.parse(raw);
  } catch {
    return new Response(null, {status: 400});
  }
  if (!value || !validArticle(value.type, value.slug) || typeof value.body !== 'string' ||
      !value.body.trim() || Array.from(value.body.trim()).length > 500) {
    return new Response(null, {status: 400});
  }
  if (!isCommentAllowed(value.body)) {
    return NextResponse.json({code: 'COMMENT_NOT_ALLOWED'}, {
      status: 422, headers: {'Cache-Control': 'no-store'},
    });
  }
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return new Response(null, {status: 503});

  try {
    const db = createClient(url, key, {auth: {persistSession: false, autoRefreshToken: false}});
    let reader: string | null = null;
    try { const session=await createSessionClient();const {data:{user}}=await session.auth.getUser();reader=user?.id??null; } catch {}
    const {data, error} = await db.rpc('submit_article_comment_v2', {
      p_type: value.type, p_slug: value.slug, p_body: value.body.trim(), p_reader:reader,
    });
    if (error) return new Response(null, {status: 503});
    if (!Array.isArray(data) || !data[0]) return new Response(null, {status: 404});
    return NextResponse.json({comment: data[0]}, {status: 201, headers: {'Cache-Control': 'no-store'}});
  } catch {
    return new Response(null, {status: 503});
  }
}
