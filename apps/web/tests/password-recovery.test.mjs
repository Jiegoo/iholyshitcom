import { test } from 'node:test';
import assert from 'node:assert/strict';
import { recoveryOrigin, validPassword, requestRecovery, exchangeRecovery, changeRecoveredPassword } from '../lib/password-recovery.mjs';
const env = { NEWS_PASSWORD_RECOVERY_ENABLED: 'true', NEWS_AUTH_ORIGIN: 'https://site.example', NODE_ENV: 'production' };
test('disabled by default and accepts only explicit safe origins', () => {
  assert.equal(recoveryOrigin({}), null);
  assert.equal(recoveryOrigin(env), 'https://site.example');
  for (const origin of ['http://site.example', 'https://user:secret@site.example', 'https://site.example/x', 'https://site.example?x=1', 'http://localhost:3000']) assert.equal(recoveryOrigin({...env, NEWS_AUTH_ORIGIN: origin}), null);
  assert.equal(recoveryOrigin({...env, NODE_ENV:'development', NEWS_AUTH_ORIGIN:'http://localhost:3000'}), 'http://localhost:3000');
});
test('password validation preserves whitespace and rejects mismatch / extremes', () => {
  assert.equal(validPassword(' fictional pass ', ' fictional pass '), true);
  assert.equal(validPassword(' fictional pass ', 'fictional pass'), false);
  assert.equal(validPassword('short', 'short'), false);
  assert.equal(validPassword('x'.repeat(129), 'x'.repeat(129)), false);
  assert.equal(validPassword(null, null), false);
});
test('request uses only fixed callback, returns generic status and hides provider errors', async () => {
  let calls = 0;
  const client = {auth:{resetPasswordForEmail: async (email, opts) => {calls++; assert.equal(email,'fixture@example.invalid'); assert.deepEqual(opts,{redirectTo:'https://site.example/editor/auth/callback'}); return {error:null};}}};
  assert.equal(await requestRecovery(client,'fixture@example.invalid','https://site.example'),'sent');
  assert.equal(await requestRecovery(client,'bad','https://site.example'),'invalid');
  assert.equal(calls,1);
  client.auth.resetPasswordForEmail = async () => {throw new Error('private provider detail');};
  assert.equal(await requestRecovery(client,'fixture@example.invalid','https://site.example'),'unavailable');
});
test('callback rejects missing, duplicate and errored codes; expiry and reuse fail closed', async () => {
  let used = false;
  const client = {auth:{exchangeCodeForSession:async () => {const error = used ? new Error('expired') : null; used=true;return {error};}}};
  for(const query of ['', '?code=', '?code=a&code=b', '?error=denied&code=a']) assert.equal(await exchangeRecovery(client,new URL('https://site.example'+query)), false);
  assert.equal(await exchangeRecovery(client,new URL('https://site.example?code=fictional&next=https://evil.example')),true);
  assert.equal(await exchangeRecovery(client,new URL('https://site.example?code=fictional')),false);
  client.auth.exchangeCodeForSession = async () => {throw new Error('missing verifier');};
  assert.equal(await exchangeRecovery(client,new URL('https://site.example?code=fictional')),false);
});
test('update verifies user before mutation and signs out after success', async () => {
  const seen=[];
  const client={auth:{getUser:async()=>{seen.push('verify');return {data:{user:{id:'fixture'}},error:null};},updateUser:async()=>{seen.push('update');return {error:null};},signOut:async(opts)=>{seen.push('logout');assert.equal(opts.scope,'global');return {error:null};}}};
  assert.equal(await changeRecoveredPassword(client,'fictional-only-pass','fictional-only-pass'),'saved');
  assert.deepEqual(seen,['verify','update','logout']);
  seen.length=0;
  client.auth.getUser=async()=>({data:{user:null},error:new Error('expired')});
  assert.equal(await changeRecoveredPassword(client,'fictional-only-pass','fictional-only-pass'),'expired');assert.deepEqual(seen,[]);
});
test('password rejection and post-success logout failure remain distinct', async () => {
  const client={auth:{getUser:async()=>({data:{user:{id:'fixture'}},error:null}),updateUser:async()=>({error:new Error('weak')}),signOut:async()=>({error:new Error('network')})}};
  assert.equal(await changeRecoveredPassword(client,'fictional-only-pass','fictional-only-pass'),'rejected');
  client.auth.updateUser=async()=>({error:null});
  assert.equal(await changeRecoveredPassword(client,'fictional-only-pass','fictional-only-pass'),'saved-signout-failed');
});
