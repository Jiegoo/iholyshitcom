import SiteHeader from '../site-header';
import type { Metadata } from 'next';
import Link from 'next/link';
import { getCorrections } from '../../lib/public-stories';
import { bilingualPageSearchMetadata, pageSearchMetadata } from '../../lib/search-config.mjs';
import { localePath } from '../../lib/locale-path';
import { notFound } from 'next/navigation';

export async function generateMetadata({ searchParams }: { searchParams: Promise<{lang?: string | string[]}> }): Promise<Metadata> {
  if (process.env.NEWS_BILINGUAL_PUBLIC_READ === 'true' || (await searchParams).lang !== undefined) {
    const {lang} = await searchParams;
    const locale = lang === 'zh' ? 'zh' : 'en';
    return { title: `${locale === 'zh' ? '更正与撤回' : 'Corrections'}${locale === 'zh' ? ' - 科技简报 (Newsroom)' : '｜Newsroom'}`, ...(lang === undefined || lang === 'zh' || lang === 'en' ? bilingualPageSearchMetadata('/corrections', locale) : {}) };
  }
  return { title: 'Corrections｜Newsroom', ...pageSearchMetadata('/corrections') };
}
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function Corrections({searchParams}: {searchParams:Promise<{lang?:string|string[]}>}) {
  const bilingual=process.env.NEWS_BILINGUAL_PUBLIC_READ==='true'; const {lang}=await searchParams;
  if(lang!==undefined && lang!=='zh' && lang!=='en') notFound();
  const locale=lang==='zh'?'zh':'en';const zh=locale==='zh';
  const notices = await getCorrections(bilingual?locale:undefined);
  return <><SiteHeader locale={locale} path="/corrections" /><main className="info-page" lang={zh?'zh':'en'}>
    <p className="eyebrow">{zh?'责任与透明':'Accountability'}</p>
    <h1>{zh?'更正与撤回':'Corrections and retractions.'}</h1>
    <p className="description">{zh?'此处显示最近的更正和撤回说明，最多 100 条。':'The latest published notices about corrections and retracted stories. This page shows up to 100 notices.'}</p>
    {notices.length === 0 ? <section><h2>{zh?'暂无说明':'No notices available'}</h2><p>{zh?'发布说明后会显示在这里。':'Published notices will appear here when available.'}</p></section> :
      <section><h2>{zh?'最新说明':'Latest notices'}</h2><ul>{notices.map((item, index) => <li key={`${item.slug}-${item.published_at}-${index}`}>
        <h3>{item.kind === 'retraction' ? (zh?'撤回':'Retraction') : (zh?'更正':'Correction')}</h3><p>{item.notice}</p>
        <p><time dateTime={item.published_at}>{item.published_at.slice(0, 10)}</time> · <Link href={localePath(locale,`/story/${encodeURIComponent(item.slug)}`)}>{zh?'查看事件':'View story'}</Link></p>
      </li>)}</ul></section>}
  </main></>;
}
