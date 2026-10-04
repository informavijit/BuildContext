import { LanguageAdapter, ExtractionContext } from '../languages/adapter';
import { LanguageTier, FileFacts } from '../languages/tiers';
import { executeRulePack, RulePack } from '../languages/regex-engine';
import javaRules from '../rules/java.json';

export class JavaAnalyzer implements LanguageAdapter {
  id = 'java';
  extensions = ['.java'];
  manifests = ['pom.xml', 'build.gradle', 'build.gradle.kts'];
  tier = LanguageTier.Tier1Deep;

  extract(context: ExtractionContext): FileFacts {
    return executeRulePack(context.content, context.relativePath, javaRules as RulePack, 'java');
  }
}
