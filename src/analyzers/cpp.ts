import { LanguageAdapter, ExtractionContext } from '../languages/adapter';
import { LanguageTier, FileFacts } from '../languages/tiers';
import { executeRulePack, RulePack } from '../languages/regex-engine';
import cppRules from '../rules/cpp.json';

export class CppAnalyzer implements LanguageAdapter {
  id = 'cpp';
  extensions = ['.c', '.cc', '.cpp', '.cxx', '.h', '.hpp'];
  manifests = ['CMakeLists.txt', 'Makefile', '*.vcxproj'];
  tier = LanguageTier.Tier1Deep;

  extract(context: ExtractionContext): FileFacts {
    return executeRulePack(context.content, context.relativePath, cppRules as RulePack, 'cpp');
  }
}
