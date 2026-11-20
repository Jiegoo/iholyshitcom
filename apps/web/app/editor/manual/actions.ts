'use server';

import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { publicArticleSlug } from '../../../lib/historical-article-slugs.mjs';
import { createClient } from '../../../lib/supabase';

const uuid=/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
function text(form:FormData,name:string,max:number){const value=form.get(name);if(typeof value!=='string'||!value.trim()||value.length>max)throw new Error('invalid input');return value.trim();}
function optionalUuid(form:FormData,name:string){const value=form.get(name);if(value===null||value==='')return null;if(typeof value!=='string'||!uuid.test(value))throw new Error('invalid id');return value;}
function safeOrigin(configured:string|undefined,actual:string|null){try{return !!configured&&!!actual&&new URL(configured).origin===actual}catch{return false}}

type ManualSaveResult = {ok:false;message:string}|{ok:true;message:string;articleId:string;revisionId:string;slug:string};

export async function saveManualDraft(form: FormData): Promise<ManualSaveResult> {
 let id: string | null = null;
 try {
  id = optionalUuid(form, 'article_id');
  const expected = optionalUuid(form, 'revision_id');
  if (!safeOrigin(process.env.NEWS_AUTH_ORIGIN, (await headers()).get('origin'))) return {ok:false,message:'编辑站点地址不匹配，未提交。'};
  const operation = form.get('operation');
  if (operation !== 'save' && operation !== 'publish' && operation !== 'correction') return {ok:false,message:'请选择有效操作。'};
  const value = form.get('score');
  const score = typeof value === 'string' && /^(?:0|[1-9][0-9]?|100)$/.test(value) ? Number(value) : null;
  if ((value !== '' || operation !== 'save') && score === null) return {ok:false,message:'请填写 0–100 的整数评分。'};
  const reason = operation === 'save' ? null : text(form, 'reason', 1000);
  const zh = JSON.parse(text(form, 'zh_document', 300000));
  const en = JSON.parse(text(form, 'en_document', 300000));
  const tags = (form.get('tags')?.toString() ?? '').split(',').map(x => x.trim()).filter(Boolean);
  const links = (form.get('source_links')?.toString() ?? '').split('\n').map(x => x.trim()).filter(Boolean).map(url => ({url, label: ''}));
  const topics = form.getAll('topics').filter((x): x is string => typeof x === 'string');
  const related = form.getAll('related_channels').filter((x): x is string => typeof x === 'string');
  const client = await createClient();
  const user = await client.auth.getUser();
  if (user.error || !user.data.user) return {ok:false,message:'请重新登录编辑后台。'};
  const result = await client.rpc('manual_save_editor_revision', {
   p_article:id,p_expected_revision:expected,p_slug:text(form,'slug',160),
   p_zh_title:text(form,'zh_title',240),p_en_title:text(form,'en_title',240),
   p_zh_summary:text(form,'zh_summary',1000),p_en_summary:text(form,'en_summary',1000),
   p_zh_document:zh,p_en_document:en,p_primary:text(form,'primary_channel',60),
   p_related:related,p_tags:tags,p_sources:links,p_topics:topics,p_score:score,p_operation:operation,p_reason:reason,
  });
  if (result.error) {
   if (result.error.message === 'manual revision conflict') return {ok:false,message:'稿件已有其他修改，请复制当前输入后重新打开稿件。'};
   if (result.error.message === 'both language bodies required') return {ok:false,message:'发布前请填写中英文正文。'};
   return {ok:false,message:'操作未完成，请核对正文格式、分类、来源与发布状态。'};
  }
  if (typeof result.data?.article_id !== 'string' || !uuid.test(result.data.article_id)
      || !uuid.test(result.data.revision_id ?? '')
      || (operation !== 'save' && !uuid.test(result.data.publication_id ?? ''))) {
   return {ok:false,message:'操作结果未确认，请先检查稿件状态。'};
  }
  const slug = text(form,'slug',160);
  if (operation !== 'save') {
   for (const locale of ['zh','en']) {
    revalidatePath(`/${locale}/${publicArticleSlug('manual',slug)}`);
    revalidatePath(`/${locale}/manual/${slug}`);
    revalidatePath(`/${locale}`);
   }
   revalidatePath(`/manual/${slug}`);
  }
  return {ok:true,message:operation==='save'?'双语草稿已保存，公开内容未变。':operation==='correction'?'发布更正成功，中英文内容已更新。':'发布成功，中英文内容已公开。',articleId:result.data.article_id,revisionId:result.data.revision_id,slug};
 } catch {
  return {ok:false,message:'操作未完成，请检查字段与登录状态。'};
 }
}

export async function manageManualPublication(form:FormData){
 let id:string|null=null,status='publication-failed';
 try {
  id=optionalUuid(form,'article_id');
  if(!id||!safeOrigin(process.env.NEWS_AUTH_ORIGIN,(await headers()).get('origin')))throw new Error('invalid request');
  const client=await createClient();const user=await client.auth.getUser();if(user.error||!user.data.user)throw new Error('session');
  const action=text(form,'operation',20);const reason=text(form,'reason',1000);
  if(action==='retract'){
   const result=await client.rpc('manual_retract_article',{p_article:id,p_reason:reason});
   if(!result.error)status='retracted';
  }
 }catch { /* Never log article contents or credentials. */ }
 const query=new URLSearchParams({status});if(id)query.set('id',id);redirect(`/editor/manual?${query}`);
}
