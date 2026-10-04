import * as path from 'path';
import { ApplicationGroup } from '../detect/grouping';

export interface CategorySpec {
  id: string;
  name: string;
  agent: string;
  keywords: string[];
  paths: string[];
}

export function generateSuggestedCategories(appGroups: ApplicationGroup[]): CategorySpec[] {
  const specs: CategorySpec[] = [];
  const detectedTypes = new Set(appGroups.map((g) => g.type));

  // 1. Auth & Security
  specs.push({
    id: 'auth-security',
    name: 'Authentication & Security',
    agent: 'Auth & Security AI Agent',
    keywords: ['auth', 'security', 'login', 'user', 'jwt', 'token', 'permission', 'role', 'credential', 'secret'],
    paths: ['src/auth', 'src/security', 'lib/auth']
  });

  // 2. Core Business Logic / Services
  specs.push({
    id: 'core-services',
    name: 'Core Business Services & APIs',
    agent: 'Core Services AI Agent',
    keywords: ['service', 'order', 'cart', 'checkout', 'payment', 'billing', 'product', 'business', 'api', 'controller'],
    paths: ['src/services', 'src/controllers', 'src/api', 'lib/services']
  });

  // 3. Frontend & Mobile UI
  if (detectedTypes.has('mobile') || detectedTypes.has('web') || detectedTypes.has('desktop')) {
    specs.push({
      id: 'frontend-ui',
      name: 'Frontend UI & Mobile Components',
      agent: 'Frontend & UI AI Agent',
      keywords: ['ui', 'view', 'component', 'screen', 'widget', 'frontend', 'react', 'flutter', 'angular', 'vue', 'dfm', 'fmx'],
      paths: ['src/components', 'src/views', 'lib/screens', 'lib/widgets']
    });
  }

  // 4. Data Architecture & Database
  specs.push({
    id: 'data-storage',
    name: 'Database & Data Architecture',
    agent: 'Data Architecture AI Agent',
    keywords: ['database', 'table', 'migration', 'entity', 'model', 'repository', 'dbcontext', 'sql', 'prisma', 'typeorm'],
    paths: ['src/db', 'src/entities', 'src/models', 'migrations']
  });

  // 5. DevOps & Infrastructure
  specs.push({
    id: 'devops-infra',
    name: 'Infrastructure & Deployment',
    agent: 'Infrastructure & DevOps AI Agent',
    keywords: ['docker', 'k8s', 'kubernetes', 'helm', 'terraform', 'ci', 'workflow', 'config', 'env', 'appsettings'],
    paths: ['docker', 'k8s', '.github', 'infra']
  });

  // 6. Scripts & Tooling
  if (detectedTypes.has('scripts')) {
    specs.push({
      id: 'scripts-automation',
      name: 'Automation Scripts & Tooling',
      agent: 'Automation & Tooling AI Agent',
      keywords: ['script', 'powershell', 'perl', 'shell', 'bash', 'automation', 'ps1', 'sh', 'pl'],
      paths: ['scripts', 'tools']
    });
  }

  return specs;
}

export function renderCategoriesMarkdown(specs: CategorySpec[]): string {
  const yamlSpecs = specs
    .map(
      (s) => `  - id: ${s.id}
    name: "${s.name}"
    agent: "${s.agent}"
    keywords: [${s.keywords.map((k) => `"${k}"`).join(', ')}]
    paths: [${s.paths.map((p) => `"${p}"`).join(', ')}]`
    )
    .join('\n\n');

  return `# BuildContext Category & Domain Architecture Spec
> **User Instructions:** Edit this file to add, rename, or customize domain categories for your codebase.
> When you run \`BuildContext: Refine Path\`, BuildContext will group, merge, and compact all knowledge files strictly into **exactly 1 compact Markdown file per category defined below**.

---
categories:
${yamlSpecs}
---

## How to Customize Categories
1. **Add Custom Business Domains**: Add custom categories above (e.g. \`claims-processing\`, \`patient-records\`, \`fraud-detection\`).
2. **Set Domain Keywords**: Add unique domain terms or project names into the \`keywords\` list.
3. **Run Refine Path**: Run \`BuildContext: Refine Path\` to merge all codebase context files into the exact categories listed above.
`;
}
