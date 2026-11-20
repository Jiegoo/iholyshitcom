import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createRequire} from 'node:module';
import ts from 'typescript';
import {NextRequest} from 'next/server.js';
import * as detection from '../lib/visitor-locale.mjs';
import * as historical from '../lib/historical-article-slugs.mjs';
const require=createRequire(import.meta.url);
function load(path,stubs={}){const code=ts.transpileModule(readFileSync(new URL(path,import.meta.url),'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;const mod={exports:{}};new Function('require','module','exports',code)(name=>name in stubs?stubs[name]:require(name),mod,mod.exports);return mod.exports;}
const {proxy}=load('../proxy.ts',{'./lib/visitor-locale.mjs':detection,'./lib/historical-article-slugs.mjs':historical,'./lib/locale-path':{localePath:(locale,path)=>`/${locale}${path==='/'?'':path}`},'@supabase/ssr':{createServerClient:()=>({auth:{getClaims:async()=>({})}})}});

test('country defaults, consented choice and weighted browser fallback choose only supported locales',()=>{
 for(const country of ['CN','HK','MO','TW','cn'])assert.equal(detection.initialVisitorLocale({country}),'zh');
 for(const country of ['US','GB','JP','SG'])assert.equal(detection.initialVisitorLocale({country,acceptLanguage:'zh-CN'}),'en');
 assert.equal(detection.initialVisitorLocale({country:'CN',preference:'en',consented:true}),'en');
 assert.equal(detection.initialVisitorLocale({country:'US',preference:'zh',consented:true}),'zh');
 assert.equal(detection.initialVisitorLocale({country:'US',preference:'zh',consented:false}),'en');
 assert.equal(detection.initialVisitorLocale({country:'ZZ',acceptLanguage:'fr-FR,zh-Hant;q=0.8,en;q=0.4'}),'zh');
 assert.equal(detection.initialVisitorLocale({acceptLanguage:'zh;q=0,en-US;q=0.5'}),'en');
 assert.equal(detection.initialVisitorLocale({acceptLanguage:'en;q=0.4,zh;q=0.9'}),'zh');
 assert.equal(detection.initialVisitorLocale({country:null,acceptLanguage:'broken; q=xyz'}),'en');
});

test('independent deployments do not contain original-site article aliases',()=>{assert.equal(historical.publicArticleSlug('manual','sample-original-slug'),'sample-original-slug');assert.equal(historical.storedArticleSlug('sample-original-slug'),'sample-original-slug');});

test('only bare public GET/HEAD pages redirect; explicit language and service endpoints remain stable',async()=>{
 const run=(path,headers={},method='GET')=>proxy(new NextRequest(`https://www.news.launch-fixture.com${path}`,{headers,method}));
 const first=await run('/?q=ai&utm_source=test',{'x-vercel-ip-country':'CN'});
 assert.equal(first.status,307);assert.equal(first.headers.get('location'),'https://www.news.launch-fixture.com/zh?q=ai&utm_source=test');
 assert.equal(first.headers.get('cache-control'),'private, no-store');assert.equal(first.cookies.get('ihs_locale'),undefined);
 const saved=await run('/',{'x-vercel-ip-country':'CN',cookie:'ihs_cookie_consent=accepted; ihs_locale=en'});assert.equal(saved.headers.get('location'),'https://www.news.launch-fixture.com/en');
 const stale=await run('/',{'x-vercel-ip-country':'US',cookie:'ihs_locale=zh'});assert.equal(stale.headers.get('location'),'https://www.news.launch-fixture.com/en');assert.match(stale.headers.get('set-cookie'),/ihs_locale=;.*Max-Age=0/);
 assert.equal((await run('/manual/test?from=share',{'x-vercel-ip-country':'TW'},'HEAD')).headers.get('location'),'https://www.news.launch-fixture.com/zh/manual/test?from=share');
 for(const path of ['/en','/en/manual/test','/zh/category/ai','/zh/manual/test?lang=en']){
  const response=await run(path,{'x-vercel-ip-country':'US',cookie:'ihs_cookie_consent=accepted; ihs_locale=en'});assert.equal(response.headers.get('location'),null);assert.ok(response.headers.get('x-middleware-rewrite'));
 }
 assert.match((await run('/en?lang=zh',{'x-vercel-ip-country':'CN'})).headers.get('x-middleware-rewrite'),/lang=en/);
 assert.match((await run('/en/events')).headers.get('x-middleware-rewrite'),/\/events\?lang=en/);
 assert.match((await run('/zh/events/example')).headers.get('x-middleware-rewrite'),/\/events\/example\?lang=zh/);
 assert.match((await run('/en/a-news-slug')).headers.get('x-middleware-rewrite'),/\/manual\/a-news-slug\?lang=en/);
 assert.match((await run('/zh/a-news-slug')).headers.get('x-middleware-rewrite'),/\/manual\/a-news-slug\?lang=zh/);
 for(const path of ['/robots.txt','/sitemap.xml','/api/articles','/editor','/en/api/articles','/?lang=en','/?lang=invalid'])assert.equal((await run(path,{'x-vercel-ip-country':'CN'})).headers.get('location'),null,path);
 assert.equal((await run('/',{'x-vercel-ip-country':'CN'},'POST')).headers.get('location'),null);
});

test('language choice never writes before consent and rejection removes the saved preference',async()=>{
 let written='';const doc={location:{protocol:'https:'},get cookie(){return written},set cookie(value){written=value}};
 assert.equal(detection.rememberLocale('zh',doc),false);assert.equal(written,'');
 written='ihs_cookie_consent=accepted';assert.equal(detection.rememberLocale('zh',doc),true);assert.match(written,/^ihs_locale=zh;.*Max-Age=15552000;.*Secure$/);
 written='ihs_cookie_consent=accepted';assert.equal(detection.rememberLocale('en; fake=value',doc),false);assert.equal(written,'ihs_cookie_consent=accepted');
 const {POST}=load('../app/api/cookie-consent/route.ts');const response=await POST(new NextRequest('https://example.test/api/cookie-consent',{method:'POST',headers:{host:'example.test',origin:'https://example.test','content-type':'application/json'},body:JSON.stringify({decision:'reject'})}));
 assert.equal(response.status,204);assert.equal(response.cookies.get('ihs_locale').maxAge,0);
});
