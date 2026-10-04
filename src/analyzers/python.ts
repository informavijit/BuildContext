import { LanguageAdapter, ExtractionContext } from '../languages/adapter';
import { LanguageTier, FileFacts } from '../languages/tiers';
import { executeRulePack, RulePack } from '../languages/regex-engine';
import pythonRules from '../rules/python.json';

export class PythonAnalyzer implements LanguageAdapter {
  id = 'python';
  extensions = ['.py'];
  manifests = ['pyproject.toml', 'setup.py', 'requirements.txt'];
  tier = LanguageTier.Tier1Deep;

  extract(context: ExtractionContext): FileFacts {
    return executeRulePack(context.content, context.relativePath, pythonRules as RulePack, 'python');
  }
}
