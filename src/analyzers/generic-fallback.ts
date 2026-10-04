import { LanguageAdapter } from '../languages/adapter';
import { LanguageTier, FileFacts, createEmptyFileFacts } from '../languages/tiers';
import { executeRulePack, RulePack } from '../languages/regex-engine';
import genericRulePack from '../rules/generic.json';

export class GenericFallbackAnalyzer implements LanguageAdapter {
  id = 'generic';
  extensions = ['*'];
  manifests = [];
  tier = LanguageTier.Tier3Inventory;

  extract(context: { relativePath: string; content: string; languageId: string }): FileFacts {
    return executeRulePack(context.content, context.relativePath, genericRulePack as RulePack, 'generic');
  }
}
