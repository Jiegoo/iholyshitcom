'use client';

export default function EditorError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return <main lang="zh"><h1>编辑服务暂时不可用</h1><p>无法加载此页面，请稍后重试。尚未确认的操作请先核对记录，避免重复提交。</p><button onClick={reset}>重试</button></main>;
}
