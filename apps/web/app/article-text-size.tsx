'use client';
import {useEffect,useRef,useState} from 'react';
type Size='small'|'medium'|'large';
const preferenceKey='ihs_article_text_size';
const isSize=(value:unknown):value is Size=>value==='small'||value==='medium'||value==='large';
export default function ArticleTextSize({locale}:{locale:'zh'|'en'}){
 const [size,setSize]=useState<Size>('small');const group=useRef<HTMLDivElement>(null);const zh=locale==='zh';
 useEffect(()=>{
  function apply(value:unknown){if(!isSize(value))return;const article=group.current?.closest('article');if(article)article.dataset.readingSize=value;setSize(value);}
  try{apply(localStorage.getItem(preferenceKey));}catch{ /* Current-page controls remain available when storage is blocked. */ }
  const sync=(event:StorageEvent)=>{if(event.key===preferenceKey)apply(event.newValue??'small');};
  window.addEventListener('storage',sync);return()=>window.removeEventListener('storage',sync);
 },[]);
 function choose(next:Size){const article=group.current?.closest('article');if(!article)return;article.dataset.readingSize=next;setSize(next);try{localStorage.setItem(preferenceKey,next);}catch{ /* Do not block reading preferences on the current page. */ }}
 return <div ref={group} className="article-text-size" role="group" aria-label={zh?'正文字号':'Article text size'}><span>{zh?'字号':'Text'}</span>{([
  ['small',zh?'小':'S',zh?'小号正文':'Small text'],['medium',zh?'中':'M',zh?'中号正文':'Medium text'],['large',zh?'大':'L',zh?'大号正文':'Large text'],
 ] as const).map(([value,label,name])=><button key={value} type="button" aria-label={name} aria-pressed={size===value} onClick={()=>choose(value)}>{label}</button>)}</div>;
}
