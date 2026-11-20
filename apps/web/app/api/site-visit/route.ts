import {createHmac} from 'node:crypto';
import {createClient} from '@supabase/supabase-js';
import {NextResponse,type NextRequest} from 'next/server';
import {analyticsIdentity} from '../../../lib/analytics-reader';
import {analyticsPath,analyticsReferrer,analyticsDevice,analyticsBrowser,analyticsOS} from '../../../lib/traffic-analytics.mjs';
export const runtime='nodejs';
export const dynamic='force-dynamic';
export async function POST(request:NextRequest){
 let secure=false;try{const origin=new URL(request.headers.get('origin')??'');if(!['http:','https:'].includes(origin.protocol)||origin.host!==request.headers.get('host'))return new Response(null,{status:403});secure=origin.protocol==='https:'}catch{return new Response(null,{status:403})}
 if(request.cookies.get('ihs_cookie_consent')?.value!=='accepted')return new Response(null,{status:403});
 const agent=(request.headers.get('user-agent')??'').slice(0,512);if(/bot|spider|crawler|slurp|headless/i.test(agent))return new Response(null,{status:204});
 if(Number(request.headers.get('content-length')??0)>1024)return new Response(null,{status:413});
 let value:{id?:unknown;path?:unknown;referrer?:unknown;seconds?:unknown};try{const body=await request.text();if(body.length>1024)throw Error();value=JSON.parse(body)}catch{return new Response(null,{status:400})}
 if(!value||typeof value.id!=='string'||!/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value.id))return new Response(null,{status:400});
 const update=value.seconds!==undefined;
 if(update?typeof value.seconds!=='number'||!Number.isInteger(value.seconds)||value.seconds<0||value.seconds>1800:!analyticsPath(value.path))return new Response(null,{status:400});
 const url=process.env.SUPABASE_URL,key=process.env.SUPABASE_SERVICE_ROLE_KEY;if(!url||!key)return new Response(null,{status:503});
 const reader=analyticsIdentity(request.cookies.get('ihs_site_reader')?.value,key);
 if(update&&reader.isNew)return new Response(null,{status:204});
 const hash=(value:string)=>createHmac('sha256',key).update(value).digest('hex');
 const visitor=hash(`site-visitor:${reader.token}`),session=analyticsIdentity(request.cookies.get('ihs_visit')?.value,key,'visit');
 const country=request.headers.get('x-vercel-ip-country')??'';
 try{
  const db=createClient(url,key,{auth:{persistSession:false,autoRefreshToken:false}});
  const result=update?await db.rpc('record_site_engagement',{p_event:value.id,p_visitor:visitor,p_seconds:value.seconds}):await db.rpc('record_site_page_view',{
   p_event:value.id,p_visitor:visitor,p_session:hash(`site-session:${reader.token}:${session.token}`),p_path:analyticsPath(value.path),p_referrer:analyticsReferrer(value.referrer,request.headers.get('host')),
   p_device:analyticsDevice(agent),p_browser:analyticsBrowser(agent),p_os:analyticsOS(agent),p_country:/^[A-Z]{2}$/.test(country)?country:'unknown',
  });
  if(result.error)return new Response(null,{status:503});
  const response=new NextResponse(null,{status:204,headers:{'Cache-Control':'no-store'}});
  if(!update){if(reader.isNew)response.cookies.set('ihs_site_reader',reader.cookie,{httpOnly:true,secure,sameSite:'lax',path:'/',maxAge:30*86400});response.cookies.set('ihs_visit',session.cookie,{httpOnly:true,secure,sameSite:'lax',path:'/',maxAge:1800})}
  return response;
 }catch{return new Response(null,{status:503})}
}
