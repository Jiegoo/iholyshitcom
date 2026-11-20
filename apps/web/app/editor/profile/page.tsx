import type {Metadata} from 'next';
import {createClient,isConfigured} from '../../../lib/supabase';
import {updateProfile} from './actions';
export const dynamic='force-dynamic';
export const metadata:Metadata={title:'个人资料｜Newsroom',robots:{index:false,follow:false}};
export default async function Profile({searchParams}:{searchParams:Promise<{status?:string}>}){
 const {status}=await searchParams;if(!isConfigured())return <main>编辑服务尚未配置。</main>;
 const client=await createClient();const user=await client.auth.getUser();if(user.error||!user.data.user)return <main><a href="/editor">请先登录编辑后台</a></main>;
 const name=typeof user.data.user.user_metadata?.display_name==='string'?user.data.user.user_metadata.display_name:'';
 return <main className="manual-workspace"><a href="/editor">← 返回编辑后台</a><h1>个人资料与密码</h1><p>账号：{user.data.user.email}</p>
 {status==='saved'&&<p role="status">资料已更新。</p>}{status==='failed'&&<p role="alert">操作未完成，请检查输入后重试。</p>}
 <form action={updateProfile}><label>显示名称 <input name="display_name" defaultValue={name} maxLength={80} required/></label><button name="action" value="name">保存名称</button></form>
 <form action={updateProfile}><label>新密码 <input name="password" type="password" minLength={12} maxLength={128} autoComplete="new-password" required/></label><label>确认新密码 <input name="confirmation" type="password" minLength={12} maxLength={128} autoComplete="new-password" required/></label><button name="action" value="password">修改密码</button></form></main>;
}
