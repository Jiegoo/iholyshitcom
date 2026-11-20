import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createRequire} from 'node:module';
import ts from 'typescript';
const require=createRequire(import.meta.url);
test('homepage loads each channel independently',async()=>{
 const src=readFileSync(new URL('../app/page.tsx',import.meta.url),'utf8');
 const code=ts.transpileModule(src,{compilerOptions:{module:ts.ModuleKind.CommonJS,jsx:ts.JsxEmit.ReactJSX,target:ts.ScriptTarget.ES2022}}).outputText;
 const channels=[{slug:'ai'},{slug:'industry'}],calls=[];
 const stubs={'../lib/public-stories':{getBrowse:async o=>(calls.push(o.category),[{category:o.category}]),getChannelCounts:async()=>[],getHotEvents:async()=>[],getLatestDiscoveries:async()=>[],getHomepageFeatured:async()=>({headline:[],picks:[],picks_recent:[]}),getHomepageSection:async()=>[]},'../lib/editorial-channels':{editorialChannels:channels},'../lib/local-fixtures':{localFixtureMode:()=>false},'../lib/site-brand.mjs':{siteNames:{},siteTitles:{}},'../lib/search-config.mjs':{},'./discovery':{},'./bilingual-home':{default:()=>null}};
 const m={exports:{}};new Function('require','module','exports',code)(name=>name in stubs?stubs[name]:require(name),m,m.exports);
 const page=await m.exports.default({searchParams:Promise.resolve({lang:'en'})});
 assert.deepEqual(calls,['ai','industry']);assert.deepEqual(page.props.stories.map(s=>s.category),calls);
});
