import {NextResponse,type NextRequest} from 'next/server';
export const runtime='nodejs';
export const dynamic='force-dynamic';
export async function POST(request:NextRequest){
 const origin=request.headers.get('origin');let secure=false;
 try{const parsed=new URL(origin??'');if(!['http:','https:'].includes(parsed.protocol)||parsed.host!==request.headers.get('host'))return new Response(null,{status:403});secure=parsed.protocol==='https:'}catch{return new Response(null,{status:403})}
 const length=Number(request.headers.get('content-length')??0);if(length>100)return new Response(null,{status:413});
 let decision:unknown;try{const text=await request.text();if(text.length>100)throw Error();decision=JSON.parse(text)?.decision}catch{return new Response(null,{status:400})}
 if(decision!=='accept'&&decision!=='reject')return new Response(null,{status:400});
 const response=new NextResponse(null,{status:204,headers:{'Cache-Control':'no-store'}});
 if(decision==='accept')response.cookies.set('ihs_cookie_consent','accepted',{httpOnly:false,secure,sameSite:'lax',path:'/',maxAge:180*86400});
 else {response.cookies.set('ihs_cookie_consent','',{secure,sameSite:'lax',path:'/',maxAge:0});response.cookies.set('ihs_reader','',{httpOnly:true,secure,sameSite:'lax',path:'/',maxAge:0});response.cookies.set('ihs_site_reader','',{httpOnly:true,secure,sameSite:'lax',path:'/',maxAge:0});response.cookies.set('ihs_visit','',{httpOnly:true,secure,sameSite:'lax',path:'/',maxAge:0});response.cookies.set('ihs_locale','',{secure,sameSite:'lax',path:'/',maxAge:0});}
 return response;
}
