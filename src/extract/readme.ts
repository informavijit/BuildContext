import { FileEntry } from '../util/fs';
import { readAndSanitizeText } from '../languages/encoding';

export function extractPurpose(appFiles: FileEntry[]): string {
  const readmeFile = appFiles.find((f) => /readme\.md$/i.test(f.relativePath));
  if (readmeFile) {
    const text = readAndSanitizeText(readmeFile.absolutePath);
    const lines = text.split(/\r?\n/);
    for (const line of lines) {
      const trimmed = line.trim();
      if (trimmed && !trimmed.startsWith('#') && !trimmed.startsWith('!') && !trimmed.startsWith('[')) {
        return trimmed.length > 200 ? trimmed.substring(0, 200) + '...' : trimmed;
      }
    }
  }
  return 'Application providing core domain services.';
}
