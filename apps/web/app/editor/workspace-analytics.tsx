'use client';
import {useEffect,useRef,useState} from 'react';
import {loadTrafficAnalytics} from './analytics-actions';
type Breakdown={label:string;views:number;visitors:number};
export type TrafficReport={as_of:string;started_at:string;first_day:string;last_day:string;period:string;totals:{views:number;visitors:number;sessions:number;engaged_sessions:number;engagement_seconds:number};recent_visitors:number;daily:{day:string;views:number;visitors:number}[];hourly:{hour:number;views:number}[];breakdowns:Record<string,Breakdown[]>;entry_pages:{path:string;sessions:number}[];exit_pages:{path:string;sessions:number}[]};
const periods=[['today','今天'],['yesterday','昨天'],['7d','近 7 天'],['30d','近 30 天']];
const labels:Record<string,string>={direct:'直接访问 / 无来源',search:'搜索引擎',social:'社交平台',referral:'其他外部网站',unknown:'未知地区',mobile:'手机',tablet:'平板',desktop:'电脑',zh:'中文',en:'英文'};
const number=(n:number)=>n.toLocaleString('zh-CN');
function Country({code}:{code:string}){let label=labels[code]??code;try{if(code!=='unknown')label=new Intl.DisplayNames(['zh'],{type:'region'}).of(code)??code}catch{}return <>{label}</>}
function Table({title,rows,countries=false}:{title:string;rows:Breakdown[];countries?:boolean}){
 return <section className="workspace-card analytics-breakdown"><h2>{title}</h2>{rows.length?<div className="analytics-table-scroll"><table><thead><tr><th>项目</th><th>浏览量</th><th>访客数</th></tr></thead><tbody>{rows.map(row=><tr key={row.label}><td>{countries?<Country code={row.label}/>:labels[row.label]??row.label}</td><td>{number(row.views)}</td><td>{number(row.visitors)}</td></tr>)}</tbody></table></div>:<p>该时段暂无数据。</p>}</section>;
}
export function WorkspaceAnalytics({active}:{active:boolean}){
 const [period,setPeriod]=useState('7d'),[data,setData]=useState<TrafficReport|null>(null),[busy,setBusy]=useState(false),[error,setError]=useState('');const request=useRef(0),loaded=useRef(false);
 async function load(value:string){const seq=++request.current;setBusy(true);setError('');setData(null);try{const result=await loadTrafficAnalytics(value);if(seq!==request.current)return;if(result.data){setData(result.data);loaded.current=true}else setError(result.error??'读取失败，请重试。')}catch{if(seq===request.current)setError('读取失败，请重试。')}finally{if(seq===request.current)setBusy(false)}}
 // Load once on first opening. Range changes and refresh are explicit, with no polling.
 useEffect(()=>{if(active&&!loaded.current)void load('7d')},[active]);
 const totals=data?.totals;const cards=totals?[
  ['浏览量 PV',number(totals.views)],['去重访客 UV',number(totals.visitors)],['访问次数',number(totals.sessions)],
  ['每次访问页数',totals.sessions?(totals.views/totals.sessions).toFixed(2):'—'],['跳出率',totals.sessions?`${((1-totals.engaged_sessions/totals.sessions)*100).toFixed(1)}%`:'—'],
  ['平均前台停留',totals.sessions?`${Math.round(totals.engagement_seconds/totals.sessions)} 秒`:'—'],
 ]:[];
 const max=Math.max(1,...(data?.daily.map(d=>d.views)??[]));
 return <div className="workspace-analytics"><div className="editor-page-heading"><div><p className="editor-kicker">AUDIENCE / TRAFFIC</p><h1>访问统计</h1><p>全站公开页面；后台、接口、常见爬虫不计入。北京时间，访客同意后采集。</p></div><button type="button" disabled={busy} onClick={()=>void load(period)}>刷新数据</button></div>
  <div className="workspace-switch analytics-periods" role="group" aria-label="统计时段">{periods.map(([value,label])=><button key={value} type="button" disabled={busy} aria-pressed={period===value} onClick={()=>{setPeriod(value);void load(value)}}>{label}</button>)}</div>
  {busy&&<p role="status">正在读取统计…</p>}{error&&<p role="alert">{error}</p>}
  {data&&<><p className="analytics-updated">{data.first_day} 至 {data.last_day} · 更新于 {new Date(data.as_of).toLocaleString('zh-CN',{timeZone:'Asia/Shanghai',hour12:false})}</p>
   <div className="editor-stat-grid analytics-metrics">{cards.map(([label,value])=><div key={label}><span>{label}</span><strong>{value}</strong></div>)}</div>
   <p className="analytics-updated">近 5 分钟访问浏览器：{number(data.recent_visitors)}（并非实时在线人数）</p>
   <section className="workspace-card analytics-trend"><h2>每日趋势</h2><div className="analytics-table-scroll"><table><thead><tr><th>日期</th><th>浏览量 PV</th><th>去重访客 UV</th><th aria-label="浏览量趋势"/></tr></thead><tbody>{data.daily.map(day=><tr key={day.day}><td>{day.day}</td><td>{number(day.views)}</td><td>{number(day.visitors)}</td><td><span className="analytics-bar" style={{width:`${day.views/max*100}%`}}/></td></tr>)}</tbody></table></div></section>
   <section className="workspace-card analytics-hourly"><h2>小时分布</h2><p>所选时段按北京时间小时汇总。</p><div className="analytics-hour-grid">{data.hourly.map(hour=><div key={hour.hour}><span>{String(hour.hour).padStart(2,'0')}:00</span><strong>{number(hour.views)}</strong></div>)}</div></section>
   <div className="analytics-breakdowns">{[['pages','热门页面（前 20）'],['channels','流量渠道'],['referrers','流量来源域名（前 20）'],['countries','国家与地区'],['devices','设备类型'],['browsers','浏览器'],['systems','操作系统'],['languages','页面语言']].map(([key,title])=><Table key={key} title={title} rows={data.breakdowns[key]??[]} countries={key==='countries'}/>)}
    {[['入口页面',data.entry_pages],['离开页面',data.exit_pages]].map(([title,rows])=><section key={title as string} className="workspace-card analytics-breakdown"><h2>{title as string}（前 10）</h2>{(rows as TrafficReport['entry_pages']).length?<div className="analytics-table-scroll"><table><thead><tr><th>页面</th><th>访问次数</th></tr></thead><tbody>{(rows as TrafficReport['entry_pages']).map(row=><tr key={row.path}><td>{row.path}</td><td>{number(row.sessions)}</td></tr>)}</tbody></table></div>:<p>该时段暂无数据。</p>}</section>)}
   </div><section className="workspace-card analytics-notes"><h2>统计口径</h2><p>采集开始于 {new Date(data.started_at).toLocaleString('zh-CN',{timeZone:'Asia/Shanghai',hour12:false})}。历史未采集、拒绝统计或被拦截的访问不包含在内。</p><p>一次访问使用 30 分钟无页面浏览的超时规则。停留至少 10 秒或浏览至少 2 页视为有效访问；跳出率为未达到此条件的访问占比。入口、出口及停留统计限于所选时段内已收到的记录，浏览器关闭未回传可能低估。</p><p>UV 代表浏览器而非实名人数；不同设备、清除 Cookie 或更换浏览器会重复计数。来源只保留域名，不保存网址参数、搜索词、原始 IP 或完整 User-Agent；地区仅采用托管平台提供的国家码。明细保留滚动 30 天，超过期限在后续采集时清理；本站数据与 Google 的口径及拦截情况可能不同。</p></section>
  </>}
 </div>;
}
