import {editorialDesk} from '../lib/editorial-desks.mjs';
import {localePath} from '../lib/locale-path';

export default function EditorialByline({channel,locale}:{channel?:string|null;locale:'zh'|'en'}) {
  const desk=editorialDesk(channel);
  return <p className="editorial-byline">{locale==='zh'?'栏目署名：':'By '}<a href={`${localePath(locale,'/about')}#desk-${desk.channel}`}>{desk.name}</a></p>;
}
