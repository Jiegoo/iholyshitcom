import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readdir,readFile} from 'node:fs/promises';
import {PGlite} from '@electric-sql/pglite';

test('fresh install has no accounts or content and bootstraps an independently chosen owner',async()=>{
 const db=new PGlite();
 try{
  await db.exec(`create role anon;create role authenticated;create role service_role;create schema auth;create schema storage;
   create table auth.users(id uuid primary key,email text,email_confirmed_at timestamptz,deleted_at timestamptz,banned_until timestamptz);
   create function auth.uid() returns uuid language sql stable as $$select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid$$;
   create table storage.buckets(id text primary key,name text,public boolean,file_size_limit bigint,allowed_mime_types text[]);
   create table storage.objects(id uuid primary key,bucket_id text,name text,owner_id text,metadata jsonb);
   alter table storage.objects enable row level security;grant usage on schema storage to authenticated;grant select,insert,delete on storage.objects to authenticated;`);
  const dir=new URL('../migrations/',import.meta.url);
  for(const file of (await readdir(dir)).filter(f=>f.endsWith('.sql')).sort())await db.exec(await readFile(new URL(file,dir),'utf8'));
  for(const table of ['manual_articles','editors','manual_editor_owners','duty_editor_identities','robot_prompt_versions'])assert.equal((await db.query(`select count(*)::int n from public.${table}`)).rows[0].n,0);
  assert.equal((await db.query("select public from storage.buckets where id='manual-media'")).rows[0].public,false);
  const script=await readFile(new URL('../bootstrap-owner.sql',import.meta.url),'utf8');
  await assert.rejects(db.exec(script),/Set your own email/);
  const owner='00000000-0000-4000-8000-000000000010';await db.query("insert into auth.users(id,email,email_confirmed_at) values($1,'independent@example.test',now())",[owner]);
  await db.exec(script.replaceAll('replace-with-your-email@example.invalid','independent@example.test'));
  await db.exec('set role authenticated');await db.query("select set_config('request.jwt.claim.sub',$1,false)",[owner]);
  assert.equal((await db.query('select public.manual_is_owner() ok')).rows[0].ok,true);
  await db.query("insert into storage.objects(id,bucket_id,name,owner_id) values('00000000-0000-4000-8000-000000000011','manual-media',$1,$2)",[owner+'/asset',owner]);
  await assert.rejects(db.query("insert into storage.objects(id,bucket_id,name,owner_id) values('00000000-0000-4000-8000-000000000012','manual-media','another-user/asset',$1)",[owner]),/row-level security/);
  await db.exec('reset role;set role anon');await assert.rejects(db.query('select * from public.duty_editor_identities'),/permission denied/);
 }finally{await db.close()}
});
