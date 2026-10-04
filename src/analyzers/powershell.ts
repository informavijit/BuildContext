import { LanguageAdapter, ExtractionContext } from '../languages/adapter';
import { LanguageTier, FileFacts } from '../languages/tiers';
import { executeRulePack, RulePack } from '../languages/regex-engine';
import psRules from '../rules/powershell.json';

export class PowerShellAnalyzer implements LanguageAdapter {
  id = 'powershell';
  extensions = ['.ps1', '.psm1', '.psd1'];
  manifests = ['*.psd1'];
  tier = LanguageTier.Tier2Structural;

  extract(context: ExtractionContext): FileFacts {
    return executeRulePack(context.content, context.relativePath, psRules as RulePack, 'powershell');
  }
}
