import {getHotEventForArticle,type Locale} from '../lib/public-stories';
import {localePath} from '../lib/locale-path';
export default async function HotEventBanner({slug,type,locale}:{slug:string;type:'manual'|'story';locale:Locale}){
 const event=await getHotEventForArticle(locale,type,slug);
 return event?<aside className="hot-event-banner"><a href={localePath(locale,`/events/${event.slug}`)}>{locale==='zh'?'查看事件时间线':'Follow this event'}: {event.title} →</a></aside>:null;
}
