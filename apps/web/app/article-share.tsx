'use client';
import {publicArticleSlug} from '../lib/historical-article-slugs.mjs';
import {useEffect,useState} from 'react';
import {localePath} from '../lib/locale-path';
import {articleShareLinks,copyArticleLink} from '../lib/article-share.mjs';

const logoFiles:Record<string,string>={x:'twitter-x',facebook:'facebook',linkedin:'linkedin',reddit:'reddit',whatsapp:'whatsapp',telegram:'telegram',weibo:'sina-weibo'};
function UtilityIcon({kind}:{kind:'copy'|'share'}){
 return <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">{kind==='copy'?<><rect x="8" y="8" width="12" height="12" rx="2"/><path d="M16 8V5a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h3"/></>:<><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><path d="m8.6 10.5 6.8-4m-6.8 7 6.8 4"/></>}</svg>;
}

export default function ArticleShare({title,slug,type,locale,origin}:{title:string;slug:string;type:'manual'|'story';locale:'zh'|'en';origin:string|null}){
 const zh=locale==='zh';const path=localePath(locale,`/${type === 'manual' ? '' : 'story/'}${publicArticleSlug(type, slug)}`);
 const [url,setUrl]=useState(origin?new URL(path,origin).href:'');
 const [native,setNative]=useState(false),[message,setMessage]=useState(''),[pending,setPending]=useState(false),[manualCopy,setManualCopy]=useState(false);
 useEffect(()=>{let cancelled=false;queueMicrotask(()=>{if(!cancelled){setUrl(new URL(path,origin??window.location.origin).href);setNative(typeof navigator.share==='function')}});return()=>{cancelled=true}},[origin,path]);
 async function copy(wechat=false){
  if(!url||pending)return;setPending(true);setMessage('');
  try{const copied=await copyArticleLink(url);setManualCopy(!copied);setMessage(copied?(wechat?(zh?'链接已复制，请打开微信粘贴给好友或朋友圈。':'Link copied. Paste it into WeChat to share.'):(zh?'文章链接已复制。':'Article link copied.')):(zh?'无法自动复制，请复制下方链接。':'Copy the link below to share.'));}
  finally{setPending(false);}
 }
 async function share(){
  if(!url||pending)return;setPending(true);setMessage('');
  try{await navigator.share({title,url});}
  catch(error){if(!(error instanceof DOMException&&error.name==='AbortError'))setMessage(zh?'系统分享暂不可用，请选择平台或复制链接。':'System sharing is unavailable. Choose a platform or copy the link.');}
  finally{setPending(false);}
 }
 return <section className="article-share" aria-label={zh?'分享这篇文章':'Share this article'}>
  <h2>{zh?'分享这篇文章':'Share this article'}</h2>
  <div className="article-share-actions">
   {url&&articleShareLinks(url,title).map(platform=><a key={platform.id} href={platform.href} target="_blank" rel="noopener noreferrer" title={zh?`分享到${platform.id==='weibo'?'微博':platform.label}`:`Share on ${platform.label}`} aria-label={zh?`分享到${platform.id==='weibo'?'微博':platform.label}（新窗口）`:`Share on ${platform.label} (opens a new window)`}><img src={`/social/${logoFiles[platform.id]}.svg`} width="22" height="22" alt="" aria-hidden="true"/></a>)}
   <button type="button" onClick={()=>void copy(true)} disabled={!url||pending} title={zh?'微信 · 复制链接':'WeChat · Copy link'} aria-label={zh?'微信 · 复制链接':'WeChat · Copy link'}><img src="/social/wechat.svg" width="24" height="24" alt="" aria-hidden="true"/></button>
   <button className="article-share-copy" type="button" onClick={()=>void copy()} disabled={!url||pending} title={zh?'复制链接':'Copy link'} aria-label={zh?'复制链接':'Copy link'}><UtilityIcon kind="copy"/></button>
   {native&&<button type="button" onClick={()=>void share()} disabled={!url||pending} title={zh?'更多分享':'More sharing options'} aria-label={zh?'更多分享':'More sharing options'}><UtilityIcon kind="share"/></button>}
  </div>
  <p className="article-share-status" role="status" aria-live="polite">{message}</p>
  {manualCopy&&<input className="article-share-url" aria-label={zh?'文章链接':'Article link'} value={url} readOnly onFocus={event=>event.currentTarget.select()}/>}
 </section>;
}
