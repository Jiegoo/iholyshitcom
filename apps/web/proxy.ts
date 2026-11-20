import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';
import {initialVisitorLocale,localeCookie,unlocalizedPublicPage} from './lib/visitor-locale.mjs';
import {localePath} from './lib/locale-path';
import {publicArticleSlug, storedArticleSlug} from './lib/historical-article-slugs.mjs';

export async function proxy(request: NextRequest) {
  const clearUnconsentedReader = (response: NextResponse) => {
    if (request.cookies.get('ihs_cookie_consent')?.value !== 'accepted') {
      for(const name of ['ihs_reader','ihs_site_reader','ihs_visit'])if(request.cookies.has(name))response.cookies.set(name, '', { httpOnly: true, path: '/', sameSite: 'lax', secure: request.nextUrl.protocol === 'https:', maxAge: 0 });
      if(request.cookies.has(localeCookie))response.cookies.set(localeCookie, '', { path: '/', sameSite: 'lax', secure: request.nextUrl.protocol === 'https:', maxAge: 0 });
    }
  };
  const forwardedHeaders = new Headers(request.headers);
  const refreshReaderSession = async (build: () => NextResponse) => {
    let response = build();
    const url = process.env.SUPABASE_URL, key = process.env.SUPABASE_PUBLISHABLE_KEY;
    if (url && key && request.cookies.getAll().some(c => /^sb-.*-auth-token(?:\.\d+)?$/.test(c.name))) {
      const client = createServerClient(url, key, {cookies:{
        getAll:()=>request.cookies.getAll(),
        setAll(values){
          values.forEach(({name,value})=>request.cookies.set(name,value));
          forwardedHeaders.set('cookie',request.headers.get('cookie')??'');
          response=build();
          values.forEach(({name,value,options})=>response.cookies.set(name,value,options));
        },
      }});
      try { await client.auth.getClaims(); } catch { /* Public pages stay available if Auth is temporarily unreachable. */ }
    }
    clearUnconsentedReader(response);
    response.headers.set('Cache-Control','private, no-store');
    return response;
  };
  const localized = request.nextUrl.pathname.match(/^\/(zh|en)(?:\/(story\/[a-z0-9-]+|manual\/[a-z0-9-]+|category\/[a-z0-9-]+(?:\/[a-z0-9-]+)?|events(?:\/[a-z0-9-]+)?|search|about|methodology|corrections|privacy|terms|[a-z0-9-]+))?\/?$/);
  const oldArticle = request.nextUrl.pathname.match(/^\/(zh|en)\/(?:manual\/)?([a-z0-9-]+)\/?$/);
  if (oldArticle && ['GET','HEAD'].includes(request.method)) {
    const short = publicArticleSlug('manual', oldArticle[2]);
    if (short !== oldArticle[2]) {
      const target=request.nextUrl.clone();target.pathname=`/${oldArticle[1]}/${short}`;
      const response=NextResponse.redirect(target,308);response.headers.set('Cache-Control','private, no-store');return response;
    }
  }
  const requested = request.nextUrl.searchParams.get('lang');
  if(!localized&&requested===null&&['GET','HEAD'].includes(request.method)&&unlocalizedPublicPage(request.nextUrl.pathname)){
    const locale=initialVisitorLocale({country:request.headers.get('x-vercel-ip-country'),acceptLanguage:request.headers.get('accept-language'),
      preference:request.cookies.get(localeCookie)?.value,consented:request.cookies.get('ihs_cookie_consent')?.value==='accepted'});
    const target=request.nextUrl.clone();target.pathname=localePath(locale,request.nextUrl.pathname.replace(/\/$/,'')||'/');
    const redirect=NextResponse.redirect(target,307);clearUnconsentedReader(redirect);
    redirect.headers.set('Cache-Control','private, no-store');redirect.headers.set('Vary','Cookie, Accept-Language, X-Vercel-IP-Country');return redirect;
  }
  const language = request.nextUrl.pathname.startsWith('/editor') ? 'zh' : localized?.[1] ?? (requested === 'zh' ? 'zh' : 'en');
  forwardedHeaders.set('x-iholy-locale', language);
  if (localized) {
    const target = request.nextUrl.clone();
    const path = localized[2];
    target.pathname = path ? (!path.includes('/') && !['search','about','methodology','corrections','privacy','terms','events'].includes(path) ? `/manual/${storedArticleSlug(path)}` : `/${path}`) : '/';
    target.searchParams.set('lang', language);
    return refreshReaderSession(()=>NextResponse.rewrite(target, { request: { headers: forwardedHeaders } }));
  }
  let response = NextResponse.next({ request: { headers: forwardedHeaders } });
  if (!request.nextUrl.pathname.startsWith('/editor')) {
    return refreshReaderSession(()=>NextResponse.next({ request: { headers: forwardedHeaders } }));
  }
  const url = process.env.SUPABASE_URL;
  response.headers.set('X-Robots-Tag', 'noindex, nofollow');
  const key = process.env.SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) {
    response.headers.set('Cache-Control', 'private, no-store');
    return response;
  }
  const client = createServerClient(url, key, {
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll(values) {
        values.forEach(({ name, value }) => request.cookies.set(name, value));
        forwardedHeaders.set('cookie', request.headers.get('cookie') ?? '');
        response = NextResponse.next({ request: { headers: forwardedHeaders } });
        response.headers.set('X-Robots-Tag', 'noindex, nofollow');
        values.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
      },
    },
  });
  await client.auth.getClaims();
  response.headers.set('Cache-Control', 'private, no-store');
  return response;
}
export const config = { matcher: ['/', '/story/:path*', '/manual/:path*', '/events/:path*', '/editor/:path*', '/member/:path*', '/robots.txt', '/sitemap.xml', '/about', '/methodology', '/corrections', '/privacy', '/terms', '/search', '/category/:path*', '/zh/:path*', '/en/:path*'] };
