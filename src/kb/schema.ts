export type AppType =
  | 'mobile'
  | 'web'
  | 'backend'
  | 'desktop'
  | 'cli'
  | 'worker'
  | 'library'
  | 'shared'
  | 'infra'
  | 'scripts'
  | 'legacy';

export interface KbFrontMatter {
  schema: 'buildcontext/1';
  id: string;
  name: string;
  type: AppType;
  languages: string[];
  frameworks: string[];
  root: string;
  entry_points: string[];
  depends_on: string[];
  related_apps: string[];
  source_hash: string;
  commit?: string;
  tokens: number;
  mode: 'rule-based' | 'ai';
  model?: string;
}

export interface ComponentInfo {
  name: string;
  role: string;
  file: string;
  dependsOn?: string[];
  usedBy?: string[];
}

export interface FlowInfo {
  name: string;
  trigger: string;
  chain: string[];
}

export interface InterfaceInfo {
  type: 'HTTP' | 'gRPC' | 'GraphQL' | 'Event' | 'Export' | 'CLI' | 'Library';
  methodOrKind?: string;
  pathOrName: string;
  handlerOrFile: string;
  line?: number;
}

export interface DataEntity {
  name: string;
  kind: 'Entity' | 'Table' | 'Collection' | 'Store' | 'Model';
  fieldsOrTable?: string;
}

export interface ConfigKey {
  key: string;
  sourceFile: string;
  description?: string;
}

export interface DependencyInfo {
  name: string;
  version?: string;
  isInternal: boolean;
}

export interface HotspotInfo {
  file: string;
  reason: string;
  lineCount?: number;
  todoCount?: number;
}

export interface CrossAppLink {
  targetAppId: string;
  reason: string;
  evidence: string;
}

export interface ApplicationKbData {
  frontMatter: KbFrontMatter;
  tldr: string;
  quickFacts: Record<string, string>;
  buildRunTest: Record<string, string>;
  structureMap: string;
  components: ComponentInfo[];
  flows: FlowInfo[];
  interfaces: InterfaceInfo[];
  dataEntities: DataEntity[];
  configKeys: ConfigKey[];
  dependencies: DependencyInfo[];
  conventions: string[];
  hotspots: HotspotInfo[];
  relatedApps: CrossAppLink[];
  evidenceIndex: Array<{ claim: string; path: string; line?: number }>;
}
