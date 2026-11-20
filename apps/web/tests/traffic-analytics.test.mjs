import {test} from 'node:test';import assert from 'node:assert/strict';import {analyticsPath,analyticsReferrer,analyticsDevice,analyticsBrowser,analyticsOS} from '../lib/traffic-analytics.mjs';import {readFileSync} from 'node:fs';import {createRequire} from 'node:module';import ts from 'typescript';import React from 'react';import {renderToStaticMarkup} from 'react-dom/server';
const require=createRequire(import.meta.url);function load(path,stubs={}){const code=ts.transpileModule(readFileSync(new URL(path,import.meta.url),'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,jsx:ts.JsxEmit.ReactJSX,target:ts.ScriptTarget.ES2022}}).outputText;const m={exports:{}};new Function('require','module','exports',code)(n=>n in stubs?stubs[n]:require(n),m,m.exports);return m.exports}
test('traffic dimensions omit queries and private paths and retain only source host',()=>{
 for(const path of ['/zh','/en/manual/a-123','/zh/category/ai/ai-created','/en/search'])assert.equal(analyticsPath(path),path);
 for(const path of ['/editor','/zh/editor','/api/articles','/en/search?q=secret','/en/manual/a#secret','https://evil.test/en','/en/../../../editor'])assert.equal(analyticsPath(path),null);
 assert.equal(analyticsReferrer('https://google.com/search?q=private','news.launch-fixture.com'),'google.com');assert.equal(analyticsReferrer('https://news.launch-fixture.com/zh','news.launch-fixture.com'),'');assert.equal(analyticsReferrer('file:///private/file','news.launch-fixture.com'),'');
 assert.equal(analyticsDevice('iPhone Mobile Safari'),'mobile');assert.equal(analyticsDevice('iPad Safari'),'tablet');assert.equal(analyticsDevice('Windows NT Chrome'),'desktop');assert.equal(analyticsBrowser('Chrome/100 Edg/100'),'Edge');assert.equal(analyticsBrowser('iPhone CriOS/100 Safari'),'Chrome');assert.equal(analyticsOS('iPhone Safari'),'iOS');
});
test('analytics action requires valid period, origin, login and owner database authorization',async()=>{
 let origin='https://example.test',user=true,denied=false;const calls=[];const client={auth:{getUser:async()=>({data:{user:user?{id:'owner'}:null}})},rpc:async(name,args)=>{calls.push({name,args});return denied?{error:{message:'owner required'}}:{data:{totals:{views:3}}}}};
 const {loadTrafficAnalytics}=load('../app/editor/analytics-actions.ts',{'next/headers':{headers:async()=>({get:()=>origin})},'../../lib/supabase':{createClient:async()=>client}});const previous=process.env.NEWS_AUTH_ORIGIN;process.env.NEWS_AUTH_ORIGIN=origin;
 try{assert.equal((await loadTrafficAnalytics('7d')).data.totals.views,3);assert.deepEqual(calls[0],{name:'owner_traffic_analytics',args:{p_period:'7d'}});assert.ok((await loadTrafficAnalytics('all')).error);origin='https://evil.test';assert.ok((await loadTrafficAnalytics('today')).error);origin='https://example.test';user=false;assert.ok((await loadTrafficAnalytics('today')).error);assert.equal(calls.length,1);user=true;denied=true;assert.ok((await loadTrafficAnalytics('today')).error)}finally{if(previous===undefined)delete process.env.NEWS_AUTH_ORIGIN;else process.env.NEWS_AUTH_ORIGIN=previous}
});
test('article list shows available read count after current score and preserves only title edit entry',()=>{
 const {WorkspaceArticles}=load('../app/editor/workspace-articles.tsx',{'next/navigation':{useRouter:()=>({refresh(){}})},'./article-visibility-actions':{},'./article-copy-actions':{},'../../lib/article-share.mjs':{},'../../lib/article-copy.mjs':{}});
 const props={items:[{id:'one',slug:'one',status:'published',zh_title:'中文',en_title:'English'}],stats:[{content_type:'manual',slug:'one',base_score:67,clicks:0,dislikes:0,shit:0,score:67}],reads:[{content_type:'manual',slug:'one',reads:123}]};
 const html=renderToStaticMarkup(React.createElement(WorkspaceArticles,props));assert.match(html,/当前 67 分 · 阅读量（近30天）123/);assert.doesNotMatch(html,/>→</);assert.match(html,/class="workspace-article-title" href="\/editor\/manual\?id=one"/);
 const unavailable=renderToStaticMarkup(React.createElement(WorkspaceArticles,{...props,reads:null}));assert.match(unavailable,/阅读量（近30天）暂不可用/);
});

test('public tracker starts after consent, counts navigation once and submits foreground time on departure',async()=>{
 let effect,cleanup,consent=false;const listeners=new Map(),calls=[];const original={window:globalThis.window,document:globalThis.document,fetch:globalThis.fetch};
 const win={location:{pathname:'/en/manual/one'},addEventListener:(k,v)=>listeners.set(k,v),removeEventListener:k=>listeners.delete(k)};
 const doc={visibilityState:'visible',referrer:'https://google.com/',addEventListener:(k,v)=>listeners.set(k,v),removeEventListener:k=>listeners.delete(k)};
 const {SiteVisit}=(()=>{const m=load('../app/site-visit.tsx',{react:{useEffect:fn=>{effect=fn}},'next/navigation':{usePathname:()=>'/en/manual/one'},'./cookie-consent':{hasCookieConsent:()=>consent},'../lib/traffic-analytics.mjs':{analyticsPath},});return {SiteVisit:m.default}})();
 try{
  globalThis.window=win;globalThis.document=doc;globalThis.fetch=async(url,args)=>{calls.push(JSON.parse(args.body));return {ok:true}};
  SiteVisit();cleanup=effect();assert.equal(calls.length,0);consent=true;listeners.get('ihs-cookie-consent-changed')();await new Promise(r=>setImmediate(r));assert.equal(calls.length,1);assert.equal(calls[0].path,'/en/manual/one');listeners.get('ihs-cookie-consent-changed')();assert.equal(calls.length,1);
  doc.visibilityState='hidden';listeners.get('visibilitychange')();await new Promise(r=>setImmediate(r));assert.equal(calls[1].id,calls[0].id);assert.equal(typeof calls[1].seconds,'number');const count=calls.length;consent=false;listeners.get('ihs-cookie-consent-changed')();cleanup();assert.equal(calls.length,count);
 }finally{Object.assign(globalThis,original)}
});
