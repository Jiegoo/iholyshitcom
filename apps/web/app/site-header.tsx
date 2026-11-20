import type { ChannelCount, Locale } from '../lib/public-stories';
import { localePath } from '../lib/locale-path';
import Brand from './brand';
import ChannelNav from './channel-nav';
import LanguageMenu from './language-menu';

export default function SiteHeader({locale,path='/',counts=[],switchHref}: {locale:Locale;path?:string;counts?:ChannelCount[];switchHref?:string}) {
  const zh=locale==='zh';
  const other=zh?'en':'zh';
  return <header className="muse-header muse-wrap site-header">
    <a href={localePath(locale,'/')} className="muse-logo site-header-logo" aria-label="Newsroom"><Brand /></a>
    <nav className="site-header-tools" aria-label={zh?'语言与导航':'Language and navigation'}>
      <a href={`/member?lang=${locale}`}>{zh?'会员':'Account'}</a><LanguageMenu locale={locale} href={switchHref??localePath(other,path)}/>
      <a href={localePath(locale,'/search')}>{zh?'搜索':'Search'}</a>
    </nav>
    <ChannelNav locale={locale} counts={counts} activeChannel={path.startsWith('/category/')?path.split('/')[2]:undefined} />
  </header>;
}
