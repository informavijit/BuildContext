import { ApplicationKbData } from './schema';
import { estimateTokenCount } from './tokens';

export function renderApplicationKb(data: ApplicationKbData): string {
  const fm = data.frontMatter;
  
  // Calculate body preview to compute body tokens accurately
  const bodyMarkdown = renderBody(data);
  const totalTokens = estimateTokenCount(bodyMarkdown);
  fm.tokens = totalTokens;

  const yamlFrontMatter = [
    '---',
    `schema: ${fm.schema}`,
    `id: ${fm.id}`,
    `name: ${escapeYaml(fm.name)}`,
    `type: ${fm.type}`,
    `languages: [${fm.languages.join(', ')}]`,
    `frameworks: [${fm.frameworks.join(', ')}]`,
    `root: ${fm.root}`,
    `entry_points: [${fm.entry_points.join(', ')}]`,
    `depends_on: [${fm.depends_on.join(', ')}]`,
    `related_apps: [${fm.related_apps.join(', ')}]`,
    `source_hash: ${fm.source_hash}`,
    fm.commit ? `commit: ${fm.commit}` : null,
    `tokens: ${fm.tokens}`,
    `mode: ${fm.mode}`,
    fm.model ? `model: ${fm.model}` : null,
    '---'
  ].filter(Boolean).join('\n');

  return `${yamlFrontMatter}\n<!-- buildcontext:auto:start -->\n${bodyMarkdown}\n<!-- buildcontext:auto:end -->\n\n<!-- buildcontext:manual -->\n`;
}

function renderBody(data: ApplicationKbData): string {
  const sections: string[] = [];

  // Title & L0 TL;DR
  sections.push(`# ${data.frontMatter.name}\n> **TL;DR (L0, max ~120 words):** ${data.tldr}`);

  // Quick Facts
  if (Object.keys(data.quickFacts).length > 0) {
    const rows = Object.entries(data.quickFacts)
      .map(([k, v]) => `| **${k}** | ${v} |`)
      .join('\n');
    sections.push(`## Quick Facts\n| Property | Value |\n|---|---|\n${rows}`);
  }

  // Build, Run, Test
  if (Object.keys(data.buildRunTest).length > 0) {
    const cmds = Object.entries(data.buildRunTest)
      .map(([k, v]) => `### ${k}\n\`\`\`bash\n${v}\n\`\`\``)
      .join('\n\n');
    sections.push(`## Build, Run, Test\n${cmds}`);
  }

  // Structure Map
  if (data.structureMap && data.structureMap.trim()) {
    sections.push(`## Structure Map\n\`\`\`\n${data.structureMap.trim()}\n\`\`\``);
  }

  // Architecture and Key Components
  if (data.components.length > 0) {
    const rows = data.components
      .map((c) => `| \`${c.name}\` | ${c.role} | [\`${c.file}\`](file:///${c.file}) | ${c.dependsOn?.join(', ') || '-'} | ${c.usedBy?.join(', ') || '-'} |`)
      .join('\n');
    sections.push(`## Architecture and Key Components\n| Component | Role | File | Depends On | Used By |\n|---|---|---|---|---|\n${rows}`);
  }

  // Entry Points and Main Flows
  if (data.flows.length > 0) {
    const flowsStr = data.flows
      .map((f, i) => `${i + 1}. **${f.name}** (Trigger: \`${f.trigger}\`)\n   - Chain: ${f.chain.join(' → ')}`)
      .join('\n');
    sections.push(`## Entry Points and Main Flows\n${flowsStr}`);
  }

  // Interfaces
  if (data.interfaces.length > 0) {
    const rows = data.interfaces
      .map((i) => `| ${i.type} | ${i.methodOrKind || '-'} | \`${i.pathOrName}\` | [\`${i.handlerOrFile}\`](file:///${i.handlerOrFile}${i.line ? `#L${i.line}` : ''}) |`)
      .join('\n');
    sections.push(`## Interfaces\n| Type | Method | Path / Name | Handler / Location |\n|---|---|---|---|\n${rows}`);
  }

  // Data
  if (data.dataEntities.length > 0) {
    const rows = data.dataEntities
      .map((d) => `| \`${d.name}\` | ${d.kind} | ${d.fieldsOrTable || '-'} |`)
      .join('\n');
    sections.push(`## Data\n| Entity / Model | Kind | Details |\n|---|---|---|\n${rows}`);
  }

  // Configuration (names only)
  if (data.configKeys.length > 0) {
    const rows = data.configKeys
      .map((c) => `| \`${c.key}\` | [\`${c.sourceFile}\`](file:///${c.sourceFile}) | ${c.description || 'Config Key'} |`)
      .join('\n');
    sections.push(`## Configuration (names only)\n| Key Name | File | Purpose |\n|---|---|---|\n${rows}`);
  }

  // Dependencies
  if (data.dependencies.length > 0) {
    const rows = data.dependencies
      .map((d) => `| \`${d.name}\` | ${d.version || 'unspecified'} | ${d.isInternal ? 'Internal App' : 'External Library'} |`)
      .join('\n');
    sections.push(`## Dependencies\n| Dependency | Version | Type |\n|---|---|---|\n${rows}`);
  }

  // Conventions
  if (data.conventions.length > 0) {
    const convs = data.conventions.map((c) => `- ${c}`).join('\n');
    sections.push(`## Conventions\n${convs}`);
  }

  // Gotchas and Hotspots
  if (data.hotspots.length > 0) {
    const rows = data.hotspots
      .map((h) => `| [\`${h.file}\`](file:///${h.file}) | ${h.reason} | ${h.todoCount ?? 0} |`)
      .join('\n');
    sections.push(`## Gotchas and Hotspots\n| File | Risk / Note | TODOs |\n|---|---|---|\n${rows}`);
  }

  // Related Applications
  if (data.relatedApps.length > 0) {
    const rows = data.relatedApps
      .map((r) => `| \`${r.targetAppId}\` | ${r.reason} | ${r.evidence} |`)
      .join('\n');
    sections.push(`## Related Applications\n| App ID | Reason | Evidence |\n|---|---|---|\n${rows}`);
  }

  // Evidence Index
  if (data.evidenceIndex.length > 0) {
    const rows = data.evidenceIndex
      .map((e) => `- **${e.claim}**: [\`${e.path}\`](file:///${e.path}${e.line ? `#L${e.line}` : ''})`)
      .join('\n');
    sections.push(`## Evidence Index\n${rows}`);
  }

  return sections.join('\n\n');
}

function escapeYaml(str: string): string {
  if (str.includes(':') || str.includes('#') || str.includes('"')) {
    return `"${str.replace(/"/g, '\\"')}"`;
  }
  return str;
}
