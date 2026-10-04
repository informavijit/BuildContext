import { computeHash } from '../util/hash';

export class AiCache {
  private cache = new Map<string, string>();

  public get(evidenceHash: string): string | undefined {
    return this.cache.get(evidenceHash);
  }

  public set(evidenceHash: string, resultMarkdown: string): void {
    this.cache.set(evidenceHash, resultMarkdown);
  }
}
