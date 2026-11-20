import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createRequire} from 'node:module';
import ts from 'typescript';
const require=createRequire(import.meta.url);
const articleId='11111111-1111-4111-8111-111111111111';
const revisionId='22222222-2222-4222-8222-222222222222';
const publicationId='33333333-3333-4333-8333-333333333333';
function load(file,overrides,extra={}){
 const compiled={exports:{}};
 const code=ts.transpileModule(readFileSync(new URL(file,import.meta.url),'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,jsx:ts.JsxEmit.ReactJSX,target:ts.ScriptTarget.ES2022}}).outputText;
 new Function('require','module','exports',...Object.keys(extra),code)(name=>name in overrides?overrides[name]:require(name),compiled,compiled.exports,...Object.values(extra));
 return compiled.exports;
}
function form(){
 const f=new FormData();
 for(const [k,v] of Object.entries({article_id:articleId,revision_id:revisionId,slug:'fixture',zh_title:'更正标题',en_title:'Corrected headline',zh_summary:'摘要',en_summary:'Summary',zh_document:'{"type":"doc"}',en_document:'{"type":"doc"}',primary_channel:'ai',score:'69',reason:'更正标题',operation:'correction'}))f.set(k,v);
 f.append('topics','new-capabilities');return f;
}
test('correction returns saved revision without redirect and invalidates both public languages',async()=>{
 const before=process.env.NEWS_AUTH_ORIGIN;process.env.NEWS_AUTH_ORIGIN='https://example.com';
 const paths=[],calls=[];let fail=false;
 try{
  const {saveManualDraft}=load('../app/editor/manual/actions.ts',{
   'next/headers':{headers:async()=>new Headers({origin:'https://example.com'})},
   'next/navigation':{redirect:()=>assert.fail('must not navigate')},
   'next/cache':{revalidatePath:path=>paths.push(path)},
   '../../../lib/historical-article-slugs.mjs':{publicArticleSlug:(_type,slug)=>slug},
   '../../../lib/supabase':{createClient:async()=>({auth:{getUser:async()=>({data:{user:{id:articleId}}})},rpc:async(name,args)=>{calls.push({name,args});return fail?{error:{message:'manual revision conflict'}}:{data:{article_id:articleId,revision_id:revisionId,publication_id:publicationId}}}})},
  });
  const result=await saveManualDraft(form());assert.equal(result.ok,true);assert.equal(result.revisionId,revisionId);assert.equal(calls[0].args.p_zh_title,'更正标题');assert.equal(calls[0].args.p_score,69);assert.ok(paths.includes('/zh/fixture'));assert.ok(paths.includes('/en/fixture'));
  paths.length=0;const draft=form();draft.set('operation','save');assert.equal((await saveManualDraft(draft)).ok,true);assert.deepEqual(paths,[]);
  fail=true;assert.match((await saveManualDraft(form())).message,/已有其他修改/);assert.deepEqual(paths,[]);
 }finally{if(before===undefined)delete process.env.NEWS_AUTH_ORIGIN;else process.env.NEWS_AUTH_ORIGIN=before;}
});
test('editor keeps its position and updates revision for successive corrections',async()=>{
 const state=[];let cursor=0;const pending=[],sent=[],history=[];
 class Button{constructor(value){this.value=value;}}
 class CopyForm{constructor(input){const f=new FormData();for(const [k,v] of input)f.append(k,v);return f;}}
 const editor={getJSON:()=>({type:'doc',content:[]}),getText:()=> 'Live editor text'};
 const {ManualEditor}=load('../app/editor/manual/manual-editor.tsx',{
  react:{useState:initial=>{const i=cursor++;if(!(i in state))state[i]=initial;return [state[i],value=>state[i]=typeof value==='function'?value(state[i]):value]},useMemo:fn=>fn(),useTransition:()=>[false,fn=>pending.push(fn())]},
  '@supabase/ssr':{createBrowserClient:()=>({})},'@tiptap/extension-image':{default:{configure:()=>({})}},
  '@tiptap/react':{useEditor:()=>editor,EditorContent:()=>null},'@tiptap/starter-kit':{default:{}},'@tiptap/extension-table':{TableKit:{}},
  './actions':{saveManualDraft:async f=>{sent.push(f);return {ok:true,message:'发布更正成功',articleId,revisionId:publicationId,slug:'fixture'}}},
  '../../../lib/channel-topics':{channelTopics:{'ai':[{slug:'new-capabilities',zh:'新能力'}]}},
 },{FormData:CopyForm,HTMLButtonElement:Button,window:{history:{replaceState:(...args)=>history.push(args)}}});
 const draft={id:articleId,revision_id:revisionId,status:'published',primary_channel:'ai',topics:['new-capabilities'],related_channels:[],tags:[],source_links:[],editor_score:69};
 const render=()=>{cursor=0;return ManualEditor({draft,robotScore:69,initialMedia:[],supabaseUrl:'fixture',publishableKey:'fixture'})};
 const nodes=tree=>!tree||typeof tree!=='object'?[]:[tree,...[tree.props?.children].flat(Infinity).flatMap(nodes)];
 let tree=render();const submit=()=>tree.props.onSubmit({preventDefault(){},nativeEvent:{submitter:new Button('correction')},currentTarget:form()});
 submit();await Promise.all(pending);tree=render();
 const all=nodes(tree);assert.equal(all.find(n=>n.props?.name==='revision_id').props.value,publicationId);assert.ok(all.some(n=>n.props?.role==='status'));assert.ok(all.some(n=>n.props?.href==='/zh/fixture'));assert.equal(history.length,1);
 const second=form();second.set('revision_id',all.find(n=>n.props?.name==='revision_id').props.value);
 tree.props.onSubmit({preventDefault(){},nativeEvent:{submitter:new Button('correction')},currentTarget:second});await Promise.all(pending);assert.equal(sent[1].get('revision_id'),publicationId);
});
