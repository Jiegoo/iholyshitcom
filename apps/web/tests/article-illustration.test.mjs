import {test} from 'node:test';import assert from 'node:assert/strict';import {readFileSync} from 'node:fs';import ts from 'typescript';
const source=readFileSync(new URL('../lib/article-illustration.ts',import.meta.url),'utf8');const code=ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;const mod={exports:{}};new Function('module','exports',code)(mod,mod.exports);
const {illustrationTheme,illustrationVariant}=mod.exports;
test('illustrations choose stable, relevant topics from identifiers and channels',()=>{
 for(const [slug,channel,expected] of [['signal-encryption-proof','ai','security'],['nasa-mars-mission','technology','space'],['humanoid-robot-demo','robotics','robot'],['quantum-chip','technology','chip'],['gene-therapy','technology','bio'],['solar-battery-breakthrough','technology','energy'],['model-released','ai','ai'],['unknown-announcement','industry','business']])assert.equal(illustrationTheme(slug,channel),expected,slug);
 assert.equal(illustrationTheme('unknown','robotics'), 'robot');assert.equal(illustrationTheme('unknown',null,['脑机接口']), 'bio');assert.equal(illustrationTheme('unknown',null), 'tech');assert.equal(illustrationVariant('fixture'),illustrationVariant('fixture'));assert.ok(illustrationVariant('fixture')<4);
});
