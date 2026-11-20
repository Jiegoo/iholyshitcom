import Link from 'next/link';
import { emailLinkConfig } from '../../../lib/editor-email-link';
import { isConfigured } from '../../../lib/supabase';
import { sendEditorMagicLink } from './actions';
export const dynamic = 'force-dynamic';
export const metadata = { title: '邮箱链接登录｜Newsroom', robots: { index: false, follow: false } };
export default async function EmailLink({ searchParams }: { searchParams: Promise<{ status?: string }> }) {
  const { status } = await searchParams;
  const enabled = !!emailLinkConfig() && isConfigured();
  return <main><h1>邮箱链接登录</h1><p>仅限已登记的现有编辑账号，不创建账号。请在发起申请的同一浏览器打开邮件链接。</p>
    {(!enabled || status === 'unavailable') && <p role="alert">邮箱链接登录暂不可用。</p>}
    {status === 'sent' && <p role="status">如该邮箱符合登录条件，请查看本次登录邮件。不要把邮件链接、令牌或密码发到聊天中。</p>}
    {status === 'invalid' && <p role="alert">登录未完成或申请已失效，请重新申请。</p>}
    {enabled && <form action={sendEditorMagicLink}><label>编辑邮箱<input name="email" type="email" autoComplete="email" maxLength={254} required /></label><button>发送登录链接</button></form>}
    <p><Link href="/editor">返回密码登录</Link></p></main>;
}
