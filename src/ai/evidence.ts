import { ApplicationGroup } from '../detect/grouping';
import { redactText } from '../util/redact';
import { extractPrunedStructureTree } from '../extract/structure';
import { extractPurpose } from '../extract/readme';
import { extractBuildRunTestScripts } from '../extract/scripts';

export interface EvidencePack {
  appId: string;
  appName: string;
  appType: string;
  structureTree: string;
  purpose: string;
  buildRunTest: Record<string, string>;
  knownFiles: string[];
  configKeys: string[];
  symbolOutlines: Array<{ file: string; symbols: string[] }>;
}

export function buildEvidencePack(
  appGroup: ApplicationGroup,
  excludeGlobs: string[] = []
): EvidencePack {
  const knownFiles = appGroup.files.map((f) => f.relativePath);
  const purpose = redactText(extractPurpose(appGroup.files));
  const buildRunTest = extractBuildRunTestScripts(appGroup.files);
  const structureTree = extractPrunedStructureTree(appGroup.files);

  return {
    appId: appGroup.id,
    appName: appGroup.name,
    appType: appGroup.type,
    structureTree,
    purpose,
    buildRunTest,
    knownFiles,
    configKeys: [],
    symbolOutlines: []
  };
}
