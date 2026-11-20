import Link from 'next/link';
import { createClient, isConfigured } from '../../../lib/supabase';
import { recoveryOrigin } from '../../../lib/password-recovery.mjs';
import { saveRecoveredPassword } from '../recovery-actions';
import RecoverySubmit from '../recovery-submit';
export const dynamic = 'force-dynamic';
export const metadata = { title: '设置密码｜Newsroom', robots: { index: false, follow: false } };
export default async function UpdatePassword({ searchParams }: { searchParams: Promise<{ status?: string }> }) {
  const { status } = await searchParams;
  if (!recoveryOrigin() || !isConfigured()) return <main><h1>密码恢复暂不可用</h1></main>;
  if (status === 'saved-signout-failed') return <main><h1>密码已更新</h1><p role="alert">自动退出未能确认，无需再次改密，请到编辑页退出登录。</p><Link href="/editor">编辑页</Link></main>;
  const client = await createClient();
  const { data, error } = await client.auth.getUser();
  if (error || !data.user) return <main><h1>恢复会话已过期</h1><Link href="/editor/forgot-password">重新申请链接</Link></main>;
  return <main><h1>设置新密码</h1><p>使用 12–128 位独立密码，仅在本页输入，不要发到聊天。保存后退出账号会话；现有访问令牌可能持续有效至到期。</p>
    {status === 'invalid' && <p role="alert">两次密码须一致且长度为 12–128 位。</p>}
    {status === 'rejected' && <p role="alert">密码未被接受，请换用更强密码或重新申请恢复链接。</p>}
    {['expired', 'unavailable'].includes(status ?? '') && <p role="alert">未能更新密码，会话过期请重新申请链接。</p>}
    <form action={saveRecoveredPassword}><label>新密码<input type="password" name="password" autoComplete="new-password" minLength={12} maxLength={128} required /></label><label>确认密码<input type="password" name="confirmation" autoComplete="new-password" minLength={12} maxLength={128} required /></label><RecoverySubmit>保存密码并退出</RecoverySubmit></form>
    <p><Link href="/editor">取消</Link></p></main>;
}
