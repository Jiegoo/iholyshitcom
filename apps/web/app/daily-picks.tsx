'use client';
import {publicArticleSlug} from '../lib/historical-article-slugs.mjs';
import type {BrowseItem,Locale} from '../lib/public-stories';
import {editorialChannelLabel,isEditorialChannel} from '../lib/editorial-channels';
import {bilingualCategoryLabel} from '../lib/categories';
import {localePath} from '../lib/locale-path';
import IndexButton from './index-button';
export default function DailyPicks({locale,heat,recent,mode,setMode}:{locale:Locale;heat:BrowseItem[];recent:BrowseItem[];mode:'heat'|'recent';setMode:(mode:'heat'|'recent')=>void}){
 const zh=locale==='zh';const items=mode==='heat'?heat:recent;
 return <><div className="muse-heading daily-picks-heading"><h2>{zh?'每日精选':'Daily picks'}</h2><div className="daily-picks-sort" role="group" aria-label={zh?'精选排序':'Sort daily picks'}><button type="button" aria-pressed={mode==='recent'} onClick={()=>setMode('recent')}>{zh?'时间排序':'Latest'}</button><button type="button" aria-pressed={mode==='heat'} onClick={()=>setMode('heat')}>{zh?'热度排序':'Popular'}</button></div></div>
 <p className="daily-picks-note">{zh?'仅展示今天发布的文章 · 北京时间':'Published today only · UTC+8'}</p>
 {items.length?<div className="muse-grid">{items.map(item=><article className="muse-card" key={`${item.content_type??'story'}-${item.slug}`}><div className="muse-card-top">{isEditorialChannel(item.category)?editorialChannelLabel(item.category,locale):bilingualCategoryLabel(item.category,locale)} {item.score==null?<span>{zh?'评分未知':'Score unavailable'}</span>:<IndexButton slug={item.slug} type={item.content_type??'story'} score={item.score} locale={locale}/>}</div><h3><a href={localePath(locale,`/${item.content_type==='manual'?'':'story/'}${encodeURIComponent(publicArticleSlug(item.content_type, item.slug))}`)}>{item.title}</a></h3><p>{item.summary}</p></article>)}</div>:<div className="muse-empty">{zh?'今天还没有编辑精选。':'No editorial picks yet today.'}</div>}</>;
}
