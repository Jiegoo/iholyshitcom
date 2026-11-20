import { createClient, isConfigured } from '../../../../lib/supabase';

export const dynamic='force-dynamic';
const uuid=/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const types=new Set(['image/jpeg','image/png','image/webp','image/gif']);
export async function GET(request:Request,{params}:{params:Promise<{id:string}>}){
 const {id}=await params;if(!uuid.test(id)||!isConfigured())return new Response(null,{status:404});
 const client=await createClient();const user=await client.auth.getUser();
 if(!user.error&&user.data.user){
  const asset=await client.rpc('manual_get_media',{p_id:id});
  if(!asset.error&&asset.data&&types.has(asset.data.mime)&&typeof asset.data.path==='string'){
   const result=await client.storage.from('manual-media').download(asset.data.path);
   if(!result.error&&result.data&&result.data.size<=52428800)return new Response(result.data,{headers:{'Content-Type':asset.data.mime,'X-Content-Type-Options':'nosniff','Cache-Control':'private, no-store','Content-Security-Policy':"default-src 'none'; sandbox"}});
  }
 }
 if(process.env.NEWS_MANUAL_PUBLIC_READ==='false')return new Response(null,{status:404});
 const asset=await client.rpc('get_public_manual_media',{p_id:id});
 if(asset.error||!asset.data||!types.has(asset.data.mime)||typeof asset.data.path!=='string'||!/^([0-9a-f-]{36})\/([0-9a-f-]{36})$/.test(asset.data.path))return new Response(null,{status:404});
 const key=process.env.SUPABASE_PUBLISHABLE_KEY!;const range=request.headers.get('range');
 if(range&&!/^bytes=\d*-\d*$/.test(range))return new Response(null,{status:416});
 const headers:Record<string,string>={apikey:key,Authorization:`Bearer ${key}`};if(range)headers.Range=range;
 const base=process.env.SUPABASE_URL!;const target=new URL(`/storage/v1/object/authenticated/manual-media/${asset.data.path}`,base);
 let upstream:Response;try{upstream=await fetch(target,{headers,cache:'no-store',signal:AbortSignal.timeout(20000),redirect:'error'});}catch{return new Response(null,{status:502});}
 if(!upstream.ok||!upstream.body)return new Response(null,{status:upstream.status===416?416:404});
 const responseHeaders=new Headers({'Content-Type':asset.data.mime,'X-Content-Type-Options':'nosniff','Cache-Control':'private, no-store','Content-Security-Policy':"default-src 'none'; sandbox"});
 for(const name of ['content-length','content-range','accept-ranges']){const value=upstream.headers.get(name);if(value)responseHeaders.set(name,value);}
 return new Response(upstream.body,{status:upstream.status,headers:responseHeaders});
}
