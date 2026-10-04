import { LanguageAdapter, ExtractionContext } from '../languages/adapter';
import { LanguageTier, FileFacts, createEmptyFileFacts } from '../languages/tiers';

export class DockerAnalyzer implements LanguageAdapter {
  id = 'docker';
  extensions = ['dockerfile'];
  manifests = ['dockerfile', 'docker-compose.yml'];
  tier = LanguageTier.Tier2Structural;

  extract(context: ExtractionContext): FileFacts {
    const facts = createEmptyFileFacts();
    const lines = context.content.split(/\r?\n/);
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      if (line.startsWith('EXPOSE')) {
        facts.configKeys.push({
          key: `Port ${line.substring(7).trim()}`,
          evidence: { file: context.relativePath, line: i + 1 }
        });
      }
    }
    return facts;
  }
}
