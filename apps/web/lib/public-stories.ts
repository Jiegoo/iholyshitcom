import 'server-only';
import { createClient } from '@supabase/supabase-js';
import { cache } from 'react';
import { isEditorialChannel } from './editorial-channels';
import { isConfigured } from './supabase';

export type Source = { name: string; url: string; attribution: string };
export type Story = { slug: string; title: string; summary: string; sources: Source[]; updates: { kind: 'update' | 'correction'; notice: string; published_at: string }[] };
export type BilingualStory = { slug: string; locale: 'zh' | 'en'; title: string; summary: string; single_source: boolean;
  what_we_dont_know: string | null; claims: { text: string; sources: Source[] }[];
  updates: { kind: 'update' | 'correction'; notice: string; published_at: string }[] };
export type FeedItem = Pick<Story, 'slug' | 'title' | 'summary'> & { category: string | null; score: number | null; content_type?: 'story' | 'manual' };
export type RankingItem = { slug: string; title: string; score: number; content_type?: 'story' | 'manual' };
export type ChannelCount = { channel: string; story_count: number };
export type Correction = { slug: string; kind: 'correction' | 'retraction'; notice: string; published_at: string };
export type Retraction = { slug: string; notice: string; retracted_at: string; target_slug?: string };
export type BrowseItem = FeedItem & { published_at: string; content_type?: 'story' | 'manual' };
export type DailyItem = FeedItem & { published_at: string; source_count: number };
export type BrowseOptions = { query: string; category: string | null; period: string; sort: string; offset: number };
export type Locale = 'zh' | 'en';

function publicClient() {
  if (!isConfigured()) return null;
  return createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_PUBLISHABLE_KEY!, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
    global: { fetch: (input, init) => fetch(input, { ...init, cache: 'no-store',
      signal: init?.signal ? AbortSignal.any([init.signal, AbortSignal.timeout(5000)]) : AbortSignal.timeout(5000) }) },
  });
}
export async function getFeed(locale?: Locale): Promise<FeedItem[]> {
  const client = publicClient();
  if (!client) throw new Error('Stories are temporarily unavailable');
  const { data, error } = locale ? await client.rpc('get_public_channel_discovery', { p_locale: locale }) : await client.rpc('get_public_discovery');
  if (error) throw new Error('Stories are temporarily unavailable');
  return (data ?? []) as FeedItem[];
}
export async function getChannelCounts(): Promise<ChannelCount[]> {
  const client = publicClient();
  if (!client) throw new Error('Channel counts are temporarily unavailable');
  let { data, error } = await client.rpc('get_public_unified_channel_counts');
  if (error?.code === 'PGRST202') ({ data, error } = await client.rpc('get_public_channel_counts'));
  if (error || !Array.isArray(data)) throw new Error('Channel counts are temporarily unavailable');
  return data as ChannelCount[];
}
export async function getRanking(locale?: Locale, bilingualOverride?: boolean): Promise<RankingItem[]> {
  const rows=await getBrowse({query:'',category:null,period:'all',sort:'score',offset:0},locale,bilingualOverride);
  return rows.filter(row=>row.score!==null).map(row=>({slug:row.slug,title:row.title,score:row.score!,content_type:row.content_type}));
}
export async function getDaily(locale?: Locale): Promise<DailyItem[]> {
  const client = publicClient();
  if (!client) throw new Error('Daily selection is temporarily unavailable');
  const { data, error } = locale ? await client.rpc('get_public_channel_daily', { p_locale: locale }) : await client.rpc('get_public_daily');
  if (error || !Array.isArray(data)) throw new Error('Daily selection is temporarily unavailable');
  return data as DailyItem[];
}
export type TrendingItem = BrowseItem & { views: number };
export async function getHomepageFeatured(locale:Locale,bilingual:boolean):Promise<{headline:TrendingItem[];picks:TrendingItem[];picks_recent:TrendingItem[]}>{
 const empty={headline:[],picks:[],picks_recent:[]};
 const client=publicClient();if(!client)return empty;
 const {data,error}=await client.rpc('get_homepage_featured',{p_locale:locale,p_bilingual:bilingual});
 return !error&&data&&Array.isArray(data.headline)&&Array.isArray(data.picks)&&Array.isArray(data.picks_recent)?data:empty;
}
export async function getHomepageSection(section: 'headline' | 'picks' | 'picks_recent' | 'trending', locale: Locale, bilingual: boolean): Promise<TrendingItem[]> {
  const client=publicClient(); if(!client)return [];
  const {data,error}=await client.rpc('get_homepage_section',{p_section:section,p_locale:locale,p_bilingual:bilingual});
  return !error && Array.isArray(data) ? data as TrendingItem[] : [];
}
export async function getArticleIndex(slug:string,type:'manual'|'story'):Promise<number|null>{
 const client=publicClient();if(!client)return null;const {data,error}=await client.rpc('get_article_index',{p_type:type,p_slug:slug});return !error&&typeof data==='number'?data:null;
}
export async function getLatestDiscoveries(locale:Locale,bilingual:boolean,sort:'latest'|'score'):Promise<BrowseItem[]>{
 const client=publicClient();if(!client)throw new Error('Stories are temporarily unavailable');
 const {data,error}=await client.rpc('get_public_latest_discoveries',{p_locale:locale,p_bilingual:bilingual,p_sort:sort});
 if(error||!Array.isArray(data))throw new Error('Stories are temporarily unavailable');return data as BrowseItem[];
}
export async function getCorrections(locale?: Locale): Promise<Correction[]> {
  const client = publicClient();
  if (!client) throw new Error('Notices are temporarily unavailable');
  const { data, error } = locale ? await client.rpc('get_public_bilingual_corrections', { p_locale: locale }) : await client.rpc('get_public_corrections');
  if (error) throw new Error('Notices are temporarily unavailable');
  return (data ?? []) as Correction[];
}
export async function getBrowse(options: BrowseOptions, locale?: Locale, bilingualOverride?: boolean): Promise<BrowseItem[]> {
  const client = publicClient();
  if (!client) throw new Error('Stories are temporarily unavailable');
  const args = {
    p_query: options.query, p_category: options.category, p_period: options.period, p_sort: options.sort, p_offset: options.offset,
  };
  const bilingual = bilingualOverride ?? !!locale;
  let { data, error } = await client.rpc('get_public_unified_browse', { p_locale: locale ?? 'zh', p_bilingual: bilingual,
    p_query: options.query, p_channel: options.category, p_period: options.period, p_sort: options.sort, p_offset: options.offset });
  if (error?.code === 'PGRST202') ({ data, error } = bilingual && locale ? (options.category === null || isEditorialChannel(options.category)
    ? await client.rpc('get_public_channel_browse', { p_query: options.query, p_channel: options.category, p_period: options.period, p_sort: options.sort, p_offset: options.offset, p_locale: locale })
    : await client.rpc('get_public_bilingual_browse', { ...args, p_locale: locale })) : await client.rpc('get_public_browse', args));
  if (error || !Array.isArray(data)) throw new Error('Stories are temporarily unavailable');
  return data as BrowseItem[];
}
export async function getBrowseCount(options: BrowseOptions,locale:Locale,bilingual:boolean):Promise<number>{
 const client=publicClient();if(!client)throw new Error('Stories are temporarily unavailable');
 const {data,error}=await client.rpc('get_public_browse_count',{p_locale:locale,p_bilingual:bilingual,p_query:options.query,p_channel:options.category,p_period:options.period});
 if(error||!Number.isSafeInteger(Number(data))||Number(data)<0||data===null)throw new Error('Story count is temporarily unavailable');
 return Number(data);
}
export async function getTopicCount(locale:Locale,channel:string,topic:string):Promise<number>{
 const client=publicClient();if(!client)throw new Error('Stories are temporarily unavailable');
 const {data,error}=await client.rpc('get_public_topic_count',{p_locale:locale,p_channel:channel,p_topic:topic});
 if(error||!Number.isSafeInteger(Number(data))||Number(data)<0||data===null)throw new Error('Story count is temporarily unavailable');
 return Number(data);
}
export const getStory = cache(async (slug: string): Promise<{ story: Story | null; retraction: Retraction | null }> => {
  const client = publicClient();
  if (!client) throw new Error('Story is temporarily unavailable');
  const [story, retraction] = await Promise.all([
    client.rpc('get_public_story_page', { p_slug: slug }),
    client.rpc('get_public_retraction', { p_slug: slug }),
  ]);
  if (story.error || retraction.error) throw new Error('Story is temporarily unavailable');
  const notice = (retraction.data?.[0] as Retraction | undefined) ?? null;
  if (notice) {
    const target = await client.rpc('get_public_duplicate_target', { p_slug: slug });
    const targetSlug = target.data?.[0]?.target_slug;
    if (!target.error && typeof targetSlug === 'string' && /^[a-z0-9]+(-[a-z0-9]+)*$/.test(targetSlug) && targetSlug.length <= 200) notice.target_slug = targetSlug;
  }
  return { story: (story.data?.[0] as Story | undefined) ?? null, retraction: notice };
});
export const getBilingualStory = cache(async (slug: string, locale: 'zh' | 'en'): Promise<{ story: BilingualStory | null; retraction: Retraction | null }> => {
  const client = publicClient();
  if (!client) throw new Error('Story is temporarily unavailable');
  const [story, retraction, updates] = await Promise.all([
    client.rpc('get_public_bilingual_story', { p_slug: slug, p_locale: locale }),
    client.rpc('get_public_bilingual_retraction', { p_slug: slug, p_locale: locale }),
    client.rpc('get_public_bilingual_notices', { p_slug: slug, p_locale: locale }),
  ]);
  if (story.error || retraction.error || updates.error || !Array.isArray(updates.data)) throw new Error('Story is temporarily unavailable');
  const record = story.data as Omit<BilingualStory, 'updates'> | null;
  return { story: record ? { ...record, updates: updates.data as BilingualStory['updates'] } : null,
    retraction: (retraction.data?.[0] as Retraction | undefined) ?? null };
});
export async function getSitemapSlugs(): Promise<string[]> {
  const client = publicClient();
  if (!client) throw new Error('Sitemap is temporarily unavailable');
  const slugs: string[] = [];
  let after: string | null = null;
  for (let page = 0; page < 100; page++) {
    const result: { data: unknown; error: unknown } = await client.rpc('get_public_sitemap', { p_after: after, p_limit: 500 });
    if (result.error || !Array.isArray(result.data) || result.data.length > 500) throw new Error('Sitemap is temporarily unavailable');
    const rows: unknown[] = result.data;
    for (const row of rows) {
      const slug: unknown = row !== null && typeof row === 'object' && 'slug' in row ? row.slug : null;
      if (typeof slug !== 'string' || slug.length > 200 || !/^[a-z0-9]+(-[a-z0-9]+)*$/.test(slug) || (after !== null && slug <= after)) {
        throw new Error('Sitemap data is invalid');
      }
      slugs.push(slug);
      if (slugs.length > 49990) throw new Error('Sitemap requires pagination');
      after = slug;
    }
    if (rows.length < 500) return slugs;
  }
  throw new Error('Sitemap requires pagination');
}
export async function getSitemapArticleShard(bucket:number,after:{slug:string;content_type:'manual'|'story'}|null,limit:number,bilingual:boolean):Promise<{slug:string;content_type:'manual'|'story'}[]>{
 const client=publicClient();if(!client)throw new Error('Sitemap is temporarily unavailable');
 const {data,error}=await client.rpc('get_sitemap_article_shard',{p_bucket:bucket,p_after_slug:after?.slug??null,p_after_type:after?.content_type??null,p_limit:limit,p_bilingual:bilingual});
 if(error||!Array.isArray(data)||data.length>limit)throw new Error('Sitemap is temporarily unavailable');
 let last=after;for(const row of data){if(!row||typeof row.slug!=='string'||row.slug.length>200||!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(row.slug)||!['manual','story'].includes(row.content_type)||(last&&(row.slug<last.slug||row.slug===last.slug&&row.content_type<=last.content_type)))throw new Error('Sitemap data is invalid');last=row}
 return data;
}
export function safeSourceUrl(input: string): string | null {
  try {
    const url = new URL(input);
    return url.protocol === 'https:' && !url.username && !url.password ? url.href : null;
  } catch { return null; }
}

export type FullArticleContent={single_source_label:string;seo?:{title:string;meta_description:string;slug:string;summary:string;keywords:string[];tags:string[]}}&Record<'title'|'what_happened'|'why_it_matters'|'what_we_know'|'what_we_dont_know'|'timeline'|'sources'|'corrections',{text:string;claim_ids:string[]}[]>;
export const getPublicFullArticle=cache(async(slug:string,locale:'zh'|'en'):Promise<{content:FullArticleContent;expires_at:string}|null>=>{
 if(process.env.NEWS_FULL_ARTICLE_PUBLIC_READ!=='true'||process.env.NEWS_BILINGUAL_PUBLIC_READ!=='true')return null;
 const client=publicClient();if(!client)return null;
 const result=await client.rpc('get_public_full_article',{p_slug:slug,p_locale:locale});
 return result.error?null:result.data;
});

export async function getManualTopicBrowse(locale: Locale, channel: string, topic: string, offset: number): Promise<BrowseItem[]> {
  if (process.env.NEWS_MANUAL_PUBLIC_READ === 'false') return [];
  const client = publicClient();
  if (!client) throw new Error('Stories are temporarily unavailable');
  const {data,error}=await client.rpc('get_public_manual_topic_browse',{p_locale:locale,p_channel:channel,p_topic:topic,p_offset:offset});
  if (error || !Array.isArray(data)) throw new Error('Stories are temporarily unavailable');
  return data.map(item=>({...item,category:channel,content_type:'manual'})) as BrowseItem[];
}

export type HotEvent = {slug:string;title:string;summary:string;article_count:number;max_index:number|null;last_progress_at:string;age_hours:number;articles:(BrowseItem & {progress_at?:string})[]};
export async function getHotEvents(locale:Locale,slug:string|null=null,recent=false,offset=0):Promise<HotEvent[]> {
 const client=publicClient(); if(!client)return [];
 const {data,error}=await client.rpc('get_public_hot_events',{p_locale:locale,p_slug:slug,p_recent:recent,p_offset:offset});
 return !error&&Array.isArray(data)?data as HotEvent[]:[];
}

export async function getHotEventForArticle(locale:Locale,type:'manual'|'story',slug:string):Promise<{slug:string;title:string}|null> {
 const client=publicClient(); if(!client)return null;
 const {data,error}=await client.rpc('get_public_hot_event_for_article',{p_locale:locale,p_type:type,p_slug:slug});
 return !error&&Array.isArray(data)&&data.length?data[0]:null;
}

export async function getHotEventSitemap():Promise<string[]> {
 const client=publicClient();if(!client)return [];
 const slugs:string[]=[];let after='';
 for(let page=0;page<100;page++){
  const {data,error}=await client.rpc('get_hot_event_sitemap',{p_after:after});
  if(error||!Array.isArray(data))return [];
  for(const row of data)if(typeof row.slug==='string'){slugs.push(row.slug);after=row.slug;}
  if(data.length<500)return slugs;
 }
 throw new Error('Hot event sitemap requires splitting');
}
