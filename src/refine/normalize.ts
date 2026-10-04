export function normalizeText(text: string): string {
  return text
    .toLowerCase()
    .replace(/<[^>]+>/g, '') // Strip HTML tags
    .replace(/[^\w\s]/g, ' ') // Replace non-word chars
    .replace(/\s+/g, ' ') // Collapse whitespace
    .trim();
}
