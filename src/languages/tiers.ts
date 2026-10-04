export enum LanguageTier {
  Tier1Deep = 1,      // AST / Symbol Provider + Deep semantic rules
  Tier2Structural = 2, // Declarative Regex Rule Pack Engine
  Tier3Inventory = 3   // Basic metrics & inventory fallback
}

export interface FactEvidence {
  file: string;
  line?: number;
  snippet?: string;
}

export interface FileFacts {
  imports: Array<{ module: string; symbol?: string; evidence: FactEvidence }>;
  declarations: Array<{ kind: string; name: string; evidence: FactEvidence }>;
  entryPoints: Array<{ name: string; kind: string; evidence: FactEvidence }>;
  routes: Array<{ method?: string; path: string; handler: string; evidence: FactEvidence }>;
  dataAccess: Array<{ entityOrTable: string; operation?: string; evidence: FactEvidence }>;
  externalCalls: Array<{ target: string; kind: string; evidence: FactEvidence }>;
  configKeys: Array<{ key: string; evidence: FactEvidence }>;
  todos: Array<{ text: string; evidence: FactEvidence }>;
  loc: number;
  commentLoc: number;
}

export function createEmptyFileFacts(): FileFacts {
  return {
    imports: [],
    declarations: [],
    entryPoints: [],
    routes: [],
    dataAccess: [],
    externalCalls: [],
    configKeys: [],
    todos: [],
    loc: 0,
    commentLoc: 0
  };
}
