'use client';

import { useMemo, useState, useTransition, type FormEvent } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import Image from '@tiptap/extension-image';
import { EditorContent, useEditor, type Editor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { TableKit } from '@tiptap/extension-table';
import type { JSONContent } from '@tiptap/core';
import { saveManualDraft } from './actions';
import { channelTopics } from '../../../lib/channel-topics';

type ManualDraft={id:string;slug:string;status:string;revision_id:string;editor_score?:number|null;zh_title:string;en_title:string;zh_summary:string;en_summary:string;zh_document:JSONContent;en_document:JSONContent;primary_channel:string;related_channels:string[];topics:string[];tags:string[];source_links:{url:string;label:string}[]};
const channels=[['ai','人工智能动态'],['robotics','未来已来'],['industry','行业大动作'],['technology','Technology'],['internet','互联网动态'],['products','惊艳产品']] as const;
type MediaAsset={id:string;kind:'image';mime:string;bytes:number;created_at:string};
const editorExtensions=[StarterKit,TableKit,Image.configure({allowBase64:false})];
const blank:JSONContent={type:'doc',content:[{type:'paragraph'}]};
function Toolbar({editor}:{editor:Editor|null}){
 if(!editor)return null;
 const link=()=>{const url=window.prompt('输入 HTTPS 链接');if(!url)return;try{if(new URL(url).protocol!=='https:')return;editor.chain().focus().extendMarkRange('link').setLink({href:url}).run()}catch{/* Invalid URLs are not inserted. */}};
 const button=(label:string,action:()=>void,active=false)=><button type="button" aria-pressed={active} onClick={action}>{label}</button>;
 return <div className="manual-toolbar" aria-label="正文格式">
  {button('正文',()=>editor.chain().focus().setParagraph().run(),editor.isActive('paragraph'))}
  {button('标题',()=>editor.chain().focus().toggleHeading({level:2}).run(),editor.isActive('heading',{level:2}))}
  {button('小标题',()=>editor.chain().focus().toggleHeading({level:3}).run(),editor.isActive('heading',{level:3}))}
  {button('加粗',()=>editor.chain().focus().toggleBold().run(),editor.isActive('bold'))}
  {button('引用',()=>editor.chain().focus().toggleBlockquote().run(),editor.isActive('blockquote'))}
  {button('列表',()=>editor.chain().focus().toggleBulletList().run(),editor.isActive('bulletList'))}
  {button('编号列表',()=>editor.chain().focus().toggleOrderedList().run(),editor.isActive('orderedList'))}
  {button('链接',link,editor.isActive('link'))}
  {button('表格',()=>editor.chain().focus().insertTable({rows:3,cols:3,withHeaderRow:true}).run())}
  {button('代码块',()=>editor.chain().focus().toggleCodeBlock().run(),editor.isActive('codeBlock'))}
  {button('撤销',()=>editor.chain().focus().undo().run())}
 </div>;
}
export function ManualEditor({draft,robotScore,initialMedia,supabaseUrl,publishableKey}:{draft:ManualDraft|null;robotScore:number|null;initialMedia:MediaAsset[];supabaseUrl:string;publishableKey:string}){
 const [language,setLanguage]=useState<'zh'|'en'>('zh');
 const [message,setMessage]=useState('');
 const [saved,setSaved]=useState<{articleId:string;revisionId:string}|null>(draft?{articleId:draft.id,revisionId:draft.revision_id}:null);
 const [published,setPublished]=useState(draft?.status==='published');
 const [success,setSuccess]=useState(false);
 const [publicSlug,setPublicSlug]=useState('');
 const [pending,startTransition]=useTransition();
 const [media,setMedia]=useState<MediaAsset[]>(initialMedia.filter(asset=>asset.kind==='image')),[rights,setRights]=useState(''),[busy,setBusy]=useState(false);
 const browser=useMemo(()=>createBrowserClient(supabaseUrl,publishableKey),[supabaseUrl,publishableKey]);
 const [primary,setPrimary]=useState(draft?.primary_channel??'');
 const [topics,setTopics]=useState<string[]>(draft?.topics??[]);
 const zh=useEditor({immediatelyRender:false,extensions:editorExtensions,content:draft?.zh_document??blank});
 const en=useEditor({immediatelyRender:false,extensions:editorExtensions,content:draft?.en_document??blank});
 const activeEditor=language==='zh'?zh:en;
 function insertAsset(asset:MediaAsset){
  if(!activeEditor)return;const src=`/api/manual-media/${asset.id}`;
  activeEditor.chain().focus().setImage({src,alt:'站长上传图片'}).run();
 }
 async function upload(file:File){
  const kind=file.type.startsWith('image/')?'image':null;
  if(!kind||!['image/jpeg','image/png','image/webp','image/gif'].includes(file.type)||file.size<1||file.size>52428800){setMessage('请选择不超过 50 MB 的 JPG、PNG、WebP 或 GIF 文件。');return;}
  if(rights.trim().length<8){setMessage('请先填写至少 8 个字的素材权利说明。');return;}
  setBusy(true);setMessage('');let path:string|null=null;let registeredOk=false;
  try{
   const identity=await browser.auth.getUser();if(identity.error||!identity.data.user)throw new Error('login');
   const id=crypto.randomUUID();path=`${identity.data.user.id}/${id}`;
   const uploaded=await browser.storage.from('manual-media').upload(path,file,{contentType:file.type,upsert:false});if(uploaded.error){path=null;throw new Error('upload');}
   const registered=await browser.rpc('manual_register_media',{p_id:id,p_path:path,p_kind:kind,p_rights:rights.trim()});if(registered.error)throw new Error('register');registeredOk=true;
   const asset:MediaAsset={id,kind,mime:file.type,bytes:file.size,created_at:new Date().toISOString()};setMedia(previous=>[asset,...previous]);insertAsset(asset);setMessage('素材已登记并插入当前语言正文。');
  }catch{
   if(path&&!registeredOk){const removed=await browser.storage.from('manual-media').remove([path]);setMessage(removed.error?'素材登记失败，临时文件清理失败，请联系管理员。':'上传或素材登记失败，未插入正文。');}
   else if(registeredOk)setMessage('素材已登记，但未能插入正文；可从素材库重新插入。');
   else setMessage('上传失败，请检查登录状态、素材权限和存储配置。');
  }finally{setBusy(false);}
 }
 const publishOperation=published?'correction':'publish';
 const publishLabel=published?'发布更正':draft?.status==='retracted'?'重新发布':'站长发布';
 function submit(event:FormEvent<HTMLFormElement>){
  event.preventDefault();
  if(pending||busy||!zh||!en)return;
  setSuccess(false);
  setPublicSlug('');
  const button=(event.nativeEvent as SubmitEvent).submitter;
  const operation=button instanceof HTMLButtonElement?button.value:'save';
  const values=new FormData(event.currentTarget);
  for(const [name,locale,label] of [['slug','zh','文章网址标识'],['zh_title','zh','中文标题'],['zh_summary','zh','中文摘要'],['en_title','en','英文标题'],['en_summary','en','英文摘要']] as const){
   if(!String(values.get(name)??'').trim()){setLanguage(locale);setMessage(`请填写${label}。`);return;}
  }
  if(!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(String(values.get('slug')))){setMessage('网址标识只能包含英文小写、数字和连字符。');return;}
  if(!primary){setMessage('请选择主频道。');return;}
  if(!topics.length){setMessage('请至少选择一个主频道下的细分分类。');return;}
  const score=String(values.get('score')??'');
  if((score!==''||operation!=='save')&&!/^(?:0|[1-9][0-9]?|100)$/.test(score)){setMessage('请填写 0–100 的整数评分。');return;}
  if(operation!=='save'&&!String(values.get('reason')??'').trim()){setMessage('请填写发布说明。');return;}
  if(operation!=='save'&&(!zh.getText().trim()||!en.getText().trim())){
   setLanguage(!zh.getText().trim()?'zh':'en');
   setMessage('发布前请填写中英文正文。');return;
  }
  values.set('operation',operation);
  values.set('zh_document',JSON.stringify(zh.getJSON()));
  values.set('en_document',JSON.stringify(en.getJSON()));
  setMessage('');
  startTransition(async()=>{
   try {
    const result=await saveManualDraft(values);
    setMessage(result.message);
    setSuccess(result.ok);
    if(result.ok){
     setSaved({articleId:result.articleId,revisionId:result.revisionId});
     if(operation!=='save'){setPublished(true);setPublicSlug(result.slug);}
     window.history.replaceState(null,'',`/editor/manual?id=${result.articleId}`);
    }
   } catch {setMessage('提交失败，请检查网络后重试；当前输入已保留。');}
  });
 }
 return <form onSubmit={submit} noValidate className="manual-editor-form">
  <input type="hidden" name="article_id" value={saved?.articleId??''}/><input type="hidden" name="revision_id" value={saved?.revisionId??''}/>
  <div className="manual-writing-area">
  <label>文章网址标识（英文小写、数字及连字符）<input name="slug" required pattern="[a-z0-9]+(-[a-z0-9]+)*" maxLength={160} defaultValue={draft?.slug} readOnly={!!saved}/></label>
  <div className="manual-language-tabs" aria-label="正文语言"><button type="button" aria-pressed={language==='zh'} onClick={()=>setLanguage('zh')}>中文录入</button><button type="button" aria-pressed={language==='en'} onClick={()=>setLanguage('en')}>英文录入</button></div>
  <div hidden={language!=='zh'}><label>中文标题<input name="zh_title" required maxLength={240} defaultValue={draft?.zh_title}/></label><label>中文摘要<textarea name="zh_summary" required maxLength={1000} defaultValue={draft?.zh_summary}/></label><p>中文正文</p><Toolbar editor={zh}/><EditorContent editor={zh} className="manual-rich-editor"/></div>
  <div hidden={language!=='en'}><label>英文标题<input name="en_title" required maxLength={240} defaultValue={draft?.en_title}/></label><label>英文摘要<textarea name="en_summary" required maxLength={1000} defaultValue={draft?.en_summary}/></label><p>English content</p><Toolbar editor={en}/><EditorContent editor={en} className="manual-rich-editor"/></div>
  </div>
  <aside className="manual-settings"><h3>文章设置</h3>
  <fieldset><legend>图片</legend>
   <label>素材权利说明（仅使用自制或已获授权素材）<input value={rights} onChange={event=>setRights(event.target.value)} maxLength={1000}/></label>
   <label>上传图片（不超过 50 MB）<input type="file" accept="image/jpeg,image/png,image/webp,image/gif" disabled={busy} onChange={event=>{const file=event.target.files?.[0];if(file)void upload(file);event.currentTarget.value='';}}/></label>
   {media.length>0&&<div><p>素材库（插入当前语言正文）</p>{media.map(asset=><button key={asset.id} type="button" disabled={busy} onClick={()=>insertAsset(asset)}>图片 · {new Date(asset.created_at).toLocaleDateString()}</button>)}</div>}
   <p>视频请用正文工具栏中的“链接”插入外部视频地址。</p>
  </fieldset>
  <label>主频道<select name="primary_channel" required value={primary} onChange={event=>{setPrimary(event.target.value);setTopics([])}}><option value="" disabled>请选择主频道</option>{channels.map(([id,label])=><option key={id} value={id}>{label}</option>)}</select></label>
  <fieldset className="manual-topic-options"><legend>细分分类（至少选择一项）</legend>{!primary&&<p>先选择主频道，再选择对应的小类。</p>}{(channelTopics[primary]??[]).map(item=><label key={item.slug}><input type="checkbox" name="topics" value={item.slug} checked={topics.includes(item.slug)} onChange={event=>setTopics(previous=>event.target.checked?[...previous,item.slug]:previous.filter(value=>value!==item.slug))}/>{item.zh}</label>)}</fieldset>
  <fieldset><legend>关联频道（可选）</legend>{channels.filter(([id])=>id!==primary).map(([id,label])=><label key={id}><input type="checkbox" name="related_channels" value={id} defaultChecked={draft?.related_channels.includes(id)}/>{label}</label>)}</fieldset>
  <label>标签（用英文逗号分隔）<input name="tags" defaultValue={draft?.tags.join(', ')}/></label>
  <label>来源链接（每行一个 HTTPS 链接）<textarea name="source_links" rows={3} defaultValue={draft?.source_links.map(item=>item.url).join('\n')}/></label>
  <label>Newsroom Index（0–100）<input name="score" type="number" min={0} max={100} step={1} defaultValue={draft?.editor_score??robotScore??''}/></label>
  {robotScore!=null&&<p>机器人原始评分：{robotScore} 分</p>}
  <label>发布说明<input name="reason" maxLength={1000}/></label>
  <button type="submit" name="operation" value="save" disabled={pending||busy||!zh||!en}>保存双语草稿</button>
  <button type="submit" name="operation" value={publishOperation} disabled={pending||busy||!zh||!en}>{pending?'提交中…':publishLabel}</button>
  {message&&<p role={success?'status':'alert'} aria-live="polite">{message}{publicSlug&&<> <a href={`/${language}/${publicSlug}`} target="_blank" rel="noreferrer">查看已发布文章</a></>}</p>}
  </aside>
 </form>;
}
