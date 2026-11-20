'use client';

import {useEffect, useState} from 'react';
import type {TopicScene} from '../lib/topic-illustrations';
import {nextIllustration, type IllustrationRotation} from '../lib/illustration-rotation';
import TopicIllustration from './topic-illustration';

const memory = new Map<string, IllustrationRotation>();

export default function RotatingTopicIllustration({scene, slug, locale, initialVariant}: {
  scene: TopicScene; slug: string; locale: 'zh' | 'en'; initialVariant: number;
}) {
  const [variant, setVariant] = useState(initialVariant);
  const key = `ihs-illustration-v1:${scene.channel}/${scene.topic}`;
  useEffect(() => {
    const frame = requestAnimationFrame(() => {
      let previous: unknown = memory.get(key);
      try {
        const stored = sessionStorage.getItem(key);
        if (stored) previous = JSON.parse(stored);
      } catch {
        // Storage may be disabled. Rotation can still work in this document.
      }
      const selected = nextIllustration(slug, previous);
      memory.set(key, selected);
      try {
        sessionStorage.setItem(key, JSON.stringify(selected));
      } catch {
        // Keep the illustration available even when browser storage is full.
      }
      setVariant(selected.variant);
    });
    return () => cancelAnimationFrame(frame);
  }, [key, slug]);
  return <TopicIllustration scene={scene} locale={locale} variant={variant}/>;
}
