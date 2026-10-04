import { LanguageAdapter, ExtractionContext } from '../languages/adapter';
import { LanguageTier, FileFacts } from '../languages/tiers';
import { executeRulePack, RulePack } from '../languages/regex-engine';
import sqlRules from '../rules/sql.json';

export class SqlAnalyzer implements LanguageAdapter {
  id = 'sql';
  extensions = ['.sql', '.prc', '.pks', '.pkb'];
  manifests = [];
  tier = LanguageTier.Tier2Structural;

  extract(context: ExtractionContext): FileFacts {
    return executeRulePack(context.content, context.relativePath, sqlRules as RulePack, 'sql');
  }
}
