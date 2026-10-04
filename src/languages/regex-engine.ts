import { FileFacts, createEmptyFileFacts } from './tiers';
import { stripCommentsAndStrings } from './comment-stripper';

export interface RuleCaptureGroupMap {
  module?: number;
  symbol?: number;
  name?: number;
  kind?: number;
  method?: number;
  path?: number;
  handler?: number;
  entity?: number;
  target?: number;
  key?: number;
}

export interface RuleDefinition {
  id: string;
  kind: 'import' | 'declaration' | 'entry' | 'route' | 'data' | 'external' | 'config';
  pattern: string;
  flags?: string;
  captureGroups?: RuleCaptureGroupMap;
  confidence?: number;
  description?: string;
}

export interface RulePack {
  languageId: string;
  rules: RuleDefinition[];
}

export function executeRulePack(
  code: string,
  relativePath: string,
  rulePack: RulePack,
  languageId: string
): FileFacts {
  const facts = createEmptyFileFacts();

  // Basic LOC count
  const rawLines = code.split(/\r?\n/);
  facts.loc = rawLines.length;

  // Detect TODOs/FIXMEs in raw code
  for (let i = 0; i < rawLines.length; i++) {
    const line = rawLines[i];
    const todoMatch = line.match(/\b(TODO|FIXME|HACK|BUG)\b:?\s*(.*)/i);
    if (todoMatch) {
      facts.todos.push({
        text: todoMatch[0].trim(),
        evidence: { file: relativePath, line: i + 1, snippet: line.trim() }
      });
    }
  }

  // Strip comments for structural parsing
  const { strippedCode, lineMap } = stripCommentsAndStrings(code, languageId);
  const lines = strippedCode.split(/\r?\n/);

  for (const rule of rulePack.rules) {
    let regex: RegExp;
    try {
      regex = new RegExp(rule.pattern, rule.flags || 'g');
    } catch {
      continue;
    }

    for (let idx = 0; idx < lines.length; idx++) {
      const lineText = lines[idx];
      if (!lineText.trim()) continue;

      regex.lastIndex = 0;
      let match: RegExpExecArray | null;

      while ((match = regex.exec(lineText)) !== null) {
        const lineNum = lineMap[idx] || idx + 1;
        const cg = rule.captureGroups || {};

        const modVal = cg.module ? match[cg.module] : match[1];
        const nameVal = cg.name ? match[cg.name] : match[1];
        const kindVal = cg.kind ? match[cg.kind] : 'declaration';
        const methodVal = cg.method ? match[cg.method] : 'GET';
        const pathVal = cg.path ? match[cg.path] : match[1];
        const handlerVal = cg.handler ? match[cg.handler] : relativePath;

        switch (rule.kind) {
          case 'import':
            if (modVal) {
              facts.imports.push({
                module: modVal.trim(),
                symbol: cg.symbol ? match[cg.symbol] : undefined,
                evidence: { file: relativePath, line: lineNum, snippet: lineText.trim() }
              });
            }
            break;
          case 'declaration':
            if (nameVal) {
              facts.declarations.push({
                kind: kindVal,
                name: nameVal.trim(),
                evidence: { file: relativePath, line: lineNum, snippet: lineText.trim() }
              });
            }
            break;
          case 'entry':
            if (nameVal) {
              facts.entryPoints.push({
                name: nameVal.trim(),
                kind: kindVal,
                evidence: { file: relativePath, line: lineNum, snippet: lineText.trim() }
              });
            }
            break;
          case 'route':
            if (pathVal) {
              facts.routes.push({
                method: methodVal,
                path: pathVal.trim(),
                handler: handlerVal,
                evidence: { file: relativePath, line: lineNum, snippet: lineText.trim() }
              });
            }
            break;
          case 'data':
            if (nameVal) {
              facts.dataAccess.push({
                entityOrTable: nameVal.trim(),
                operation: methodVal,
                evidence: { file: relativePath, line: lineNum, snippet: lineText.trim() }
              });
            }
            break;
          case 'external':
            if (nameVal) {
              facts.externalCalls.push({
                target: nameVal.trim(),
                kind: kindVal,
                evidence: { file: relativePath, line: lineNum, snippet: lineText.trim() }
              });
            }
            break;
          case 'config':
            if (nameVal) {
              facts.configKeys.push({
                key: nameVal.trim(),
                evidence: { file: relativePath, line: lineNum, snippet: lineText.trim() }
              });
            }
            break;
        }

        if (!rule.flags?.includes('g')) break;
      }
    }
  }

  return facts;
}
