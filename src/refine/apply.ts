import * as fs from 'fs';
import * as path from 'path';
import { RefinementPlan } from './plan';
import { ensureDirSync } from '../util/fs';

export function applyRefinementPlan(
  plan: RefinementPlan,
  targetDir: string,
  inPlace = false,
  createBackup = true
): { backupDir?: string; reportPath: string } {
  let backupDir: string | undefined;

  if (inPlace && createBackup) {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    backupDir = path.join(targetDir, '.buildcontext-backup', timestamp);
    ensureDirSync(backupDir);

    for (const filePath of plan.refinedFiles.keys()) {
      if (fs.existsSync(filePath)) {
        const rel = path.relative(targetDir, filePath);
        const dest = path.join(backupDir, rel);
        ensureDirSync(path.dirname(dest));
        fs.copyFileSync(filePath, dest);
      }
    }
  }

  const outputDir = inPlace ? targetDir : path.join(targetDir, '_refined');
  ensureDirSync(outputDir);

  for (const [filePath, content] of plan.refinedFiles.entries()) {
    const filename = path.basename(filePath);
    const dest = path.join(outputDir, filename);
    fs.writeFileSync(dest, content, 'utf-8');
  }

  // Generate REFINE_REPORT.md
  const reportPath = path.join(outputDir, 'REFINE_REPORT.md');
  const reportContent = generateRefineReport(plan);
  fs.writeFileSync(reportPath, reportContent, 'utf-8');

  return { backupDir, reportPath };
}

export function generateRefineReport(plan: RefinementPlan): string {
  const percentSaved = plan.totalTokensBefore > 0
    ? (((plan.totalTokensBefore - plan.totalTokensAfter) / plan.totalTokensBefore) * 100).toFixed(1)
    : '0';

  const agentRows = plan.recommendedAgents
    .map(
      (a) =>
        `| **${a.agentName}** | ${a.categoryName} | [\`${a.targetFilename}\`](./${a.targetFilename}) | ${a.sourceFilesCount} source files |`
    )
    .join('\n');

  const actionRows = plan.actions
    .map(
      (a) =>
        `| ${a.action} | \`${path.basename(a.targetPath)}\` | ${a.reason} | ${a.tokenSavings} tokens |`
    )
    .join('\n');

  const removedRows =
    plan.removedLog.length > 0
      ? plan.removedLog.map((r) => `| ${r.rule} | ${r.description} |`).join('\n')
      : '| None | No noise items removed |';

  const conflictRows =
    plan.conflicts.length > 0
      ? plan.conflicts.map((c) => `- **CONFLICT:** ${c}`).join('\n')
      : 'No conflicting facts encountered.';

  return `# BuildContext Refine Path & Multi-Agent Decomposition Report

## Executive Summary
- **Total Recommended Specialized Agents:** ${plan.recommendedAgents.length} Agents
- **Tokens Before Refinement:** ${plan.totalTokensBefore} tokens
- **Tokens After Refinement:** ${plan.totalTokensAfter} tokens
- **Total Savings:** ${plan.totalTokensBefore - plan.totalTokensAfter} tokens (${percentSaved}% reduction)

---

## Recommended Multi-Agent Architecture Plan
Based on domain analysis, your codebase is partitioned into **${plan.recommendedAgents.length} specialized domain agents**. Use **1 specialized agent per category** to maintain compact context windows:

| Recommended AI Agent | Category / Domain | Refined Context File | Knowledge Sources |
|---|---|---|---|
${agentRows}

### How to Deploy Multi-Agent System
1. **Agent Assignment**: Assign each \`agent-<category>.md\` file as system prompt context for its dedicated AI agent (Claude Code, Copilot, Cursor, Gemini).
2. **Domain Scoping**: Route user tasks for specific modules to the matching specialized agent instead of sending the whole codebase.

---

## Refinement Actions Applied
| Action | Target File | Description / Reason | Savings |
|---|---|---|---|
${actionRows}

## Removed / De-noised Items
| Rule Applied | Description |
|---|---|
${removedRows}

## Fact Conflicts
${conflictRows}
`;
}
