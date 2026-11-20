import { glossaryLabel } from './glossary';

export const categories = [
  { slug: 'robotics', label: '机器人' }, { slug: 'bci', label: '脑机接口' },
  { slug: 'energy', label: '能源' }, { slug: 'chips-ai', label: '芯片 / AI' },
  { slug: 'space', label: '太空' }, { slug: 'biotech', label: '生物科技' },
] as const;

export function categoryLabel(slug: string | null) {
  return categories.find(category => category.slug === slug)?.label ?? '分类未知';
}

export function bilingualCategoryLabel(slug: string | null, locale: 'zh' | 'en') {
  return slug ? glossaryLabel(`category.${slug}`,locale) ?? (locale==='zh'?'分类未知':'Unclassified') : (locale==='zh'?'分类未知':'Unclassified');
}
