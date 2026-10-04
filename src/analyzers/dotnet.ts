import { LanguageAdapter, ExtractionContext } from '../languages/adapter';
import { LanguageTier, FileFacts } from '../languages/tiers';
import { executeRulePack, RulePack } from '../languages/regex-engine';
import csharpRules from '../rules/csharp.json';

export class DotNetAnalyzer implements LanguageAdapter {
  id = 'dotnet';
  extensions = ['.cs', '.vb', '.fs', '.razor', '.cshtml', '.xaml'];
  manifests = ['*.sln', '*.csproj', '*.vbproj', '*.fsproj'];
  tier = LanguageTier.Tier1Deep;

  extract(context: ExtractionContext): FileFacts {
    return executeRulePack(context.content, context.relativePath, csharpRules as RulePack, 'csharp');
  }
}
