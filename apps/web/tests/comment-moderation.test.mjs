import {test} from 'node:test';
import assert from 'node:assert/strict';
import {isCommentAllowed} from '../lib/comment-moderation.ts';

test('Chinese and English restricted comments, common obfuscation and contact spam are blocked', () => {
  for (const body of [
    '你是傻逼', '你是傻。逼', '腦殘', '殺了你', '去\u200b死', '这就是政治', '战争来了',
    '他们是劣等人种', '他就是骗子', '加微信：abc', '色情广告', '稳赚返利',
    'FUCK you', 'ＦＵＣＫ you', 'f.u.c.k you', 'f u c k you', 'f\u200buck you', 'fück you',
    'f4gg0t', 'n1gger', 'kill yourself', 'He is a scammer', 'Discuss the election', 'this war',
    'white supremacy', 'visit https://spam.example', 'buy at spam.xyz', 'me@example.com',
    'call +1 (415) 555-1234',
  ]) assert.equal(isCommentAllowed(body), false, body);
});

test('Technology discussion, critical opinions, identities and substring collisions remain allowed', () => {
  for (const body of [
    '这篇文章真的烂，论据不充分。', '我不喜欢这个产品，价格太贵。', '黑人和白人研究员一起发布了成果',
    '中国美国的芯片效率比较', '脑机接口研究很有意思', '机器人模拟和真机表现差别很大',
    'The class is based in Scunthorpe.', 'The race condition affects hardware.',
    'Black holes and white dwarfs', 'This article is misleading; please check the benchmark.',
    'The attack surface is smaller.', 'The Newsroom Index is 60.', '版本 2026，芯片 123456',
  ]) assert.equal(isCommentAllowed(body), true, body);
});
