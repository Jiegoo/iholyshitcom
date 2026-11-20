import type {Metadata} from 'next';
import {createClient,isConfigured} from '../../../lib/supabase';
import {changeTeamRole,createTeamAccount} from './actions';
export const dynamic='force-dynamic';
export const metadata:Metadata={title:'岗位管理｜Newsroom',robots:{index:false,follow:false}};
type Member={email:string;user_id:string;roles:string[];active:boolean};
const names:Record<string,string>={duty_editor:'旧值班编辑',website_editor:'网站编辑',reviewer:'审查员'};
function RoleSelect(){return <select name="role" required><option value="website_editor">网站编辑</option><option value="reviewer">审查员</option></select>}
export default async function TeamPage({searchParams}:{searchParams:Promise<{status?:string}>}){
 const query=await searchParams;if(!isConfigured())return <main>编辑服务尚未配置。</main>;
 const client=await createClient();const user=await client.auth.getUser();if(user.error||!user.data.user)return <main><a href="/editor">请先登录编辑后台</a></main>;
 const owner=await client.rpc('manual_is_owner');if(owner.error||owner.data!==true)return <main><a href="/editor">返回编辑后台</a><p>岗位管理仅限站长。</p></main>;
 const members=await client.rpc('owner_list_team');
 return <main className="manual-workspace"><a href="/editor">← 返回编辑后台</a><h1>岗位管理</h1>
  <p>站长创建人工账号并分配岗位，无需邮箱验证。编辑登录后可修改自己的资料和密码；外部 AI 值班编辑使用独立机器接口，不在此创建人工账号。</p>
  <p>网站编辑与审查员目前共用编辑和审查权限；来源许可和最终发布由站长控制。</p>
  {query.status==='saved'&&<p role="status">岗位已更新。</p>}{query.status==='created'&&<p role="status">账号及岗位已创建。</p>}
  {query.status==='account-missing'&&<p role="alert">未找到该账号，请先创建。</p>}{query.status==='configuration'&&<p role="alert">账号创建服务尚未配置。</p>}
  {query.status==='unconfirmed'&&<p role="alert">创建结果未确认，请先核对账号是否存在，再重试。</p>}
  {query.status==='partial'&&<p role="alert">账号已创建，但岗位分配及自动清理未完成，请先核对账号状态。</p>}{query.status==='failed'&&<p role="alert">操作未完成，请检查账号和权限。</p>}
  <h2>创建人工账号并分配岗位</h2><form action={createTeamAccount}><label>邮箱 <input name="email" type="email" required maxLength={254}/></label><label>初始密码 <input name="password" type="password" required minLength={12} maxLength={128} autoComplete="new-password"/></label><label>岗位 <RoleSelect/></label><button>创建账号</button></form>
  <h2>调整已有账号岗位</h2><form action={changeTeamRole}><label>邮箱 <input name="email" type="email" required maxLength={254}/></label><label>岗位 <RoleSelect/></label><button name="operation" value="grant">授予岗位</button><button name="operation" value="revoke">撤销岗位</button></form>
  <h2>已分配岗位</h2>{members.error?<p role="alert">无法读取岗位记录。</p>:(members.data as Member[]).length===0?<p>暂未分配岗位。</p>:<ul>{(members.data as Member[]).map(m=><li key={m.user_id}>{m.email} · {m.roles.map(r=>names[r]??r).join('、')} · {m.active?'已启用':'已停用'}</li>)}</ul>}
 </main>;
}
