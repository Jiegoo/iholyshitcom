import { channelTopics } from '../lib/channel-topics';
import { localePath } from '../lib/locale-path';
import type { Locale } from '../lib/public-stories';
export default function ChannelTopics({locale,channel,topic}:{locale:Locale;channel:string;topic?:string}) {
 return <nav className="channel-topic-filter" aria-label={locale==='zh'?'频道子分类':'Channel topics'}>
  <a href={localePath(locale,`/category/${channel}`)} aria-current={!topic?'page':undefined}>{locale==='zh'?'全部':'All'}</a>
  {(channelTopics[channel]??[]).map(item=><a key={item.slug} href={localePath(locale,`/category/${channel}/${item.slug}`)} aria-current={topic===item.slug?'page':undefined}>{item[locale]}</a>)}
 </nav>;
}
