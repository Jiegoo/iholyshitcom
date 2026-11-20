import {editorialDesks,editorialDesk} from '../lib/editorial-desks.mjs';

export default function EditorialDesks({locale}:{locale:'zh'|'en'}) {
  const zh=locale==='zh';
  return <section><h2>{zh?'栏目署名':'Editorial desk bylines'}</h2>
    <p>{zh?'以下名称是按栏目使用的编辑署名，代表网站的内容分类，并非虚构的个人记者或独立机构。':'These are site-wide editorial bylines used to identify coverage areas, not invented individual journalists or separate organizations.'}</p>
    <ul>{[...editorialDesks,editorialDesk(null)].map(desk=><li id={`desk-${desk.channel}`} key={desk.channel}>{desk.name}</li>)}</ul>
  </section>;
}
