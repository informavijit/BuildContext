import { LanguageAdapter, ExtractionContext } from '../languages/adapter';
import { LanguageTier, FileFacts } from '../languages/tiers';
import { executeRulePack, RulePack } from '../languages/regex-engine';
import shellRules from '../rules/shell.json';

export class ShellAnalyzer implements LanguageAdapter {
  id = 'shell';
  extensions = ['.sh', '.bash', '.zsh', '.bat', '.cmd'];
  manifests = [];
  tier = LanguageTier.Tier2Structural;

  extract(context: ExtractionContext): FileFacts {
    return executeRulePack(context.content, context.relativePath, shellRules as RulePack, 'shell');
  }
}
