import { LanguageAdapter, ExtractionContext } from '../languages/adapter';
import { LanguageTier, FileFacts, createEmptyFileFacts } from '../languages/tiers';
import { redactConfigValues } from '../util/redact';

export class ConfigAnalyzer implements LanguageAdapter {
  id = 'config';
  extensions = ['.json', '.yml', '.yaml', '.toml', '.ini', '.env'];
  manifests = ['appsettings.json', 'application.yml', 'docker-compose.yml'];
  tier = LanguageTier.Tier2Structural;

  extract(context: ExtractionContext): FileFacts {
    const facts = createEmptyFileFacts();
    
    // Extract key names only
    try {
      if (context.relativePath.endsWith('.json')) {
        const parsed = JSON.parse(context.content);
        const redacted = redactConfigValues(parsed) as Record<string, unknown>;
        for (const k of Object.keys(redacted)) {
          facts.configKeys.push({
            key: k,
            evidence: { file: context.relativePath, line: 1 }
          });
        }
      } else {
        const lines = context.content.split(/\r?\n/);
        for (let i = 0; i < lines.length; i++) {
          const line = lines[i];
          const keyMatch = line.match(/^\s*([A-Za-z0-9_.-]+)\s*[:=]/);
          if (keyMatch) {
            facts.configKeys.push({
              key: keyMatch[1],
              evidence: { file: context.relativePath, line: i + 1 }
            });
          }
        }
      }
    } catch {
      // Fallback safe line parsing
    }

    return facts;
  }
}
