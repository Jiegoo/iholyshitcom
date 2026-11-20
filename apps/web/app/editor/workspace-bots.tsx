'use client';
import {useActionState} from 'react';
import {IdentityForm} from './duty/identity-form';
import {disableDutyIdentityInline} from './duty/actions';
type Bot={bot_id:string;enabled:boolean;updated_at:string};
function DisableBot({bot}:{bot:string}){const [state,action,pending]=useActionState(disableDutyIdentityInline,{message:''});return <form action={action}><input type="hidden" name="bot" value={bot}/><button disabled={pending}>{pending?'停用中…':'停用'}</button>{state.message&&<span role="status">{state.message}</span>}</form>}
export function WorkspaceBots({bots}:{bots:Bot[]}){return <><div className="editor-page-heading"><div><p className="editor-kicker">AI / DUTY EDITORS</p><h1>值班机器人</h1><p>管理 Muse、Grok 等外部机器人的独立投稿身份。有效投稿会直接发布。</p></div></div><div className="workspace-card workspace-bots"><IdentityForm/><section><div className="workspace-card-heading"><div><h2>机器人列表</h2><p>每个机器人使用独立密钥。</p></div><span>{bots.length} 个</span></div>{bots.length===0?<p>还没有添加机器人。</p>:<ul>{bots.map(bot=><li key={bot.bot_id}><div><strong>{bot.bot_id}</strong><small>{bot.enabled?'已启用':'已停用'}</small></div>{bot.enabled&&<DisableBot bot={bot.bot_id}/>}</li>)}</ul>}</section></div></>}
