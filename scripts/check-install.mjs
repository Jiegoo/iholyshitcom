// Local-only installation and API smoke test. Never accepts a remote database URL.
import assert from 'node:assert/strict';
import {mkdtemp,readdir,readFile,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {fileURLToPath} from 'node:url';
import {spawn} from 'node:child_process';
import {once} from 'node:events';
import http from 'node:http';
import net from 'node:net';
import {createHash} from 'node:crypto';
import EmbeddedPostgres from 'embedded-postgres';
import pgDriver from 'pg';

const root=fileURLToPath(new URL('../',import.meta.url));
async function port(){const s=net.createServer();s.listen(0,'127.0.0.1');await once(s,'listening');const n=s.address().port;await new Promise(r=>s.close(r));return n}
const dir=await mkdtemp(join(tmpdir(),'newsroom-install-')),dbPort=await port(),webPort=await port();
const database=new EmbeddedPostgres({databaseDir:dir,user:'postgres',password:'local-install-only',port:dbPort,persistent:false,postgresFlags:['-h','127.0.0.1'],onLog:()=>{}});
let db,pool,rest,web,started=false;
try{
 await database.initialise();await database.start();started=true;db=database.getPgClient();await db.connect();
 await db.query(`create role anon;create role authenticated;create role service_role;create schema auth;
 create table auth.users(id uuid primary key,email text,email_confirmed_at timestamptz,deleted_at timestamptz,banned_until timestamptz);
 create function auth.uid() returns uuid language sql stable as $$select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid$$;`);
 for(const file of (await readdir(join(root,'supabase/migrations'))).filter(f=>f.endsWith('.sql')).sort())await db.query(await readFile(join(root,'supabase/migrations',file),'utf8'));
 assert.equal((await db.query('select count(*)::int n from public.manual_articles')).rows[0].n,0);
 const owner='00000000-0000-4000-8000-000000000010';
 await db.query("insert into auth.users(id,email,email_confirmed_at) values($1,'independent@example.test',now())",[owner]);
 await db.query((await readFile(join(root,'supabase/bootstrap-owner.sql'),'utf8')).replaceAll('replace-with-your-email@example.invalid','independent@example.test'));
 const token='local-test-only-credential-xxxxxxxxxxxxxxxxxxxxxxxx',hash=createHash('sha256').update(token).digest('hex');
 await db.query('set role authenticated');await db.query("select set_config('request.jwt.claim.sub',$1,false)",[owner]);
 await db.query("select public.owner_manage_duty_identity('examplebot',$1,true)",[hash]);await db.query('reset role');
 const routines=new Map((await db.query("select p.proname,p.proretset from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname='public'")).rows.map(r=>[r.proname,r]));
 pool=new pgDriver.Pool({host:'127.0.0.1',port:dbPort,user:'postgres',password:'local-install-only',database:'postgres',max:8});
 rest=http.createServer(async(req,res)=>{
  res.setHeader('content-type','application/json');const match=/^\/rest\/v1\/rpc\/([a-z0-9_]+)$/.exec(req.url??'');
  if(!match||!routines.has(match[1])){res.writeHead(404);return res.end(JSON.stringify({code:'PGRST202',message:'Function not found'}))}
  let client;
  try{
   let raw='';for await(const chunk of req){raw+=chunk;if(raw.length>400000)throw Error('oversized request')}
   const args=raw?JSON.parse(raw):{};const entries=Object.entries(args);if(entries.some(([key])=>!/^[a-z][a-z0-9_]*$/.test(key)))throw Error('Invalid RPC parameter');
   client=await pool.connect();await client.query('begin');await client.query(req.headers.apikey==='service-fixture'?'set local role service_role':'set local role anon');
   const result=await client.query(`select * from public."${match[1]}"(${entries.map(([key],i)=>`${key} => $${i+1}`).join(',')})`,entries.map(([,value])=>value));await client.query('commit');
   const value=routines.get(match[1]).proretset?result.rows:result.rows[0]?.[match[1]]??null;res.end(JSON.stringify(value));
  }catch(error){if(client)await client.query('rollback');res.writeHead(400);res.end(JSON.stringify({code:error.code??'RPC_ERROR',message:error.message}))}
  finally{client?.release()}
 });rest.listen(0,'127.0.0.1');await once(rest,'listening');
 const env={...process.env,SUPABASE_URL:`http://127.0.0.1:${rest.address().port}`,SUPABASE_PUBLISHABLE_KEY:'public-fixture',SUPABASE_SERVICE_ROLE_KEY:'service-fixture',NEWS_MANUAL_PUBLIC_READ:'true',NEWS_BILINGUAL_PUBLIC_READ:'true',NEWS_RSS_ENABLED:'true',VERCEL_ENV:'production',SITE_INDEXING_ENABLED:'true',SITE_CANONICAL_ORIGIN:'https://news.launch-fixture.com',NEXT_TELEMETRY_DISABLED:'1'};
 web=spawn(process.execPath,[join(root,'node_modules/next/dist/bin/next'),'start','--hostname','127.0.0.1','--port',String(webPort)],{cwd:join(root,'apps/web'),env,stdio:'ignore'});
 const base=`http://127.0.0.1:${webPort}`;let ready=false;
 for(let i=0;i<100;i++){if(web.exitCode!==null)throw Error('Web server exited');try{await fetch(base);ready=true;break}catch{await new Promise(r=>setTimeout(r,100))}}
 assert.ok(ready,'Web server started');
 const payload={request_id:'independent-install-fixture',slug:'independent-install-fixture',channel:'ai',topic:'new-capabilities',suggested_score:82,
  zh:{title:'本地安装验收：虚构科技事件',summary:'这是一条合成测试内容。',body:'这是一条合成测试内容，不是真实新闻。仅用于独立实例的本地接口与页面验收。'},
  en:{title:'Local installation check: fictional event',summary:'Synthetic test content.',body:'This is synthetic test content, not a real report. It verifies a local independent installation.'},
  sources:[{name:'Synthetic source',title:'Fictional fixture',url:'https://example.test/fixture'}]};
 async function submit(){return fetch(base+'/api/articles',{method:'POST',headers:{authorization:'Bearer '+token,'content-type':'application/json'},body:JSON.stringify(payload)})}
 const first=await submit();const receipt=await first.json();assert.equal(first.status,201,JSON.stringify(receipt));assert.equal(receipt.status,'published');
 const repeat=await submit();const repeated=await repeat.json();assert.equal(repeated.article_id,receipt.article_id);assert.equal(repeated.duplicate,true);
 const status=await fetch(base+'/api/articles?request_id='+payload.request_id,{headers:{authorization:'Bearer '+token}});assert.equal(status.status,200);
 for(const [locale,title]of [['en',payload.en.title],['zh',payload.zh.title]]){
  const article=await fetch(base+`/${locale}/${receipt.slug}`);assert.equal(article.status,200);assert.ok((await article.text()).includes(title));
  const home=await fetch(base+`/${locale}`);assert.equal(home.status,200);assert.ok((await home.text()).includes(title));
 }
 const rss=await fetch(base+'/rss.xml');assert.equal(rss.status,200);assert.ok((await rss.text()).includes(payload.en.title));
 const sitemap=await fetch(base+'/sitemap.xml');assert.equal(sitemap.status,200);assert.ok((await sitemap.text()).includes('sitemapindex'));
 console.log('PASS: empty PostgreSQL install, independent owner, scoped bot POST/replay/GET, bilingual article/home, RSS and sitemap.');
}finally{
 if(web&&web.exitCode===null){web.kill();await once(web,'exit')}
 if(rest)await new Promise(r=>rest.close(r));if(pool)await pool.end();if(db)await db.end();if(started)await database.stop();await rm(dir,{recursive:true,force:true});
}
