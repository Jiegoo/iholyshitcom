import {createHmac} from 'node:crypto';
import {isIP} from 'node:net';
import {createClient} from '@supabase/supabase-js';
import {NextResponse,type NextRequest} from 'next/server';
export const runtime='nodejs';
export const dynamic='force-dynamic';
export async function POST(request:NextRequest){
 try{const origin=new URL(request.headers.get('origin')??'');if(!['http:','https:'].includes(origin.protocol)||origin.host!==request.headers.get('host'))return new Response(null,{status:403})}catch{return new Response(null,{status:403})}
 if(Number(request.headers.get('content-length')??0)>512)return new Response(null,{status:413});
 let value:{type?:unknown;slug?:unknown;reaction?:unknown};try{const body=await request.text();if(body.length>512)throw Error();value=JSON.parse(body)}catch{return new Response(null,{status:400})}
 if(!value||(value.type!=='manual'&&value.type!=='story')||typeof value.slug!=='string'||value.slug.length>200||!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(value.slug))return new Response(null,{status:400});
 if(value.reaction!==undefined&&!['like','dislike','shit'].includes(value.reaction as string))return new Response(null,{status:400});
 const url=process.env.SUPABASE_URL,key=process.env.SUPABASE_SERVICE_ROLE_KEY;if(!url||!key)return new Response(null,{status:503});
 const rawIp=(request.headers.get('x-vercel-forwarded-for')??(process.env.NODE_ENV!=='production'?request.headers.get('x-forwarded-for'):null)??'').split(',')[0].trim();
 if(!isIP(rawIp))return new Response(null,{status:503});
 const agent=(request.headers.get('user-agent')??'').slice(0,512);
 const visitorHash=createHmac('sha256',key).update(JSON.stringify(['article-reaction-v1',rawIp,agent,value.type,value.slug])).digest('hex');
 try{const db=createClient(url,key,{auth:{persistSession:false,autoRefreshToken:false}});const {data,error}=await db.rpc('record_limited_article_reaction',{p_type:value.type,p_slug:value.slug,p_reaction:value.reaction??'like',p_visitor_hash:visitorHash});if(error)return new Response(null,{status:503});if(!data)return new Response(null,{status:404});if(data.limited)return NextResponse.json({error:'reaction_limit'},{status:429,headers:{'Cache-Control':'no-store'}});return NextResponse.json({score:data.score,remaining:data.remaining},{headers:{'Cache-Control':'no-store'}})}catch{return new Response(null,{status:503})}
}
