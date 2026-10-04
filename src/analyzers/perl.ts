import { LanguageAdapter, ExtractionContext } from '../languages/adapter';
import { LanguageTier, FileFacts } from '../languages/tiers';
import { executeRulePack, RulePack } from '../languages/regex-engine';
import perlRules from '../rules/perl.json';

export class PerlAnalyzer implements LanguageAdapter {
  id = 'perl';
  extensions = ['.pl', '.pm', '.t'];
  manifests = ['cpanfile', 'Makefile.PL', 'Build.PL'];
  tier = LanguageTier.Tier2Structural;

  extract(context: ExtractionContext): FileFacts {
    return executeRulePack(context.content, context.relativePath, perlRules as RulePack, 'perl');
  }
}
