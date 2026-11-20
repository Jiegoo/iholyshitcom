import {channelTopics} from '../lib/channel-topics';
import {editorialChannels} from '../lib/editorial-channels';
import {localePath} from '../lib/locale-path';

type Props={locale:'zh'|'en';channel?:string|null;topics?:string[]};
export default function ArticleBreadcrumbs({locale,channel,topics}:Props){
 const zh=locale==='zh';
 const selected=editorialChannels.find(item=>item.slug===channel);
 const topic=selected?channelTopics[selected.slug]?.find(item=>topics?.includes(item.slug)):undefined;
 return <nav className="article-breadcrumbs" aria-label={zh?'当前位置':'Breadcrumb'}><ol>
  <li><a href={localePath(locale,'/')}>{zh?'首页':'Home'}</a></li>
  {selected?<li><a href={localePath(locale,`/category/${selected.slug}`)}>{selected.label}</a></li>:<li><a href={localePath(locale,'/search')}>{zh?'全部新闻':'All news'}</a></li>}
  {topic&&<li><a href={localePath(locale,`/category/${selected!.slug}/${topic.slug}`)}>{topic[locale]}</a></li>}
  <li aria-current="page">{zh?'文章':'Article'}</li>
 </ol></nav>;
}
