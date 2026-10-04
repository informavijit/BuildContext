import { LanguageAdapter, ExtractionContext } from '../languages/adapter';
import { LanguageTier, FileFacts } from '../languages/tiers';
import { executeRulePack, RulePack } from '../languages/regex-engine';
import jsTsRules from '../rules/js-ts.json';
import reactRules from '../rules/react.json';
import angularRules from '../rules/angular.json';
import nodeRules from '../rules/node.json';

export class JavaScriptTypeScriptAnalyzer implements LanguageAdapter {
  id = 'javascript-typescript';
  extensions = ['.js', '.jsx', '.ts', '.tsx', '.mjs', '.cjs', '.vue', '.svelte'];
  manifests = ['package.json', 'tsconfig.json'];
  tier = LanguageTier.Tier1Deep;

  extract(context: ExtractionContext): FileFacts {
    const baseFacts = executeRulePack(context.content, context.relativePath, jsTsRules as RulePack, 'typescript');
    const reactFacts = executeRulePack(context.content, context.relativePath, reactRules as RulePack, 'react');
    const angularFacts = executeRulePack(context.content, context.relativePath, angularRules as RulePack, 'angular');
    const nodeFacts = executeRulePack(context.content, context.relativePath, nodeRules as RulePack, 'node');

    return {
      imports: [...baseFacts.imports, ...reactFacts.imports, ...angularFacts.imports, ...nodeFacts.imports],
      declarations: [...baseFacts.declarations, ...reactFacts.declarations, ...angularFacts.declarations, ...nodeFacts.declarations],
      entryPoints: [...baseFacts.entryPoints, ...reactFacts.entryPoints, ...angularFacts.entryPoints, ...nodeFacts.entryPoints],
      routes: [...baseFacts.routes, ...reactFacts.routes, ...angularFacts.routes, ...nodeFacts.routes],
      dataAccess: [...baseFacts.dataAccess, ...reactFacts.dataAccess, ...angularFacts.dataAccess, ...nodeFacts.dataAccess],
      externalCalls: [...baseFacts.externalCalls, ...reactFacts.externalCalls, ...angularFacts.externalCalls, ...nodeFacts.externalCalls],
      configKeys: [...baseFacts.configKeys, ...reactFacts.configKeys, ...angularFacts.configKeys, ...nodeFacts.configKeys],
      todos: [...baseFacts.todos, ...reactFacts.todos, ...angularFacts.todos, ...nodeFacts.todos],
      loc: baseFacts.loc,
      commentLoc: baseFacts.commentLoc
    };
  }
}
