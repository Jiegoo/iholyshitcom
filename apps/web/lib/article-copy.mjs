import {copyArticleLink as copyText} from './article-share.mjs';

export function articleBodyText(document) {
 function text(node) {
  if (!node || typeof node !== 'object') return '';
  if (['image','youtube','manualVideo','video','horizontalRule'].includes(node.type)) return '';
  if (node.type==='text') return typeof node.text==='string'?node.text:'';
  if (node.type==='hardBreak') return '\n';
  const children=Array.isArray(node.content)?node.content.map(text):[];
  const separator=['paragraph','heading','codeBlock'].includes(node.type)?'':node.type==='tableRow'?'\t':node.type==='doc'?'\n\n':'\n';
  return children.join(separator);
 }
 return text(document)
  .replace(/\[([^\]]*)\]\((?:https?:\/\/|www\.)[^)\s]+\)/giu,'$1')
  .replace(/<(?:https?:\/\/|www\.)[^>]+>/giu,'')
  .replace(/(?:https?:\/\/|ftp:\/\/|www\.)[^\s<>"'，。；！？、（）【】]+/giu,value=>value.match(/[.,;:!?)}\]]+$/)?.[0]??'')
  .split('\n').map(line=>line.trimEnd()).join('\n').replace(/\n{3,}/g,'\n\n').trim();
}

/** @param {() => Promise<string>} load */
export async function copyLoadedArticleText(load,nav=navigator,doc=document,Item=globalThis.ClipboardItem) {
 const pending=Promise.resolve().then(load);
 if (nav.clipboard?.write && Item) {
  const blob=pending.then(text=>new Blob([text],{type:'text/plain'}));
  blob.catch(()=>{});
  try {
   // Start in the click gesture; WebKit must not wait for the article request first.
   await nav.clipboard.write([new Item({'text/plain':blob})]);
   return {copied:true,text:await pending};
  } catch { /* Fall back to the existing plain-text copy and manual selection. */ }
 }
 const text=await pending;
 return {copied:await copyText(text,nav,doc),text};
}
