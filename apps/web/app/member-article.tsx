'use client';
import {useEffect,useState} from 'react';
import {bookmarkInline} from './member/actions';
export default function MemberArticle({slug,type,locale,historyEnabled}:{slug:string;type:'manual'|'story';locale:'zh'|'en';historyEnabled:boolean}){
 const [state,setState]=useState<'idle'|'busy'|'saved'|'login'|'failed'>('idle');
 useEffect(()=>{if(!historyEnabled)return;void fetch('/api/member-history',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({slug,type}),keepalive:true}).catch(()=>{})},[slug,type,historyEnabled]);
 async function save(){if(state==='busy'||state==='saved')return;setState('busy');try{setState(await bookmarkInline(type,slug))}catch{setState('failed')}}
 return <div className="member-bookmark"><button type="button" onClick={()=>void save()} disabled={state==='busy'||state==='saved'}>☆ {state==='saved'?(locale==='zh'?'已收藏':'Saved'):(locale==='zh'?'收藏文章':'Save article')}</button>{state==='login'&&<a href={`/member?lang=${locale}`}>{locale==='zh'?'请先登录':'Sign in first'}</a>}{state==='failed'&&<span role="status">{locale==='zh'?'收藏失败，请重试。':'Could not save. Try again.'}</span>}</div>;
}
