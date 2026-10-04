import * as path from 'path';
import * as fs from 'fs';
import { ParsedMarkdownFile } from './parse';
import { CategorySpec } from './categoryGenerator';

export interface FileCluster {
  clusterId: string;
  categoryName: string;
  recommendedAgentName: string;
  targetFilename: string;
  files: ParsedMarkdownFile[];
}

export function parseCategoriesSpec(categoriesContent: string): CategorySpec[] {
  const specs: CategorySpec[] = [];
  const fmMatch = categoriesContent.match(/^---\s*[\r\n]+categories:([\s\S]*?)[\r\n]+---/m);
  if (!fmMatch) return specs;

  const block = fmMatch[1];
  const items = block.split(/[\r\n]+\s*-\s+id:\s*/);

  for (const item of items) {
    if (!item.trim()) continue;
    const lines = item.split(/[\r\n]+/);
    let id = '';
    let name = '';
    let agent = '';
    let keywords: string[] = [];
    let paths: string[] = [];

    const firstLine = lines[0].trim();
    if (firstLine && !firstLine.includes(':')) {
      id = firstLine.replace(/["']/g, '');
    }

    for (const line of lines) {
      const trimmed = line.trim();
      if (trimmed.startsWith('id:')) id = trimmed.substring(3).trim().replace(/["']/g, '');
      if (trimmed.startsWith('name:')) name = trimmed.substring(5).trim().replace(/["']/g, '');
      if (trimmed.startsWith('agent:')) agent = trimmed.substring(6).trim().replace(/["']/g, '');
      if (trimmed.startsWith('keywords:')) {
        const kwStr = trimmed.substring(9).trim().replace(/[\[\]"']/g, '');
        keywords = kwStr.split(',').map((k) => k.trim()).filter(Boolean);
      }
      if (trimmed.startsWith('paths:')) {
        const pStr = trimmed.substring(6).trim().replace(/[\[\]"']/g, '');
        paths = pStr.split(',').map((p) => p.trim()).filter(Boolean);
      }
    }

    if (id) {
      specs.push({
        id,
        name: name || id,
        agent: agent || `${id} AI Agent`,
        keywords,
        paths
      });
    }
  }

  return specs;
}

export function clusterMarkdownFilesWithSpec(
  files: ParsedMarkdownFile[],
  categoriesSpec: CategorySpec[]
): FileCluster[] {
  const clusterMap = new Map<string, { spec: CategorySpec; files: ParsedMarkdownFile[] }>();

  for (const spec of categoriesSpec) {
    clusterMap.set(spec.id, { spec, files: [] });
  }

  // Classify each file into one of the user-defined categories
  for (const file of files) {
    const fullText = (file.filePath + ' ' + file.frontMatter + ' ' + file.sections.map((s) => `${s.heading} ${s.content}`).join(' ')).toLowerCase();

    let bestCategory = categoriesSpec[0];
    let maxMatches = -1;

    for (const spec of categoriesSpec) {
      let matches = 0;
      for (const kw of spec.keywords) {
        if (kw && fullText.includes(kw.toLowerCase())) {
          matches++;
        }
      }
      for (const p of spec.paths) {
        if (p && file.filePath.toLowerCase().includes(p.toLowerCase())) {
          matches += 3; // Weight path matches higher
        }
      }

      if (matches > maxMatches) {
        maxMatches = matches;
        bestCategory = spec;
      }
    }

    if (bestCategory && clusterMap.has(bestCategory.id)) {
      clusterMap.get(bestCategory.id)!.files.push(file);
    }
  }

  const clusters: FileCluster[] = [];
  for (const [id, data] of clusterMap.entries()) {
    // Only output clusters that have at least 1 file
    if (data.files.length > 0) {
      clusters.push({
        clusterId: id,
        categoryName: data.spec.name,
        recommendedAgentName: data.spec.agent,
        targetFilename: `agent-${id}.md`,
        files: data.files
      });
    }
  }

  return clusters;
}

export function loadOrCreateCategoriesSpec(folderPath: string): CategorySpec[] {
  const specPath = path.join(folderPath, 'CATEGORIES.md');
  if (fs.existsSync(specPath)) {
    try {
      const content = fs.readFileSync(specPath, 'utf-8');
      const parsed = parseCategoriesSpec(content);
      if (parsed.length > 0) return parsed;
    } catch {}
  }

  // Default standard categories spec fallback
  return [
    { id: 'auth-security', name: 'Authentication & Security', agent: 'Auth & Security AI Agent', keywords: ['auth', 'security', 'login', 'user', 'jwt', 'token', 'permission'], paths: ['auth', 'security'] },
    { id: 'core-services', name: 'Core Business Services & APIs', agent: 'Core Services AI Agent', keywords: ['service', 'order', 'cart', 'checkout', 'payment', 'billing', 'api', 'controller'], paths: ['services', 'controllers', 'api'] },
    { id: 'frontend-ui', name: 'Frontend UI & Mobile Components', agent: 'Frontend & UI AI Agent', keywords: ['ui', 'view', 'component', 'screen', 'widget', 'frontend', 'react', 'flutter', 'angular'], paths: ['components', 'views', 'screens'] },
    { id: 'data-storage', name: 'Database & Data Architecture', agent: 'Data Architecture AI Agent', keywords: ['database', 'table', 'migration', 'entity', 'model', 'repository', 'sql'], paths: ['db', 'entities', 'models'] },
    { id: 'devops-infra', name: 'Infrastructure & Deployment', agent: 'DevOps & Infra AI Agent', keywords: ['docker', 'k8s', 'helm', 'terraform', 'ci', 'workflow', 'config', 'env'], paths: ['docker', 'k8s', 'infra'] }
  ];
}

export function clusterMarkdownFiles(files: ParsedMarkdownFile[], folderPath?: string): FileCluster[] {
  let categoriesSpec: CategorySpec[] = [];
  if (folderPath) {
    categoriesSpec = loadOrCreateCategoriesSpec(folderPath);
  } else {
    categoriesSpec = loadOrCreateCategoriesSpec('.');
  }
  return clusterMarkdownFilesWithSpec(files, categoriesSpec);
}
