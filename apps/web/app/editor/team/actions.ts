'use server';
import {headers} from 'next/headers';
import {redirect} from 'next/navigation';
import {createClient as createAdminClient} from '@supabase/supabase-js';
import {createClient} from '../../../lib/supabase';
const roles=['website_editor','reviewer'];
async function ownerClient(){
 const origin=(await headers()).get('origin');
 if(!process.env.NEWS_AUTH_ORIGIN||!origin||new URL(process.env.NEWS_AUTH_ORIGIN).origin!==origin)throw new Error('origin');
 const client=await createClient();const user=await client.auth.getUser();if(user.error||!user.data.user)throw new Error('session');
 const owner=await client.rpc('manual_is_owner');if(owner.error||owner.data!==true)throw new Error('owner');
 return client;
}
export async function changeTeamRole(form:FormData){
 let status='failed';
 try {
  const email=form.get('email'), role=form.get('role'), operation=form.get('operation');
  if(typeof email!=='string'||email.length>254||typeof role!=='string'||!roles.includes(role)||!['grant','revoke'].includes(String(operation)))throw new Error('fields');
  const client=await ownerClient();
  const result=await client.rpc('owner_set_team_role',{p_email:email.trim(),p_role:role,p_enabled:operation==='grant'});
  if(!result.error)status='saved';else if(result.error.message.includes('account not found'))status='account-missing';
 }catch{/* Do not log account details or credentials. */}
 redirect(`/editor/team?status=${status}`);
}
export async function createTeamAccount(form:FormData){
 let status='failed';
 try{
  const email=form.get('email'),password=form.get('password'),role=form.get('role');
  if(typeof email!=='string'||email.length>254||!/^\S+@\S+\.\S+$/.test(email.trim())||typeof password!=='string'||password.length<12||password.length>128||typeof role!=='string'||!roles.includes(role))throw new Error('fields');
  const client=await ownerClient();
  if(!process.env.SUPABASE_URL||!process.env.SUPABASE_SERVICE_ROLE_KEY){status='configuration';throw new Error('configuration');}
  const admin=createAdminClient(process.env.SUPABASE_URL,process.env.SUPABASE_SERVICE_ROLE_KEY,{auth:{persistSession:false,autoRefreshToken:false}});
  status='unconfirmed';
  const created=await admin.auth.admin.createUser({email:email.trim(),password,email_confirm:true});
  if(created.error||!created.data.user)throw new Error('create');
  const assigned=await client.rpc('owner_set_team_role',{p_email:email.trim(),p_role:role,p_enabled:true});
  if(assigned.error){const cleanup=await admin.auth.admin.deleteUser(created.data.user.id);status=cleanup.error?'partial':'failed';}
  else status='created';
 }catch{/* Never log passwords, account data or provider errors. */}
 redirect(`/editor/team?status=${status}`);
}
