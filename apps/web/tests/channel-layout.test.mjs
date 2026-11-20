import {test} from 'node:test';import assert from 'node:assert/strict';import {readFileSync} from 'node:fs';import {createRequire} from 'node:module';import React from 'react';import {renderToStaticMarkup} from 'react-dom/server';import ts from 'typescript';
const require=createRequire(import.meta.url);
function load(path,overrides={}){const code=ts.transpileModule(readFileSync(new URL(path,import.meta.url),'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,jsx:ts.JsxEmit.ReactJSX,target:ts.ScriptTarget.ES2022}}).outputText;const m={exports:{}};new Function('require','module','exports',code)(name=>name in overrides?overrides[name]:require(name),m,m.exports);return m.exports}
const {channelTopics}=load('../lib/channel-topics.ts');const {editorialChannels}=load('../lib/editorial-channels.ts');const localePath=(l,p)=>`/${l}${p}`;
const Topics=load('../app/channel-topics.tsx',{'../lib/channel-topics':{channelTopics},'../lib/locale-path':{localePath}}).default;
const Nav=load('../app/channel-nav.tsx',{'../lib/channel-topics':{channelTopics},'../lib/locale-path':{localePath},'../lib/editorial-channels':{editorialChannels}}).default;
test('channel navigation highlights one current channel and omits the Chinese separator',()=>{
 for(const c of editorialChannels){const html=renderToStaticMarkup(React.createElement(Nav,{locale:'zh',activeChannel:c.slug}));assert.equal((html.match(/aria-current="page"/g)??[]).length,1);assert.ok(html.includes(`<small>${c.zh}</small>`));assert.doesNotMatch(html,/<small><span/);}
});
test('topic filters show only this channel, preserve locale and select the current topic',()=>{
 for(const c of editorialChannels)for(const locale of ['en','zh']){const first=channelTopics[c.slug][0];const html=renderToStaticMarkup(React.createElement(Topics,{locale,channel:c.slug,topic:first.slug}));assert.equal((html.match(/<a /g)??[]).length,channelTopics[c.slug].length+1);assert.equal((html.match(/aria-current="page"/g)??[]).length,1);assert.ok(html.includes(`href="/${locale}/category/${c.slug}/${first.slug}" aria-current="page"`));}
});
