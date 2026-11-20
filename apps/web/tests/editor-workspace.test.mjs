import {test} from 'node:test';import assert from 'node:assert/strict';import {readFileSync} from 'node:fs';import {createRequire} from 'node:module';import ts from 'typescript';import {renderToStaticMarkup} from 'react-dom/server';import React from 'react';
import {articleBodyText} from '../lib/article-copy.mjs';
const require=createRequire(import.meta.url);
function load(path,stubs={}){const code=ts.transpileModule(readFileSync(new URL(path,import.meta.url),'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,jsx:ts.JsxEmit.ReactJSX,target:ts.ScriptTarget.ES2022}}).outputText;const m={exports:{}};new Function('require','module','exports',code)(name=>name in stubs?stubs[name]:require(name),m,m.exports);return m.exports}
test('workspace loads only article and robot operations and isolates individual failures',async()=>{
 const calls=[];const client={rpc:async name=>{calls.push(name);if(name==='manual_list_articles')return {data:[{id:'one',slug:'one',zh_title:'中文',en_title:'English',status:'published'}],error:null};if(name==='owner_list_duty_identities')return {data:null,error:{message:'denied'}};if(name==='owner_list_anonymous_comments'||name==='owner_article_reaction_stats'||name==='owner_article_read_stats')return {data:[],error:null};return {data:{selection:{prompt:'a',version:1},editor:{prompt:'b',version:2}},error:null}}};
 const stub={};for(const [module,name] of [['./workspace-tabs','WorkspaceTabs'],['./workspace-articles','WorkspaceArticles'],['./workspace-bots','WorkspaceBots'],['./workspace-homepage','WorkspaceHomepage'],['./workspace-comments','WorkspaceComments']])stub[module]={[name]:props=>React.createElement('div',null,name==='WorkspaceTabs'?[props.articles,props.bots,props.homepage,props.comments]:name)};
 const {EditorWorkspace}=load('../app/editor/editor-workspace.tsx',{'../../lib/supabase':{},'./actions':{logout:()=>{}},...stub});const html=renderToStaticMarkup(await EditorWorkspace({client}));assert.match(html,/WorkspaceArticles/);assert.match(html,/无法加载机器人/);assert.match(html,/WorkspaceHomepage/);assert.match(html,/WorkspaceComments/);assert.deepEqual(calls.sort(),['manual_list_articles','owner_list_duty_identities','owner_article_reaction_stats','owner_list_anonymous_comments','owner_article_read_stats'].sort());
});
test('homepage controls load and save in place while checking session and origin',async()=>{
 const calls=[];const client={auth:{getUser:async()=>({data:{user:{id:'owner'}},error:null})},rpc:async(name,args)=>{calls.push({name,args});return {data:name==='owner_get_homepage_control'?'pin':null,error:null}}};
 const {managePickInline}=load('../app/editor/homepage/inline-actions.ts',{'next/headers':{headers:async()=>({get:()=> 'https://example.test'})},'../../../lib/supabase':{createClient:async()=>client},'../../../lib/public-stories':{}});const previousOrigin=process.env.NEWS_AUTH_ORIGIN;process.env.NEWS_AUTH_ORIGIN='https://example.test';
 try{const form=new FormData();form.set('slug','test-article');form.set('kind','manual');form.set('operation','load');const first=await managePickInline({message:'',mode:null,loaded:false},form);assert.equal(first.mode,'pin');assert.equal(first.loaded,true);form.set('operation','save');form.set('mode','exclude');const saved=await managePickInline(first,form);assert.equal(saved.mode,'exclude');assert.equal(calls.at(-1).args.p_mode,'exclude');form.set('kind','story');await managePickInline(saved,form);assert.equal(calls.at(-1).args.p_type,'story');process.env.NEWS_AUTH_ORIGIN='https://different.test';const denied=await managePickInline(saved,form);assert.match(denied.message,/失败/);assert.equal(calls.length,3)}finally{if(previousOrigin===undefined)delete process.env.NEWS_AUTH_ORIGIN;else process.env.NEWS_AUTH_ORIGIN=previousOrigin}
});

test('list visibility controls are separate from edit links and enable only the reverse state',()=>{
 const {WorkspaceArticles}=load('../app/editor/workspace-articles.tsx',{'next/navigation':{useRouter:()=>({refresh(){}})},'./article-visibility-actions':{setArticleVisibility:async()=>({message:''})},'./article-copy-actions':{},'../../lib/article-share.mjs':{},'../../lib/article-copy.mjs':{}});
 for(const status of ['published','retracted','draft']){
  const html=renderToStaticMarkup(React.createElement(WorkspaceArticles,{items:[{id:'00000000-0000-4000-8000-000000000001',slug:'test',status,zh_title:'测试',en_title:'Test'}],stats:[]}));
  for(const anchor of html.matchAll(/<a\b[^>]*>([\s\S]*?)<\/a>/g))assert.doesNotMatch(anchor[1],/<button/);
  const buttons=[...html.matchAll(/<button([^>]*)>(上线|下线)<\/button>/g)];
  assert.equal(buttons.length,2);
  assert.equal(buttons[0][1].includes('disabled'),status!=='retracted');
  assert.equal(buttons[1][1].includes('disabled'),status!=='published');
  assert.ok(html.indexOf('>复制标题<')<html.indexOf('>复制正文<'));
  assert.ok(html.indexOf('>复制正文<')<html.indexOf('>上线<'));
  assert.ok(html.indexOf('article-visibility-buttons')<html.indexOf('manual-status'));
 }
});

test('body copy requires owner RPC, valid origin and session and returns only the selected document text',async()=>{
 let signedIn=true,origin='https://example.test',denied=false,body='正文 https://example.test/link';const calls=[];
 const client={auth:{getUser:async()=>({data:{user:signedIn?{id:'owner'}:null},error:null})},rpc:async(name,args)=>{calls.push({name,args});return denied?{data:null,error:{message:'denied'}}:{data:{zh_document:{type:'doc',content:[{type:'paragraph',content:[{type:'text',text:body}]}]},en_document:{type:'doc',content:[{type:'paragraph',content:[{type:'text',text:'English body'}]}]},zh_title:'TITLE_NOT_BODY',zh_summary:'SUMMARY_NOT_BODY',source_links:[{url:'https://example.test/source'}]},error:null};}};
 const {getArticleBodyForCopy}=load('../app/editor/article-copy-actions.ts',{'next/headers':{headers:async()=>({get:()=>origin})},'../../lib/supabase':{createClient:async()=>client},'../../lib/article-copy.mjs':{articleBodyText}});
 const previous=process.env.NEWS_AUTH_ORIGIN;process.env.NEWS_AUTH_ORIGIN='https://example.test';
 try{
  const id='00000000-0000-4000-8000-000000000001';
  assert.equal((await getArticleBodyForCopy(id,'zh')).text,'正文\n\n来自newsroom科技简报');
  assert.equal((await getArticleBodyForCopy(id,'en')).text,'English body\n\n来自newsroom科技简报');
  body='已含署名\n\n来自newsroom科技简报';assert.equal((await getArticleBodyForCopy(id,'zh')).text,body);
  assert.deepEqual(calls[0],{name:'manual_get_article',args:{p_article:id}});
  assert.equal((await getArticleBodyForCopy('bad','zh')).text,undefined);
  assert.equal((await getArticleBodyForCopy(id,'fr')).text,undefined);
  origin='https://other.test';assert.equal((await getArticleBodyForCopy(id,'zh')).text,undefined);
  origin='https://example.test';signedIn=false;assert.equal((await getArticleBodyForCopy(id,'zh')).text,undefined);assert.equal(calls.length,3);
  signedIn=true;denied=true;assert.equal((await getArticleBodyForCopy(id,'zh')).text,undefined);
 }finally{if(previous===undefined)delete process.env.NEWS_AUTH_ORIGIN;else process.env.NEWS_AUTH_ORIGIN=previous}
});

test('inline publication requires valid origin and login and returns actual persisted state',async()=>{
 const calls=[];let signedIn=true;let origin='https://example.test';
 const client={auth:{getUser:async()=>({data:{user:signedIn?{id:'owner'}:null},error:null})},rpc:async(name,args)=>{calls.push({name,args});return {data:args.p_published?'published':'retracted',error:null}}};
 const {setArticleVisibility}=load('../app/editor/article-visibility-actions.ts',{'next/headers':{headers:async()=>({get:()=>origin})},'../../lib/supabase':{createClient:async()=>client}});
 const previous=process.env.NEWS_AUTH_ORIGIN;process.env.NEWS_AUTH_ORIGIN='https://example.test';
 try{
  const id='00000000-0000-4000-8000-000000000001';
  assert.equal((await setArticleVisibility(id,false,'published')).status,'retracted');
  assert.equal((await setArticleVisibility(id,true,'retracted')).status,'published');
  assert.equal(calls.length,2);assert.equal(calls[0].args.p_expected_status,'published');
  assert.equal((await setArticleVisibility(id,true,'draft')).status,undefined);
  origin='https://other.test';assert.equal((await setArticleVisibility(id,false,'published')).status,undefined);
  origin='https://example.test';signedIn=false;assert.equal((await setArticleVisibility(id,false,'published')).status,undefined);
  assert.equal(calls.length,2);
 }finally{if(previous===undefined)delete process.env.NEWS_AUTH_ORIGIN;else process.env.NEWS_AUTH_ORIGIN=previous}
});

test('current sidebar exposes operations without retired collection and prompt navigation',()=>{
 const {WorkspaceTabs}=load('../app/editor/workspace-tabs.tsx',{'../brand':{default:()=>null},'./workspace-members':{WorkspaceMembers:()=>null},'./workspace-analytics':{WorkspaceAnalytics:()=>null}});
 const html=renderToStaticMarkup(React.createElement(WorkspaceTabs,{articles:null,bots:null,homepage:null,comments:null,session:null}));
 for(const label of ['文章管理','会员管理','访问统计','值班机器人','首页精选','匿名评价','成员与权限','个人资料'])assert.ok(html.includes(label));
 assert.doesNotMatch(html,/view=legacy|采集与历史|AI 提示词|选题机器人|双语编辑机器人/);
});
