import glossary from '../../../packages/contracts/glossary.v1.json';

export function glossaryLabel(id: string, locale: 'zh' | 'en'): string | null {
  return glossary.terms.find(term => term.id === id)?.[locale] ?? null;
}
