import type {HotEvent,Locale} from '../lib/public-stories';
import {localePath} from '../lib/locale-path';
export default function HotEvents({locale,events}:{locale:Locale;events:HotEvent[]}){
 if(!events.length)return null;const zh=locale==='zh';
 return <section className="hot-events"><div className="muse-heading"><h2>{zh?'热门事件':'Hot Events'}</h2><a href={localePath(locale,'/events')}>{zh?'查看全部':'View all'} →</a></div><div className="hot-events-list">{events.map(event=><a className="hot-event-card" href={localePath(locale,`/events/${event.slug}`)} key={event.slug}><span className="hot-event-meta"><span className="hot-event-dot"/> {zh?'持续追踪':'Following'} · {event.article_count} {zh?'篇':'stories'} · {event.max_index??'—'} <time dateTime={event.last_progress_at}>{new Intl.RelativeTimeFormat(locale,{numeric:'auto'}).format(-event.age_hours,'hour')}</time></span><strong>{event.title}</strong><span>{event.articles.reduce((latest,item)=>!latest||Date.parse(item.progress_at??item.published_at)>Date.parse(latest.progress_at??latest.published_at)?item:latest,event.articles[0])?.title}</span></a>)}</div></section>;
}
