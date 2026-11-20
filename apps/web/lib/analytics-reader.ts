import {createHmac,randomBytes,timingSafeEqual} from 'node:crypto';
export function analyticsIdentity(value:string|undefined,key:string,kind:'reader'|'visit'='reader'){
 const sign=(token:string)=>createHmac('sha256',key).update(`${kind}-cookie:${token}`).digest('hex');
 const parts=value?.split('.');let token='';
 if(parts?.length===2&&/^[0-9a-f]{32}$/.test(parts[0])&&/^[0-9a-f]{64}$/.test(parts[1])&&timingSafeEqual(Buffer.from(sign(parts[0]),'hex'),Buffer.from(parts[1],'hex')))token=parts[0];
 const isNew=!token;if(isNew)token=randomBytes(16).toString('hex');
 return {token,isNew,cookie:`${token}.${sign(token)}`};
}
