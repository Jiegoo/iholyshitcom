import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import http from 'node:http';
import net from 'node:net';
import {spawn} from 'node:child_process';
import {once} from 'node:events';
import {fileURLToPath} from 'node:url';

test('robot endpoint authenticates, checks bilingual fields and publishes a valid submission', {timeout:60000},async()=>{
 const fakeToken='test_only_'+'x'.repeat(40),fakeId='00000000-0000-4000-8000-000000000010';let received;
 const mock=http.createServer((req,res)=>{let body='';req.on('data',chunk=>body+=chunk);req.on('end',()=>{const data=JSON.parse(body);res.setHeader('content-type','application/json');if(req.url==='/rest/v1/rpc/duty_editor_identify')return res.end(JSON.stringify(data.p_hash===createHash('sha256').update(fakeToken).digest('hex')?'muse':null));if(req.url==='/rest/v1/rpc/duty_editor_submission_status'){
 assert.equal(data.p_bot,'muse');
 assert.equal(data.p_secret_hash,createHash('sha256').update(fakeToken).digest('hex'));
 return res.end(JSON.stringify(data.p_request==='missing'||data.p_request==='other-bot-request'?null:{
 request_id:data.p_request,article_id:fakeId,revision_id:'fixture-revision',slug:'stored-slug',
 status:data.p_request==='retracted'?'retracted':'published',submitted_at:'2026-11-13T00:00:00Z'
 }));
}received=data;res.end(JSON.stringify({article_id:fakeId,slug:data.p_request==='legacy-replay'?'legacy-article':'example-article-20261115',status:'published',duplicate:data.p_request==='legacy-replay'}));});});
 mock.listen(0,'127.0.0.1');await once(mock,'listening');const socket=net.createServer();socket.listen(0,'127.0.0.1');await once(socket,'listening');const port=socket.address().port;await new Promise(r=>socket.close(r));
 const cwd=fileURLToPath(new URL('..',import.meta.url)),exe=fileURLToPath(new URL('../../../node_modules/next/dist/bin/next',import.meta.url));
 const child=spawn(process.execPath,[exe,'start','-p',String(port)],{cwd,stdio:'ignore',env:{...process.env,SUPABASE_URL:`http://127.0.0.1:${mock.address().port}`,SUPABASE_SERVICE_ROLE_KEY:'test_service_key',NEWS_DUTY_BOT_HASHES:JSON.stringify({muse:createHash('sha256').update(fakeToken).digest('hex')})}});
 const base=`http://127.0.0.1:${port}`;
 const body={request_id:'example-1',slug:'example-article',zh:{title:'标题',summary:'摘要',body:'正文一。\n\n正文二。'},en:{title:'Headline',summary:'Summary',body:'First.\n\nSecond.'},channel:'technology',topic:'chips',suggested_score:80,sources:[{name:'Example',title:'Original headline',url:'https://example.com/news',published_at:new Date(Date.now()-10000).toISOString()}]};
 try{
  let ready=false;for(let i=0;i<120;i++){if(child.exitCode!==null)throw Error('Next exited');try{await fetch(`${base}/api/articles`,{method:'POST'});ready=true;break}catch{await new Promise(r=>setTimeout(r,100))}}assert.equal(ready,true);
  const send=(data,token=fakeToken)=>fetch(`${base}/api/articles`,{method:'POST',headers:{authorization:`Bearer ${token}`,'content-type':'application/json'},body:JSON.stringify(data)});
  assert.equal((await send(body,'wrong')).status,401);
  assert.equal((await send({...body,topic:'drones'})).status,400);
  for(const score of [0,1,69,99,100]){assert.equal((await send({...body,suggested_score:score})).status,201);assert.equal(received.p_payload.suggested_score,score);}
  for(const score of [-1,101,69.5,'69',null])assert.equal((await send({...body,suggested_score:score})).status,400);
  assert.equal((await send({...body,sources:[{...body.sources[0],published_at:'2020-01-01T00:00:00Z'}]})).status,201);
  assert.equal((await send({...body,sources:[{name:'Example',title:'Original headline',url:'https://example.com/news'}]})).status,201);
  assert.equal((await send({...body,sources:[{...body.sources[0],published_at:'not-a-date'}]})).status,400);
  assert.equal((await send({...body,channel:'ai',topic:'ai-created'})).status,201);assert.equal(received.p_payload.topic,'ai-created');
  assert.equal((await send({...body,channel:'industry',topic:'ai-created'})).status,400);
  assert.equal((await send({...body,channel:'internet',topic:'internet-weirdness'})).status,201);
  assert.equal(received.p_payload.topic,'internet-weirdness');
  assert.equal((await send({...body,channel:'ai',topic:'internet-weirdness'})).status,400);
  assert.equal((await send({...body,channel:'internet',topic:'life-is-game'})).status,201);
  assert.equal(received.p_payload.topic,'life-is-game');
  assert.equal((await send({...body,channel:'ai',topic:'life-is-game'})).status,400);
  const result=await send(body);assert.equal(result.status,201);const receipt=await result.json();assert.equal(receipt.request_id,body.request_id);assert.equal(receipt.status,'published');assert.equal(receipt.slug,'example-article-20261115');assert.equal(receipt.public_paths.en,'/en/example-article-20261115');
  const replay=await send({...body,request_id:'legacy-replay'});assert.equal(replay.status,200);assert.equal((await replay.json()).public_paths.en,'/en/legacy-article');
  assert.equal(received.p_bot,'muse');assert.equal(received.p_payload.zh.document.content.length,2);assert.equal(received.p_payload.channel,'technology');
  const marked={...body,request_id:'marked-heading',zh:{...body.zh,body:'导语。\n## 关键进展\n具体事实。'},en:{...body.en,body:'Intro.\n<h2>Key development</h2>\nDetails.'}};
  assert.equal((await send(marked)).status,201);
  assert.equal(received.p_payload.zh.document.content[1].type,'heading');assert.equal(received.p_payload.en.document.content[1].attrs.level,2);
  const oldDocument=text=>({type:'doc',content:text.trim().split(/\n\s*\n/).map(p=>({type:'paragraph',content:[{type:'text',text:p.trim()}]}))});
  const oldPayload={slug:marked.slug,zh:{title:marked.zh.title,summary:marked.zh.summary,document:oldDocument(marked.zh.body)},en:{title:marked.en.title,summary:marked.en.summary,document:oldDocument(marked.en.body)},channel:marked.channel,topic:marked.topic,suggested_score:marked.suggested_score,sources:marked.sources,tags:[]};
  assert.equal(received.p_hash,createHash('sha256').update(JSON.stringify(oldPayload)).digest('hex'));
  assert.equal('publish' in received.p_payload,false);
  const status=(requestId,token=fakeToken)=>fetch(`${base}/api/articles?request_id=${encodeURIComponent(requestId)}`,{headers:{authorization:`Bearer ${token}`}});
  assert.equal((await status('example-1','wrong')).status,401);
  assert.equal((await status('')).status,400);
  assert.equal((await status('x'.repeat(129))).status,400);
  const found=await status('example-1');
  assert.equal(found.status,200);assert.equal(found.headers.get('cache-control'),'no-store');
  const recovered=await found.json();
  assert.equal(recovered.request_id,'example-1');assert.equal(recovered.article_id,fakeId);
  assert.equal(recovered.public_paths.en,'/en/stored-slug');
  assert.equal((await status('missing')).status,404);
  assert.equal((await status('other-bot-request')).status,404);
  const retracted=await (await status('retracted')).json();
  assert.equal(retracted.status,'retracted');assert.equal(retracted.public_paths,undefined);

 }finally{child.kill('SIGTERM');await new Promise(r=>mock.close(r));}
});
