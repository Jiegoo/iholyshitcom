import {publicArticleSlug} from '../../../lib/historical-article-slugs.mjs';
import { createHash } from 'node:crypto';
import { createClient } from '@supabase/supabase-js';
import { channelTopics } from '../../../lib/channel-topics';
import {articleDocument,legacyArticleDocument} from '../../../lib/article-document.mjs';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
const fail = (status:number, message:string) => Response.json({error:message},{status,headers:{'Cache-Control':'no-store'}});
const object = (x:unknown): x is Record<string,unknown> => !!x && typeof x==='object' && !Array.isArray(x);
const string = (x:unknown,max:number):x is string => typeof x==='string' && x.trim().length>0 && x.length<=max;
async function identify(header:string|null):Promise<{bot:string;hash:string}|null> {
 const match=/^Bearer ([A-Za-z0-9_-]{32,200})$/.exec(header??'');
 if(!match)return null;
 const url=process.env.SUPABASE_URL,key=process.env.SUPABASE_SERVICE_ROLE_KEY;
 if(!url||!key)throw new Error('service unavailable');
 const db=createClient(url,key,{auth:{persistSession:false,autoRefreshToken:false}});
 const hash=createHash('sha256').update(match[1]).digest('hex');
 const {data,error}=await db.rpc('duty_editor_identify',{p_hash:hash});
 if(error)throw new Error('service unavailable');
 return typeof data==='string'&&/^[a-z0-9][a-z0-9_-]{0,63}$/.test(data)?{bot:data,hash}:null;
}
async function limitedBody(request:Request):Promise<string> {
 if(!request.body)throw new Error('empty');
 const reader=request.body.getReader();const decoder=new TextDecoder('utf-8',{fatal:true});let size=0, body='';
 while(true){const {done,value}=await reader.read();if(done)break;size+=value.byteLength;if(size>300000){await reader.cancel();throw new Error('too large');}body+=decoder.decode(value,{stream:true});}
 return body+decoder.decode();
}
export async function GET(request: Request) {
 const requestId = new URL(request.url).searchParams.get('request_id');
 if (!requestId || !/^[A-Za-z0-9._-]{1,128}$/.test(requestId)) {
  return fail(400, 'A valid request_id is required');
 }
 let identity: {bot: string; hash: string} | null;
 try { identity = await identify(request.headers.get('authorization')); }
 catch { return fail(503, 'Submission service unavailable'); }
 if (!identity) return fail(401, 'Unauthorized');
 const url = process.env.SUPABASE_URL, key = process.env.SUPABASE_SERVICE_ROLE_KEY;
 if (!url || !key) return fail(503, 'Submission service not configured');
 try {
  const db = createClient(url, key, {auth: {persistSession: false, autoRefreshToken: false}});
  const {data, error} = await db.rpc('duty_editor_submission_status', {
   p_bot: identity.bot, p_secret_hash: identity.hash, p_request: requestId,
  });
  if (error) return fail(error.message === 'identity revoked' ? 401 : 503, 'Status lookup unavailable');
  if (data === null) return Response.json({
   code: 'SUBMISSION_NOT_FOUND', request_id: requestId,
   error: 'No committed submission found for this request ID',
  }, {status: 404, headers: {'Cache-Control': 'no-store'}});
  if (!object(data) || typeof data.article_id !== 'string' ||
      typeof data.slug !== 'string' || typeof data.status !== 'string') {
   return fail(503, 'Result unavailable');
  }
  return Response.json({
   ...data,
   ...(data.status === 'published' ? {public_paths: {
    en: `/en/${publicArticleSlug('manual', data.slug)}`, zh: `/zh/${publicArticleSlug('manual', data.slug)}`,
   }} : {}),
   editor_path: `/editor/manual?id=${data.article_id}`,
  }, {headers: {'Cache-Control': 'no-store'}});
 } catch {
  return fail(503, 'Submission service unavailable');
 }
}

export async function POST(request:Request) {
 let identity:{bot:string;hash:string}|null;try{identity=await identify(request.headers.get('authorization'));}catch{return fail(503,'Submission service unavailable');}if(!identity)return fail(401,'Unauthorized');
 if(!request.headers.get('content-type')?.toLowerCase().startsWith('application/json'))return fail(415,'JSON required');
 let value:unknown;
 try{value=JSON.parse(await limitedBody(request));}catch{return fail(400,'Invalid or oversized JSON');}
 if(!object(value)||!string(value.request_id,128)||!/^[A-Za-z0-9._-]+$/.test(value.request_id)||!string(value.slug,160)||!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(value.slug)
 ||!object(value.zh)||!object(value.en)||!string(value.zh.title,240)||!string(value.en.title,240)||!string(value.zh.summary,1000)||!string(value.en.summary,1000)
 ||!string(value.zh.body,100000)||!string(value.en.body,100000)||!string(value.channel,60)||!string(value.topic,60)
 ||!channelTopics[value.channel]?.some(t=>t.slug===value.topic)||typeof value.suggested_score!=='number'||!Number.isInteger(value.suggested_score)||value.suggested_score<0||value.suggested_score>100||!Array.isArray(value.sources)||value.sources.length<1||value.sources.length>30
 ||(value.tags!==undefined&&(!Array.isArray(value.tags)||value.tags.length>20||value.tags.some((tag:unknown)=>!string(tag,50)))))return fail(400,'Invalid article fields');
 const sources=[];
 for(const source of value.sources){
  if(!object(source)||!string(source.name,300)||!string(source.title,500)||!string(source.url,2048)||(source.published_at!==undefined&&source.published_at!==null&&!string(source.published_at,40)))return fail(400,'Invalid source');
  try{const url=new URL(source.url);if(url.protocol!=='https:'||url.username||url.password)throw new Error();if(typeof source.published_at==='string'&&(!Number.isFinite(Date.parse(source.published_at))||!/^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d(?:\.\d+)?(?:Z|[+-]\d\d:\d\d)$/.test(source.published_at)))throw new Error();}catch{return fail(400,'Source requires an HTTPS link and, if supplied, a valid timestamp');}
  sources.push({name:source.name,title:source.title,url:source.url,published_at:source.published_at});
 }
 const payload={slug:value.slug,zh:{title:value.zh.title,summary:value.zh.summary,document:legacyArticleDocument(value.zh.body)},en:{title:value.en.title,summary:value.en.summary,document:legacyArticleDocument(value.en.body)},channel:value.channel,topic:value.topic,suggested_score:value.suggested_score,sources,tags:value.tags??[]};
 const hash=createHash('sha256').update(JSON.stringify(payload)).digest('hex');
 payload.zh.document=articleDocument(value.zh.body);payload.en.document=articleDocument(value.en.body);
 const url=process.env.SUPABASE_URL,key=process.env.SUPABASE_SERVICE_ROLE_KEY;
 if(!url||!key)return fail(503,'Submission service not configured');
 try{
  const db=createClient(url,key,{auth:{persistSession:false,autoRefreshToken:false}});
  const {data,error}=await db.rpc('duty_editor_submit',{p_bot:identity.bot,p_secret_hash:identity.hash,p_request:value.request_id,p_hash:hash,p_payload:payload});
  if(error){if(error.message==='idempotency conflict')return fail(409,'Request ID already used for different content');return fail(422,'Article could not be submitted');}
  if(!object(data)||typeof data.article_id!=='string')return fail(503,'Result unavailable');
  const slug=typeof data.slug==='string'?data.slug:value.slug;
  return Response.json({...data,slug,request_id:value.request_id,...(data.status==='published'?{public_paths:{en:`/en/${publicArticleSlug('manual', slug)}`,zh:`/zh/${publicArticleSlug('manual', slug)}`}}:{}),editor_path:`/editor/manual?id=${data.article_id}`},{status:data.duplicate===true?200:201,headers:{'Cache-Control':'no-store'}});
 }catch{return fail(503,'Submission service unavailable');}
}
