'use client';
import { useState } from 'react';
import { editorialChannels } from '../lib/editorial-channels';
import { channelTopics } from '../lib/channel-topics';
import { localePath } from '../lib/locale-path';
import type { ChannelCount, Locale } from '../lib/public-stories';

export default function ChannelNav({ locale, counts = [], activeChannel }: { locale: Locale; counts?: ChannelCount[]; activeChannel?: string }) {
  const zh = locale === 'zh';
  const [open,setOpen]=useState<string|null>(null);const [pinned,setPinned]=useState(false);
  return <nav className="muse-nav" aria-label={zh ? '编辑频道' : 'Editorial channels'} onMouseLeave={()=>{if(!pinned)setOpen(null)}} onKeyDown={event=>{if(event.key==='Escape'){setOpen(null);setPinned(false)}}}>
    {editorialChannels.map(channel => {
      const count=counts.find(c=>c.channel===channel.slug)?.story_count;
      return <div className="channel-menu" key={channel.slug} onMouseEnter={()=>{if(window.matchMedia('(hover: hover)').matches && open!==channel.slug){setOpen(channel.slug);setPinned(false)}}}>
        <a className="channel-link" aria-current={activeChannel===channel.slug?'page':undefined} href={localePath(locale,`/category/${channel.slug}`)}><strong>{channel.label}{count!==undefined && <span> · {count}</span>}</strong>{zh && <> <small>{channel.zh}</small></>}</a>
        <button type="button" className="channel-toggle" aria-expanded={open===channel.slug} aria-controls={`topics-${channel.slug}`} aria-label={zh ? `${channel.label}子分类` : `${channel.label} topics`} onClick={()=>{if(open===channel.slug && pinned){setOpen(null);setPinned(false)}else{setOpen(channel.slug);setPinned(true)}}}>▾</button>
      </div>;
    })}
    {editorialChannels.map(channel=><div key={channel.slug} id={`topics-${channel.slug}`} className="channel-submenu" hidden={open!==channel.slug}>{channelTopics[channel.slug].map(topic=><a key={topic.slug} href={localePath(locale,`/category/${channel.slug}/${topic.slug}`)}>{topic[locale]}</a>)}</div>)}
  </nav>;
}
