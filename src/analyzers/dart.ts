import { LanguageAdapter, ExtractionContext } from '../languages/adapter';
import { LanguageTier, FileFacts } from '../languages/tiers';
import { executeRulePack, RulePack } from '../languages/regex-engine';
import dartRules from '../rules/dart.json';

export class DartAnalyzer implements LanguageAdapter {
  id = 'dart';
  extensions = ['.dart'];
  manifests = ['pubspec.yaml'];
  tier = LanguageTier.Tier1Deep;

  extract(context: ExtractionContext): FileFacts {
    return executeRulePack(context.content, context.relativePath, dartRules as RulePack, 'dart');
  }
}
