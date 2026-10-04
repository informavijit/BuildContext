import { FileFacts, LanguageTier } from './tiers';

export interface ExtractionContext {
  workspaceRoot: string;
  relativePath: string;
  content: string;
  languageId: string;
}

export interface LanguageAdapter {
  id: string;
  extensions: string[];
  manifests: string[];
  tier: LanguageTier;
  extract(file: ExtractionContext): FileFacts;
}
