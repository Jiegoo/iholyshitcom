export function localePath(locale: 'zh' | 'en', path: string): string {
  return `/${locale}${path === '/' ? '' : path}`;
}
