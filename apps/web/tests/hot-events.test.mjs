import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createRequire} from 'node:module';
import ts from 'typescript';
import {renderToStaticMarkup} from 'react-dom/server';
const require=createRequire(import.meta.url);
const source=readFileSync(new URL('../app/hot-events.tsx',import.meta.url),'utf8');
const code=ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.CommonJS,jsx:ts.JsxEmit.ReactJSX,target:ts.ScriptTarget.ES2022}}).outputText;
const output={exports:{}};
new Function('require','module','exports',code)(name=>name==='../lib/locale-path'?{localePath:(locale,path)=>`/${locale}${path}`}:require(name),output,output.exports);
const component=output.exports.default;
test('event strip hides when empty and links to localized timelines',()=>{
 assert.equal(renderToStaticMarkup(component({locale:'zh',events:[]})),'');
 const event={slug:'rocket',title:'火箭事件',article_count:3,max_index:85,age_hours:2,last_progress_at:'2026-11-19T00:00:00Z',articles:[{title:'最新进展'}]};
 const html=renderToStaticMarkup(component({locale:'zh',events:[event]}));
 assert.match(html,/\/zh\/events\/rocket/);assert.match(html,/火箭事件/);assert.match(html,/最新进展/);assert.match(html,/85/);
});
