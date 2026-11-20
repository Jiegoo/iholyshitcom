import {test} from 'node:test';
import assert from 'node:assert/strict';
import {articleShareLinks,copyArticleLink} from '../lib/article-share.mjs';

test('share destinations preserve the exact localized link and safely encode a bilingual title',()=>{
 const url='https://www.news.launch-fixture.com/zh/manual/test-article',title='AI & Society: 新发现 + 69%? #1';
 const links=articleShareLinks(url,title);assert.equal(links.length,7);
 for(const item of links){
  const dest=new URL(item.href);assert.equal(dest.protocol,'https:');
  const params=dest.searchParams;
  if(item.id==='whatsapp')assert.equal(params.get('text'),`${title}\n${url}`);
  else{assert.equal(params.get(item.id==='facebook'?'u':'url'),url);if(['x','telegram'].includes(item.id))assert.equal(params.get('text'),title);if(['reddit','weibo'].includes(item.id))assert.equal(params.get('title'),title);}
  assert.equal(dest.hash,'');
 }
 assert.ok(articleShareLinks(url.replace('/zh/','/en/'),title).every(item=>decodeURIComponent(item.href).includes('/en/manual/test-article')));
});

test('copy success uses only the clipboard and does not construct a fallback input',async()=>{
 let copied;assert.equal(await copyArticleLink('https://example.test/en/story/test',{clipboard:{writeText:async text=>{copied=text}}},{createElement(){throw Error('unexpected fallback')}}),true);assert.equal(copied,'https://example.test/en/story/test');
});

test('denied clipboard falls back safely, restores focus and reports a blocked copy',async()=>{
 for(const allowed of [true,false]){
  const calls=[];const input={style:{},select(){calls.push('select')},remove(){calls.push('remove')}};
  const doc={createElement:()=>input,body:{appendChild(){calls.push('append')}},activeElement:{focus(){calls.push('focus')}},execCommand(command){assert.equal(command,'copy');return allowed}};
  assert.equal(await copyArticleLink('https://example.test/zh/story/test',{clipboard:{writeText:async()=>{throw Error('denied')}}},doc),allowed);
  assert.equal(input.value,'https://example.test/zh/story/test');assert.deepEqual(calls,['append','select','remove','focus']);
 }
});
