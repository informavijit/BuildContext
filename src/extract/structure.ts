import * as path from 'path';
import { FileEntry } from '../util/fs';

export function extractPrunedStructureTree(appFiles: FileEntry[], maxDepth = 3): string {
  const dirs = new Set<string>();
  for (const f of appFiles) {
    const parts = f.relativePath.split('/');
    let current = '';
    for (let i = 0; i < Math.min(parts.length - 1, maxDepth); i++) {
      current = current ? `${current}/${parts[i]}` : parts[i];
      dirs.add(current);
    }
  }

  const sortedDirs = Array.from(dirs).sort();
  const treeLines = sortedDirs.map((d) => {
    const depth = d.split('/').length - 1;
    const indent = '  '.repeat(depth);
    return `${indent}├── ${path.basename(d)}/`;
  });

  return treeLines.slice(0, 30).join('\n') || '.';
}
