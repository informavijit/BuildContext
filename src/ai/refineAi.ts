import { AiProvider } from './provider';
import { ParsedMarkdownFile } from '../refine/parse';

export async function refineMarkdownWithAi(
  provider: AiProvider,
  file: ParsedMarkdownFile
): Promise<ParsedMarkdownFile> {
  const prompt = `You are an expert technical editor. Refine and compress the following Markdown document.
Rules:
1. Deduplicate redundant headings, bullet points, and table rows.
2. Convert verbose prose into concise Markdown tables and terse bullet points.
3. Keep ALL file paths, endpoints, environment key names, commands, and code symbols intact.
4. Do NOT invent facts. Do NOT add decorative emojis or marketing prose.

Input Document:
${file.sections.map((s) => `## ${s.heading}\n${s.content}`).join('\n\n')}

Return raw refined Markdown only.`;

  try {
    const response = await provider.complete([
      { role: 'system', content: 'You are a deterministic technical editor.' },
      { role: 'user', content: prompt }
    ]);

    if (response && response.trim()) {
      // Split response by headings
      const lines = response.split(/\r?\n/);
      const newSections = [];
      let currentHeading = 'Overview';
      let currentLevel = 2;
      let currentLines: string[] = [];

      for (const line of lines) {
        const match = line.match(/^(#{1,6})\s+(.*)/);
        if (match) {
          if (currentLines.length > 0) {
            newSections.push({
              heading: currentHeading,
              level: currentLevel,
              content: currentLines.join('\n').trim(),
              entities: []
            });
          }
          currentLevel = match[1].length;
          currentHeading = match[2].trim();
          currentLines = [];
        } else {
          currentLines.push(line);
        }
      }

      if (currentLines.length > 0) {
        newSections.push({
          heading: currentHeading,
          level: currentLevel,
          content: currentLines.join('\n').trim(),
          entities: []
        });
      }

      if (newSections.length > 0) {
        return {
          ...file,
          sections: newSections
        };
      }
    }
  } catch (err) {
    console.warn('AI refinement failed, using rule-based refined file:', err);
  }

  return file;
}
