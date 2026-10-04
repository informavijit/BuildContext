export interface MarkdownSection {
  heading: string;
  level: number;
  content: string;
  entities: string[];
}

export interface ParsedMarkdownFile {
  filePath: string;
  frontMatter: string;
  sections: MarkdownSection[];
  manualSection: string;
}

export function parseMarkdownFile(filePath: string, content: string): ParsedMarkdownFile {
  let frontMatter = '';
  let rest = content;

  if (content.startsWith('---')) {
    const endFm = content.indexOf('---', 3);
    if (endFm !== -1) {
      frontMatter = content.substring(0, endFm + 3);
      rest = content.substring(endFm + 3);
    }
  }

  let manualSection = '';
  const manualIdx = rest.indexOf('<!-- buildcontext:manual -->');
  if (manualIdx !== -1) {
    manualSection = rest.substring(manualIdx);
    rest = rest.substring(0, manualIdx);
  }

  const lines = rest.split(/\r?\n/);
  const sections: MarkdownSection[] = [];

  let currentHeading = 'Overview';
  let currentLevel = 1;
  let currentLines: string[] = [];

  for (const line of lines) {
    const headingMatch = line.match(/^(#{1,6})\s+(.*)/);
    if (headingMatch) {
      if (currentLines.length > 0) {
        sections.push({
          heading: currentHeading,
          level: currentLevel,
          content: currentLines.join('\n').trim(),
          entities: extractEntitiesFromText(currentLines.join('\n'))
        });
      }
      currentLevel = headingMatch[1].length;
      currentHeading = headingMatch[2].trim();
      currentLines = [];
    } else {
      currentLines.push(line);
    }
  }

  if (currentLines.length > 0) {
    sections.push({
      heading: currentHeading,
      level: currentLevel,
      content: currentLines.join('\n').trim(),
      entities: extractEntitiesFromText(currentLines.join('\n'))
    });
  }

  return { filePath, frontMatter, sections, manualSection };
}

function extractEntitiesFromText(text: string): string[] {
  const entities: string[] = [];
  // Extract path links
  const pathMatches = text.match(/\[`([^`]+)`\]\(file:\/\/\/[^)]+\)/g);
  if (pathMatches) {
    for (const p of pathMatches) {
      const m = p.match(/\[`([^`]+)`\]/);
      if (m) entities.push(m[1]);
    }
  }
  // Extract backticked symbols
  const symbolMatches = text.match(/`([^`]+)`/g);
  if (symbolMatches) {
    for (const s of symbolMatches) {
      entities.push(s.replace(/`/g, ''));
    }
  }
  return Array.from(new Set(entities));
}
