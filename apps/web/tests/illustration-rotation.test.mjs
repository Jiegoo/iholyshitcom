import {test} from 'node:test';
import assert from 'node:assert/strict';
import {nextIllustration} from '../lib/illustration-rotation.ts';

test('each round displays all six designs, with no repeat at round boundaries', () => {
 let state, last;
 for(let round=0;round<12;round++){
  const variants=[];
  for(let article=0;article<6;article++){
   state=nextIllustration(`article-${round}-${article}`,state,()=>0.37);
   assert.notEqual(state.variant,last);
   variants.push(state.variant);last=state.variant;
  }
  assert.deepEqual([...variants].sort(),[0,1,2,3,4,5]);
 }
});

test('same article preserves its image across locale changes and reloads', () => {
 const state=nextIllustration('same-article',undefined,()=>0.2);
 assert.deepEqual(nextIllustration('same-article',JSON.parse(JSON.stringify(state))),state);
});

test('missing or malformed stored preferences recover without blocking the image', () => {
 for(const stored of [null,{},'bad',{article:'x',variant:12,remaining:[1]},
  {article:'x',variant:0,remaining:[1,1]}, {article:'x',variant:0,remaining:[0,2]},
  {article:'x',variant:0,remaining:[1,2,3,4,5,6]}]){
  const state=nextIllustration('article',stored,()=>0.5);
  assert.ok(state.variant>=0&&state.variant<6);
  assert.equal(state.remaining.length,5);
 }
});
