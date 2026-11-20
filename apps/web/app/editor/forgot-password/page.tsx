import Link from 'next/link';
import { recoveryOrigin } from '../../../lib/password-recovery.mjs';
import { isConfigured } from '../../../lib/supabase';
import { requestPasswordRecovery } from '../recovery-actions';
import RecoverySubmit from '../recovery-submit';
export const dynamic = 'force-dynamic';
export const metadata = { title: '重设密码｜Newsroom', robots: { index: false, follow: false } };
export default async function ForgotPassword({ searchParams }: { searchParams: Promise<{ status?: string }> }) {
  const { status } = await searchParams;
  const enabled = recoveryOrigin() && isConfigured();
  return <main><h1>重设密码</h1>
    <p>使用现有编辑账号邮箱，并在同一浏览器打开邮件链接。</p>
    {status === 'sent' && <p role="status">如该账号可接收恢复邮件，已请求发送链接，请同时检查垃圾邮件。</p>}
    {status === 'saved' && <p role="status">密码已更新，请使用新密码登录。</p>}
    {status === 'invalid' && <p role="alert">请输入有效邮箱。</p>}
    {status === 'expired' && <p role="alert">链接已失效，请在此浏览器重新申请。</p>}
    {(!enabled || status === 'unavailable') && <p role="alert">密码恢复暂不可用。</p>}
    {enabled && <form action={requestPasswordRecovery}><label>邮箱<input name="email" type="email" autoComplete="email" required maxLength={254} /></label><RecoverySubmit>发送恢复链接</RecoverySubmit></form>}
    <p><Link href="/editor">返回登录</Link></p>
  </main>;
}
