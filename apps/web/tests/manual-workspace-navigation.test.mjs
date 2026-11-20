import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createRequire} from 'node:module';
import ts from 'typescript';
import {renderToStaticMarkup} from 'react-dom/server';
const require=createRequire(import.meta.url);
const id='11111111-1111-4111-8111-111111111111';
const items=Array.from({length:25},(_,i)=>({id:i===0?id:`00000000-0000-4000-8000-${String(i).padStart(12,'0')}`,slug:`story-${i}`,status:'draft',zh_title:`标题 ${i}`,en_title:`Headline ${i}`}));
async function render(query){
 const calls=[];const client={auth:{getUser:async()=>({data:{user:{id:'owner'}}})},rpc:async(name)=>{calls.push(name);if(name==='manual_is_owner')return {data:true};if(name==='manual_list_articles')return {data:items};if(name==='manual_list_media')return {data:[]};if(name==='manual_get_article_with_topics')return {data:{...items[0],revision_id:id}};return {data:null}}};
 const src=readFileSync(new URL('../app/editor/manual/page.tsx',import.meta.url),'utf8');const compiled={exports:{}};
 const code=ts.transpileModule(src,{compilerOptions:{module:ts.ModuleKind.CommonJS,jsx:ts.JsxEmit.ReactJSX,target:ts.ScriptTarget.ES2022}}).outputText;
 const overrides={'../../../lib/supabase':{createClient:async()=>client,isConfigured:()=>true},'./manual-editor':{ManualEditor:()=>null},'./actions':{manageManualPublication:()=>{}}};
 new Function('require','module','exports',code)(name=>name in overrides?overrides[name]:require(name),compiled,compiled.exports);
 return {html:renderToStaticMarkup(await compiled.exports.default({searchParams:Promise.resolve(query)})),calls};
}
test('article list is paginated and opens separate editing view',async()=>{
 const first=await render({});assert.match(first.html,/标题 0/);assert.doesNotMatch(first.html,/标题 24/);assert.match(first.html,/第 1 \/ 2 页/);assert.doesNotMatch(first.html,/编辑文章<\/h2>/);assert.ok(!first.calls.includes('manual_list_media'));
 const second=await render({page:'2'});assert.match(second.html,/标题 24/);assert.doesNotMatch(second.html,/标题 0/);
 const found=await render({q:'Headline 24'});assert.match(found.html,/标题 24/);assert.doesNotMatch(found.html,/标题 0/);
 const selected=await render({id});assert.match(selected.html,/返回工作台/);assert.match(selected.html,/编辑文章/);assert.doesNotMatch(selected.html,/稿件列表<\/h2>/);assert.ok(!selected.calls.includes('manual_list_articles'));
 const created=await render({new:'1'});assert.match(created.html,/新建双语稿件/);assert.ok(!created.calls.includes('manual_list_articles'));
});
