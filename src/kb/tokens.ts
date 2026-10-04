export function estimateTokenCount(text: string): number {
  if (!text) return 0;
  // Standard deterministic char/4 estimation
  return Math.ceil(text.length / 4);
}
