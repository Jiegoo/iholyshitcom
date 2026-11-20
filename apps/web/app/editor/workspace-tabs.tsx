'use client';
import {useState,type ReactNode} from 'react';
import Brand from '../brand';
import {WorkspaceMembers} from './workspace-members';
import {WorkspaceAnalytics} from './workspace-analytics';

type Tab='articles'|'bots'|'homepage'|'comments'|'analytics'|'members';
const tabs:{id:Tab;label:string;icon:string}[]=[{id:'articles',label:'文章管理',icon:'▤'},{id:'members',label:'会员管理',icon:'◉'},{id:'analytics',label:'访问统计',icon:'▥'},{id:'bots',label:'值班机器人',icon:'◎'},{id:'homepage',label:'首页精选',icon:'◇'},{id:'comments',label:'匿名评价',icon:'☏'}];
export function WorkspaceTabs({articles,bots,homepage,comments,session,initialTab}:{articles:ReactNode;bots:ReactNode;homepage:ReactNode;comments:ReactNode;session:ReactNode;initialTab?:string}){
 const [tab,setTab]=useState<Tab>(()=>tabs.some(item=>item.id===initialTab)?initialTab as Tab:'articles');const [menu,setMenu]=useState(false);
 return <div className="editor-dashboard editor-workspace">
  <aside className={`editor-dashboard-nav${menu?' is-open':''}`} aria-label="后台导航">
   <a className="editor-dashboard-brand" href="/editor"><Brand/><span>管理工作台</span></a>
   <button type="button" className="editor-mobile-toggle" aria-label="后台导航菜单" aria-expanded={menu} onClick={()=>setMenu(!menu)}>☰</button>
   <p className="editor-dashboard-nav-title">日常运营</p>
   {tabs.map(item=><button type="button" key={item.id} aria-pressed={tab===item.id} onClick={()=>{setTab(item.id);setMenu(false)}}><span className="editor-nav-icon" aria-hidden="true">{item.icon}</span><strong>{item.label}</strong></button>)}
   <div className="editor-sidebar-divider"/><p className="editor-dashboard-nav-title">其他管理</p>
   <a className="editor-sidebar-link" href="/editor/team">◉ <span>成员与权限</span></a>
   <a className="editor-sidebar-link" href="/editor/profile">◯ <span>个人资料</span></a>
   <div className="editor-sidebar-session">{session}</div>
  </aside>
  <div className="editor-dashboard-main"><header className="editor-dashboard-top"><div><span>Newsroom / 管理工作台</span><strong>{tabs.find(x=>x.id===tab)?.label}</strong></div><a href="/" target="_blank" rel="noreferrer">查看网站 ↗</a></header>
   <div className="editor-dashboard-content"><div hidden={tab!=='articles'}>{articles}</div><div hidden={tab!=='members'}><WorkspaceMembers active={tab==='members'}/></div><div hidden={tab!=='analytics'}><WorkspaceAnalytics active={tab==='analytics'}/></div><div hidden={tab!=='bots'}>{bots}</div><div hidden={tab!=='homepage'}>{homepage}</div><div hidden={tab!=='comments'}>{comments}</div></div>
  </div>
 </div>;
}
