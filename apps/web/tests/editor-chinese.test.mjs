import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createRequire} from 'node:module';
import ts from 'typescript';
import React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
const require=createRequire(import.meta.url);
async function render({configured=true,signedIn=true,owner=true,query={}}={}){
 const calls=[];
 const client={auth:{getClaims:async()=>({data:signedIn?{claims:{sub:'owner'}}:null})},rpc:async name=>{calls.push(name);assert.equal(name,'manual_is_owner');return {data:owner,error:null}}};
 const overrides={
  '../../lib/supabase':{isConfigured:()=>configured,createClient:async()=>client},
  '../../lib/editor-email-link':{emailLinkConfig:()=>false},
  './actions':{login(){},logout(){}},
  './editor-workspace':{EditorWorkspace:()=>React.createElement('div',null,'当前文章工作台')},
 };
 const compiled={exports:{}};
 const code=ts.transpileModule(readFileSync(new URL('../app/editor/page.tsx',import.meta.url),'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,jsx:ts.JsxEmit.ReactJSX,target:ts.ScriptTarget.ES2022}}).outputText;
 new Function('require','module','exports',code)(name=>name in overrides?overrides[name]:require(name),compiled,compiled.exports);
 return {html:renderToStaticMarkup(await compiled.exports.default({searchParams:Promise.resolve(query)})),calls};
}
test('Chinese login, configuration and access checks survive collection console removal',async()=>{
 assert.match((await render({configured:false})).html,/编辑服务尚未配置/);
 const login=await render({signedIn:false,query:{status:'login'}});assert.match(login.html,/登录失败/);assert.match(login.html,/邮箱/);assert.match(login.html,/密码/);assert.deepEqual(login.calls,[]);
 const denied=await render({owner:false});assert.match(denied.html,/没有可用的编辑访问权限/);assert.match(denied.html,/退出登录/);
});
test('retired collection query parameters cannot reactivate the old console or its database reads',async()=>{
 for(const query of [{view:'legacy'},{story:'old-story',candidateArticle:'old-article'},{status:'saved'}]){
  const result=await render({query});assert.match(result.html,/当前文章工作台/);assert.deepEqual(result.calls,['manual_is_owner']);assert.doesNotMatch(result.html,/采集|来源许可|审核历史/);
 }
 const proxy=readFileSync(new URL('../proxy.ts',import.meta.url),'utf8');assert.match(proxy,/noindex, nofollow/);assert.match(proxy,/private, no-store/);
});
