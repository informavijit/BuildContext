import { FileFacts } from '../languages/tiers';
import { InterfaceInfo } from '../kb/schema';

export function extractInterfacesFromFacts(fileFactsMap: Map<string, FileFacts>): InterfaceInfo[] {
  const interfaces: InterfaceInfo[] = [];

  for (const [filePath, facts] of fileFactsMap.entries()) {
    for (const r of facts.routes) {
      interfaces.push({
        type: 'HTTP',
        methodOrKind: r.method,
        pathOrName: r.path,
        handlerOrFile: filePath,
        line: r.evidence.line
      });
    }

    for (const entry of facts.entryPoints) {
      interfaces.push({
        type: 'CLI',
        methodOrKind: entry.kind,
        pathOrName: entry.name,
        handlerOrFile: filePath,
        line: entry.evidence.line
      });
    }
  }

  return interfaces;
}
