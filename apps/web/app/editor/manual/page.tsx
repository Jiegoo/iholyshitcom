import type { Metadata } from 'next';
import { createClient, isConfigured } from '../../../lib/supabase';
import { ManualEditor } from './manual-editor';
import { manageManualPublication } from './actions';

export const dynamic='force-dynamic';
export const metadata:Metadata={title:'站长人工编辑｜Newsroom',robots:{index:false,follow:false}};
const uuid=/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
export default async function ManualPage({searchParams}:{searchParams:Promise<{id?:string;status?:string;new?:string;page?:string;q?:string}>}){
 const query=await searchParams;if(!isConfigured())return <main>编辑服务尚未配置。</main>;
 const client=await createClient();const user=await client.auth.getUser();if(user.error||!user.data.user)return <main><a href="/editor">请先登录编辑后台</a></main>;
 const access=await client.rpc('manual_is_owner');if(access.error||access.data!==true)return <main><a href="/editor">返回编辑后台</a><h1>站长人工编辑</h1><p>此入口仅对获授权的站长开放。</p></main>;
 const editing=Boolean(query.id)||query.new==='1';
 const [list,media]=await Promise.all([editing?Promise.resolve(null):client.rpc('manual_list_articles'),editing?client.rpc('manual_list_media'):Promise.resolve(null)]);
 const selected=query.id&&uuid.test(query.id)?await client.rpc('manual_get_article_with_topics',{p_article:query.id}):null;
 const duty=query.id&&uuid.test(query.id)?await client.rpc('owner_duty_submission',{p_article:query.id}):null;
 if(selected?.error||query.id&&(!uuid.test(query.id)||!selected?.data))return <main><a href="/editor/manual">返回人工稿件</a><p role="alert">稿件不可用或无权限。</p></main>;
 const entries=(list?.data??[]) as {id:string;slug:string;status:string;zh_title:string;en_title:string}[];
 const term=typeof query.q==='string'?query.q.trim().slice(0,100):'';
 const filtered=term?entries.filter(item=>[item.zh_title,item.en_title,item.slug].some(value=>value?.toLowerCase().includes(term.toLowerCase()))):entries;
 const pages=Math.max(1,Math.ceil(filtered.length/20));
 const requested=Number(query.page);const page=Number.isInteger(requested)&&requested>0?Math.min(requested,pages):1;
 const visible=filtered.slice((page-1)*20,page*20);
 const pageUrl=(n:number)=>`/editor/manual?${new URLSearchParams({...(term?{q:term}:{}),page:String(n)})}`;
 return <main className="manual-workspace"><a className="manual-back" href='/editor'>← 返回工作台</a><div className="manual-page-heading"><div><p className="editor-kicker">CONTENT / ARTICLES</p><h1>{editing?(selected?.data?'编辑文章':'新建稿件'):'人工稿件'}</h1><p>{editing?'编辑当前文章及管理发布。':'查看、搜索和管理双语文章。'}</p></div>{!editing&&<div><a className="editor-primary-action" href="/editor/manual?new=1">＋ 新建稿件</a></div>}</div>
  {query.status==='published'&&<p role="status">中英文版本已发布。</p>}
  {query.status==='retracted'&&<p role="status">该稿件已下线。</p>}
  {query.status==='publication-failed'&&<p role="alert">操作未完成，请确认稿件版本、评分与权限。</p>}
  {query.status==='saved'&&<p role="status">双语草稿已保存；公开内容仅在发布后更新。</p>}
  {query.status==='conflict'&&<p role="alert">稿件已在其他页面修改，请重新打开后再保存。</p>}
  {query.status==='configuration'&&<p role="alert">编辑站点地址尚未配置或不匹配，未提交。</p>}
  {query.status==='rejected'&&<p role="alert">保存失败，请检查字段、来源链接和正文格式。</p>}
  {query.status==='unconfirmed'&&<p role="alert">保存结果未确认，请先检查稿件列表。</p>}
  {!editing&&(list?.error?<p role="alert">无法读取人工稿件列表。</p>:<section className="manual-article-list"><div className="manual-section-head"><div><h2>稿件列表</h2><p>选择稿件，在独立页面编辑或管理发布。</p></div><span>{filtered.length} 篇</span></div><form className="manual-list-search" action="/editor/manual"><label htmlFor="manual-search">搜索稿件</label><input id="manual-search" name="q" defaultValue={term} maxLength={100} placeholder="标题或网址标识"/><button type="submit">搜索</button>{term&&<a href="/editor/manual">清除</a>}</form>{filtered.length===0?<div className="manual-empty"><strong>{term?'没有匹配的稿件':'还没有人工稿件'}</strong><p>{term?'换个关键词再试。':'创建第一篇文章，开始编辑中英文内容。'}</p>{!term&&<a href="/editor/manual?new=1">新建稿件 →</a>}</div>:<><ul>{visible.map(item=><li key={item.id}><a href={`/editor/manual?id=${item.id}`}><span><strong>{item.zh_title}</strong><small>{item.slug}</small></span><span className={`manual-status status-${item.status}`}>{item.status==='draft'?'草稿':item.status==='published'?'已发布':'已下线'}</span><span aria-hidden="true">→</span></a></li>)}</ul>{pages>1&&<nav className="manual-pagination" aria-label="稿件分页">{page>1&&<a href={pageUrl(page-1)}>← 上一页</a>}<span>第 {page} / {pages} 页</span>{page<pages&&<a href={pageUrl(page+1)}>下一页 →</a>}</nav>}</>}</section>)}
  {selected?.data&&duty?.data&&<section className="manual-publication"><h2>值班编辑投稿</h2><p>机器人：{duty.data.bot_id}</p><ul>{(duty.data.sources as {name:string;title:string;url:string;published_at:string|null}[]).map((source,index)=><li key={index}><a href={source.url} target="_blank" rel="noreferrer">{source.name}：{source.title}</a> · 来源标注时间：{source.published_at || "未提供"}</li>)}</ul><p>来源时间由投稿机器人提供，请审核时核对。</p></section>}
  {selected?.data?.status==='published'&&<section className="manual-publication"><h2>下线管理</h2>
   <form action={manageManualPublication}><input type="hidden" name="article_id" value={selected.data.id}/><label>下线原因 <input name="reason" maxLength={1000} required/></label><button type="submit" name="operation" value="retract">下线文章</button></form>
  </section>}
  {(selected?.data||query.new==='1')&&<section className="manual-editor-section"><h2>{selected?.data?'编辑文章':'新建双语稿件'}</h2><ManualEditor key={selected?.data?.revision_id??'new'} draft={selected?.data??null} robotScore={duty?.data?.suggested_score??null} initialMedia={media?.error?[]:media?.data??[]} supabaseUrl={process.env.SUPABASE_URL!} publishableKey={process.env.SUPABASE_PUBLISHABLE_KEY!} /></section>}
 </main>;
}
