import {NextResponse,type NextRequest} from 'next/server';
import {getLatestDiscoveries} from '../../../lib/public-stories';
export const dynamic='force-dynamic';
export async function GET(request:NextRequest){
 const locale=request.nextUrl.searchParams.get('lang');if(locale!=='zh'&&locale!=='en')return new Response(null,{status:400,headers:{'Cache-Control':'no-store'}});
 try{const items=await getLatestDiscoveries(locale,process.env.NEWS_BILINGUAL_PUBLIC_READ==='true','score');return NextResponse.json({items},{headers:{'Cache-Control':'no-store','X-Robots-Tag':'noindex'}})}catch{return new Response(null,{status:503,headers:{'Cache-Control':'no-store','X-Robots-Tag':'noindex'}})}
}
