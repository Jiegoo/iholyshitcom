'use server';
import {headers} from 'next/headers';
import {createClient} from '../../lib/supabase';
import type {TrafficReport} from './workspace-analytics';
export async function loadTrafficAnalytics(period:string):Promise<{data?:TrafficReport;error?:string}>{
 if(!['today','yesterday','7d','30d'].includes(period))return {error:'请选择有效的统计时段。'};
 try{
  const h=await headers();const origin=new URL(h.get('origin')??'');const configured=process.env.NEWS_AUTH_ORIGIN;
  if(!['http:','https:'].includes(origin.protocol))return {error:'无法读取统计，请刷新页面后重试。'};
  if(configured?origin.origin!==new URL(configured).origin:origin.host!==(h.get('x-forwarded-host')??h.get('host')))return {error:'无法读取统计，请刷新页面后重试。'};
  const client=await createClient();const identity=await client.auth.getUser();if(identity.error||!identity.data.user)return {error:'请重新登录后查看统计。'};
  const result=await client.rpc('owner_traffic_analytics',{p_period:period});if(result.error||!result.data)return {error:'暂时无法读取访问统计，请稍后重试。'};
  return {data:result.data as TrafficReport};
 }catch{return {error:'暂时无法读取访问统计，请稍后重试。'}}
}
