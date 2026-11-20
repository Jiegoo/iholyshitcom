import { test } from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import net from 'node:net';
import { spawn } from 'node:child_process';
import { once } from 'node:events';
import { fileURLToPath } from 'node:url';

async function port() {
  const socket=net.createServer(); socket.listen(0,'127.0.0.1'); await once(socket,'listening');
  const value=socket.address().port; await new Promise(resolve=>socket.close(resolve)); return value;
}
async function startServer(env) {
  const value=await port();
  const server=spawn(process.execPath,[fileURLToPath(new URL('../../../node_modules/next/dist/bin/next',import.meta.url)),'start','--hostname','127.0.0.1','--port',String(value)],{
    cwd:fileURLToPath(new URL('..',import.meta.url)),env:{...process.env,...env,NEXT_TELEMETRY_DISABLED:'1'},stdio:'ignore',
  });
  const base=`http://127.0.0.1:${value}`;
  for (let i=0;i<100;i++) {
    if (server.exitCode!==null) throw new Error('Next exited during fixture startup');
    try { await fetch(`${base}/robots.txt`); return {server,base}; } catch { await new Promise(resolve=>setTimeout(resolve,100)); }
  }
  server.kill('SIGTERM');
  throw new Error('Next fixture did not start');
}
async function stop(server) {
  if (server.exitCode===null) { server.kill('SIGTERM'); await once(server,'exit'); }
}

test('search publication is production-only and excludes hidden or retracted stories', {timeout:60000}, async()=>{
  let mode='published';
  let sitemapCalls=0;
  const story={slug:'fixture',title:'Fictional fixture title',summary:'Fictional fixture summary',sources:[],updates:[]};
  const mock=http.createServer((req,res)=>{
    res.setHeader('content-type','application/json');
    if(req.url==='/rest/v1/rpc/get_public_browse_count'||req.url==='/rest/v1/rpc/get_public_topic_count')return res.end('41');
    if(req.url==='/rest/v1/rpc/get_public_unified_browse'||req.url==='/rest/v1/rpc/get_public_unified_channel_counts'){res.writeHead(404);return res.end(JSON.stringify({code:'PGRST202',message:'fixture missing'}));}
    if(req.url==='/rest/v1/rpc/get_public_manual_feed'||req.url==='/rest/v1/rpc/get_public_manual_topic_browse'||req.url==='/rest/v1/rpc/get_public_channel_counts')return res.end('[]');
    if(req.url==='/rest/v1/rpc/get_public_latest_discoveries')return res.end('[]');
    if(req.url==='/rest/v1/rpc/get_sitemap_article_shard'){let body='';req.on('data',x=>body+=x);req.on('end',()=>{sitemapCalls++;if(mode==='error'){res.writeHead(503);return res.end('{}')}const q=JSON.parse(body);const items=mode==='published'&&q.p_bucket===6?['fixture']:mode==='many'&&q.p_bucket===3?Array.from({length:501},(_,i)=>`story-${String(i).padStart(4,'0')}`):[];res.end(JSON.stringify(items.filter(slug=>!q.p_after_slug||slug>q.p_after_slug).slice(0,q.p_limit).map(slug=>({slug,content_type:'story'}))))});return;}
    if (mode==='error') { res.writeHead(503); res.end('{}'); return; }
    if (req.url==='/rest/v1/rpc/get_public_sitemap') {
      let body=''; req.on('data',chunk=>{ body+=chunk; }); req.on('end',()=>{
        sitemapCalls++;
        const {p_after: after,p_limit: limit}=JSON.parse(body);
        const items=mode==='published' ? ['fixture'] : mode==='many' ? Array.from({length:501},(_,i)=>`story-${String(i).padStart(4,'0')}`) : [];
        res.end(JSON.stringify(items.filter(slug=>after===null || slug>after).slice(0,limit).map(slug=>({slug}))));
      });
    }
    else if (req.url==='/rest/v1/rpc/get_public_discovery') res.end(JSON.stringify(mode==='published' ? [story] : []));
    else if (req.url==='/rest/v1/rpc/get_public_discovery_ranking') res.end('[]');
    else if (req.url==='/rest/v1/rpc/get_public_daily') res.end('[]');
    else if (req.url==='/rest/v1/rpc/get_public_browse'||req.url==='/rest/v1/rpc/get_public_channel_browse') res.end('[]');
    else if (req.url==='/rest/v1/rpc/get_public_story_page') res.end(JSON.stringify(mode==='published' ? [story] : []));
    else if (req.url==='/rest/v1/rpc/get_public_retraction') res.end(JSON.stringify(mode==='retracted' ? [{slug:'fixture',notice:'Withdrawn fixture',retracted_at:'2026-11-05T00:00:00Z'}] : []));
    else { res.writeHead(404); res.end('{}'); }
  });
  mock.listen(0,'127.0.0.1'); await once(mock,'listening');
  const env={SUPABASE_URL:`http://127.0.0.1:${mock.address().port}`,SUPABASE_PUBLISHABLE_KEY:'local-test-placeholder',
    SITE_CANONICAL_ORIGIN:'https://news.launch-fixture.com',SITE_INDEXING_ENABLED:'true'};
  let preview,closedProduction,production,fixtureProduction,bilingualProduction;
  try {
    preview=await startServer({...env,VERCEL_ENV:'preview'});
    const previewHome=await (await fetch(preview.base)).text();
    assert.match(previewHome,/<meta name="robots" content="noindex, nofollow"/);
    assert.doesNotMatch(previewHome,/rel="canonical"/);
    assert.match(await (await fetch(`${preview.base}/robots.txt`)).text(),/Disallow: \//);
    assert.doesNotMatch(await (await fetch(`${preview.base}/sitemap.xml`)).text(),/news\.launch-fixture\.com/);
    await stop(preview.server); preview=null;
    closedProduction=await startServer({...env,VERCEL_ENV:'production',SITE_INDEXING_ENABLED:'false'});
    const closedHome=await (await fetch(closedProduction.base)).text();
    assert.match(closedHome,/<meta name="robots" content="noindex, nofollow"/);
    assert.doesNotMatch(closedHome,/rel="canonical"/);
    assert.match(await (await fetch(`${closedProduction.base}/robots.txt`)).text(),/Disallow: \//);
    assert.doesNotMatch(await (await fetch(`${closedProduction.base}/sitemap.xml`)).text(),/news\.launch-fixture\.com/);
    await stop(closedProduction.server); closedProduction=null;
    for (const flag of ['NEWS_DEMO', 'NEWS_LOCAL_FIXTURES']) {
      fixtureProduction=await startServer({...env,VERCEL_ENV:'production',[flag]:'true'});
      const home=await (await fetch(fixtureProduction.base)).text();
      assert.match(home,/<meta name="robots" content="noindex, nofollow"/);
      assert.doesNotMatch(home,/rel="canonical"/);
      assert.match(await (await fetch(`${fixtureProduction.base}/robots.txt`)).text(),/Disallow: \//);
      assert.doesNotMatch(await (await fetch(`${fixtureProduction.base}/sitemap.xml`)).text(),/news\.launch-fixture\.com/);
      await stop(fixtureProduction.server); fixtureProduction=null;
    }
    bilingualProduction=await startServer({...env,VERCEL_ENV:'production',NEWS_BILINGUAL_PUBLIC_READ:'true',NEWS_RSS_ENABLED:'false',NEWS_EXPORT_FIXTURES:'false'});
    assert.match(await (await fetch(`${bilingualProduction.base}/robots.txt`)).text(),/Sitemap:/);
    assert.match(await (await fetch(`${bilingualProduction.base}/sitemap.xml`)).text(),/sitemapindex/);
    for(const path of ['/en','/zh','/en/category/ai','/zh/category/ai/model-releases','/en/search','/zh/about','/en/privacy','/en/terms']){const response=await fetch(`${bilingualProduction.base}${path}`);assert.equal(response.status,200,path);const html=await response.text();assert.doesNotMatch(html,/<meta name="robots" content="noindex/);}
    assert.equal((await fetch(`${bilingualProduction.base}/feed/en`)).status,200);
    assert.equal((await fetch(`${bilingualProduction.base}/news-sitemap.xml`)).status,200);
    await stop(bilingualProduction.server); bilingualProduction=null;
    production=await startServer({...env,VERCEL_ENV:'production'});
    let response=await fetch(production.base);
    let html=await response.text();
    assert.match(html,/<meta name="robots" content="index, follow"/);
    assert.match(html,/rel="canonical" href="https:\/\/news\.launch-fixture\.com\/en"/);
    const robots=await (await fetch(`${production.base}/robots.txt`)).text();
    assert.match(robots,/Sitemap: https:\/\/news\.launch-fixture\.com\/sitemap\.xml/);
    response=await fetch(`${production.base}/sitemap.xml`);
    assert.match(response.headers.get('cache-control'),/no-store/);
    let xml=await response.text();
    assert.match(xml,/sitemapindex/);assert.match(xml,/sitemaps\/en-6\.xml/);const pageMap=await(await fetch(`${production.base}/sitemaps/pages.xml`)).text();assert.match(pageMap,/https:\/\/news\.launch-fixture\.com\/en\/category\/robotics/);let articleMap=await(await fetch(`${production.base}/sitemaps/en-6.xml`)).text();assert.match(articleMap,/https:\/\/news\.launch-fixture\.com\/story\/fixture/);
    assert.doesNotMatch(xml,/\/editor|draft/);
    html=await (await fetch(`${production.base}/category/robotics`)).text();
    assert.match(html,/rel="canonical" href="https:\/\/news\.launch-fixture\.com\/en\/category\/robotics"/);
    html=await (await fetch(`${production.base}/category/robotics?q=robot`)).text();
    assert.match(html,/<meta name="robots" content="index, follow"/);
    html=await (await fetch(`${production.base}/search`)).text();
    assert.match(html,/<meta name="robots" content="index, follow"/);
    mode='many'; sitemapCalls=0;
    xml=await (await fetch(`${production.base}/sitemaps/en-3.xml`)).text();
    assert.match(xml,/\/story\/story-0500/);
    assert.equal(sitemapCalls,2,'sitemap must fetch subsequent public pages');
    mode='published';
    response=await fetch(`${production.base}/story/fixture`);
    html=await response.text();
    assert.match(html,/<title>Fictional fixture title｜Newsroom<\/title>/);
    assert.match(html,/rel="canonical" href="https:\/\/news\.launch-fixture\.com\/story\/fixture"/);
    const editor=await fetch(`${production.base}/editor`);
    assert.match(editor.headers.get('x-robots-tag'),/noindex/);
    assert.match(await editor.text(),/<meta name="robots" content="noindex, nofollow"/);
    mode='retracted';
    response=await fetch(`${production.base}/story/fixture`); html=await response.text();
    assert.match(html,/Withdrawn fixture/);
    assert.match(html,/<meta name="robots" content="noindex, nofollow"/);
    assert.doesNotMatch(html,/Fictional fixture title/);
    xml=await (await fetch(`${production.base}/sitemaps/en-6.xml`)).text();
    assert.doesNotMatch(xml,/\/story\/fixture/);
    mode='error';
    response=await fetch(`${production.base}/sitemaps/en-6.xml`);
    assert.ok(response.status>=500,'database failure must not return a successful empty sitemap');
  } finally {
    if (preview) await stop(preview.server);
    if (closedProduction) await stop(closedProduction.server);
    if (fixtureProduction) await stop(fixtureProduction.server);
    if (bilingualProduction) await stop(bilingualProduction.server);
    if (production) await stop(production.server);
    await new Promise(resolve=>mock.close(resolve));
  }
});
