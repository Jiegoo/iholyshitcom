import ArticleBreadcrumbs from '../../article-breadcrumbs';
import HotEventBanner from '../../hot-event-banner';
import ContentDisclosure from '../../content-disclosure';
import {publicArticleSlug} from '../../../lib/historical-article-slugs.mjs';
import MemberArticle from '../../member-article-server';
import RelatedArticles from '../../related-articles';
import {siteNames} from '../../../lib/site-brand.mjs';
import ArticleTextSize from '../../article-text-size';
import ArticleShare from '../../article-share';
import ArticleComments from '../../article-comments';
import ArticleReactions from '../../article-reactions';
import type {JSONContent} from '@tiptap/core';
import {Fragment,type ReactNode} from 'react';
import {notFound} from 'next/navigation';
import type {Metadata} from 'next';
import {bilingualPageSearchMetadata,searchOrigin} from '../../../lib/search-config.mjs';
import {newsSocialMetadata,newsStructuredData} from '../../../lib/news-metadata.mjs';
import {getManualArticle} from '../../../lib/manual-public';
import SiteHeader from '../../site-header';
import ArticleView from '../../article-view';
import ArticleIllustration from '../../article-illustration';
import IndexButton from '../../index-button';
import EditorialByline from '../../editorial-byline';
export const dynamic='force-dynamic';
export async function generateMetadata({params,searchParams}:{params:Promise<{slug:string}>;searchParams:Promise<{lang?:string|string[]}>}):Promise<Metadata>{
 const {slug}=await params;const {lang}=await searchParams;
 if(!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(slug)||(lang!==undefined&&lang!=='zh'&&lang!=='en'))return {robots:{index:false,follow:false}};
 const locale=lang==='zh'?'zh':'en';const article=await getManualArticle(slug,locale);if(!article)return {robots:{index:false,follow:false}};
 const origin=searchOrigin();const social=newsSocialMetadata({title:article.title,summary:article.summary,locale},origin);
 return {title:`${article.seo?.title || article.title}${locale === 'zh' ? ' - 科技简报 (Newsroom)' : '｜Newsroom'}`,description:article.seo?.meta_description || article.summary,keywords:article.seo?.keywords,robots:origin?undefined:{index:false,follow:false},...bilingualPageSearchMetadata(`/${publicArticleSlug('manual', slug)}`,locale),...social,
  openGraph:{...social.openGraph,siteName:siteNames[locale],locale:locale==='zh'?'zh_CN':'en_US',...(origin?{url:`${origin}/${locale}/${publicArticleSlug('manual', slug)}`}:{})}};
}

const internal=/^\/api\/manual-media\/[0-9a-f-]{36}$/i;
function hasArticleImage(node:JSONContent|null|undefined):boolean{return node?.type==='image'||(node?.content?.some(hasArticleImage)??false)}
function safeHttps(value:unknown):string|null{if(typeof value!=='string')return null;try{const url=new URL(value);return url.protocol==='https:'&&!url.username&&!url.password?url.href:null}catch{return null}}
function renderNode(node:JSONContent,index:number):ReactNode{
 const children=node.content?.map(renderNode);const key=index;
 switch(node.type){
 case 'doc':return <Fragment key={key}>{children}</Fragment>;
 case 'text':{let output:ReactNode=node.text??'';for(const mark of node.marks??[]){if(mark.type==='bold')output=<strong>{output}</strong>;else if(mark.type==='italic')output=<em>{output}</em>;else if(mark.type==='strike')output=<s>{output}</s>;else if(mark.type==='code')output=<code>{output}</code>;else if(mark.type==='underline')output=<u>{output}</u>;else if(mark.type==='link'){const href=safeHttps(mark.attrs?.href);if(href)output=<a href={href} rel="noopener noreferrer">{output}</a>;}}return <Fragment key={key}>{output}</Fragment>;}
 case 'paragraph':return <p key={key}>{children}</p>;
 case 'heading':return node.attrs?.level===2?<h2 key={key}>{children}</h2>:node.attrs?.level===3?<h3 key={key}>{children}</h3>:<h4 key={key}>{children}</h4>;
 case 'blockquote':return <blockquote key={key}>{children}</blockquote>;
 case 'bulletList':return <ul key={key}>{children}</ul>;case 'orderedList':return <ol key={key}>{children}</ol>;case 'listItem':return <li key={key}>{children}</li>;
 case 'codeBlock':return <pre key={key}><code>{children}</code></pre>;case 'hardBreak':return <br key={key}/>;case 'horizontalRule':return <hr key={key}/>;
 case 'table':return <table key={key}><tbody>{children}</tbody></table>;case 'tableRow':return <tr key={key}>{children}</tr>;case 'tableCell':return <td key={key}>{children}</td>;case 'tableHeader':return <th key={key}>{children}</th>;
 case 'image':{const src=node.attrs?.src;return typeof src==='string'&&internal.test(src)?<img key={key} src={src} alt={typeof node.attrs?.alt==='string'?node.attrs.alt:''}/>:null;}
 default:return null;
 }
}
export default async function ManualPage({params,searchParams}:{params:Promise<{slug:string}>;searchParams:Promise<{lang?:string|string[]}>}){
 const {slug}=await params;const {lang}=await searchParams;if(!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(slug)||(lang!==undefined&&lang!=='zh'&&lang!=='en'))notFound();
 const locale=lang==='zh'?'zh':'en';const article=await getManualArticle(slug,locale);if(!article)notFound();
 return <main className="manual-public" lang={locale}><SiteHeader locale={locale} path={`/${publicArticleSlug('manual', slug)}`} /><ArticleView slug={slug} type="manual"/><article className="public-article"><script type="application/ld+json" dangerouslySetInnerHTML={{__html:newsStructuredData({title:article.title,summary:article.summary,locale,channel:article.channel},searchOrigin())}}/><ArticleBreadcrumbs locale={locale} channel={article.channel} topics={article.topics}/><h1>{article.title}</h1><EditorialByline channel={article.channel} locale={locale}/><div className="article-opening"><div className="article-index-row"><ArticleTextSize locale={locale}/><IndexButton slug={slug} type="manual" score={article.score} locale={locale}/></div>{!hasArticleImage(article.document)&&<ArticleIllustration slug={slug} channel={article.channel} topics={article.topics} tags={article.tags} locale={locale}/>}</div><p className="article-reading-summary">{article.summary}</p><div className="manual-public-body article-reading-body">{renderNode(article.document,0)}</div><MemberArticle slug={slug} type="manual" locale={locale}/><HotEventBanner slug={slug} type="manual" locale={locale}/><ContentDisclosure locale={locale}/><RelatedArticles slug={slug} type="manual" locale={locale} tags={article.tags} title={article.title}/><ArticleShare title={article.title} slug={slug} type="manual" locale={locale} origin={searchOrigin()}/><ArticleReactions slug={slug} type="manual" locale={locale}/><ArticleComments slug={slug} type="manual" locale={locale}/>{article.sources.length>0&&<section><h2>{locale==='zh'?'来源':'Sources'}</h2><ul>{article.sources.map((source,index)=>{const href=safeHttps(source.url);return href?<li key={index}><a href={href} rel="noopener noreferrer">{source.label||source.url}</a></li>:null})}</ul></section>}</article></main>;
}
