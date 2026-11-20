// Never let an environment flag label remote or production data as a demo.
export function localFixtureMode() {
  if (process.env.NEWS_LOCAL_FIXTURES !== 'true') return false;
  try { return ['localhost', '127.0.0.1', '[::1]'].includes(new URL(process.env.SUPABASE_URL ?? '').hostname); }
  catch { return false; }
}
