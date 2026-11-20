import { getBrowse, getChannelCounts, getDaily, getFeed, getRanking, getHomepageSection, getHomepageFeatured, getLatestDiscoveries, getHotEvents } from '../lib/public-stories';
import { bilingualPageSearchMetadata, pageSearchMetadata, searchOrigin } from '../lib/search-config.mjs';
import {shareImages} from '../lib/news-metadata.mjs';
import Discovery from './discovery';
import { randomUUID } from 'node:crypto';
import { localFixtureMode } from '../lib/local-fixtures';
import { notFound } from 'next/navigation';
import BilingualHome from './bilingual-home';
import {siteNames,siteTitles} from '../lib/site-brand.mjs';
import { editorialChannels } from '../lib/editorial-channels';

export const dynamic = 'force-dynamic';
export const revalidate = 0;
export async function generateMetadata({ searchParams }: { searchParams: Promise<{lang?: string | string[]}> }) {
  if (process.env.NEWS_DEMO !== 'true') {
    const {lang} = await searchParams;
    const locale = lang === 'zh' ? 'zh' : 'en';
    const images=shareImages(searchOrigin());
    return { title:siteTitles[locale],openGraph:{type:'website',title:siteTitles[locale],siteName:siteNames[locale],...(images?{images}:{})},twitter:{card:images?'summary_large_image' as const:'summary' as const,title:siteTitles[locale],...(images?{images:images.map(image=>image.url)}:{})},description: locale === 'zh' ? '科技简报（Newsroom）关注全球科技、人工智能与前沿发现，以中英双语报道值得关注的科技新闻。' : 'Verified shocking tech news, explained clearly.', ...(localFixtureMode() || (lang !== undefined && lang !== 'zh' && lang !== 'en') ? { robots: { index: false, follow: false } } : {}), ...(lang === undefined || lang === 'zh' || lang === 'en' ? bilingualPageSearchMetadata('/', locale) : {}) };
  }
  return process.env.NEWS_DEMO === 'true' || localFixtureMode()
    ? { ...pageSearchMetadata('/'), robots: { index: false, follow: false } }
    : pageSearchMetadata('/');
}

export default async function Home({searchParams}: {searchParams:Promise<{lang?:string|string[]}>}) {
  const demo = process.env.NEWS_DEMO === 'true';
  if (!demo) {
    const {lang}=await searchParams;
    if(lang!==undefined && lang!=='zh' && lang!=='en') notFound();
    const bilingual=process.env.NEWS_BILINGUAL_PUBLIC_READ === 'true';
    const locale=lang==='zh'?'zh':'en';
    const [channelStories,recentStories,hotStories,featured,trending,counts,hotEvents]=await Promise.all([Promise.all(editorialChannels.map(channel=>getBrowse({query:'',category:channel.slug,period:'all',sort:'latest',offset:0},locale,bilingual))),getLatestDiscoveries(locale,bilingual,'latest'),getLatestDiscoveries(locale,bilingual,'score'),getHomepageFeatured(locale,bilingual),getHomepageSection('trending',locale,bilingual),bilingual?getChannelCounts():Promise.resolve([]),getHotEvents(locale,null,true)]);
    const stories=channelStories.flat();
    return <BilingualHome locale={locale} stories={stories} recentStories={recentStories} hotStories={hotStories} headline={featured.headline} trending={trending} daily={featured.picks} dailyRecent={featured.picks_recent} counts={counts} hotEvents={hotEvents} localFixtures={localFixtureMode()} legacy={!bilingual} />;
  }
  const [stories, ranking, daily] = demo ? [[], [], []] : await Promise.all([getFeed(), getRanking(), getDaily()]);
  return <Discovery stories={stories} ranking={ranking} daily={daily} demo={demo} localFixtures={localFixtureMode()} tipsEnabled={process.env.NEWS_TIPS_ENABLED === 'true'} submissionId={randomUUID()} />;
}
