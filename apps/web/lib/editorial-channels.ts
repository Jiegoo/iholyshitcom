// Editorial channels are separate from the six technology-domain tags.
export const editorialChannels = [
  { slug: 'ai', label: 'AI', zh: '人工智能与应用', en: 'AI and applications' },
  { slug: 'robotics', label: 'Robotics', zh: '机器人与自动化', en: 'Robotics and automation' },
  { slug: 'industry', label: 'Industry', zh: '科技产业动态', en: 'Technology industry' },
  { slug: 'technology', label: 'Technology', zh: '科学与工程', en: 'Science and engineering' },
  { slug: 'internet', label: 'Internet', zh: '互联网与安全', en: 'Internet and security' },
  { slug: 'products', label: 'Products', zh: '产品与工具', en: "Products and tools" },
] as const;
export function isEditorialChannel(slug: string | null): boolean {
  return editorialChannels.some(channel => channel.slug === slug);
}
export function editorialChannelLabel(slug: string | null, locale: 'zh' | 'en'): string {
  return editorialChannels.find(channel => channel.slug === slug)?.label ?? (locale === 'zh' ? '未分类' : 'Unclassified');
}
