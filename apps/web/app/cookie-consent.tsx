'use client';
import {useEffect,useState} from 'react';
import {usePathname} from 'next/navigation';
import {localePath} from '../lib/locale-path';
import {rememberLocale} from '../lib/visitor-locale.mjs';
const rejectionKey='ihs_cookie_rejected';
export function hasCookieConsent(){return document.cookie.split(';').some(part=>part.trim()==='ihs_cookie_consent=accepted')}
export function CookiePreferencesButton({locale}:{locale:'zh'|'en'}){return <button className="cookie-preferences-link" type="button" onClick={()=>window.dispatchEvent(new Event('ihs-open-cookie-preferences'))}>{locale==='zh'?'Cookie 设置':'Cookie settings'}</button>}
export default function CookieConsent({locale}:{locale:'zh'|'en'}){
 const [open,setOpen]=useState(false),[busy,setBusy]=useState(false),[error,setError]=useState(false);const path=usePathname();const zh=locale==='zh';
 // Browser-only cookie and local storage values must be read after hydration.
 // eslint-disable-next-line react-hooks/set-state-in-effect
 useEffect(()=>{if(path?.startsWith('/editor')){setOpen(false);return}let rejected=false;try{rejected=localStorage.getItem(rejectionKey)==='yes'}catch{}setOpen(!hasCookieConsent()&&!rejected);const reopen=()=>{setError(false);setOpen(true)};window.addEventListener('ihs-open-cookie-preferences',reopen);return()=>window.removeEventListener('ihs-open-cookie-preferences',reopen)},[path]);
 async function choose(decision:'accept'|'reject'){
  setBusy(true);setError(false);try{const response=await fetch('/api/cookie-consent',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({decision}),cache:'no-store'});if(!response.ok)throw Error();if(decision==='accept')rememberLocale(locale);try{if(decision==='reject')localStorage.setItem(rejectionKey,'yes');else localStorage.removeItem(rejectionKey)}catch{}setOpen(false);window.dispatchEvent(new Event('ihs-cookie-consent-changed'))}catch{setError(true)}finally{setBusy(false)}
 }
 if(!open||path?.startsWith('/editor'))return null;
 return <aside className="cookie-consent" role="dialog" aria-labelledby="cookie-consent-title" aria-describedby="cookie-consent-description"><div><h2 id="cookie-consent-title">{zh?'Cookie 选择':'Your cookie choice'}</h2><p id="cookie-consent-description">{zh?'经你同意后，我们使用 Cookie 记住语言，并与 Google 统计网站访问和文章阅读情况。你可以拒绝，仍可阅读和切换语言；也可以随时在页脚更改选择。':'With your permission, cookies remember your language and help us and Google measure website visits and article readership. You can decline and still read and switch languages, and change your choice anytime in the footer.'} <a href={localePath(locale,'/privacy')}>{zh?'隐私声明':'Privacy policy'}</a></p>{error&&<p role="alert">{zh?'设置未保存，请重试。':'Your choice could not be saved. Please try again.'}</p>}</div><div className="cookie-consent-actions"><button type="button" disabled={busy} onClick={()=>void choose('reject')}>{zh?'拒绝':'Decline'}</button><button type="button" disabled={busy} onClick={()=>void choose('accept')}>{zh?'同意':'Accept'}</button></div></aside>;
}
