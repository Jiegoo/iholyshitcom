import {createClient} from '../../lib/supabase';
import {logout} from './actions';
import {WorkspaceTabs} from './workspace-tabs';
import {WorkspaceArticles,type WorkspaceArticle} from './workspace-articles';
import {WorkspaceBots} from './workspace-bots';
import {WorkspaceHomepage} from './workspace-homepage';
import {WorkspaceComments} from './workspace-comments';
type Bot={bot_id:string;enabled:boolean;updated_at:string};
export async function EditorWorkspace({client,initialTab}:{client:Awaited<ReturnType<typeof createClient>>;initialTab?:string}){
 const [articleResult,botResult,indexResult,commentResult,readsResult]=await Promise.all([client.rpc('manual_list_articles'),client.rpc('owner_list_duty_identities'),client.rpc('owner_article_reaction_stats'),client.rpc('owner_list_anonymous_comments'),client.rpc('owner_article_read_stats')]);
 return <WorkspaceTabs initialTab={initialTab}
  articles={articleResult.error||!Array.isArray(articleResult.data)?<p role="alert">无法加载文章，请稍后重试。</p>:<WorkspaceArticles items={articleResult.data as WorkspaceArticle[]} reads={readsResult.error||!Array.isArray(readsResult.data)?null:readsResult.data} stats={indexResult.error||!Array.isArray(indexResult.data)?null:indexResult.data}/>}
  bots={botResult.error||!Array.isArray(botResult.data)?<p role="alert">无法加载机器人，请检查站长权限。</p>:<WorkspaceBots bots={botResult.data as Bot[]}/>}
  homepage={articleResult.error||!Array.isArray(articleResult.data)?<p role="alert">无法加载已发布文章，请稍后重试。</p>:<WorkspaceHomepage items={articleResult.data as WorkspaceArticle[]}/>}
  comments={commentResult.error||!Array.isArray(commentResult.data)?<p role="alert">无法加载匿名评价，请稍后重试。</p>:<WorkspaceComments items={commentResult.data}/>}
  session={<form action={logout}><button>退出登录</button></form>}/>;
}
