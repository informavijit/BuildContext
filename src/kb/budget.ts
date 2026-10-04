import { ApplicationKbData } from './schema';
import { estimateTokenCount } from './tokens';

export function enforceTokenBudget(
  data: ApplicationKbData,
  targetTokens = 3000,
  hardCapTokens = 6000,
  maxComponents = 15
): ApplicationKbData {
  const pruned: ApplicationKbData = {
    ...data,
    components: [...data.components],
    flows: [...data.flows],
    interfaces: [...data.interfaces],
    dataEntities: [...data.dataEntities],
    configKeys: [...data.configKeys],
    dependencies: [...data.dependencies],
    conventions: [...data.conventions],
    hotspots: [...data.hotspots],
    relatedApps: [...data.relatedApps],
    evidenceIndex: [...data.evidenceIndex]
  };

  if (pruned.components.length > maxComponents) {
    pruned.components = pruned.components.slice(0, maxComponents);
  }

  // Calculate tokens iteratively and prune lowest priority elements if over budget
  let currentEst = estimateDataTokens(pruned);

  if (currentEst > hardCapTokens || currentEst > targetTokens) {
    if (pruned.evidenceIndex.length > 20) {
      pruned.evidenceIndex = pruned.evidenceIndex.slice(0, 20);
    }
    currentEst = estimateDataTokens(pruned);
  }

  if (currentEst > targetTokens && pruned.hotspots.length > 10) {
    pruned.hotspots = pruned.hotspots.slice(0, 10);
    currentEst = estimateDataTokens(pruned);
  }

  if (currentEst > targetTokens && pruned.configKeys.length > 25) {
    pruned.configKeys = pruned.configKeys.slice(0, 25);
    currentEst = estimateDataTokens(pruned);
  }

  if (currentEst > targetTokens && pruned.interfaces.length > 30) {
    pruned.interfaces = pruned.interfaces.slice(0, 30);
  }

  return pruned;
}

function estimateDataTokens(data: ApplicationKbData): number {
  return estimateTokenCount(JSON.stringify(data));
}
