'use server';
import {headers} from 'next/headers';
import {createClient} from '../../lib/supabase';

export async function setArticleVisibility(id:string,published:boolean,status:string):Promise<{status?:string;message:string}>{
 if(!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)||typeof published!=='boolean'||!['published','retracted'].includes(status))return {message:'无法操作这篇文章。'};
 try{
  const origin=(await headers()).get('origin'),expected=process.env.NEWS_AUTH_ORIGIN;
  if(!origin||!expected||new URL(expected).origin!==origin)throw Error('origin');
  const client=await createClient();const {data,error}=await client.auth.getUser();
  if(error||!data.user)return {message:'登录已失效，请重新登录。'};
  const result=await client.rpc('owner_set_article_visibility',{p_article:id,p_published:published,p_expected_status:status});
  if(result.error||result.data!==(published?'published':'retracted'))return {message:'操作失败，请检查站长权限或刷新文章状态后重试。'};
  return {status:result.data,message:published?'已上线。':'已下线。'};
 }catch{return {message:'操作失败，请稍后重试。'};}
}
