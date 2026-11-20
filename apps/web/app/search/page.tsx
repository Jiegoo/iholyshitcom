import Browse from '../browse';
import {bilingualPageSearchMetadata} from '../../lib/search-config.mjs';

export const dynamic = 'force-dynamic';
export async function generateMetadata({ searchParams }: { searchParams: Promise<{lang?: string | string[];q?:string|string[];period?:string|string[];sort?:string|string[];page?:string|string[]}> }) {
  const query=await searchParams;const {lang}=query;
  const locale=lang==='zh'?'zh':'en';return { title: `${locale==='zh'?'搜索':'Search'}${locale === 'zh' ? ' - 科技简报 (Newsroom)' : '｜Newsroom'}`,...(Object.keys(query).every(key=>key==='lang')?bilingualPageSearchMetadata('/search',locale):{}) };
}
export default async function Search({ searchParams }: { searchParams: Promise<{ q?: string | string[]; period?: string | string[]; sort?: string | string[]; page?: string | string[]; lang?: string | string[] }> }) {
  return <Browse params={await searchParams} />;
}
