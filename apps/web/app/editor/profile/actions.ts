'use server';
import {headers} from 'next/headers';
import {redirect} from 'next/navigation';
import {createClient} from '../../../lib/supabase';
export async function updateProfile(form:FormData){
 let status='failed';
 try{
  const origin=(await headers()).get('origin');if(!process.env.NEWS_AUTH_ORIGIN||!origin||new URL(process.env.NEWS_AUTH_ORIGIN).origin!==origin)throw new Error('origin');
  const client=await createClient();const user=await client.auth.getUser();if(user.error||!user.data.user)throw new Error('session');
  const action=form.get('action');
  if(action==='name'){
   const name=form.get('display_name');if(typeof name!=='string'||name.trim().length<1||name.trim().length>80)throw new Error('name');
   const result=await client.auth.updateUser({data:{display_name:name.trim()}});if(!result.error)status='saved';
  }else if(action==='password'){
   const password=form.get('password'),confirmation=form.get('confirmation');
   if(typeof password!=='string'||password.length<12||password.length>128||password!==confirmation)throw new Error('password');
   const result=await client.auth.updateUser({password});if(!result.error)status='saved';
  }
 }catch{/* Do not log personal details, passwords or provider errors. */}
 redirect(`/editor/profile?status=${status}`);
}
