import {test} from 'node:test';
import assert from 'node:assert/strict';
import {articleDocument,legacyArticleDocument} from '../lib/article-document.mjs';
const paras = doc => doc.content.filter(n=>n.type==='paragraph').map(n=>n.content[0].text);
const heads = doc => doc.content.filter(n=>n.type==='heading');

test('keeps existing markdown and HTML headings as semantic h2 nodes',()=>{
 const body='开头段落。\n## 关键进展\n这是正文。\n\n<h2>后续影响</h2>\n仍是正文。';
 const doc=articleDocument(body);
 assert.deepEqual(heads(doc).map(x=>x.content[0].text),['关键进展','后续影响']);
 assert.ok(heads(doc).every(x=>x.attrs.level===2));
 assert.deepEqual(paras(doc),['开头段落。','这是正文。','仍是正文。']);
});

test('adds up to three evidence-preserving headings to long unstructured text',()=>{
 const body=Array.from({length:5},(_,i)=>`这是第${i}段的重要事实说明。`+'科技新闻内容'.repeat(35)).join('\n\n');
 const doc=articleDocument(body);assert.equal(heads(doc).length,3);assert.deepEqual(paras(doc),paras(legacyArticleDocument(body)));
 for(const h of heads(doc))assert.ok(body.includes(h.content[0].text));
});

test('leaves short and unsuitable text unchanged rather than guessing',()=>{
 for(const body of ['短文章。\n\n下一段。','长'.repeat(1000),'长'.repeat(300)+'\n\n'+'长'.repeat(300)+'\n\n'+'长'.repeat(300)+'\n\n'+'长'.repeat(300)])assert.deepEqual(articleDocument(body),legacyArticleDocument(body));
});
