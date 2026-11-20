'use client';

import type { MouseEvent, ReactNode } from 'react';

// Preserve the list entry in the current history record without adding a new
// history entry or putting internal navigation state into the story URL.
export default function BrowseStoryLink({ href, anchor, children }: { href: string; anchor: string; children: ReactNode }) {
  function remember(event: MouseEvent<HTMLAnchorElement>) {
    if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    const url = new URL(window.location.href);
    url.hash = anchor;
    window.history.replaceState(window.history.state, '', url);
  }
  return <a href={href} onClick={remember}>{children}</a>;
}
