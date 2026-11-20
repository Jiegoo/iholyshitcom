import { notFound } from 'next/navigation';
import { channelTopics } from '../../../../lib/channel-topics';
import { editorialChannels } from '../../../../lib/editorial-channels';
import { localePath } from '../../../../lib/locale-path';
import ChannelTopics from '../../../channel-topics';
import DiscoveryCards from '../../../discovery-cards';
import SiteHeader from '../../../site-header';
import {bilingualPageSearchMetadata} from '../../../../lib/search-config.mjs';
import { getManualTopicBrowse, getTopicCount } from '../../../../lib/public-stories';

type Props = { params: Promise<{ slug: string; topic: string }>; searchParams: Promise<{ lang?: string | string[]; page?: string | string[] }> };
export const dynamic = 'force-dynamic';
export async function generateMetadata({ params, searchParams }: Props) {
  const { slug, topic } = await params; const { lang, page } = await searchParams;
  const items=Object.hasOwn(channelTopics,slug)?channelTopics[slug]:[];const item=items.find(value=>value.slug===topic);
  if(!item||(lang!==undefined&&lang!=='zh'&&lang!=='en'))return {title:'Newsroom',robots:{index:false,follow:false}};
  const locale=lang==='zh'?'zh':'en';return {title:`${item[locale]}${locale === 'zh' ? ' - 科技简报 (Newsroom)' : '｜Newsroom'}`,...(page===undefined?bilingualPageSearchMetadata(`/category/${slug}/${topic}`,locale):{})};
}
export default async function TopicPage({ params, searchParams }: Props) {
  const { slug, topic } = await params; const { lang, page:pageParam } = await searchParams;
  if (lang!==undefined && lang!=='zh' && lang!=='en') notFound();
  const channel=editorialChannels.find(item=>item.slug===slug);const items=Object.hasOwn(channelTopics,slug)?channelTopics[slug]:[];const item=items.find(value=>value.slug===topic);
  if (!channel || !item) notFound();
  const locale=lang==='zh'?'zh':'en'; const zh=locale==='zh';
  const path=`/category/${slug}/${topic}`;
  const page=typeof pageParam==='string'&&/^[1-9]\d{0,2}$/.test(pageParam)?Number(pageParam):1;
  if(page>501) notFound();
  const [rows,total]=await Promise.all([getManualTopicBrowse(locale,slug,topic,(page-1)*20),getTopicCount(locale,slug,topic)]);
  const totalPages=Math.max(1,Math.ceil(total/20));
  const pageLink=(n:number)=>{const query=new URLSearchParams();if(n>1)query.set('page',String(n));return `${localePath(locale,path)}${query.size?'?'+query:''}`};
  return <main className="browse-page" lang={locale}><SiteHeader locale={locale} path={path} />
    <h1 className="visually-hidden">{channel.label} · {item[locale]}</h1>
    <ChannelTopics locale={locale} channel={slug} topic={topic}/>
    <p className="browse-count">{zh?`第 ${page} 页 / 共 ${totalPages} 页`:`Page ${page} / ${totalPages}`}</p>
    {!rows.length&&<p>{zh?'此分类暂无已发布文章。':'No published articles in this topic yet.'}</p>}
    <DiscoveryCards locale={locale} items={rows.slice(0,20)}/>
    <nav className="browse-pages" aria-label={zh?'结果分页':'Pagination'}><span>{zh?`第 ${page} 页 / 共 ${totalPages} 页`:`Page ${page} / ${totalPages}`}</span>{page>1&&<a href={pageLink(page-1)}>← {zh?'上一页':'Previous'}</a>}{rows.length>20&&page<501&&<a href={pageLink(page+1)}>{zh?'下一页':'Next'} →</a>}</nav></main>;
}
