import * as fs from 'fs';
import * as path from 'path';
import { IgnoreFilter } from './ignore';

export interface FileEntry {
  absolutePath: string;
  relativePath: string;
  sizeBytes: number;
  extension: string;
}

export function detectEncodingAndRead(filePath: string): string {
  try {
    const buffer = fs.readFileSync(filePath);
    if (buffer.length >= 3 && buffer[0] === 0xef && buffer[1] === 0xbb && buffer[2] === 0xbf) {
      return buffer.toString('utf-8', 3);
    }
    if (buffer.length >= 2 && buffer[0] === 0xff && buffer[1] === 0xfe) {
      return buffer.toString('utf16le', 2);
    }
    if (buffer.length >= 2 && buffer[0] === 0xfe && buffer[1] === 0xff) {
      // UTF-16 BE
      const swapped = Buffer.allocUnsafe(buffer.length - 2);
      for (let i = 2; i < buffer.length - 1; i += 2) {
        swapped[i - 2] = buffer[i + 1];
        swapped[i - 1] = buffer[i];
      }
      return swapped.toString('utf16le');
    }

    return buffer.toString('utf-8');
  } catch (err) {
    return '';
  }
}

export function scanWorkspaceFiles(
  rootDir: string,
  ignoreFilter: IgnoreFilter,
  maxFiles = 20000,
  maxFileSizeKB = 512
): FileEntry[] {
  const results: FileEntry[] = [];
  const maxBytes = maxFileSizeKB * 1024;

  function traverse(dirPath: string): void {
    if (results.length >= maxFiles) return;

    let entries: fs.Dirent[] = [];
    try {
      entries = fs.readdirSync(dirPath, { withFileTypes: true });
    } catch {
      return;
    }

    for (const entry of entries) {
      if (results.length >= maxFiles) break;

      const fullPath = path.join(dirPath, entry.name);
      const relPath = path.relative(rootDir, fullPath).replace(/\\/g, '/');

      if (entry.isDirectory()) {
        if (!ignoreFilter.isIgnored(relPath, true)) {
          traverse(fullPath);
        }
      } else if (entry.isFile()) {
        if (!ignoreFilter.isIgnored(relPath, false)) {
          try {
            const stat = fs.statSync(fullPath);
            if (stat.size <= maxBytes) {
              results.push({
                absolutePath: fullPath,
                relativePath: relPath,
                sizeBytes: stat.size,
                extension: path.extname(entry.name).toLowerCase()
              });
            }
          } catch {
            // Ignore unreadable files
          }
        }
      }
    }
  }

  traverse(rootDir);
  return results;
}

export function ensureDirSync(dirPath: string): void {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
}
