'use server';
import { createHash,randomBytes } from 'node:crypto';
import { revalidatePath } from 'next/cache';
import { createClient } from '../../../lib/supabase';
export type DutyState={message:string;token?:string;bot?:string};
export async function createDutyIdentity(_previous:DutyState,form:FormData):Promise<DutyState>{
 const bot=form.get('bot');if(typeof bot!=='string'||!/^[a-z0-9][a-z0-9_-]{0,63}$/.test(bot))return {message:'名称只能使用小写字母、数字、下划线或连字符。'};
 try{
  const key=randomBytes(48).toString('base64url');const hash=createHash('sha256').update(key).digest('hex');
  const db=await createClient();const {error}=await db.rpc('owner_manage_duty_identity',{p_bot:bot,p_hash:hash,p_enabled:true});
  if(error)return {message:'创建失败，请检查站长权限或数据库迁移。'};
  revalidatePath('/editor/duty');revalidatePath('/editor');return {message:'密钥只显示本次，请安全交给对应机器人。',token:key,bot};
 }catch{return {message:'创建失败，请检查服务配置。'};}
}
export async function disableDutyIdentity(form:FormData){
 const bot=form.get('bot');if(typeof bot!=='string'||!/^[a-z0-9][a-z0-9_-]{0,63}$/.test(bot))return;
 const db=await createClient();await db.rpc('owner_manage_duty_identity',{p_bot:bot,p_hash:null,p_enabled:false});revalidatePath('/editor/duty');
}

export async function disableDutyIdentityInline(_previous:{message:string},form:FormData):Promise<{message:string}>{
 const bot=form.get('bot');if(typeof bot!=='string'||!/^[a-z0-9][a-z0-9_-]{0,63}$/.test(bot))return {message:'机器人名称无效。'};
 const db=await createClient();const {error}=await db.rpc('owner_manage_duty_identity',{p_bot:bot,p_hash:null,p_enabled:false});
 if(error)return {message:'停用失败，请检查站长权限或稍后重试。'};
 revalidatePath('/editor/duty');revalidatePath('/editor');return {message:`${bot} 已停用。`};
}
