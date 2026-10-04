import * as path from 'path';
import { ParsedMarkdownFile, parseMarkdownFile } from './parse';
import { removeNoise } from './noise-rules';
import { mergeMarkdownCluster } from './merge';
import { clusterMarkdownFiles, FileCluster } from './cluster';
import { compactMarkdownFile } from './compact';
import { estimateTokenCount } from '../kb/tokens';

export interface RefinementAction {
  action: 'Dedupe' | 'Merge' | 'Prune' | 'Compact';
  targetPath: string;
  sourcePaths: string[];
  reason: string;
  tokenSavings: number;
}

export interface RecommendedAgentSpec {
  agentName: string;
  categoryName: string;
  targetFilename: string;
  sourceFilesCount: number;
}

export interface RefinementPlan {
  actions: RefinementAction[];
  refinedFiles: Map<string, string>;
  totalTokensBefore: number;
  totalTokensAfter: number;
  conflicts: string[];
  removedLog: Array<{ rule: string; description: string }>;
  recommendedAgents: RecommendedAgentSpec[];
}

export function buildRefinementPlan(
  fileMap: Map<string, string>,
  duplicateThreshold = 0.85,
  folderPath?: string
): RefinementPlan {
  const actions: RefinementAction[] = [];
  const refinedFiles = new Map<string, string>();
  let totalBefore = 0;
  let totalAfter = 0;
  const conflicts: string[] = [];
  const removedLog: Array<{ rule: string; description: string }> = [];
  const recommendedAgents: RecommendedAgentSpec[] = [];

  const parsedFiles: ParsedMarkdownFile[] = [];

  for (const [filePath, content] of fileMap.entries()) {
    const tokens = estimateTokenCount(content);
    totalBefore += tokens;

    // Apply noise rules first
    const { cleanedText, removedItems } = removeNoise(content);
    removedLog.push(...removedItems);

    parsedFiles.push(parseMarkdownFile(filePath, cleanedText));
  }

  // Cluster files by user-defined categories in CATEGORIES.md or default categories
  const clusters: FileCluster[] = clusterMarkdownFiles(parsedFiles, folderPath);

  for (const cluster of clusters) {
    const sourcePaths = cluster.files.map((f) => f.filePath);
    const mergeResult = mergeMarkdownCluster(cluster.targetFilename, cluster.files, duplicateThreshold);
    conflicts.push(...mergeResult.conflicts);

    // Apply deep compaction to the merged file
    const compactedFile = compactMarkdownFile(mergeResult.mergedFile);

    const pf = compactedFile;
    const renderedSections = pf.sections.map((s) => `${'#'.repeat(s.level)} ${s.heading}\n${s.content}`).join('\n\n');

    let fullRender = [pf.frontMatter, renderedSections, pf.manualSection].filter(Boolean).join('\n\n');

    // Add agent header if not already present
    if (!fullRender.includes('Recommended Agent:')) {
      const agentHeader = `# ${cluster.categoryName} - Specialized Agent Context\n> **Recommended Agent:** ${cluster.recommendedAgentName}\n> **Category / Domain:** ${cluster.categoryName}\n> **Merged Knowledge Source Files:** ${cluster.files.length} files\n\n`;
      fullRender = agentHeader + fullRender;
    }

    refinedFiles.set(cluster.targetFilename, fullRender);
    const tokens = estimateTokenCount(fullRender);
    totalAfter += tokens;

    const sourceTokens = sourcePaths.reduce((sum, p) => sum + estimateTokenCount(fileMap.get(p) || ''), 0);

    recommendedAgents.push({
      agentName: cluster.recommendedAgentName,
      categoryName: cluster.categoryName,
      targetFilename: cluster.targetFilename,
      sourceFilesCount: cluster.files.length
    });

    actions.push({
      action: cluster.files.length > 1 ? 'Merge' : 'Compact',
      targetPath: cluster.targetFilename,
      sourcePaths,
      reason: cluster.files.length > 1
        ? `Clubbed ${cluster.files.length} files into specialized '${cluster.recommendedAgentName}' context file`
        : `Refined and compacted into specialized '${cluster.recommendedAgentName}' context file`,
      tokenSavings: Math.max(0, sourceTokens - tokens)
    });
  }

  return {
    actions,
    refinedFiles,
    totalTokensBefore: totalBefore,
    totalTokensAfter: totalAfter,
    conflicts,
    removedLog,
    recommendedAgents
  };
}
