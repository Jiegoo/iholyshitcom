import ArticleBreadcrumbs from '../../article-breadcrumbs';
import HotEventBanner from '../../hot-event-banner';
import ContentDisclosure from '../../content-disclosure';
import EditorialByline from '../../editorial-byline';
import RelatedArticles from '../../related-articles';
import MemberArticle from '../../member-article-server';
import ArticleTextSize from '../../article-text-size';
import ArticleShare from '../../article-share';
import ArticleComments from '../../article-comments';
import ArticleReactions from '../../article-reactions';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { getBilingualStory, getStory, safeSourceUrl, getPublicFullArticle, getArticleIndex } from '../../../lib/public-stories';
import { bilingualPageSearchMetadata, pageSearchMetadata, searchOrigin } from '../../../lib/search-config.mjs';
import SiteHeader from '../../site-header';
import ArticleView from '../../article-view';
import IndexButton from '../../index-button';
import ArticleIllustration from '../../article-illustration';
import { localFixtureMode } from '../../../lib/local-fixtures';
import { localePath } from '../../../lib/locale-path';
import { glossaryLabel } from '../../../lib/glossary';
import { newsSocialMetadata, newsStructuredData } from '../../../lib/news-metadata.mjs';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function generateMetadata({ params, searchParams }: { params: Promise<{ slug: string }>; searchParams: Promise<{ lang?: string | string[] }> }): Promise<Metadata> {
  if (process.env.NEWS_BILINGUAL_PUBLIC_READ === 'true') {
    const { slug } = await params;
    const { lang } = await searchParams;
    const robots = searchOrigin() ? undefined : { index: false, follow: false };
    if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(slug) || slug.length > 200 || (lang !== undefined && lang !== 'zh' && lang !== 'en')) return { robots };
    const locale = lang === 'zh' ? 'zh' : 'en';
    const { story, retraction } = await getBilingualStory(slug, locale);
    if (!story || retraction) return { robots };
    const fullArticle = await getPublicFullArticle(slug, locale);
    const seo = fullArticle?.content.seo;
    return { title: `${seo?.title || story.title}${locale === 'zh' ? ' - 科技简报 (Newsroom)' : '｜Newsroom'}`, description: seo?.meta_description || story.summary,
      keywords: seo?.keywords, robots, ...bilingualPageSearchMetadata(`/story/${slug}`, locale), ...newsSocialMetadata(story, searchOrigin()) };
  }
  if (localFixtureMode()) return { robots: { index: false, follow: false } };
  const origin = searchOrigin();
  if (!origin) return {};
  const { slug } = await params;
  if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(slug) || slug.length > 200) return { robots: { index: false, follow: false } };
  const { story, retraction } = await getStory(slug);
  if (!story || retraction) return { robots: { index: false, follow: false } };
  const path = `/story/${slug}`;
  return { title: `${story.title}｜Newsroom`, description: story.summary, ...pageSearchMetadata(path),
    openGraph: { type: 'article', title: story.title, description: story.summary, url: `${origin}${path}` } };
}

export default async function StoryPage({ params, searchParams }: { params: Promise<{ slug: string }>; searchParams: Promise<{ lang?: string | string[] }> }) {
  const { slug } = await params;
  if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(slug)) notFound();
  if (process.env.NEWS_BILINGUAL_PUBLIC_READ === 'true') {
    const query = await searchParams;
    if (query.lang !== undefined && query.lang !== 'zh' && query.lang !== 'en') notFound();
    const locale = query.lang === 'zh' ? 'zh' : 'en';
    const { story, retraction } = await getBilingualStory(slug, locale);
    if (retraction) return <main><SiteHeader locale={locale} path={`/story/${slug}`} /><article lang={locale}><h1>{locale === 'zh' ? '新闻已撤回' : 'Story retracted'}</h1><p>{retraction.notice}</p></article></main>;
    if (!story) notFound();
    const [fullArticle,indexScore]=await Promise.all([getPublicFullArticle(slug,locale),getArticleIndex(slug,'story')]);
    return <main><SiteHeader locale={locale} path={`/story/${slug}`} />{localFixtureMode() && <p>{locale==='zh'?'演示 · 本地虚构数据，不是真实新闻。':'Demo · Fictional local data, not real news.'}</p>}
      <ArticleView slug={slug} type="story"/><article className="public-article" lang={locale}><script type="application/ld+json" dangerouslySetInnerHTML={{ __html: newsStructuredData(story,searchOrigin()) }} /><ArticleBreadcrumbs locale={locale}/><h1>{story.title}</h1><EditorialByline locale={locale}/><div className="article-opening"><div className="article-index-row"><ArticleTextSize locale={locale}/>{indexScore!=null&&<IndexButton slug={slug} type="story" score={indexScore} locale={locale}/>}</div><ArticleIllustration slug={slug} locale={locale}/></div><div className="article-reading-body"><p>{story.summary}</p>
        {story.single_source && <p role="note">{locale === 'zh' ? '单一来源、持续核验中' : 'Single source; verification ongoing'}</p>}
        {fullArticle&&<section aria-label={locale==='zh'?'完整新闻正文':'Full article'}>{([
          ['what_happened','',''],['why_it_matters','为什么重要','Why It Matters'],['what_we_know','已知事实','What We Know'],['what_we_dont_know','尚不确定','What We Don’t Know'],['timeline','时间线','Timeline'],['sources','来源','Sources'],['corrections','更正','Corrections'],
        ] as const).map(([key,zh,en])=>fullArticle.content[key].length>0&&<section key={key}>{(zh||en)&&<h2>{locale==='zh'?zh:en}</h2>}{fullArticle.content[key].map((row,i)=><p key={i} style={{whiteSpace:'pre-wrap'}}>{row.text}</p>)}</section>)}</section>}
        {story.what_we_dont_know && <section><h2>{glossaryLabel('ui.what_we_dont_know',locale)}</h2><p>{story.what_we_dont_know}</p></section>}
        <section><h2>{locale === 'zh' ? '事实与来源' : 'Claims and sources'}</h2><ul>{story.claims.map((claim, i) => <li key={i}><p>{claim.text}</p><ul>{claim.sources.map((source, j) => {
          const url = safeSourceUrl(source.url);
          return <li key={`${source.name}-${j}`}>{url ? <a href={url} rel="noopener noreferrer">{source.name}</a> : <span>{source.name}</span>} — {source.attribution}</li>;
        })}</ul></li>)}</ul></section>
        {story.updates.length > 0 && <section><h2>{locale === 'zh' ? '更新与更正' : 'Updates and corrections'}</h2><ul>{story.updates.map((update, i) =>
          <li key={`${update.published_at}-${i}`}><strong>{update.kind === 'correction' ? (locale === 'zh' ? '更正' : 'Correction') : (locale === 'zh' ? '更新' : 'Update')}</strong>: {update.notice}</li>)}</ul></section>}
      </div><MemberArticle slug={slug} type="story" locale={locale}/><HotEventBanner slug={slug} type="story" locale={locale}/><ContentDisclosure locale={locale}/><RelatedArticles slug={slug} type="story" locale={locale} title={story.title}/><ArticleShare title={story.title} slug={slug} type="story" locale={locale} origin={searchOrigin()}/><ArticleReactions slug={slug} type="story" locale={locale}/><ArticleComments slug={slug} type="story" locale={locale}/></article></main>;
  }
  const {lang}=await searchParams; if(lang!==undefined && lang!=='zh' && lang!=='en') notFound();
  const zh=lang==='zh'; const locale=zh?'zh':'en';
  const { story, retraction } = await getStory(slug);
  if (retraction) return <main><SiteHeader locale={locale} path={`/story/${slug}`} />{localFixtureMode() && <p>{zh?'演示 · 本地虚构数据，不是真实新闻。':'Demo · Fictional local data, not real news.'}</p>}<h1>{zh?'新闻已撤回':'Story retracted'}</h1><p>{retraction.notice}</p><p>{zh?'撤回时间：':'Retracted: '}<time dateTime={retraction.retracted_at}>{new Date(retraction.retracted_at).toISOString().slice(0,10)}</time></p>{retraction.target_slug && <p><a href={localePath(locale,`/story/${retraction.target_slug}`)}>{zh?'查看相关事件':'Read the related story'}</a></p>}</main>;
  if (!story) notFound();
  const indexScore=await getArticleIndex(slug,'story');
  return <main><SiteHeader locale={locale} path={`/story/${slug}`} />{localFixtureMode() && <p>{zh?'演示 · 本地虚构数据，不是真实新闻。':'Demo · Fictional local data, not real news.'}</p>}<ArticleView slug={slug} type="story"/><article className="public-article"><script type="application/ld+json" dangerouslySetInnerHTML={{__html:newsStructuredData({title:story.title,summary:story.summary,locale},searchOrigin())}}/><ArticleBreadcrumbs locale={locale}/><h1>{story.title}</h1><EditorialByline locale={locale}/><div className="article-opening"><div className="article-index-row"><ArticleTextSize locale={locale}/>{indexScore!=null&&<IndexButton slug={slug} type="story" score={indexScore} locale={locale}/>}</div><ArticleIllustration slug={slug} locale={locale}/></div><div className="article-reading-body"><p>{story.summary}</p><section><h2>{zh?'来源':'Sources'}</h2><p>{zh?'以下列出支持本事件的来源。本页尚未将每句话映射到具体来源。':'Sources supporting this event are listed below. Individual sentences are not mapped to specific sources on this page.'}</p><ul>{story.sources.map((source, index) => {
    const url = safeSourceUrl(source.url);
    return <li key={`${source.name}-${index}`}>{url ? <a href={url} rel="noopener noreferrer">{source.name}</a> : <span>{source.name}</span>} — {source.attribution}</li>;
  })}</ul></section>{story.updates.length > 0 && <section><h2>{zh?'更新与更正':'Updates and corrections'}</h2><ul>{story.updates.map((update, index) => <li key={`${update.published_at}-${index}`}><strong>{update.kind === 'correction' ? (zh?'更正':'Correction') : (zh?'更新':'Update')}</strong>: {update.notice} <time dateTime={update.published_at}>{new Date(update.published_at).toISOString().slice(0,10)}</time></li>)}</ul></section>}</div><MemberArticle slug={slug} type="story" locale={locale}/><HotEventBanner slug={slug} type="story" locale={locale}/><ContentDisclosure locale={locale}/><RelatedArticles slug={slug} type="story" locale={locale} title={story.title}/><ArticleShare title={story.title} slug={slug} type="story" locale={locale} origin={searchOrigin()}/><ArticleReactions slug={slug} type="story" locale={locale}/><ArticleComments slug={slug} type="story" locale={locale}/></article></main>;
}
