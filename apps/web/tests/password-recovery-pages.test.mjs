import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { createServer } from 'node:net';
import { once } from 'node:events';
const cwd = new URL('../', import.meta.url);
test('built recovery routes remain closed and callback cannot redirect externally', async () => {
  const allocator=createServer();allocator.listen(0,'127.0.0.1');await once(allocator,'listening');
  const port=allocator.address().port; await new Promise(resolve=>allocator.close(resolve));
  const env={...process.env, SUPABASE_URL:'', SUPABASE_PUBLISHABLE_KEY:'', NEWS_PASSWORD_RECOVERY_ENABLED:'false', NEWS_AUTH_ORIGIN:''};
  const server=spawn(process.execPath,['../../node_modules/next/dist/bin/next','start','--hostname','127.0.0.1','--port',String(port)],{cwd,env,stdio:'ignore'});
  const base=`http://127.0.0.1:${port}`;
  try {
    let ready=false;
    for(let n=0;n<100;n++){try{await fetch(base+'/editor/forgot-password');ready=true;break;}catch{await new Promise(r=>setTimeout(r,100));}}
    assert.ok(ready,'server started');
    for(const path of ['/editor/forgot-password','/editor/update-password']) {
      const response=await fetch(base+path);const html=await response.text();
      assert.equal(response.status,200);assert.match(response.headers.get('cache-control'),/no-store/);
      assert.match(html,/unavailable|暂不可用/);assert.doesNotMatch(html,/<input/);
    }
    const response=await fetch(base+'/editor/auth/callback?next=https://evil.example',{redirect:'manual'});
    assert.equal(response.status,303);assert.equal(response.headers.get('location'),'/editor/forgot-password?status=expired');
    assert.equal(response.headers.get('referrer-policy'),'no-referrer');
  } finally {server.kill('SIGTERM');await once(server,'exit');}
});
