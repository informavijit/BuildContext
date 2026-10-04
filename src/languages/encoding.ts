import { detectEncodingAndRead } from '../util/fs';

export function readAndSanitizeText(filePath: string): string {
  const text = detectEncodingAndRead(filePath);
  // Remove null characters or invalid control characters
  return text.replace(/\0/g, '');
}
