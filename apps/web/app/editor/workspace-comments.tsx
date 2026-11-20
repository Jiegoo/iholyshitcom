'use client';
import {useActionState,useState} from 'react';
import {hideAnonymousComment,loadAnonymousComments} from './comments-actions';
type Comment={id:number;content_type:'manual'|'story';slug:string;body:string;created_at:string};
function Entry({comment}:{comment:Comment}){const [state,action,pending]=useActionState(hideAnonymousComment,{message:'',hidden:false});if(state.hidden)return null;return <li><div><a href={`/${comment.content_type}/${encodeURIComponent(comment.slug)}`} target="_blank" rel="noreferrer">{comment.slug} ↗</a><time>{new Date(comment.created_at).toLocaleString('zh-CN')}</time></div><p>{comment.body}</p><form action={action}><input type="hidden" name="id" value={String(comment.id)}/><button disabled={pending}>{pending?'处理中…':'隐藏评价'}</button>{state.message&&<span role="status">{state.message}</span>}</form></li>}
export function WorkspaceComments({items:initial}:{items:Comment[]}){
 const [items,setItems]=useState(initial),[page,setPage]=useState(0),[loading,setLoading]=useState(false),[error,setError]=useState('');
 async function change(next:number){setLoading(true);setError('');const result=await loadAnonymousComments(next*20);if(result.items){setItems(result.items);setPage(next)}else setError('无法加载评价，请重试。');setLoading(false)}
 return <section className="workspace-card workspace-comments"><div className="workspace-card-heading"><div><h1>匿名评价</h1><p>查看读者的文字评价，必要时可以隐藏。</p></div></div>{items.length?<><ul>{items.slice(0,20).map(c=><Entry key={c.id} comment={c}/>)}</ul><nav className="manual-pagination" aria-label="评价分页"><button disabled={loading||page===0} onClick={()=>void change(page-1)}>上一页</button><span>第 {page+1} 页</span><button disabled={loading||items.length<=20} onClick={()=>void change(page+1)}>下一页</button></nav></>:<p className="workspace-empty">暂无匿名文字评价。</p>}{error&&<p role="alert">{error}</p>}</section>
}
