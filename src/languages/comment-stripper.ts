export interface LineMapEntry {
  originalLine: number;
  content: string;
}

export function stripCommentsAndStrings(
  code: string,
  languageId: string
): { strippedCode: string; lineMap: number[] } {
  const lines = code.split(/\r?\n/);
  const lineMap: number[] = lines.map((_, idx) => idx + 1);
  let inBlockComment = false;
  let blockCommentEndMarker = '*/';

  const strippedLines: string[] = [];

  for (let i = 0; i < lines.length; i++) {
    let line = lines[i];

    if (inBlockComment) {
      const endIdx = line.indexOf(blockCommentEndMarker);
      if (endIdx !== -1) {
        inBlockComment = false;
        line = line.substring(endIdx + blockCommentEndMarker.length);
      } else {
        strippedLines.push('');
        continue;
      }
    }

    // Pascal / Delphi comments: { ... } or (* ... *)
    if (languageId === 'delphi' || languageId === 'pascal') {
      line = line.replace(/\{[\s\S]*?\}/g, '');
      line = line.replace(/\(\*[\s\S]*?\*\)/g, '');
      line = line.replace(/\/\/.*$/g, '');
    }
    // C-like comments: // and /* */
    else if (['java', 'csharp', 'cpp', 'c', 'javascript', 'typescript', 'dart', 'go', 'rust', 'kotlin', 'swift', 'php'].includes(languageId)) {
      if (line.includes('/*')) {
        const startIdx = line.indexOf('/*');
        const endIdx = line.indexOf('*/', startIdx + 2);
        if (endIdx !== -1) {
          line = line.substring(0, startIdx) + line.substring(endIdx + 2);
        } else {
          inBlockComment = true;
          blockCommentEndMarker = '*/';
          line = line.substring(0, startIdx);
        }
      }
      line = line.replace(/\/\/.*$/, '');
    }
    // Python comments: # and docstrings
    else if (languageId === 'python') {
      line = line.replace(/#.*$/, '');
    }
    // PowerShell comments: # and <# #>
    else if (languageId === 'powershell') {
      if (line.includes('<#')) {
        const startIdx = line.indexOf('<#');
        const endIdx = line.indexOf('#>', startIdx + 2);
        if (endIdx !== -1) {
          line = line.substring(0, startIdx) + line.substring(endIdx + 2);
        } else {
          inBlockComment = true;
          blockCommentEndMarker = '#>';
          line = line.substring(0, startIdx);
        }
      }
      line = line.replace(/#.*$/, '');
    }
    // Perl comments: # and POD
    else if (languageId === 'perl') {
      if (line.startsWith('=pod') || line.startsWith('=head')) {
        inBlockComment = true;
        blockCommentEndMarker = '=cut';
        strippedLines.push('');
        continue;
      }
      line = line.replace(/#.*$/, '');
    }
    // Shell comments: #
    else if (['shell', 'bash', 'zsh'].includes(languageId)) {
      line = line.replace(/#.*$/, '');
    }
    // SQL comments: -- and /* */
    else if (languageId === 'sql') {
      line = line.replace(/--.*$/, '');
    }

    // Strip basic string literals while preserving quotes
    line = line.replace(/"(?:[^"\\]|\\.)*"/g, '""');
    line = line.replace(/'(?:[^'\\]|\\.)*'/g, "''");

    strippedLines.push(line);
  }

  return {
    strippedCode: strippedLines.join('\n'),
    lineMap
  };
}
