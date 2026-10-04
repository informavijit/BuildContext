import { normalizeText } from './normalize';

export function jaccardSimilarity(textA: string, textB: string): number {
  const normA = normalizeText(textA);
  const normB = normalizeText(textB);

  if (!normA && !normB) return 1.0;
  if (!normA || !normB) return 0.0;

  const setA = new Set(normA.split(' '));
  const setB = new Set(normB.split(' '));

  let intersection = 0;
  for (const word of setA) {
    if (setB.has(word)) intersection++;
  }

  const union = new Set([...setA, ...setB]).size;
  return union === 0 ? 0 : intersection / union;
}
