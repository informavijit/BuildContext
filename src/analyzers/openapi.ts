import { LanguageAdapter, ExtractionContext } from '../languages/adapter';
import { LanguageTier, FileFacts, createEmptyFileFacts } from '../languages/tiers';

export class OpenApiProtoAnalyzer implements LanguageAdapter {
  id = 'openapi-proto';
  extensions = ['.proto', '.swagger', '.openapi'];
  manifests = [];
  tier = LanguageTier.Tier2Structural;

  extract(context: ExtractionContext): FileFacts {
    const facts = createEmptyFileFacts();
    const lines = context.content.split(/\r?\n/);
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const serviceMatch = line.match(/\bservice\s+([A-Za-z0-9_]+)/);
      if (serviceMatch) {
        facts.declarations.push({
          kind: 'ServiceContract',
          name: serviceMatch[1],
          evidence: { file: context.relativePath, line: i + 1 }
        });
      }
    }
    return facts;
  }
}
