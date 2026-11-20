import {publicArticleSlug} from '../../../lib/historical-article-slugs.mjs';
import {searchOrigin} from '../../../lib/search-config.mjs';
import {urlsetXml} from '../../../lib/sitemap-xml.mjs';
import {getSitemapArticleShard,getHotEventSitemap} from '../../../lib/public-stories';
import {editorialChannels} from '../../../lib/editorial-channels';
import {channelTopics} from '../../../lib/channel-topics';
import {categories} from '../../../lib/categories';
export const dynamic='force-dynamic';
export async function GET(_request:Request,{params}:{params:Promise<{slug:string}>}){
 const origin=searchOrigin();if(!origin)return new Response('Not found',{status:404});const {slug}=await params;let urls:string[]=[];
 if(slug==='pages.xml'){
  const paths=['','/events','/about','/methodology','/corrections','/privacy','/terms','/search',...[...new Set([...editorialChannels.map(c=>c.slug),...categories.map(c=>c.slug)])].flatMap(slug=>[`/category/${slug}`,...(channelTopics[slug]??[]).map(topic=>`/category/${slug}/${topic.slug}`)])];
  urls=['en','zh'].flatMap(locale=>paths.map(path=>`${origin}/${locale}${path}`));
  const events=await getHotEventSitemap();urls.push(...['en','zh'].flatMap(locale=>events.map(event=>`${origin}/${locale}/events/${event}`)));if(urls.length>50000)throw Error('Sitemap requires splitting');
 }else{
  const match=/^(en|zh)-([0-7])\.xml$/.exec(slug);if(!match)return new Response('Not found',{status:404});const locale=match[1],bucket=Number(match[2]),bilingual=process.env.NEWS_BILINGUAL_PUBLIC_READ==='true';let after:{slug:string;content_type:'manual'|'story'}|null=null;
  for(let page=0;page<=100;page++){
   const rows=await getSitemapArticleShard(bucket,after,500,bilingual);
   for(const row of rows){if(row.content_type!=='story'||bilingual||locale==='en')urls.push(`${origin}${row.content_type==='story'&&!bilingual?'':`/${locale}`}/${row.content_type==='manual'?'':'story/'}${publicArticleSlug(row.content_type, row.slug)}`);if(urls.length>50000)throw Error('Sitemap shard exceeds 50000 URLs');after=row}
   if(rows.length<500)break;if(page===100)throw Error('Sitemap shard requires splitting');
  }
 }
 return new Response(urlsetXml(urls),{headers:{'Content-Type':'application/xml; charset=utf-8','Cache-Control':'private, no-store'}});
}
