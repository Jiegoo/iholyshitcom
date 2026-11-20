import type { Metadata } from 'next';
import { EditorWorkspace } from './editor-workspace';
import { emailLinkConfig } from '../../lib/editor-email-link';
import { createClient, isConfigured } from '../../lib/supabase';
import { login, logout } from './actions';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = { title: '编辑管理｜Newsroom', description: '文章和网站运营管理后台。', robots: { index: false, follow: false } };
type Search = Promise<{status?:string;tab?:string}>;
function Input({name,label,type='text'}:{name:string;label:string;type?:string}) {
 return <label>{label}<input name={name} type={type} required /></label>;
}
export default async function Editor({searchParams}:{searchParams:Search}) {
 const query = await searchParams;
  if (!isConfigured()) return <main><h1>编辑管理</h1><p>编辑服务尚未配置。</p></main>;
  const client = await createClient();
  const { data: identity, error: authError } = await client.auth.getClaims();
  if (authError || !identity?.claims?.sub) return <main><h1>编辑登录</h1>{query.status === 'login' && <p role="alert">登录失败，请检查邮箱和密码。</p>}<form action={login}><Input name="email" label="邮箱" type="email" /><Input name="password" label="密码" type="password" /><button>登录</button></form><p><a href="/editor/forgot-password">忘记密码</a></p>{emailLinkConfig() && <p><a href="/editor/email-link">使用邮箱登录链接</a></p>}</main>;
 const owner = await client.rpc('manual_is_owner');
 if (!owner.error && owner.data === true) return <EditorWorkspace client={client} initialTab={query.tab}/>;
 return <main><h1>编辑管理</h1><p role="alert">此账号没有可用的编辑访问权限。</p><a href="/editor/profile">个人资料</a><form action={logout}><button>退出登录</button></form></main>;
}
