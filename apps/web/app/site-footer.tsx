'use client';

import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import { localePath } from '../lib/locale-path';
import Brand from './brand';
import {CookiePreferencesButton} from './cookie-consent';
import {siteTaglines} from '../lib/site-brand.mjs';

export default function SiteFooter({initialLocale}: {initialLocale:'zh'|'en'}) {
  const params=useSearchParams(); const pathname=usePathname(); const prefix=pathname?.match(/^\/(zh|en)(?:\/|$)/)?.[1];
  const locale=pathname?.startsWith('/editor')?'zh':prefix==='zh'||prefix==='en'?prefix:params.get('lang')==='zh'?'zh':params.get('lang')==='en'?'en':initialLocale; const zh=locale==='zh';
  const url=(path:string)=>localePath(locale,path);
  return <footer className="site-footer" lang={locale}><div className="site-footer-inner">
    <div><Link className="site-footer-brand" href={url('/')}><Brand /></Link><p>{siteTaglines[locale]}</p><p className="site-footer-copyright">© {new Date().getUTCFullYear()} Newsroom. {zh?'版权所有。':'All rights reserved.'}</p></div>
    <nav aria-label={zh?'网站导航':'Site'}><Link href={url('/')}>{zh?'首页':'Home'}</Link><Link href={url('/about')}>{zh?'关于':'About'}</Link>
      <Link href={url('/privacy')}>{zh?'隐私声明':'Privacy'}</Link><Link href={url('/terms')}>{zh?'使用条款':'Terms'}</Link>{!pathname?.startsWith('/editor')&&<CookiePreferencesButton locale={locale} />}</nav>
  </div></footer>;
}
