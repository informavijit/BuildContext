import { LanguageAdapter, ExtractionContext } from '../languages/adapter';
import { LanguageTier, FileFacts } from '../languages/tiers';
import { executeRulePack, RulePack } from '../languages/regex-engine';
import genericRules from '../rules/generic.json';

export class GoRustKotlinSwiftPhpRubyAnalyzer implements LanguageAdapter {
  id = 'go-rust-kotlin-swift-php-ruby';
  extensions = ['.go', '.rs', '.kt', '.kts', '.swift', '.php', '.rb', '.scala', '.groovy'];
  manifests = ['go.mod', 'Cargo.toml', 'Package.swift', 'composer.json', 'Gemfile', 'build.sbt'];
  tier = LanguageTier.Tier2Structural;

  extract(context: ExtractionContext): FileFacts {
    return executeRulePack(context.content, context.relativePath, genericRules as RulePack, 'generic');
  }
}
