import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readdir,readFile} from 'node:fs/promises';
import {PGlite} from '@electric-sql/pglite';

test('hot event migration creates protected tables and empty public results',async()=>{
 const db=new PGlite();try{
  await db.exec(`create role anon;create role authenticated;create role service_role;create schema auth;create table auth.users(id uuid primary key,email text,email_confirmed_at timestamptz,deleted_at timestamptz,banned_until timestamptz);create function auth.uid() returns uuid language sql stable as $$select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid$$;`);
  await db.exec("insert into auth.users(id,email,email_confirmed_at) values('00000000-0000-4000-8000-000000000001','owner@example.test',now())");
  const dir=new URL('../migrations/',import.meta.url);
  for(const file of (await readdir(dir)).filter(f=>f.endsWith('.sql')).sort())await db.exec(await readFile(new URL(file,dir),'utf8'));
  await db.exec(`update public.manual_public_rollout set enabled=true;
    insert into public.hot_events(id,slug,zh_title,en_title,zh_summary,en_summary,status,last_progress_at)
    values ('10000000-0000-4000-8000-000000000001','event-one','事件一','Event one','摘要','Summary','published',now()),
    ('10000000-0000-4000-8000-000000000002','event-two','事件二','Event two','摘要','Summary','published',now()-interval '1 hour'),
    ('10000000-0000-4000-8000-000000000003','event-old','旧事件','Old event','摘要','Summary','published',now()-interval '73 hours');
    insert into public.manual_articles(id,slug,owner_id,status,hot_event_id)
    values ('20000000-0000-4000-8000-000000000001','article-one','00000000-0000-4000-8000-000000000001','published','10000000-0000-4000-8000-000000000001'),
    ('20000000-0000-4000-8000-000000000002','article-two','00000000-0000-4000-8000-000000000001','published','10000000-0000-4000-8000-000000000002'),
    ('20000000-0000-4000-8000-000000000003','article-old','00000000-0000-4000-8000-000000000001','published','10000000-0000-4000-8000-000000000003');
    insert into public.manual_article_revisions(id,article_id,revision_number,zh_title,en_title,zh_summary,en_summary,zh_document,en_document,primary_channel,created_by)
    select a.id,a.id,1,'测试','Test','摘要','Summary','{}'::jsonb,'{}'::jsonb,'ai',a.owner_id from public.manual_articles a where a.slug like 'article-%';
    update public.manual_articles set published_revision_id=id where slug like 'article-%';
    insert into public.manual_publication_events(article_id,revision_id,final_score,action,reason,actor_id)
    select id,id,80,'publish','test',owner_id from public.manual_articles where slug like 'article-%';`);
  await db.exec('set role anon');
  const events=(await db.query("select * from public.get_public_hot_events('en',null,true)")).rows;
  assert.deepEqual(events.map(e=>e.slug),['event-one','event-two']);
  assert.equal(events[0].article_count,1);
  assert.equal((await db.query("select * from public.get_public_hot_event_for_article('zh','manual','article-one')")).rows[0].slug,'event-one');
  await assert.rejects(db.query('select * from public.hot_event_jobs'),/permission denied/);
  await db.exec(`reset role;
   update public.hot_event_jobs set status='completed';
   insert into public.manual_articles(id,slug,owner_id,status) values
   ('30000000-0000-4000-8000-000000000001','new-one','00000000-0000-4000-8000-000000000001','published'),
   ('30000000-0000-4000-8000-000000000002','new-two','00000000-0000-4000-8000-000000000001','published'),
   ('30000000-0000-4000-8000-000000000003','new-three','00000000-0000-4000-8000-000000000001','published');
   insert into public.manual_article_revisions(id,article_id,revision_number,zh_title,en_title,zh_summary,en_summary,zh_document,en_document,primary_channel,created_by)
   select id,id,1,'机器人突破','Robot breakthrough','摘要','Summary','{}'::jsonb,'{}'::jsonb,'ai',owner_id from public.manual_articles where slug like 'new-%';
   update public.manual_articles set published_revision_id=id where slug like 'new-%';
   insert into public.manual_publication_events(article_id,revision_id,final_score,action,reason,actor_id)
   select id,id,80,'publish','test',owner_id from public.manual_articles where slug like 'new-%';
   set role service_role;`);
  const job=(await db.query('select public.hot_event_claim() as job')).rows[0].job;
  assert.ok(job.articles.some(a=>a.id===job.anchor));
  const ids=job.articles.filter(a=>a.title==='Robot breakthrough').map(a=>a.id);
  assert.equal(ids.length,3);
  const proposal={ids,zh_title:'机器人',en_title:'Robot',zh_summary:'一。二。三。',en_summary:'One. Two. Three.'};
  const eventId=(await db.query('select public.hot_event_apply($1,$2,$3::jsonb) as id',[job.job_id,job.attempt,JSON.stringify(proposal)])).rows[0].id;
  assert.ok(eventId);
  await assert.rejects(db.query('select public.hot_event_apply($1,$2,$3::jsonb)',[job.job_id,job.attempt,JSON.stringify(proposal)]),/lease expired/);
  const next=(await db.query('select public.hot_event_claim() as job')).rows[0].job;
  const forged={...proposal,ids:[...ids,'manual:ffffffff-ffff-4fff-8fff-ffffffffffff']};
  await assert.rejects(db.query('select public.hot_event_apply($1,$2,$3::jsonb)',[next.job_id,next.attempt,JSON.stringify(forged)]),/membership no longer eligible/);
  await db.query('select public.hot_event_retry($1,$2)',[next.job_id,next.attempt]);
  await db.exec('reset role;set role anon');
  const generated=(await db.query("select * from public.get_public_hot_events('en',null,true)")).rows;
  assert.equal(generated[0].article_count,3);
  assert.equal(generated[0].max_index,80);
  await db.exec(`reset role;
   insert into public.manual_publication_events(article_id,revision_id,action,reason,actor_id)
   values('30000000-0000-4000-8000-000000000001','30000000-0000-4000-8000-000000000001','retract','test','00000000-0000-4000-8000-000000000001');
   update public.manual_articles set status='retracted' where id='30000000-0000-4000-8000-000000000001';
   set role anon;`);
  assert.equal((await db.query("select * from public.get_public_hot_events('en',$1,false)",[`event-${eventId}`])).rows.length,0);


 }finally{await db.close()}
});
