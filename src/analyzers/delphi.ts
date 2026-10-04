import { LanguageAdapter, ExtractionContext } from '../languages/adapter';
import { LanguageTier, FileFacts } from '../languages/tiers';
import { executeRulePack, RulePack } from '../languages/regex-engine';
import pascalRules from '../rules/pascal.json';
import dfmRules from '../rules/dfm.json';

export class DelphiAnalyzer implements LanguageAdapter {
  id = 'delphi';
  extensions = ['.pas', '.lpr', '.lpi', '.lfm', '.dpr', '.dpk', '.dfm', '.fmx', '.inc', '.dproj', '.groupproj'];
  manifests = ['*.dpr', '*.dpk', '*.dproj', '*.groupproj'];
  tier = LanguageTier.Tier1Deep;

  extract(context: ExtractionContext): FileFacts {
    const ext = context.relativePath.split('.').pop()?.toLowerCase();
    
    if (ext === 'dfm' || ext === 'fmx') {
      if (context.content.startsWith('TPF0')) {
        const facts = executeRulePack('', context.relativePath, dfmRules as RulePack, 'dfm');
        facts.declarations.push({
          kind: 'BinaryForm',
          name: 'binary form, not parsed',
          evidence: { file: context.relativePath, line: 1 }
        });
        return facts;
      }
      return executeRulePack(context.content, context.relativePath, dfmRules as RulePack, 'dfm');
    }

    return executeRulePack(context.content, context.relativePath, pascalRules as RulePack, 'delphi');
  }
}
