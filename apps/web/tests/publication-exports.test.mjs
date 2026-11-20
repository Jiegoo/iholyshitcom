import { test } from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import net from 'node:net';
import { spawn } from 'node:child_process';
import { once } from 'node:events';
import { fileURLToPath } from 'node:url';
import { newsSitemapXml, rssXml } from '../lib/publication-xml.mjs';

test('XML exports escape data and reject malformed, stale or duplicate news', () => {
  const item={slug:'fixture',title:'<script> & \u0001 \ud800',summary:'A & B',published_at:'2026-11-09T00:00:00.000Z'};
  const historic=rssXml([{...item,slug:'sample-original-slug',content_type:'manual'}],'https://fixture.invalid','en',null);assert.match(historic,/\/en\/sample-original-slug/);assert.doesNotMatch(historic,/\/en\/gpt-/);
  const rss=rssXml([item],'https://fixture.invalid','en',null);
  assert.match(rss,/&lt;script&gt; &amp;/);assert.doesNotMatch(rss,/[\u0001\ud800]/);
  assert.throws(()=>rssXml([{...item,slug:'../editor'}],'https://fixture.invalid','en',null),/Invalid public export/);
  const now=Date.parse('2026-11-09T12:00:00Z');
  assert.match(newsSitemapXml([{item,locale:'en'}],'https://fixture.invalid',now),/news:publication_date/);
  assert.throws(()=>newsSitemapXml([{item,locale:'en'},{item,locale:'en'}],'https://fixture.invalid',now),/duplicate/);
  assert.throws(()=>newsSitemapXml([{item,locale:'en'}],'https://fixture.invalid',now+49*3600000),/date/);
});

test('local fictional feeds and news sitemap reuse current public projection and stay closed otherwise', { timeout:60000 }, async()=>{
  let mode='public';
  const mock=http.createServer((req,res)=>{
    res.setHeader('content-type','application/json');
    if(req.url==='/rest/v1/rpc/get_public_browse_count'||req.url==='/rest/v1/rpc/get_public_topic_count')return res.end('41');
    if(req.url==='/rest/v1/rpc/get_public_unified_browse'||req.url==='/rest/v1/rpc/get_public_unified_channel_counts'){res.writeHead(404);return res.end(JSON.stringify({code:'PGRST202',message:'fixture missing'}));}
    if(req.url==='/rest/v1/rpc/get_public_manual_feed')return res.end('[]');
    if (mode==='error') { res.writeHead(503);return res.end('{}'); }
    if(req.url!=='/rest/v1/rpc/get_public_channel_browse') { res.writeHead(404);return res.end('{}'); }
    let body='';req.on('data',chunk=>{body+=chunk});req.on('end',()=>{
      const q=JSON.parse(body);
      const rows=mode==='public' && q.p_offset===0 && (!q.p_channel || q.p_channel==='technology')
        ? [{slug:'fixture',title:q.p_locale==='zh'?'虚构 & 测试':'Fictional & test',summary:'Original <fixture>',category:'technology',score:80,published_at:new Date(Date.now()-10000).toISOString()}] : [];
      res.end(JSON.stringify(rows));
    });
  });
  mock.listen(0,'127.0.0.1');await once(mock,'listening');
  const socket=net.createServer();socket.listen(0,'127.0.0.1');await once(socket,'listening');const port=socket.address().port;await new Promise(r=>socket.close(r));
  const child=spawn(process.execPath,[fileURLToPath(new URL('../../../node_modules/next/dist/bin/next',import.meta.url)),'start','--hostname','127.0.0.1','--port',String(port)],{
    cwd:fileURLToPath(new URL('..',import.meta.url)),env:{...process.env,SUPABASE_URL:`http://127.0.0.1:${mock.address().port}`,SUPABASE_PUBLISHABLE_KEY:'fixture',
      NEWS_BILINGUAL_PUBLIC_READ:'true',NEWS_LOCAL_FIXTURES:'true',NEWS_EXPORT_FIXTURES:'true',NEXT_TELEMETRY_DISABLED:'1'},stdio:'ignore'});
  const base=`http://127.0.0.1:${port}`;
  try {
    let ready=false;for(let i=0;i<100;i++){try{await fetch(`${base}/robots.txt`);ready=true;break}catch{await new Promise(r=>setTimeout(r,100))}}assert.ok(ready);
    let res=await fetch(`${base}/feed/zh`);assert.equal(res.status,200);assert.match(res.headers.get('cache-control'),/no-store/);assert.match(res.headers.get('x-robots-tag'),/noindex/);
    const rss=await fetch(`${base}/rss.xml`);assert.equal(rss.status,200);assert.match(rss.headers.get('content-type'),/application\/rss\+xml/);const english=await rss.text();assert.match(english,/<rss version="2\.0">/);assert.match(english,/<language>en<\/language>/);assert.match(english,/Fictional &amp; test/);assert.match(english,/https:\/\/fixture\.invalid\/en\/story\/fixture/);
    let body=await res.text();assert.match(body,/虚构 &amp; 测试/);assert.match(body,/https:\/\/fixture\.invalid\/zh\/story\/fixture/);assert.match(body,/Original &lt;fixture&gt;/);
    body=await (await fetch(`${base}/feed/en/technology`)).text();assert.match(body,/Fictional &amp; test/);
    body=await (await fetch(`${base}/feed/en/ai`)).text();assert.doesNotMatch(body,/<item>/);
    assert.equal((await fetch(`${base}/feed/en/unknown`)).status,404);assert.equal((await fetch(`${base}/feed/fr`)).status,404);
    body=await (await fetch(`${base}/news-sitemap.xml`)).text();assert.match(body,/\/zh\/story\/fixture/);assert.match(body,/\/en\/story\/fixture/);assert.match(body,/news:publication_date/);assert.match(body,/<news:language>zh-cn<\/news:language>/);
    assert.match(await (await fetch(`${base}/robots.txt`)).text(),/Disallow: \//);
    assert.doesNotMatch(await (await fetch(`${base}/sitemap.xml`)).text(),/fixture/);
    for(const hidden of ['revoked','retracted','quarantine']) {
      mode=hidden;
      assert.doesNotMatch(await (await fetch(`${base}/feed/zh`)).text(),/fixture\/story|<item>/);
      assert.doesNotMatch(await (await fetch(`${base}/rss.xml`)).text(),/<item>/);
      assert.doesNotMatch(await (await fetch(`${base}/news-sitemap.xml`)).text(),/<url>/);
    }
    mode='error';assert.ok((await fetch(`${base}/feed/zh`)).status>=500);assert.ok((await fetch(`${base}/rss.xml`)).status>=500);assert.ok((await fetch(`${base}/news-sitemap.xml`)).status>=500);
  } finally { child.kill('SIGTERM');if(child.exitCode===null)await once(child,'exit');await new Promise(r=>mock.close(r)); }
});
