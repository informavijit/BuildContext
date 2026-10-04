export function preserveManualBlocks(existingContent: string, newAutoContent: string): string {
  if (!existingContent || !existingContent.trim()) {
    return newAutoContent;
  }

  // Extract keep blocks inside old auto section if any
  const keepBlocks: string[] = [];
  const keepRegex = /<!--\s*buildcontext:keep\s*-->([\s\S]*?)<!--\s*\/buildcontext:keep\s*-->/gi;
  let keepMatch: RegExpExecArray | null;
  while ((keepMatch = keepRegex.exec(existingContent)) !== null) {
    keepBlocks.push(keepMatch[0]);
  }

  // Extract manual section after auto block if present
  let manualSection = '';
  const manualIdx = existingContent.indexOf('<!-- buildcontext:manual -->');
  if (manualIdx !== -1) {
    manualSection = existingContent.substring(manualIdx);
  }

  let result = newAutoContent;

  if (keepBlocks.length > 0) {
    const endAutoIdx = result.indexOf('<!-- buildcontext:auto:end -->');
    if (endAutoIdx !== -1) {
      const beforeEnd = result.substring(0, endAutoIdx);
      const afterEnd = result.substring(endAutoIdx);
      result = `${beforeEnd}\n\n${keepBlocks.join('\n\n')}\n${afterEnd}`;
    }
  }

  if (manualSection) {
    result = `${result.trim()}\n\n${manualSection.trim()}\n`;
  }

  return result;
}
