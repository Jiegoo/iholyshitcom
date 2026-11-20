'use client';
import type {Locale} from '../lib/public-stories';
import {rememberLocale} from '../lib/visitor-locale.mjs';
export default function LanguageMenu({locale,href}:{locale:Locale;href:string}){
 const zh=locale==='zh';
 return <details className="language-menu" onPointerLeave={event=>{if(event.pointerType==='mouse')event.currentTarget.open=false}} onKeyDown={event=>{if(event.key==='Escape'){event.currentTarget.open=false;event.currentTarget.querySelector('summary')?.focus()}}}>
  <summary aria-label={zh?'选择语言':'Choose language'}>{zh?'中文':'English'} <span aria-hidden="true">▾</span></summary>
  <div className="language-options"><span aria-current="true">{zh?'中文':'English'}</span><a href={href} hrefLang={zh?'en':'zh'} onClick={()=>rememberLocale(zh?'en':'zh')}>{zh?'English':'中文'}</a></div>
 </details>;
}
