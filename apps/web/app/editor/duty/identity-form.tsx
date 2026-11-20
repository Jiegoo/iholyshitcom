'use client';
import { useActionState } from 'react';
import { createDutyIdentity,type DutyState } from './actions';
const initial:DutyState={message:''};
export function IdentityForm(){
 const [state,action,pending]=useActionState(createDutyIdentity,initial);
 return <section><h2>添加或轮换机器人</h2><p>每个机器人独立密钥；同名创建会立即使旧密钥失效。</p>
  <form action={action}><label>机器人名称 <input name="bot" placeholder="例如 muse、grok、chatgpt" required pattern="[a-z0-9][a-z0-9_-]{0,63}" /></label> <button disabled={pending}>创建专用密钥</button></form>
  {state.message&&<p role="status">{state.message}</p>}{state.token&&<label>{state.bot} 的一次性密钥 <input type="password" readOnly value={state.token} autoComplete="off" onFocus={event=>event.currentTarget.select()}/></label>}
 </section>;
}
