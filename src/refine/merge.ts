import { ParsedMarkdownFile, MarkdownSection } from './parse';
import { jaccardSimilarity } from './simhash';

export interface RefinedClusterResult {
  mergedFile: ParsedMarkdownFile;
  conflicts: string[];
}

export function mergeMarkdownCluster(
  targetPath: string,
  files: ParsedMarkdownFile[],
  duplicateThreshold = 0.85
): RefinedClusterResult {
  const conflicts: string[] = [];
  const mergedSectionsMap = new Map<string, MarkdownSection>();

  for (const file of files) {
    for (const sec of file.sections) {
      const existing = mergedSectionsMap.get(sec.heading);
      if (!existing) {
        mergedSectionsMap.set(sec.heading, { ...sec });
      } else {
        const sim = jaccardSimilarity(existing.content, sec.content);
        if (sim >= duplicateThreshold) {
          // Keep richest section (longer or more entities)
          if (sec.content.length > existing.content.length) {
            mergedSectionsMap.set(sec.heading, { ...sec });
          }
        } else {
          // Check if sections can be merged by unioning lines (tables/lists)
          const mergedContent = mergeSectionText(existing.content, sec.content);
          if (mergedContent) {
            mergedSectionsMap.set(sec.heading, {
              heading: sec.heading,
              level: sec.level,
              content: mergedContent,
              entities: Array.from(new Set([...existing.entities, ...sec.entities]))
            });
          } else {
            // Keep side-by-side with CONFLICT note
            conflicts.push(`Conflict in heading "${sec.heading}" across cluster files`);
            mergedSectionsMap.set(sec.heading, {
              heading: sec.heading,
              level: sec.level,
              content: `${existing.content}\n\n> **CONFLICT (Side-by-side view):**\n${sec.content}`,
              entities: Array.from(new Set([...existing.entities, ...sec.entities]))
            });
          }
        }
      }
    }
  }

  const mergedFile: ParsedMarkdownFile = {
    filePath: targetPath,
    frontMatter: files[0]?.frontMatter || '',
    sections: Array.from(mergedSectionsMap.values()),
    manualSection: files[0]?.manualSection || ''
  };

  return { mergedFile, conflicts };
}

function mergeSectionText(textA: string, textB: string): string | null {
  const linesA = textA.split(/\r?\n/);
  const linesB = textB.split(/\r?\n/);

  // Deduplicate lines (lists, table rows) preserving structure
  const lineSet = new Set<string>();
  const mergedLines: string[] = [];

  for (const line of [...linesA, ...linesB]) {
    const trimmed = line.trim();
    if (!trimmed) {
      mergedLines.push('');
      continue;
    }

    if (lineSet.has(trimmed)) {
      continue;
    }
    lineSet.add(trimmed);
    mergedLines.push(line);
  }

  return mergedLines.join('\n').replace(/\n{3,}/g, '\n\n');
}
