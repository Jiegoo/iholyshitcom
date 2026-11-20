import {publicArticleSlug} from '../lib/historical-article-slugs.mjs';
import {editorialChannelLabel,isEditorialChannel} from '../lib/editorial-channels';
import {bilingualCategoryLabel} from '../lib/categories';
import {localePath} from '../lib/locale-path';
import type {BrowseItem,Locale} from '../lib/public-stories';
import BrowseStoryLink from './browse-story-link';
import IndexButton from './index-button';
export default function DiscoveryCards({locale,items}:{locale:Locale;items:BrowseItem[]}) {
 return <div className="bilingual-latest-list">{items.map(item=><article className="muse-card" id={`story-${item.slug}`} key={`${item.content_type??'story'}-${item.slug}`}><div className="muse-card-top">{isEditorialChannel(item.category)?editorialChannelLabel(item.category,locale):bilingualCategoryLabel(item.category,locale)} {item.score==null?<span>{locale==='zh'?'评分未知':'Score unavailable'}</span>:<IndexButton slug={item.slug} type={item.content_type??'story'} score={item.score} locale={locale}/>}</div><h3><BrowseStoryLink anchor={`story-${item.slug}`} href={localePath(locale,`/${item.content_type==='manual'?'':'story/'}${encodeURIComponent(publicArticleSlug(item.content_type,item.slug))}`)}>{item.title}</BrowseStoryLink></h3><p>{item.summary}</p></article>)}</div>;
}
