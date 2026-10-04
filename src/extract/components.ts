import { FileFacts } from '../languages/tiers';
import { ComponentInfo } from '../kb/schema';

export function extractComponentsFromFacts(fileFactsMap: Map<string, FileFacts>): ComponentInfo[] {
  const components: ComponentInfo[] = [];

  for (const [filePath, facts] of fileFactsMap.entries()) {
    for (const decl of facts.declarations) {
      if (['class', 'interface', 'ReactComponent', 'NestController', 'SFCComponent', 'procedure'].includes(decl.kind)) {
        components.push({
          name: decl.name,
          role: `${decl.kind} component in ${filePath}`,
          file: filePath,
          dependsOn: facts.imports.map((i) => i.module).slice(0, 3),
          usedBy: []
        });
      }
    }
  }

  return components.slice(0, 15);
}
