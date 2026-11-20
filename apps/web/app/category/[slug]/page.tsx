import { notFound } from 'next/navigation';
import Browse from '../../browse';
import { categories, bilingualCategoryLabel } from '../../../lib/categories';
import { bilingualPageSearchMetadata } from '../../../lib/search-config.mjs';
import { editorialChannels, isEditorialChannel } from '../../../lib/editorial-channels';
import { localFixtureMode } from '../../../lib/local-fixtures';

export const dynamic = 'force-dynamic';
type Props = { params: Promise<{ slug: string }>; searchParams: Promise<{ q?: string | string[]; period?: string | string[]; sort?: string | string[]; page?: string | string[]; lang?: string | string[] }> };
export async function generateMetadata({ params, searchParams }: Props) {
  const { slug } = await params;
  const category = isEditorialChannel(slug) ? editorialChannels.find(c => c.slug === slug) : categories.find(c => c.slug === slug);
  if (!category) return { robots: { index: false, follow: false } };
  const query = await searchParams;
  if(query.lang!==undefined && query.lang!=='zh' && query.lang!=='en') return {robots:{index:false,follow:false}};
  const locale=query.lang==='zh'?'zh':'en';
  const plain=Object.keys(query).every(key=>key==='lang');
  return {title:`${isEditorialChannel(slug)?category.label:bilingualCategoryLabel(slug,locale)}${locale === 'zh' ? ' - 科技简报 (Newsroom)' : '｜Newsroom'}`,...(plain?bilingualPageSearchMetadata(`/category/${slug}`,locale):{}),...(localFixtureMode()?{robots:{index:false,follow:false}}:{})};
}
export default async function Category({ params, searchParams }: Props) {
  const { slug } = await params;
  if (!categories.some(category => category.slug === slug) && !isEditorialChannel(slug)) notFound();
  const query = await searchParams;
  return <Browse params={query} category={slug} />;
}
