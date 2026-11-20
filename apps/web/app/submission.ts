'use server';

import { createClient } from '@supabase/supabase-js';
import { isConfigured } from '../lib/supabase';

export type SubmissionState = { message: string; success: boolean };
export async function submitCandidate(_state: SubmissionState, form: FormData): Promise<SubmissionState> {
  const failure = { message: '提交失败，请检查链接和标题后重试。', success: false };
  if (process.env.NEWS_DEMO === 'true' || process.env.NEWS_TIPS_ENABLED !== 'true' || !isConfigured()) return { message: '投稿暂未开放。', success: false };
  const id = form.get('id'), input = form.get('url'), title = form.get('title'), trap = form.get('website');
  if (typeof id !== 'string' || !/^[0-9a-f-]{36}$/i.test(id) || typeof input !== 'string' || typeof title !== 'string'
    || (typeof trap === 'string' && trap !== '') || title.trim().length < 1 || title.trim().length > 200 || input.length > 2048) return failure;
  let url: URL;
  try { url = new URL(input); } catch { return failure; }
  if (url.protocol !== 'https:' || url.username || url.password || /\s/.test(input)) return failure;
  const client = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_PUBLISHABLE_KEY!, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
    global: { fetch: (value, init) => fetch(value, { ...init, signal: AbortSignal.timeout(5000), cache: 'no-store' }) },
  });
  const { error } = await client.rpc('submit_candidate', { p_id: id, p_url: url.href, p_title: title.trim() });
  return error ? failure : { message: '已收到候选线索，等待编辑审阅；不会自动抓取或发布。', success: true };
}
