'use client';
import {useEffect} from 'react';
import {usePathname} from 'next/navigation';
import {hasCookieConsent} from './cookie-consent';
import {analyticsPath} from '../lib/traffic-analytics.mjs';
export default function SiteVisit(){
 const pathname=usePathname();
 useEffect(()=>{
  // The browser URL includes the public locale; internal Next rewrites may not.
  const path=analyticsPath(window.location.pathname);if(!path)return;
  let id='',ready=false,ended=false,started=0,elapsed=0,lastSent=-1;
  const send=(body:object)=>fetch('/api/site-visit',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body),keepalive:true}).catch(()=>null);
  const pause=()=>{if(started){elapsed+=performance.now()-started;started=0}};
  const flush=()=>{pause();const seconds=Math.min(1800,Math.floor(elapsed/1000));if(id&&ready&&hasCookieConsent()&&seconds>lastSent){lastSent=seconds;void send({id,seconds})}};
  const start=()=>{if(!hasCookieConsent()){pause();id='';return}if(id)return;id=crypto.randomUUID();if(document.visibilityState==='visible')started=performance.now();void send({id,path,referrer:document.referrer}).then(response=>{ready=!!response?.ok;if(ready&&(ended||document.visibilityState==='hidden'))flush()})};
  const visibility=()=>{if(document.visibilityState==='hidden')flush();else if(id&&hasCookieConsent())started=performance.now()};
  start();window.addEventListener('ihs-cookie-consent-changed',start);document.addEventListener('visibilitychange',visibility);window.addEventListener('pagehide',flush);
  return()=>{ended=true;flush();window.removeEventListener('ihs-cookie-consent-changed',start);document.removeEventListener('visibilitychange',visibility);window.removeEventListener('pagehide',flush)};
 },[pathname]);
 return null;
}
