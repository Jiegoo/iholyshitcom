'use server';
import {headers} from 'next/headers';
import {createClient} from '../../lib/supabase';
import {articleBodyText} from '../../lib/article-copy.mjs';

export async function getArticleBodyForCopy(id:string,locale:'zh'|'en'):Promise<{text?:string;message?:string}>{
 if(!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)||!['zh','en'].includes(locale))return {message:'无法读取这篇文章。'};
 try{
  const origin=(await headers()).get('origin'),expected=process.env.NEWS_AUTH_ORIGIN;
  if(!origin||!expected||new URL(expected).origin!==origin)return {message:'请从本站后台操作。'};
  const client=await createClient();const user=await client.auth.getUser();
  if(user.error||!user.data.user)return {message:'登录已失效，请重新登录。'};
  const result=await client.rpc('manual_get_article',{p_article:id});
  if(result.error||!result.data)return {message:'稿件不可用或无权限。'};
  const text=articleBodyText(result.data[`${locale}_document`]);
  const credit='来自newsroom科技简报';
  return text?{text:text.endsWith(credit)?text:`${text}\n\n${credit}`}:{message:'这篇文章暂无可复制的正文。'};
 }catch{return {message:'读取正文失败，请稍后重试。'};}
}
