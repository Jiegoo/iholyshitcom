'use server';
import {createClient} from '../../lib/supabase';
export async function hideAnonymousComment(_state:{message:string;hidden:boolean},form:FormData){
 const id=String(form.get('id')??'');if(!/^\d+$/.test(id))return {message:'无效评价。',hidden:false};
 try{const client=await createClient();const {data,error}=await client.rpc('owner_hide_anonymous_comment',{p_id:id});return error||!data?{message:'操作失败，请重试。',hidden:false}:{message:'评价已隐藏。',hidden:true}}catch{return {message:'操作失败，请重试。',hidden:false}}
}

export async function loadAnonymousComments(offset:number){
 if(!Number.isSafeInteger(offset)||offset<0||offset>100000)return {items:null};
 try{const client=await createClient();const {data,error}=await client.rpc('owner_list_anonymous_comments',{p_offset:offset});return {items:error||!Array.isArray(data)?null:data}}catch{return {items:null}}
}
