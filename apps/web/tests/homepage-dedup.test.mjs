import { test } from 'node:test';
import assert from 'node:assert/strict';
import { articleKey, excludeFeatured, displayedFeaturedKeys } from '../lib/homepage-dedup.mjs';

test('latest and refreshed popular results exclude featured articles without confusing content types', () => {
 const hero={slug:'hero',content_type:'manual'},pick={slug:'pick',content_type:'manual'};
 const other={slug:'other',content_type:'manual'},sameSlugStory={slug:'pick',content_type:'story'};
 const featured=[hero,pick].map(articleKey);
 assert.deepEqual(excludeFeatured([hero,other,pick,sameSlugStory],featured),[other,sameSlugStory]);
 assert.deepEqual(excludeFeatured([pick,hero,other],featured),[other]);
 assert.deepEqual(excludeFeatured([hero,pick],featured),[]);
});


test('only currently visible picks are excluded when switching sort modes', () => {
 const hero={slug:'hero',content_type:'manual'}, hot={slug:'hot',content_type:'manual'}, recent={slug:'recent',content_type:'manual'};
 const candidates=[hero,hot,recent];
 assert.deepEqual(excludeFeatured(candidates,displayedFeaturedKeys(hero,[hot],[recent],'heat')),[recent]);
 assert.deepEqual(excludeFeatured(candidates,displayedFeaturedKeys(hero,[hot],[recent],'recent')),[hot]);
});
