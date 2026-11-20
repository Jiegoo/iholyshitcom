import {test} from 'node:test';
import assert from 'node:assert/strict';
import {articleBodyText,copyLoadedArticleText} from '../lib/article-copy.mjs';

test('body copying preserves paragraphs, lists, link labels and tables but omits URLs and media',()=>{
 const paragraph=text=>({type:'paragraph',content:[{type:'text',text}]});
 const document={type:'doc',content:[
  {type:'heading',content:[{type:'text',text:'正文小标题'}]},
  {type:'paragraph',content:[{type:'text',text:'普通正文。'},{type:'hardBreak'},{type:'text',text:'官方说明',marks:[{type:'link',attrs:{href:'https://example.test/source'}}]}]},
  paragraph('详情见 https://example.test/news?q=1。下一句。'),
  paragraph('[参考文字](https://example.test/reference)'),
  paragraph('https://example.test/only-link'),
  paragraph('www.example.test/file'),
  {type:'image',attrs:{src:'/api/manual-media/test',alt:'IMAGE_METADATA'}},
  {type:'manualVideo',attrs:{src:'https://example.test/video'}},
  {type:'bulletList',content:[{type:'listItem',content:[paragraph('要点一')]},{type:'listItem',content:[paragraph('要点二')]}]},
  {type:'table',content:[{type:'tableRow',content:[{type:'tableCell',content:[paragraph('参数')]},{type:'tableCell',content:[paragraph('数值')]}]}]},
  {type:'codeBlock',content:[{type:'text',text:'const value = 1;'}]},
 ]};
 const result=articleBodyText(document);
 assert.match(result,/正文小标题\n\n普通正文。\n官方说明/);
 assert.match(result,/下一句。/);assert.match(result,/参考文字/);assert.match(result,/要点一\n要点二/);
 assert.match(result,/参数\t数值/);assert.match(result,/const value = 1;/);
 assert.doesNotMatch(result,/https?:|www\.|manual-media|IMAGE_METADATA/);
 assert.equal(articleBodyText(null),'');assert.equal(articleBodyText({type:'doc'}),'');
});

test('delayed body loading starts clipboard writing inside the initial click',async()=>{
 const calls=[];class Item{constructor(data){this.data=data;}}
 const nav={clipboard:{write:async items=>{calls.push('write');assert.equal(await (await items[0].data['text/plain']).text(),'正文');}}};
 const result=await copyLoadedArticleText(async()=>{calls.push('load');return '正文';},nav,{},Item);
 assert.deepEqual(calls,['write','load']);assert.deepEqual(result,{copied:true,text:'正文'});
});

test('blocked copying retains plain text for manual selection; loading failure cannot report success',async()=>{
 const input={style:{},select(){},remove(){}};
 const doc={createElement:()=>input,body:{appendChild(){}},execCommand:()=>false};
 assert.deepEqual(await copyLoadedArticleText(async()=>'正文',{clipboard:{writeText:async()=>{throw Error('blocked');}}},doc,undefined),{copied:false,text:'正文'});
 await assert.rejects(copyLoadedArticleText(async()=>{throw Error('denied');},{},doc,undefined),/denied/);
});
