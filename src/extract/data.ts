import { FileFacts } from '../languages/tiers';
import { DataEntity, ConfigKey, HotspotInfo, CrossAppLink } from '../kb/schema';

export function extractDataEntities(fileFactsMap: Map<string, FileFacts>): DataEntity[] {
  const entities: DataEntity[] = [];
  for (const [, facts] of fileFactsMap.entries()) {
    for (const d of facts.dataAccess) {
      entities.push({
        name: d.entityOrTable,
        kind: 'Table',
        fieldsOrTable: d.operation || 'Data Entity'
      });
    }
  }
  return entities;
}

export function extractConfigKeys(fileFactsMap: Map<string, FileFacts>): ConfigKey[] {
  const configKeys: ConfigKey[] = [];
  for (const [filePath, facts] of fileFactsMap.entries()) {
    for (const c of facts.configKeys) {
      configKeys.push({
        key: c.key,
        sourceFile: filePath
      });
    }
  }
  return configKeys;
}

export function extractConventions(): string[] {
  return [
    'Follow single-responsibility principle per module.',
    'Keep API route handlers decoupled from database access layers.',
    'Maintain standard error handling and logging conventions.'
  ];
}

export function extractHotspots(fileFactsMap: Map<string, FileFacts>): HotspotInfo[] {
  const hotspots: HotspotInfo[] = [];
  for (const [filePath, facts] of fileFactsMap.entries()) {
    if (facts.todos.length > 0) {
      hotspots.push({
        file: filePath,
        reason: `${facts.todos.length} TODO/FIXME markers found`,
        todoCount: facts.todos.length
      });
    }
  }
  return hotspots;
}

export function extractCrossAppLinks(
  appId: string,
  fileFactsMap: Map<string, FileFacts>,
  allAppIds: string[]
): CrossAppLink[] {
  const links: CrossAppLink[] = [];

  for (const [filePath, facts] of fileFactsMap.entries()) {
    for (const extCall of facts.externalCalls) {
      for (const otherAppId of allAppIds) {
        if (otherAppId !== appId && extCall.target.toLowerCase().includes(otherAppId)) {
          links.push({
            targetAppId: otherAppId,
            reason: `External call to ${extCall.target}`,
            evidence: `${filePath}:${extCall.evidence.line || 1}`
          });
        }
      }
    }
  }

  return links;
}
