import {searchOrigin} from '../../lib/search-config.mjs';
import {sitemapIndexXml} from '../../lib/sitemap-xml.mjs';
export const dynamic='force-dynamic';
export async function GET(){const origin=searchOrigin();if(!origin)return new Response('Not found',{status:404,headers:{'Cache-Control':'private, no-store','X-Robots-Tag':'noindex'}});return new Response(sitemapIndexXml(origin),{headers:{'Content-Type':'application/xml; charset=utf-8','Cache-Control':'private, no-store'}})}
