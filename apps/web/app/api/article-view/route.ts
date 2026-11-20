import {createHmac,randomBytes,timingSafeEqual} from 'node:crypto';
import {createClient} from '@supabase/supabase-js';
import {NextResponse,type NextRequest} from 'next/server';
export const runtime='nodejs';
export const dynamic='force-dynamic';
const cookieName='ihs_reader';
export async function POST(request:NextRequest){
 const origin=request.headers.get('origin');try{const parsed=new URL(origin??'');if(!['http:','https:'].includes(parsed.protocol)||parsed.host!==request.headers.get('host'))return new Response(null,{status:403})}catch{return new Response(null,{status:403})}
 if(request.cookies.get('ihs_cookie_consent')?.value!=='accepted')return new Response(null,{status:403});
 if(/bot|spider|crawler|slurp|headless/i.test(request.headers.get('user-agent')??''))return new Response(null,{status:204});
 const length=Number(request.headers.get('content-length')??0);if(length>512)return new Response(null,{status:413});
 let value:{type?:unknown;slug?:unknown};try{const body=await request.text();if(body.length>512)throw Error();value=JSON.parse(body)}catch{return new Response(null,{status:400})}
 if(!value||(value.type!=='manual'&&value.type!=='story')||typeof value.slug!=='string'||value.slug.length>200||!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(value.slug))return new Response(null,{status:400});
 const url=process.env.SUPABASE_URL,key=process.env.SUPABASE_SERVICE_ROLE_KEY;if(!url||!key)return new Response(null,{status:503});
 const sign=(data:string)=>createHmac('sha256',key).update('reader-cookie:'+data).digest('hex');
 const existing=request.cookies.get(cookieName)?.value?.split('.');let token='';
 if(existing?.length===2&&/^[0-9a-f]{32}$/.test(existing[0])&&/^[0-9a-f]{64}$/.test(existing[1])){const expected=Buffer.from(sign(existing[0]),'hex'),received=Buffer.from(existing[1],'hex');if(timingSafeEqual(expected,received))token=existing[0]}
 const isNew=!token;if(isNew)token=randomBytes(16).toString('hex');
 const day=new Date().toISOString().slice(0,10);const hash=createHmac('sha256',key).update(`article-view:${day}:${token}`).digest('hex');
 const client=createClient(url,key,{auth:{persistSession:false,autoRefreshToken:false}});
 try{const result=await client.rpc('record_homepage_view',{p_type:value.type,p_slug:value.slug,p_browser_hash:hash});if(result.error)return new Response(null,{status:503});const response=new NextResponse(null,{status:204,headers:{'Cache-Control':'no-store'}});if(isNew&&result.data===true)response.cookies.set(cookieName,`${token}.${sign(token)}`,{httpOnly:true,secure:origin?.startsWith('https://')===true,sameSite:'lax',path:'/',maxAge:30*86400});return response}catch{return new Response(null,{status:503})}
}
