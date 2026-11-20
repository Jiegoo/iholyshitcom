// Only canonical public paths; never retain query strings, search terms or editor URLs.
export function analyticsPath(value) {
 if(typeof value!=='string'||value.length>300||!/^\/(zh|en)(?:\/(?:about|privacy|terms|methodology|corrections|search|manual\/[a-z0-9-]+|story\/[a-z0-9-]+|(?!editor$|member$|api$)[a-z0-9-]+|category\/[a-z0-9-]+(?:\/[a-z0-9-]+)?))?\/?$/.test(value))return null;
 return value.replace(/\/$/,'');
}
export function analyticsReferrer(value,host) {
 try {const url=new URL(value);return ['http:','https:'].includes(url.protocol)&&url.host!==host?url.hostname.toLowerCase().slice(0,253):''}catch{return ''}
}
export function analyticsDevice(agent='') {
 return /ipad|tablet|android(?!.*mobile)/i.test(agent)?'tablet':/mobile|iphone|ipod/i.test(agent)?'mobile':'desktop';
}
export function analyticsBrowser(agent='') {
 if(/edg[eaios]*\//i.test(agent))return 'Edge';if(/opr\/|opera/i.test(agent))return 'Opera';if(/firefox|fxios/i.test(agent))return 'Firefox';if(/chrome|crios/i.test(agent))return 'Chrome';return /safari/i.test(agent)?'Safari':'Other';
}
export function analyticsOS(agent='') {
 if(/iphone|ipad|ipod/i.test(agent))return 'iOS';if(/android/i.test(agent))return 'Android';if(/windows/i.test(agent))return 'Windows';if(/macintosh|mac os/i.test(agent))return 'macOS';return /linux/i.test(agent)?'Linux':'Other';
}
