'use server';
import {headers} from 'next/headers';
import {createClient} from '../../../lib/supabase';
export type PickState={message:string;mode:'auto'|'pin'|'exclude'|null;loaded:boolean};
export async function managePickInline(previous:PickState,form:FormData):Promise<PickState>{
 const slug=form.get('slug'),mode=form.get('mode'),operation=form.get('operation'),kind=form.get('kind');
 if((kind!=='manual'&&kind!=='story')||typeof slug!=='string'||slug.length>200||!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(slug)||(operation!=='load'&&operation!=='save'))return {...previous,message:'操作失败，请检查文章。'};
 try{
  const origin=(await headers()).get('origin'),expected=process.env.NEWS_AUTH_ORIGIN;
  if(!origin||!expected||new URL(expected).origin!==origin)throw Error('origin');
  const db=await createClient();const {data:user,error:authError}=await db.auth.getUser();if(authError||!user.user)throw Error('session');
  if(operation==='save'){
   if(mode!=='auto'&&mode!=='pin'&&mode!=='exclude')throw Error('mode');
   const result=await db.rpc('owner_set_homepage_control',{p_type:kind,p_slug:slug,p_mode:mode});if(result.error)throw Error('save');
   return {message:'已保存。置顶将在下一个精选更新周期生效；排除立即生效。',mode,loaded:true};
  }
  const result=await db.rpc('owner_get_homepage_control',{p_type:kind,p_slug:slug});if(result.error||!['auto','pin','exclude'].includes(result.data))throw Error('load');
  return {message:'',mode:result.data as 'auto'|'pin'|'exclude',loaded:true};
 }catch{return {...previous,message:operation==='save'?'保存失败，请检查登录状态和权限。':'无法读取精选设置，请检查登录状态和权限。'}}
}
