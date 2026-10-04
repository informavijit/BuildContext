import { ParsedMarkdownFile, MarkdownSection } from './parse';

export function compactMarkdownFile(file: ParsedMarkdownFile): ParsedMarkdownFile {
  const compactedSections: MarkdownSection[] = [];

  for (const sec of file.sections) {
    const lines = sec.content.split(/\r?\n/);
    const tableRows: string[] = [];
    const bulletItems: string[] = [];
    const otherLines: string[] = [];

    let inTable = false;
    let tableHeader = '';

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed) continue;

      if (trimmed.startsWith('|')) {
        if (!inTable) {
          inTable = true;
          tableHeader = trimmed;
        } else if (trimmed.includes('---')) {
          // Skip divider row
        } else {
          tableRows.push(trimmed);
        }
      } else if (trimmed.startsWith('- ') || trimmed.startsWith('* ') || /^\d+\./.test(trimmed)) {
        inTable = false;
        bulletItems.push(trimmed);
      } else {
        inTable = false;
        otherLines.push(trimmed);
      }
    }

    // Deduplicate identical rows while preserving ALL unique evidence table rows and file pointers
    const uniqueTableRows = Array.from(new Set(tableRows));
    const uniqueBullets = Array.from(new Set(bulletItems));
    const uniqueOther = Array.from(new Set(otherLines));

    let newContent = '';
    if (uniqueTableRows.length > 0 && tableHeader) {
      const divider = '|---|---|---|---|---|'.substring(0, tableHeader.split('|').length * 4);
      newContent += `${tableHeader}\n${divider}\n${uniqueTableRows.join('\n')}\n\n`;
    }
    if (uniqueBullets.length > 0) {
      newContent += `${uniqueBullets.join('\n')}\n\n`;
    }
    if (uniqueOther.length > 0) {
      newContent += `${uniqueOther.join('\n')}`;
    }

    compactedSections.push({
      ...sec,
      content: newContent.trim() || sec.content
    });
  }

  return {
    ...file,
    sections: compactedSections
  };
}
