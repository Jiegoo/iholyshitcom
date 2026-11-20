import {cookies} from 'next/headers';
import MemberArticle from './member-article';
export default async function MemberArticleServer(props:{slug:string;type:'manual'|'story';locale:'zh'|'en'}){
 const store=await cookies();const hasSession=store.getAll().some(cookie=>/^sb-.*-auth-token(?:\.\d+)?$/.test(cookie.name));
 return <MemberArticle {...props} historyEnabled={hasSession}/>;
}
