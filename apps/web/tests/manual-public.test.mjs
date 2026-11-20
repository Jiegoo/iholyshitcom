import {test} from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import net from 'node:net';
import {spawn} from 'node:child_process';
import {once} from 'node:events';
import {fileURLToPath} from 'node:url';

for (const bilingual of [true, false]) test(`published manual article and locale-aware feeds (bilingual=${bilingual})`, {timeout:60000},async()=>{
 const browseModes = new Set();
 let published=true,withImage=true;
 const date=new Date(Date.now()-10000).toISOString();
 const id='00000000-0000-4000-8000-000000000010', owner='00000000-0000-4000-8000-000000000001';
 const doc={type:'doc',content:[{type:'paragraph',content:[{type:'text',text:'Fictional body'}]},{type:'image',attrs:{src:`/api/manual-media/${id}`,alt:'fixture'}},{type:'paragraph',content:[{type:'text',text:'Video link',marks:[{type:'link',attrs:{href:'https://example.com/video'}}]}]}]};
 const mock=http.createServer((req,res)=>{
  res.setHeader('content-type','application/json');let body='';req.on('data',c=>body+=c);req.on('end',()=>{
   if(req.url==='/rest/v1/rpc/get_public_browse_count'||req.url==='/rest/v1/rpc/get_public_topic_count')return res.end('41');
    if(req.url==='/rest/v1/rpc/get_sitemap_article_shard'){const q=JSON.parse(body);return res.end(JSON.stringify(published&&q.p_bucket===6&&!q.p_after_slug?[{slug:'fixture',content_type:'manual'}]:[]));}
   if(req.url==='/rest/v1/rpc/get_public_manual_article'){const q=JSON.parse(body);return res.end(JSON.stringify(published&&['fixture','sample-original-slug'].includes(q.p_slug)?{slug:q.p_slug,locale:q.p_locale,title:q.p_locale==='zh'?'虚构标题':'Fictional title',summary:'Fictional summary',document:withImage?doc:{type:'doc',content:[{type:'paragraph',content:[{type:'text',text:'Fictional body'}]}]},channel:'technology',topics:['chips'],tags:['Acme'],sources:[{url:'https://example.com/source',label:'source'}],score:60,published_at:'2026-11-10T00:00:00Z'}:null));}
   if(req.url==='/rest/v1/rpc/get_public_unified_browse'){const q=JSON.parse(body);browseModes.add(q.p_bilingual);if(q.p_query==='Acme')return res.end(JSON.stringify([{slug:'related-space',title:'Acme related event',summary:'Related',category:'technology',score:70,published_at:date,content_type:'manual'}]));const matches=published&&(!q.p_channel||q.p_channel==='technology')&&(!q.p_query||'fictional title'.includes(q.p_query.toLowerCase()))&&q.p_offset===0;return res.end(JSON.stringify(matches?[{slug:'fixture',title:q.p_locale==='zh'?'虚构标题':'Fictional title',summary:'Fictional summary',category:'technology',score:60,published_at:date,content_type:'manual'}]:[]));}
   if(req.url==='/rest/v1/rpc/get_public_manual_topic_browse'){const q=JSON.parse(body);return res.end(JSON.stringify(published&&q.p_channel==='technology'&&q.p_topic==='chips'?[{slug:'fixture',title:'Fictional title',summary:'Fictional summary',score:60,published_at:date}]:[]));}
   if(req.url==='/rest/v1/rpc/get_public_manual_feed')return res.end(JSON.stringify(published?[{slug:'fixture',title:'Fictional title',summary:'Fictional summary',category:'technology',score:60,published_at:'2026-11-10T00:00:00Z'}]:[]));
   if(req.url==='/rest/v1/rpc/get_public_manual_media')return res.end(JSON.stringify(published?{path:`${owner}/${id}`,mime:'image/png',bytes:4}:null));
   if(req.url?.startsWith('/storage/v1/object/authenticated/manual-media/')){res.setHeader('content-type','image/png');res.setHeader('accept-ranges','bytes');if(req.headers.range){res.statusCode=206;res.setHeader('content-range','bytes 0-1/4');return res.end('ab')}return res.end('abcd');}
   return res.end('[]');
  });
 });
 mock.listen(0,'127.0.0.1');await once(mock,'listening');const socket=net.createServer();socket.listen(0,'127.0.0.1');await once(socket,'listening');const port=socket.address().port;await new Promise(r=>socket.close(r));
 const cwd=fileURLToPath(new URL('..',import.meta.url)),exe=fileURLToPath(new URL('../../../node_modules/next/dist/bin/next',import.meta.url));
 const child=spawn(process.execPath,[exe,'start','--hostname','127.0.0.1','--port',String(port)],{cwd,env:{...process.env,SUPABASE_URL:`http://127.0.0.1:${mock.address().port}`,SUPABASE_PUBLISHABLE_KEY:'fixture',NEWS_MANUAL_PUBLIC_READ:'true',NEWS_BILINGUAL_PUBLIC_READ:String(bilingual),NEWS_RSS_ENABLED:'true',VERCEL_ENV:'production',SITE_INDEXING_ENABLED:'true',SITE_CANONICAL_ORIGIN:'https://news.launch-fixture.com',NEXT_TELEMETRY_DISABLED:'1'},stdio:'ignore'});
 const base=`http://127.0.0.1:${port}`;
 try{let ready=false;for(let i=0;i<100;i++){if(child.exitCode!==null)throw Error('Next exited');try{await fetch(base);ready=true;break}catch{await new Promise(r=>setTimeout(r,100))}}assert.equal(ready,true);
  for(const retired of ['full-articles','full-articles/setup','full-articles/revisions','classification-pilot','robots'])assert.equal((await fetch(`${base}/editor/${retired}`)).status,404);
  const defaultArticle=await(await fetch(`${base}/manual/fixture`)).text();assert.match(defaultArticle,/<html lang="en"/);assert.match(defaultArticle,/Fictional title/);assert.doesNotMatch(defaultArticle,/href="\/editor"/);
  const zh=await fetch(`${base}/zh/manual/fixture`);assert.equal(zh.status,200);const html=await zh.text();assert.match(html,/<meta property="og:image" content="https:\/\/news.launch-fixture.com\/share-card\.png"/);assert.match(html,/虚构标题/);assert.match(html,/Fictional body/);assert.match(html,/栏目署名：/);assert.match(html,/内容由本部署的编辑团队负责，请核对来源并及时更正错误/);assert.match(html,/aria-label="当前位置"/);assert.match(html,/href="\/zh\/category\/technology\/chips"/);assert.ok(html.indexOf('aria-label="当前位置"')<html.indexOf('<h1>虚构标题</h1>')); assert.ok(html.indexOf('内容由本部署')<html.indexOf('延伸阅读'));assert.match(html,/Newsroom Science &amp; Tech Desk/);assert.match(html,/<script type="application\/ld\+json">/);assert.match(html,/"author":\{"@type":"Organization","name":"Newsroom Science \\u0026 Tech Desk"/);assert.match(html,/延伸阅读/);assert.match(html,/href="\/zh\/related-space"/);assert.ok(html.indexOf('延伸阅读')<html.indexOf('分享这篇文章'));assert.match(html,/\/en\/fixture/);assert.match(html,/Newsroom Index/);assert.match(html,/api\/manual-media/);assert.doesNotMatch(html,/<figure class="article-illustration"/);
  const shortZh=await fetch(`${base}/zh/fixture`),shortEn=await fetch(`${base}/en/fixture`);assert.equal(shortZh.status,200);assert.equal(shortEn.status,200);assert.match(await shortZh.text(),/虚构标题/);const englishArticle=await shortEn.text();assert.match(englishArticle,/Fictional title/);assert.match(englishArticle,/href="\/en\/category\/technology\/chips"/);assert.match(englishArticle,/Check sources and correct errors/);
  withImage=false;const withoutIllustration=await(await fetch(`${base}/en/manual/fixture`)).text();assert.match(withoutIllustration,/Fictional body/);assert.doesNotMatch(withoutIllustration,/<figure class="article-illustration"/);withImage=true;
  const home=await(await fetch(`${base}/en`)).text();assert.match(home,/<meta property="og:image" content="https:\/\/news.launch-fixture.com\/share-card\.png"/);assert.match(home,/<meta property="og:image:width" content="1200"/);assert.match(home,/<meta property="og:image:height" content="630"/);assert.match(home,/<meta name="twitter:card" content="summary_large_image"/);assert.match(home,/\/en\/fixture/);assert.match(home,/Fictional title/);assert.match(home,/<link rel="alternate" type="application\/rss\+xml"[^>]*href="\/rss\.xml"/);
  const zhHome=await(await fetch(`${base}/zh`)).text();assert.match(zhHome,/虚构标题/);assert.match(zhHome,/<strong>AI<\/strong> <small>人工智能与应用<\/small>/);assert.doesNotMatch(zhHome,/<h3[^>]*>Fictional title<\/h3>/);assert.match(zhHome,/<link rel="alternate" type="application\/rss\+xml"[^>]*href="\/feed\/zh"/);
  const defaultHome=await(await fetch(base)).text();assert.match(defaultHome,/Fictional title/);
  assert.deepEqual([...browseModes],[bilingual]);
  const channel=await(await fetch(`${base}/en/category/technology?sort=score`)).text();assert.match(channel,/\/en\/fixture/);
  const zhChannel=await(await fetch(`${base}/zh/category/technology?sort=score`)).text();assert.match(zhChannel,/虚构标题/);
  const topic=await(await fetch(`${base}/en/category/technology/chips`)).text();assert.match(topic,/Fictional title/);assert.match(topic,/\/en\/fixture/);
  const search=await(await fetch(`${base}/en/search?q=Fictional&sort=score`)).text();assert.match(search,/\/en\/fixture/);
  const rss=await(await fetch(`${base}/feed/en/technology`)).text();assert.match(rss,/https:\/\/news.launch-fixture.com\/en\/fixture/);
  const sitemap=await(await fetch(`${base}/sitemap.xml`)).text();assert.match(sitemap,/sitemapindex/);const zhMap=await(await fetch(`${base}/sitemaps/zh-6.xml`)).text();const enMap=await(await fetch(`${base}/sitemaps/en-6.xml`)).text();assert.match(zhMap,/\/zh\/fixture/);assert.match(enMap,/\/en\/fixture/);
  const news=await(await fetch(`${base}/news-sitemap.xml`)).text();assert.match(news,/\/en\/fixture/);
  assert.match(html,/https:\/\/example.com\/video/);
  const range=await fetch(`${base}/api/manual-media/${id}`,{headers:{range:'bytes=0-1'}});assert.equal(range.status,206);assert.equal(range.headers.get('content-range'),'bytes 0-1/4');assert.equal(await range.text(),'ab');
  published=false;const emptyTopic=await(await fetch(`${base}/en/category/technology/chips`)).text();assert.match(emptyTopic,/No published articles in this topic yet/);assert.equal((await fetch(`${base}/zh/manual/fixture`)).status,404);assert.equal((await fetch(`${base}/api/manual-media/${id}`)).status,404);
 }finally{child.kill('SIGTERM');await new Promise(r=>mock.close(r));}
});
