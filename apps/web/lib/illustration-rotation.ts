export const illustrationCount = 6;
export type IllustrationRotation = {article: string; variant: number; remaining: number[]};

function validRotation(value: unknown): value is IllustrationRotation {
  if (!value || typeof value !== 'object') return false;
  const state = value as Partial<IllustrationRotation>;
  return typeof state.article === 'string' &&
    Number.isInteger(state.variant) && state.variant! >= 0 && state.variant! < illustrationCount &&
    Array.isArray(state.remaining) && state.remaining.length < illustrationCount &&
    new Set(state.remaining).size === state.remaining.length &&
    state.remaining.every(index => Number.isInteger(index) && index >= 0 &&
      index < illustrationCount && index !== state.variant);
}

// A shuffled bag uses all six designs before starting another round.
export function nextIllustration(
  article: string, previous: unknown, random: () => number = Math.random,
): IllustrationRotation {
  const state = validRotation(previous) ? previous : null;
  if (state?.article === article) return state;
  const remaining = state ? [...state.remaining] : [];
  if (!remaining.length) {
    remaining.push(...Array.from({length: illustrationCount}, (_, index) => index));
    for (let index = remaining.length - 1; index > 0; index--) {
      const selected = Math.floor(random() * (index + 1));
      [remaining[index], remaining[selected]] = [remaining[selected], remaining[index]];
    }
    if (remaining[0] === state?.variant) {
      [remaining[0], remaining[1]] = [remaining[1], remaining[0]];
    }
  }
  return {article, variant: remaining[0], remaining: remaining.slice(1)};
}
