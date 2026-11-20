import {publicArticleSlug} from '../lib/historical-article-slugs.mjs';
import IndexButton from './index-button';
import { bilingualCategoryLabel } from '../lib/categories';
import { editorialChannels, isEditorialChannel, editorialChannelLabel } from '../lib/editorial-channels';
import { localePath } from '../lib/locale-path';
import { getBrowse, getBrowseCount } from '../lib/public-stories';
import { notFound } from 'next/navigation';
import SiteHeader from './site-header';
import { localFixtureMode } from '../lib/local-fixtures';
import ChannelTopics from './channel-topics';
import DiscoveryCards from './discovery-cards';
import BrowseStoryLink from './browse-story-link';

type SearchParams = { q?: string | string[]; period?: string | string[]; sort?: string | string[]; page?: string | string[]; lang?: string | string[]; view?: string | string[] };
const one = (value: string | string[] | undefined) => typeof value === 'string' ? value : '';

export default async function Browse({ params, category = null }: { params: SearchParams; category?: string | null }) {
  const bilingual=process.env.NEWS_BILINGUAL_PUBLIC_READ==='true';
  if(params.lang!==undefined && params.lang!=='zh' && params.lang!=='en') notFound();
  const locale=params.lang==='zh'?'zh':'en'; const zh=locale==='zh';
  const label=(slug:string|null)=>isEditorialChannel(slug) || (bilingual && slug === null) ? editorialChannelLabel(slug,locale) : bilingualCategoryLabel(slug,locale);
  const withLang=(path:string)=>localePath(locale,path);
  const query = one(params.q).trim();
  const period = ['day', 'week', 'month'].includes(one(params.period)) ? one(params.period) : 'all';
  const sort = one(params.sort) === 'score' ? 'score' : 'latest';
  const pageValue = one(params.page);
  const page = pageValue && /^\d{1,3}$/.test(pageValue) ? Number(pageValue) : 1;
  const invalid = query.length > 100 || page < 1 || page > 501 || Boolean(pageValue && !/^\d{1,3}$/.test(pageValue));
  const options={query,category,period,sort,offset:(page-1)*20};
  const [rows,total]=invalid?[[],0]:await Promise.all([getBrowse(options,locale,bilingual),category?getBrowseCount(options,locale,bilingual):Promise.resolve(0)]);
  const totalPages=Math.max(1,Math.ceil(total/20));
  const rawAction = category ? `/category/${category}` : '/search';
  const action = withLang(rawAction);
  const languageLink=(language:'zh'|'en')=>{
    const search=new URLSearchParams();
    if(query) search.set('q',query);if(period!=='all') search.set('period',period);if(sort!=='latest') search.set('sort',sort);
    if(page>1 && !invalid) search.set('page',String(page));
    const path=localePath(language,rawAction);return `${path}${search.size?`?${search}`:''}${category?'#results':''}`;
  };
  const pageLink = (next: number) => {
    const search = new URLSearchParams();
    if (query) search.set('q', query);
    if (period !== 'all') search.set('period', period);
    if (sort !== 'latest') search.set('sort', sort);
    if (next > 1) search.set('page', String(next));
    return `${action}${search.size ? `?${search}` : ''}${category ? '#results' : ''}`;
  };
  return <main className="browse-page" lang={zh?'zh-CN':'en'}>
    <SiteHeader locale={locale} path={rawAction} switchHref={languageLink(zh?'en':'zh')} />
    {localFixtureMode() && <p className="browse-demo">{zh?'演示 · 本地虚构验收数据，不是真实新闻。':'Demo · Fictional test data, not real news.'}</p>}
    {category ? <><h1 className="visually-hidden">{label(category)}</h1><ChannelTopics locale={locale} channel={category}/></> : <>
    <p className="browse-kicker">{zh?'发现未来':'DISCOVER THE FUTURE'}</p>
    <h1>{zh?'搜索科技事件':'Search technology stories'}</h1>
    <nav className="browse-categories" aria-label={zh?'事件分类':'Categories'}><a href={withLang('/search')} aria-current="page">{zh?'全部':'All'}</a>{editorialChannels.map(c=><a key={c.slug} href={withLang(`/category/${c.slug}`)}>{c.label}</a>)}</nav></>}
    {!category && <form action={`${action}${category?'#results':''}`} method="get" className="browse-form">
      <label>{zh?'搜索标题':'Search titles'}<input name="q" type="search" maxLength={100} defaultValue={query} placeholder={zh?'输入关键词':'Enter keywords'} /></label>
      <label>{zh?'发布时间':'Published'}<select name="period" defaultValue={period}><option value="all">{zh?'不限时间':'Any time'}</option><option value="day">{zh?'最近 24 小时':'Last 24 hours'}</option><option value="week">{zh?'最近 7 天':'Last 7 days'}</option><option value="month">{zh?'最近 30 天':'Last 30 days'}</option></select></label>
      <label>{zh?'排序':'Sort'}<select name="sort" defaultValue={sort}><option value="latest">{zh?'最新发布':'Latest'}</option><option value="score">{zh?'评分最高':'Highest score'}</option></select></label>
      <button>{zh?'查看结果':'Show results'}</button>
    </form>}
    {invalid ? <p id="results" role="alert">{zh?'搜索条件无效，请修改后重试。':'Invalid search filters.'}</p> : <>
      <p id="results" className="browse-count" aria-live="polite">{rows.length ? (zh?`第 ${page} 页${category?` / 共 ${totalPages} 页`:""}`:`Page ${page}${category?` / ${totalPages}`:""}`) : (zh?'没有找到符合条件的已发布事件。':'No published stories match.')}</p>
      {category ? <DiscoveryCards locale={locale} items={rows.slice(0,20)}/> : <div className="browse-results">{rows.slice(0, 20).map(item => <article key={`${item.content_type??'story'}-${item.slug}`} id={`story-${item.slug}`}>
        <div className="browse-item-meta"><span>{label(item.category)}</span>{item.score === null ? <span>{zh?'评分未知':'Score unavailable'}</span> : <IndexButton slug={item.slug} type={item.content_type??'story'} score={item.score} locale={locale}/>} </div>
        <h2><BrowseStoryLink href={withLang(`/${item.content_type === 'manual' ? '' : 'story/'}${encodeURIComponent(publicArticleSlug(item.content_type, item.slug))}`)} anchor={`story-${item.slug}`}>{item.title} ↗</BrowseStoryLink></h2><p>{item.summary}</p>
        <time dateTime={item.published_at}>{zh?'首次发布：':'First published: '}{new Date(item.published_at).toISOString().slice(0, 10)} UTC</time>
      </article>)}</div>}
      {page === 501 && rows.length > 20 && <p>{zh?'结果较多，请缩小搜索范围以查看更多。':'Narrow your search to see more results.'}</p>}
      <nav className="browse-pages" aria-label={zh?'结果分页':'Pagination'}>{category&&<span>{zh?`第 ${page} 页 / 共 ${totalPages} 页`:`Page ${page} / ${totalPages}`}</span>}{page > 1 && <a href={pageLink(page - 1)}>← {zh?'上一页':'Previous'}</a>}{rows.length > 20 && page < 501 && <a href={pageLink(page + 1)}>{zh?'下一页':'Next'} →</a>}</nav>
    </>}
  </main>;
}
