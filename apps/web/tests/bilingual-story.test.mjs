import { test } from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import net from 'node:net';
import { spawn } from 'node:child_process';
import { once } from 'node:events';
import { fileURLToPath } from 'node:url';

test('bilingual story switches the same item, labels single-source and hides revoked content', {timeout:60000}, async () => {
  let visible=true, retracted=false;
  const mock=http.createServer((req,res) => {
    res.setHeader('content-type','application/json');
    if(req.url==='/rest/v1/rpc/get_public_browse_count'||req.url==='/rest/v1/rpc/get_public_topic_count')return res.end('41');
    if(req.url==='/rest/v1/rpc/get_public_unified_browse'||req.url==='/rest/v1/rpc/get_public_unified_channel_counts'){res.writeHead(404);return res.end(JSON.stringify({code:'PGRST202',message:'fixture missing'}));}
    if(req.url==='/rest/v1/rpc/get_public_manual_feed')return res.end('[]');
    if(req.url==='/rest/v1/rpc/get_public_latest_discoveries')return res.end(JSON.stringify([{slug:'fixture',title:'Fictional channel title',summary:'Fictional',category:'technology',score:80,published_at:new Date().toISOString(),content_type:'story'}]));
    if(req.url==='/rest/v1/rpc/get_public_channel_discovery') {
      res.end(JSON.stringify([{slug:'fixture',title:'Fictional feed title',summary:'Fictional feed summary',category:'technology',score:80}])); return;
    }
    if(req.url==='/rest/v1/rpc/get_public_channel_browse') {
      let body='';req.on('data',chunk=>{body+=chunk});req.on('end',()=>{const q=JSON.parse(body);res.end(JSON.stringify((q.p_channel===null||q.p_channel==='technology')?[{slug:'fixture',title:'Fictional channel title',summary:'Fictional',category:'technology',score:80,published_at:'2026-11-08T00:00:00Z'}]:[]));});return;
    }
    if(req.url==='/rest/v1/rpc/get_public_bilingual_retraction') {
      let body=''; req.on('data',chunk=>{body+=chunk}); req.on('end',()=>{
        const {p_locale}=JSON.parse(body);res.end(JSON.stringify(retracted?[{slug:'fixture',notice:p_locale==='zh'?'中文撤回说明':'English retraction notice',retracted_at:'2026-11-08T00:00:00Z'}]:[]));
      }); return;
    }
    if(req.url==='/rest/v1/rpc/get_public_bilingual_notices') {
      let body=''; req.on('data',chunk=>{body+=chunk}); req.on('end',()=>{
        const {p_locale}=JSON.parse(body);res.end(JSON.stringify(visible?[{kind:'correction',notice:p_locale==='zh'?'中文更正':'Corrected notice',published_at:'2026-11-08T00:00:00Z'}]:[]));
      }); return;
    }
    if(req.url==='/rest/v1/rpc/get_public_bilingual_story') {
      let body=''; req.on('data',chunk=>{body+=chunk}); req.on('end',()=>{
        const {p_slug,p_locale}=JSON.parse(body);
        if(!visible || p_slug!=='fixture') return res.end('null');
        res.end(JSON.stringify({slug:p_slug,locale:p_locale,title:p_locale==='zh'?'中文标题':'English title',
          summary:p_locale==='zh'?'中文摘要':'English summary',single_source:true,
          what_we_dont_know:p_locale==='zh'?'等待独立核验':'Awaiting independent verification',
          claims:[{text:p_locale==='zh'?'事实':'Fact',sources:[{name:'Example',url:'https://example.com/a',attribution:'Credit'}]}]}));
      }); return;
    }
    res.end('[]');
  });
  mock.listen(0,'127.0.0.1'); await once(mock,'listening');
  const socket=net.createServer();socket.listen(0,'127.0.0.1');await once(socket,'listening');
  const port=socket.address().port; await new Promise(resolve=>socket.close(resolve));
  const cwd=fileURLToPath(new URL('..',import.meta.url));
  const executable=fileURLToPath(new URL('../../../node_modules/next/dist/bin/next',import.meta.url));
  const child=spawn(process.execPath,[executable,'start','--hostname','127.0.0.1','--port',String(port)],{
    cwd,env:{...process.env,SUPABASE_URL:`http://127.0.0.1:${mock.address().port}`,SUPABASE_PUBLISHABLE_KEY:'fixture',
      NEWS_BILINGUAL_PUBLIC_READ:'true',NEWS_LOCAL_FIXTURES:'true',NEXT_TELEMETRY_DISABLED:'1'},stdio:['ignore','pipe','pipe']});
  let logs=''; child.stderr.on('data',chunk=>{logs+=chunk});
  const base=`http://127.0.0.1:${port}`;
  try {
    let ready=false;
    for(let i=0;i<100;i++) {
      if(child.exitCode!==null) throw new Error(`Next exited: ${logs}`);
      try { await fetch(`${base}/story/fixture?lang=zh`);ready=true;break; } catch { await new Promise(r=>setTimeout(r,100)); }
    }
    assert.equal(ready,true);
    const zhHome=await (await fetch(`${base}/?lang=zh`)).text();
    assert.match(zhHome,/<title>科技简报 — 发现值得关注的科技进展<\/title>/);
    assert.match(zhHome,/<meta name="description" content="科技简报（Newsroom）关注全球科技、人工智能与前沿发现，以中英双语报道值得关注的科技新闻。"/);
    assert.match(zhHome,/<meta property="og:title" content="科技简报 — 发现值得关注的科技进展"/);
    assert.match(zhHome,/<footer[\s\S]*?发现值得关注的科技进展/);
    assert.match(zhHome,/class="bilingual-latest-list"/);assert.match(zhHome,/aria-label="Newsroom"/);assert.match(zhHome,/noindex/);
    const header=zhHome.match(/<header[^>]*>[\s\S]*?<\/header>/)?.[0] ?? '';
    assert.doesNotMatch(header,/编辑方法|关于|更正/);
    assert.doesNotMatch(zhHome,/href="\/editor"|编辑登录/);
    const enHome=await (await fetch(`${base}/?lang=en`)).text();
    assert.match(enHome,/<title>Newsroom — Discover meaningful technology\.<\/title>/);
    assert.match(enHome,/<meta name="description" content="Verified shocking tech news, explained clearly\."/);
    assert.match(enHome,/Discover meaningful technology\./);assert.match(enHome,/noindex/);
    const zh=await fetch(`${base}/story/fixture?lang=zh`);assert.equal(zh.status,200);
    const zhHtml=await zh.text();
    assert.match(zhHtml,/<html lang="zh"/);assert.match(zhHtml,/<title>中文标题 - 科技简报 \(Newsroom\)<\/title>/);assert.match(zhHtml,/<meta name="description" content="中文摘要"/);assert.match(zhHtml,/中文标题/);assert.match(zhHtml,/单一来源、持续核验中/);assert.match(zhHtml,/等待独立核验/);
    assert.match(zhHtml,/中文更正/);
    assert.match(zhHtml,/\/en\/story\/fixture/);assert.match(zhHtml,/https:\/\/example.com\/a/);assert.match(zhHtml,/noindex/);
    const channelPage=await fetch(`${base}/en/category/technology?q=fixture&period=week&sort=score&page=2&view=list`);assert.equal(channelPage.status,200);
    const channelHtml=await channelPage.text();assert.match(channelHtml,/Page 2 \/ 3/);assert.match(channelHtml,/bilingual-latest-list/);assert.doesNotMatch(channelHtml,/<form|Search titles|Show results/);assert.doesNotMatch(channelHtml,/aria-label="View mode"/);
    assert.match(channelHtml,/href="\/zh\/category\/technology\?q=fixture&amp;period=week&amp;sort=score&amp;page=2#results"/);
    assert.match(channelHtml,/id="results"/);assert.match(channelHtml,/id="story-fixture"/);
    assert.match(channelHtml,/href="\/en\/category\/technology\?q=fixture&amp;period=week&amp;sort=score#results"/);
    assert.match(channelHtml,/<a class="channel-link" aria-current="page" href="\/en\/category\/technology"/);assert.match(channelHtml,/aria-label="Channel topics"/);assert.match(channelHtml,/Fictional channel title/);assert.match(channelHtml,/noindex/);
    assert.equal((await fetch(`${base}/zh`)).status,200);assert.equal((await fetch(`${base}/en`)).status,200);
    assert.equal((await fetch(`${base}/zh/category/space`)).status,200);
    const prefixedZh=await fetch(`${base}/zh/story/fixture`);assert.equal(prefixedZh.status,200);
    const prefixedZhHtml=await prefixedZh.text();assert.match(prefixedZhHtml,/<html lang="zh"/);assert.match(prefixedZhHtml,/中文标题/);assert.match(prefixedZhHtml,/\/en\/story\/fixture/);
    assert.match(prefixedZhHtml,/<meta property="og:title" content="中文标题"/);
    const structured=prefixedZhHtml.match(/<script type="application\/ld\+json">(.*?)<\/script>/)?.[1];
    assert.ok(structured);assert.equal(JSON.parse(structured).headline,'中文标题');assert.equal(JSON.parse(structured).inLanguage,'zh');
    assert.match(prefixedZhHtml,/noindex/);
    const prefixedEn=await fetch(`${base}/en/story/fixture`);assert.equal(prefixedEn.status,200);assert.match(await prefixedEn.text(),/English title/);
    assert.equal((await fetch(`${base}/fr/story/fixture`)).status,404);
    const en=await fetch(`${base}/story/fixture?lang=en`);assert.equal(en.status,200);
    const enHtml=await en.text();assert.match(enHtml,/aria-label="Breadcrumb"/);assert.match(enHtml,/href="\/en\/search"/);assert.match(enHtml,/Content is the responsibility of this deployment/);assert.match(enHtml,/<html lang="en"/);assert.match(enHtml,/<title>English title｜Newsroom<\/title>/);assert.match(enHtml,/<meta name="description" content="English summary"/);assert.match(enHtml,/English title/);assert.match(enHtml,/Single source; verification ongoing/);
    assert.match(enHtml,/Corrected notice/);
    assert.match(enHtml,/\/zh\/story\/fixture/);
    assert.equal((await fetch(`${base}/story/fixture?lang=fr`)).status,404);
    visible=false;
    assert.equal((await fetch(`${base}/story/fixture?lang=zh`)).status,404);
    assert.equal((await fetch(`${base}/story/fixture?lang=en`)).status,404);
    retracted=true;
    const retractedZh=await (await fetch(`${base}/story/fixture?lang=zh`)).text();
    assert.match(retractedZh,/中文撤回说明/);assert.doesNotMatch(retractedZh,/中文摘要/);assert.doesNotMatch(retractedZh,/<title>中文标题/);
    assert.doesNotMatch(retractedZh,/application\/ld\+json|og:title/);
    const retractedEn=await (await fetch(`${base}/story/fixture?lang=en`)).text();
    assert.match(retractedEn,/English retraction notice/);assert.doesNotMatch(retractedEn,/English summary/);
  } finally { child.kill('SIGTERM');await new Promise(r=>mock.close(r)); }
});
