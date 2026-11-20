import {test} from 'node:test';
import assert from 'node:assert/strict';
import {findRelatedArticles, relatedTerms} from '../lib/related-articles.mjs';

test('matches specific labels, excludes current article and ranks at most three results', async()=>{
 const row=(slug,title,date='2026-11-01T00:00:00Z')=>({slug,title,content_type:'manual',published_at:date});
 const current=row('current','SpaceX Starship current');
 const a=row('a','SpaceX Starship Flight 15'),b=row('b','SpaceX mission'),c=row('c','Starship flight'),d=row('d','Starship engine');
 const results=await findRelatedArticles({slug:'current',type:'manual',tags:['SpaceX','Starship','AI'],title:''},async term=>term==='SpaceX'?[current,a,b]:[current,a,c,d]);
 assert.deepEqual(results.map(x=>x.slug),['a','b','c']);
 assert.deepEqual(relatedTerms(['AI','科技','SpaceX','spacex','Starship']),['SpaceX','Starship']);
});

test('does not block article rendering when search fails or yields no exact match',async()=>{
 assert.deepEqual(await findRelatedArticles({slug:'x',type:'manual',tags:['SpaceX'],title:''},async()=>{throw Error('unavailable')}),[]);
 assert.deepEqual(await findRelatedArticles({slug:'x',type:'manual',tags:['SpaceX'],title:''},async()=>[{slug:'other',title:'Unrelated',published_at:'2026-11-01T00:00:00Z'}]),[]);
});
