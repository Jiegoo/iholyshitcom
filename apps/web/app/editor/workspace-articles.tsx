'use client';
import {useMemo,useState} from 'react';
import {setArticleVisibility} from './article-visibility-actions';
import {getArticleBodyForCopy} from './article-copy-actions';
import {copyArticleLink as copyText} from '../../lib/article-share.mjs';
import {copyLoadedArticleText} from '../../lib/article-copy.mjs';
export type WorkspaceArticle={id:string;slug:string;status:string;zh_title:string;en_title:string};
type ReadStat={content_type:'manual'|'story';slug:string;reads:number};
type IndexStat={content_type:'manual'|'story';slug:string;base_score:number|null;clicks:number;dislikes:number;shit:number;score:number|null};
export function WorkspaceArticles({items,stats=null,reads=null}:{items:WorkspaceArticle[];stats?:IndexStat[]|null;reads?:ReadStat[]|null}){
 const [overrides,setOverrides]=useState<Record<string,string>>({});
 const [busy,setBusy]=useState<Record<string,boolean>>({});
 const [messages,setMessages]=useState<Record<string,string>>({});
 const [copyBusy,setCopyBusy]=useState<Record<string,boolean>>({});
 const [manualCopy,setManualCopy]=useState<Record<string,string>>({});
 async function copyArticle(item:WorkspaceArticle,part:'title'|'body'){
  if(copyBusy[item.id])return;
  setCopyBusy(value=>({...value,[item.id]:true}));setMessages(value=>({...value,[item.id]:''}));setManualCopy(value=>({...value,[item.id]:''}));
  try{
   const result=part==='title'?{text:item.zh_title||item.en_title,copied:await copyText(item.zh_title||item.en_title)}:await copyLoadedArticleText(async()=>{
    const response=await getArticleBodyForCopy(item.id,item.zh_title?'zh':'en');
    if(!response.text)throw Error(response.message);return response.text;
   });
   if(!result.copied)setManualCopy(value=>({...value,[item.id]:result.text}));
   setMessages(value=>({...value,[item.id]:result.copied?(part==='title'?'标题已复制。':'正文已复制，不含网址。'):'浏览器未允许自动复制，请选中下方文字复制。'}));
  }catch{setMessages(value=>({...value,[item.id]:'复制失败，请刷新页面或重新登录后重试。'}));}
  finally{setCopyBusy(value=>({...value,[item.id]:false}));}
 }
 async function changeVisibility(item:WorkspaceArticle,published:boolean){
  if(busy[item.id])return;
  setBusy(value=>({...value,[item.id]:true}));setMessages(value=>({...value,[item.id]:''}));
  try{
   const result=await setArticleVisibility(item.id,published,item.status);
   setMessages(value=>({...value,[item.id]:result.message}));
   if(result.status)setOverrides(value=>({...value,[item.id]:result.status!}));
  }catch{setMessages(value=>({...value,[item.id]:'操作失败，请稍后重试。'}));}
  finally{setBusy(value=>({...value,[item.id]:false}));}
 }
 const statsBySlug=useMemo(()=>new Map((stats??[]).filter(s=>s.content_type==='manual').map(s=>[s.slug,s])),[stats]);
 const readsBySlug=useMemo(()=>new Map((reads??[]).filter(s=>s.content_type==='manual').map(s=>[s.slug,s.reads])),[reads]);
 const [query,setQuery]=useState('');const [status,setStatus]=useState('all');const [page,setPage]=useState(1);
 const matches=useMemo(()=>items.map(item=>({...item,status:overrides[item.id]??item.status})).filter(item=>(status==='all'||item.status===status)&&[item.zh_title,item.en_title,item.slug].some(v=>v?.toLowerCase().includes(query.trim().toLowerCase()))),[items,overrides,query,status]);
 const pages=Math.max(1,Math.ceil(matches.length/20));const current=Math.min(page,pages);const visible=matches.slice((current-1)*20,current*20);
 return <><div className="editor-page-heading"><div><p className="editor-kicker">CONTENT / ARTICLES</p><h1>文章管理</h1><p>在列表复制标题、纯文本正文或直接上线下线；点击标题进入文章编辑。</p></div><a className="editor-primary-action" href="/editor/manual?new=1">＋ 新建文章</a></div>
  <section className="workspace-card"><div className="workspace-card-heading"><div><h2>文章列表</h2><p>搜索与筛选无需重新加载页面；喜欢每 10 次加 1 分，不喜欢每 10 次减 1 分，Shit 每 3 次减 1 分。</p><p>阅读量按同一浏览器每篇每天一次去重，统计近 30 个 UTC 自然日；仅包含同意统计的阅读。</p>{stats===null&&<p role="alert">暂时无法读取互动统计。</p>}{reads===null&&<p role="alert">暂时无法读取阅读量。</p>}</div><span>{matches.length} 篇</span></div>
   <div className="workspace-filters"><label>搜索文章<input value={query} onChange={e=>{setQuery(e.target.value);setPage(1)}} placeholder="标题或网址标识" /></label><label>状态<select value={status} onChange={e=>{setStatus(e.target.value);setPage(1)}}><option value="all">全部状态</option><option value="published">已发布</option><option value="draft">草稿</option><option value="retracted">已下线</option></select></label></div>
   {visible.length===0?<p className="workspace-empty">没有找到符合条件的文章。</p>:<ul className="workspace-articles">{visible.map(item=><li key={item.id} className="workspace-article-row"><a className="workspace-article-title" href={`/editor/manual?id=${encodeURIComponent(item.id)}`}><span><strong>{item.zh_title||item.en_title}</strong><small>{item.en_title} · {item.slug}</small>{item.status==='published'&&statsBySlug.has(item.slug)&&<small>原始分 {statsBySlug.get(item.slug)!.base_score} · 喜欢 {statsBySlug.get(item.slug)!.clicks} · 不喜欢 {statsBySlug.get(item.slug)!.dislikes} · Shit {statsBySlug.get(item.slug)!.shit} · 当前 {statsBySlug.get(item.slug)!.score} 分 · 阅读量（近30天）{reads===null?'暂不可用':(readsBySlug.get(item.slug)??0).toLocaleString('zh-CN')}</small>}{(item.status!=='published'||!statsBySlug.has(item.slug))&&<small>阅读量（近30天）{reads===null?'暂不可用':(readsBySlug.get(item.slug)??0).toLocaleString('zh-CN')}</small>}</span></a><div className="workspace-article-controls"><div className="article-visibility-buttons" role="group" aria-label={`${item.zh_title||item.en_title} 操作`} aria-busy={!!busy[item.id]||!!copyBusy[item.id]}><button type="button" disabled={copyBusy[item.id]} onClick={()=>void copyArticle(item,'title')}>复制标题</button><button type="button" disabled={copyBusy[item.id]} onClick={()=>void copyArticle(item,'body')}>复制正文</button><button type="button" disabled={busy[item.id]||item.status!=='retracted'} onClick={()=>void changeVisibility(item,true)}>上线</button><button type="button" disabled={busy[item.id]||item.status!=='published'} onClick={()=>void changeVisibility(item,false)}>下线</button></div><span className={`manual-status status-${item.status}`}>{item.status==='published'?'已发布':item.status==='draft'?'草稿':item.status==='retracted'?'已下线':item.status}</span></div>{messages[item.id]&&<p className="article-visibility-message" role="status">{messages[item.id]}</p>}{manualCopy[item.id]&&<label className="article-manual-copy">待复制文字<textarea readOnly rows={5} value={manualCopy[item.id]} onFocus={event=>event.currentTarget.select()}/></label>}</li>)}</ul>}
   {pages>1&&<nav className="manual-pagination" aria-label="文章分页"><button type="button" disabled={current===1} onClick={()=>setPage(current-1)}>上一页</button><span>第 {current} / {pages} 页</span><button type="button" disabled={current===pages} onClick={()=>setPage(current+1)}>下一页</button></nav>}
  </section></>;
}
