'use client';
import {useEffect} from 'react';
import {hasCookieConsent} from './cookie-consent';
export default function ArticleView({slug,type}:{slug:string;type:'manual'|'story'}){
 useEffect(()=>{let recorded=false;const record=()=>{if(recorded||!hasCookieConsent())return;recorded=true;void fetch('/api/article-view',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({slug,type}),keepalive:true}).catch(()=>{})};record();window.addEventListener('ihs-cookie-consent-changed',record);return()=>window.removeEventListener('ihs-cookie-consent-changed',record)},[slug,type]);
 return null;
}
