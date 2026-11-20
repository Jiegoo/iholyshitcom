import {publicArticleSlug} from '../lib/historical-article-slugs.mjs';
import type { BrowseItem, ChannelCount, FeedItem, Locale, TrendingItem } from '../lib/public-stories';
import { editorialChannelLabel } from '../lib/editorial-channels';
import { localePath } from '../lib/locale-path';
import { bilingualCategoryLabel } from '../lib/categories';
import { editorialChannels, isEditorialChannel } from '../lib/editorial-channels';
import SiteHeader from './site-header';
import IndexButton from './index-button';
import HomeDiscoveries from './home-discoveries';
import HotEvents from './hot-events';
import type {HotEvent} from '../lib/public-stories';

export default function BilingualHome({locale,stories,recentStories,hotStories,headline,daily,dailyRecent,trending,counts,hotEvents,localFixtures}: {
  locale:Locale;stories:BrowseItem[];recentStories?:BrowseItem[];hotStories?:BrowseItem[];headline:BrowseItem[];daily:BrowseItem[];dailyRecent?:BrowseItem[];trending:TrendingItem[];counts:ChannelCount[];hotEvents:HotEvent[];localFixtures:boolean;legacy?:boolean;
}) {
  const zh=locale==='zh';
  const storyLink=(slug:string)=>localePath(locale,`/story/${encodeURIComponent(slug)}`);
  const articleLink=(item:FeedItem)=>item.content_type==='manual'?localePath(locale,`/${encodeURIComponent(publicArticleSlug(item.content_type, item.slug))}`):storyLink(item.slug);
  const label=(category:string|null)=>isEditorialChannel(category)?editorialChannelLabel(category,locale):bilingualCategoryLabel(category,locale);
  return <main className="muse bilingual-home" lang={locale}>
    <SiteHeader locale={locale} counts={counts} />
    <div className="muse-wrap">{localFixtures && <p className="muse-notice">{zh?'演示 · 虚构测试数据，不是真实新闻。':'Demo · Fictional test data, not real news.'}</p>}
      <section className="muse-hero"><div className="muse-hero-copy"><span className="muse-tag">{zh?'今日头条':'THE BIG PICTURE'}</span>
        <h1>{headline[0] ? <a href={articleLink(headline[0])}>{headline[0].title}</a> : (zh?'发现值得关注的科技进展。':'Discover meaningful technology.')}</h1>
        <p>{headline[0]?.summary ?? (zh?'值得惊叹的发现，经过核验与人工审核后出现在这里。':'Remarkable discoveries appear here after verification and editorial review.')}</p>
      </div></section>
      <HotEvents locale={locale} events={hotEvents}/>
      <HomeDiscoveries locale={locale} picks={daily} picksRecent={dailyRecent??daily} headline={headline[0]} recent={recentStories??stories} heat={hotStories??recentStories??stories}/>
      <div className="muse-heading"><h2>{zh?'趋势':'Trending'}</h2></div>
      {trending.length?<><p className="trending-note">{zh?'近 7 天站内阅读和读者点赞热度':'Based on site views and reader likes over the past 7 days.'}</p><div className="muse-grid">{trending.map(item=><article className="muse-card" key={`${item.content_type}-${item.slug}`}><div className="muse-card-top">{label(item.category)}{item.score!=null&&<IndexButton slug={item.slug} type={item.content_type??'story'} score={item.score} locale={locale}/>}</div><h3><a href={articleLink(item)}>{item.title}</a></h3><p>{item.summary}</p></article>)}</div></>:<div className="muse-empty">{zh?'暂无站内阅读趋势。':'No reading trends yet.'}</div>}
      <div className="muse-heading"><h2>{zh?'频道':'Channels'}</h2></div>
      <div className="home-channels">{editorialChannels.map(channel=>{const items=stories.filter(item=>item.category===channel.slug).slice(0,3);return <section key={channel.slug} className="home-channel"><h3><a href={localePath(locale,`/category/${channel.slug}`)}>{channel.label}</a></h3>{items.length?<ul>{items.map(item=><li key={`${item.content_type??'story'}-${item.slug}`}><a href={item.content_type==='manual'?localePath(locale,`/${encodeURIComponent(publicArticleSlug(item.content_type, item.slug))}`):storyLink(item.slug)}>{item.title}</a></li>)}</ul>:<p>{zh?'暂无已发布新闻。':'No published stories yet.'}</p>}</section>})}</div>
    </div>
  </main>;
}
