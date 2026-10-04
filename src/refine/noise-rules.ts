export interface NoiseRemovalResult {
  cleanedText: string;
  removedItems: Array<{ rule: string; description: string }>;
}

export function removeNoise(text: string): NoiseRemovalResult {
  const removedItems: Array<{ rule: string; description: string }> = [];
  let cleaned = text;

  // 1. Remove badges & shields ![badge](...)
  if (/!\[[^\]]*\]\(https?:\/\/(?:img\.shields\.io|badge)[^)]+\)/gi.test(cleaned)) {
    cleaned = cleaned.replace(/!\[[^\]]*\]\(https?:\/\/(?:img\.shields\.io|badge)[^)]+\)/gi, '');
    removedItems.push({ rule: 'Badges & Shields', description: 'Removed status badges/shields images' });
  }

  // 2. Remove decorative HTML comments except buildcontext markers
  const commentRegex = /<!--(?![\s]*\/?buildcontext)[\s\S]*?-->/gi;
  if (commentRegex.test(cleaned)) {
    cleaned = cleaned.replace(commentRegex, '');
    removedItems.push({ rule: 'HTML Comments', description: 'Removed non-BuildContext HTML comments' });
  }

  // 3. Remove placeholder lines (TBD, N/A, TODO: fill)
  const lines = cleaned.split(/\r?\n/);
  const filteredLines: string[] = [];

  for (const line of lines) {
    const trimmed = line.trim();
    if (/^(TBD|N\/A|TODO:\s*fill|Coming soon)\.?$/i.test(trimmed)) {
      removedItems.push({ rule: 'Placeholder Section', description: `Removed placeholder line: "${trimmed}"` });
      continue;
    }
    // Remove "Last updated: <timestamp>"
    if (/^last\s+updated\s*:\s*\d{4}-\d{2}-\d{2}/i.test(trimmed)) {
      removedItems.push({ rule: 'Timestamp Noise', description: `Removed generated timestamp: "${trimmed}"` });
      continue;
    }
    filteredLines.push(line);
  }

  // 4. Collapse redundant blank lines
  cleaned = filteredLines.join('\n').replace(/\n{3,}/g, '\n\n');

  return { cleanedText: cleaned, removedItems };
}
