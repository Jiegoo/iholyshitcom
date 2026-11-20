import {getBrowse, type Locale} from '../lib/public-stories';
import {findRelatedArticles} from '../lib/related-articles.mjs';
import {publicArticleSlug} from '../lib/historical-article-slugs.mjs';
import {localePath} from '../lib/locale-path';

export default async function RelatedArticles({slug,type,locale,tags=[],title}:{slug:string;type:'manual'|'story';locale:Locale;tags?:string[];title:string}) {
  const related = await findRelatedArticles({slug,type,tags,title}, (term:string) => getBrowse({query:term,category:null,period:'all',sort:'latest',offset:0},locale,process.env.NEWS_BILINGUAL_PUBLIC_READ==='true'));
  if (!related.length) return null;
  return <section className="related-articles" aria-label={locale==='zh'?'延伸阅读':'Related reading'}>
    <h2>{locale==='zh'?'延伸阅读':'Related reading'}</h2>
    <ul>{related.map((item:{slug:string;title:string;content_type?:'manual'|'story'})=><li key={`${item.content_type??'story'}:${item.slug}`}><a href={localePath(locale,`/${item.content_type==='manual'?'':'story/'}${publicArticleSlug(item.content_type,item.slug)}`)}>{item.title}</a></li>)}</ul>
  </section>;
}
