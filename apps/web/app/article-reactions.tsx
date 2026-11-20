'use client';
import {useState} from 'react';

type Reaction='like'|'dislike'|'shit';
export default function ArticleReactions({slug,type,locale}:{slug:string;type:'manual'|'story';locale:'zh'|'en'}){
 const [busy,setBusy]=useState(false),[selected,setSelected]=useState<Reaction|null>(null),[failed,setFailed]=useState(false),[limited,setLimited]=useState(false);
 const zh=locale==='zh';
 async function submit(reaction:Reaction){
  if(busy)return;
  setBusy(true);setFailed(false);setLimited(false);
  try{
   const response=await fetch('/api/article-index',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({slug,type,reaction}),cache:'no-store'});
   if(response.status===429){setLimited(true);return}
   if(!response.ok)throw Error();
   const data=await response.json();
   if(typeof data.score!=='number'||data.score<0||data.score>100)throw Error();
   setSelected(reaction);
   window.dispatchEvent(new CustomEvent('ihs-index-score',{detail:{slug,type,score:data.score,reaction}}));
  }catch{setFailed(true)}finally{setBusy(false)}
 }
 return <section className="article-reactions" aria-label={zh?'匿名评价':'Anonymous feedback'}>
  <div><h2>{zh?'你觉得这篇文章怎么样？':'What do you think of this story?'}</h2><p>{zh?'匿名评价，无需登录，每篇最多 5 次。':'Anonymous feedback, up to 5 reactions per article.'}</p></div>
  <div className="article-reaction-actions">
   {([['like',zh?'喜欢':'Like','👍'],['dislike',zh?'不喜欢':'Dislike','👎'],['shit','Shit','💩']] as const).map(([reaction,label,icon])=><button type="button" key={reaction} className={`reaction-${reaction}${selected===reaction?' is-selected':''}`} disabled={busy} onClick={()=>void submit(reaction)}><span aria-hidden="true">{icon}</span> {label}</button>)}
  </div>
  <p className="article-reaction-status" aria-live="polite">{limited?(zh?'这篇文章的 5 次评价已用完。':'You have used all 5 reactions for this article.'):failed?(zh?'未记录，请重试。':'Not recorded. Please try again.'):selected?(zh?'已记录，谢谢你的评价。':'Recorded. Thanks for your feedback.'):''}</p>
 </section>;
}
