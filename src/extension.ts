import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import { IgnoreFilter } from './util/ignore';
import { scanWorkspaceFiles, ensureDirSync } from './util/fs';
import { findProjectCandidates } from './detect/projects';
import { groupApplications } from './detect/grouping';
import { extractPurpose } from './extract/readme';
import { extractBuildRunTestScripts } from './extract/scripts';
import { extractPrunedStructureTree } from './extract/structure';
import { extractComponentsFromFacts } from './extract/components';
import { extractInterfacesFromFacts } from './extract/interfaces';
import { extractDataEntities, extractConfigKeys, extractConventions, extractHotspots, extractCrossAppLinks } from './extract/data';
import { ApplicationKbData } from './kb/schema';
import { enforceTokenBudget } from './kb/budget';
import { renderApplicationKb } from './kb/render';
import { generateKbIndex } from './kb/index';
import { preserveManualBlocks } from './kb/merge-manual';
import { computeHash } from './util/hash';
import { JavaScriptTypeScriptAnalyzer } from './analyzers/javascript-typescript';
import { PythonAnalyzer } from './analyzers/python';
import { DartAnalyzer } from './analyzers/dart';
import { JavaAnalyzer } from './analyzers/java';
import { DotNetAnalyzer } from './analyzers/dotnet';
import { CppAnalyzer } from './analyzers/cpp';
import { DelphiAnalyzer } from './analyzers/delphi';
import { PowerShellAnalyzer } from './analyzers/powershell';
import { PerlAnalyzer } from './analyzers/perl';
import { ConfigAnalyzer } from './analyzers/config';
import { GenericFallbackAnalyzer } from './analyzers/generic-fallback';
import { LanguageAdapter, ExtractionContext } from './languages/adapter';
import { FileFacts } from './languages/tiers';
import { buildRefinementPlan } from './refine/plan';
import { applyRefinementPlan } from './refine/apply';
import { parseMarkdownFile } from './refine/parse';
import { generateSuggestedCategories, renderCategoriesMarkdown } from './refine/categoryGenerator';
import { generateAgentPointers } from './agents/pointers';
import { OllamaProvider } from './ai/adapters/ollama';
import { buildEvidencePack } from './ai/evidence';
import { authorApplicationKbAi } from './ai/author';
import { refineMarkdownWithAi } from './ai/refineAi';

let outputChannel: vscode.OutputChannel;

export function activate(context: vscode.ExtensionContext) {
  outputChannel = vscode.window.createOutputChannel('BuildContext');
  outputChannel.appendLine('BuildContext extension activated.');

  context.subscriptions.push(
    vscode.commands.registerCommand('buildcontext.workspace', async () => {
      await runWorkspaceScan();
    }),
    vscode.commands.registerCommand('buildcontext.folder', async () => {
      const uri = await vscode.window.showOpenDialog({
        canSelectFiles: false,
        canSelectFolders: true,
        canSelectMany: false,
        openLabel: 'Select Folder to Scan'
      });
      if (uri && uri[0]) {
        await runWorkspaceScan(uri[0].fsPath);
      }
    }),
    vscode.commands.registerCommand('buildcontext.refinePath', async () => {
      await runRefinePath(false);
    }),
    vscode.commands.registerCommand('buildcontext.workspaceAi', async () => {
      await runWorkspaceScan(undefined, true);
    }),
    vscode.commands.registerCommand('buildcontext.refinePathAi', async () => {
      await runRefinePath(true);
    }),
    vscode.commands.registerCommand('buildcontext.generatePointers', async () => {
      await runGeneratePointers();
    }),
    vscode.commands.registerCommand('buildcontext.openIndex', async () => {
      await openKbIndex();
    })
  );
}

export function deactivate() {}

async function runWorkspaceScan(folderOverride?: string, useAi = false) {
  const workspaceFolders = vscode.workspace.workspaceFolders;
  if (!workspaceFolders && !folderOverride) {
    vscode.window.showErrorMessage('No workspace or folder open.');
    return;
  }

  const targetDir = folderOverride || workspaceFolders![0].uri.fsPath;
  const config = vscode.workspace.getConfiguration('buildcontext');
  const configHash = computeHash(JSON.stringify(config));

  const outputFolderRel = config.get<string>('outputFolder') || '.buildcontext/kb';
  const outDir = path.isAbsolute(outputFolderRel) ? outputFolderRel : path.join(targetDir, outputFolderRel);

  ensureDirSync(outDir);

  await vscode.window.withProgress(
    {
      location: vscode.ProgressLocation.Notification,
      title: useAi ? 'BuildContext: Workspace AI' : 'BuildContext: Workspace',
      cancellable: true
    },
    async (progress, token) => {
      progress.report({ message: 'Discovering projects...', increment: 10 });
      outputChannel.appendLine(`Scanning directory: ${targetDir}`);

      const ignoreFilter = new IgnoreFilter(targetDir, config.get<string[]>('exclude') || []);
      const files = scanWorkspaceFiles(
        targetDir,
        ignoreFilter,
        config.get<number>('maxFiles') || 20000,
        config.get<number>('maxFileSizeKB') || 512
      );

      outputChannel.appendLine(`Found ${files.length} candidate files.`);

      progress.report({ message: 'Extracting knowledge...', increment: 30 });
      const candidates = findProjectCandidates(targetDir, files);
      const appGroups = groupApplications(candidates);
      const allAppIds = appGroups.map((g) => g.id);

      const analyzers: LanguageAdapter[] = [
        new JavaScriptTypeScriptAnalyzer(),
        new PythonAnalyzer(),
        new DartAnalyzer(),
        new JavaAnalyzer(),
        new DotNetAnalyzer(),
        new CppAnalyzer(),
        new DelphiAnalyzer(),
        new PowerShellAnalyzer(),
        new PerlAnalyzer(),
        new ConfigAnalyzer(),
        new GenericFallbackAnalyzer()
      ];

      const kbResults: ApplicationKbData[] = [];
      let writtenCount = 0;
      let unchangedCount = 0;

      for (const group of appGroups) {
        if (token.isCancellationRequested) break;

        const fileFactsMap = new Map<string, FileFacts>();
        for (const file of group.files) {
          const ext = file.extension;
          const analyzer = analyzers.find((a) => a.extensions.includes(ext)) || analyzers[analyzers.length - 1];
          let content = '';
          try {
            content = fs.readFileSync(file.absolutePath, 'utf-8');
          } catch {}

          const ctx: ExtractionContext = {
            workspaceRoot: targetDir,
            relativePath: file.relativePath,
            content,
            languageId: analyzer.id
          };
          fileFactsMap.set(file.relativePath, analyzer.extract(ctx));
        }

        const purpose = extractPurpose(group.files);
        const buildRunTest = extractBuildRunTestScripts(group.files);
        const structureMap = extractPrunedStructureTree(group.files);
        const components = extractComponentsFromFacts(fileFactsMap);
        const interfaces = extractInterfacesFromFacts(fileFactsMap);
        const dataEntities = extractDataEntities(fileFactsMap);
        const configKeys = extractConfigKeys(fileFactsMap);
        const conventions = extractConventions();
        const hotspots = extractHotspots(fileFactsMap);
        const relatedApps = extractCrossAppLinks(group.id, fileFactsMap, allAppIds);

        const fileStateStr = group.files.map((f) => `${f.relativePath}:${f.sizeBytes}`).join(';');
        const sourceHash = computeHash(`${configHash}:${fileStateStr}`);

        const kbDataRaw: ApplicationKbData = {
          frontMatter: {
            schema: 'buildcontext/1',
            id: group.id,
            name: group.name,
            type: group.type,
            languages: Array.from(new Set(group.files.map((f) => f.extension).filter(Boolean))),
            frameworks: [],
            root: group.rootPath,
            entry_points: group.files.filter((f) => /main|app|index/i.test(f.relativePath)).map((f) => f.relativePath).slice(0, 3),
            depends_on: [],
            related_apps: relatedApps.map((r) => r.targetAppId),
            source_hash: sourceHash,
            tokens: 0,
            mode: 'rule-based'
          },
          tldr: `${group.name} (${group.type}): ${purpose}`,
          quickFacts: {
            Type: group.type,
            Root: group.rootPath,
            Files: group.files.length.toString()
          },
          buildRunTest,
          structureMap,
          components,
          flows: [],
          interfaces,
          dataEntities,
          configKeys,
          dependencies: [],
          conventions,
          hotspots,
          relatedApps,
          evidenceIndex: group.files.slice(0, 10).map((f) => ({ claim: `Core file`, path: f.relativePath }))
        };

        let finalKbData = enforceTokenBudget(
          kbDataRaw,
          config.get<number>('kb.targetTokensPerApp') || 3000,
          config.get<number>('kb.hardCapTokensPerApp') || 6000
        );

        if (useAi) {
          const evidence = buildEvidencePack(group);
          const aiProvider = new OllamaProvider(config.get<string>('ai.endpoint'), config.get<string>('ai.model') || 'llama3');
          finalKbData = await authorApplicationKbAi(aiProvider, evidence, finalKbData);
        }

        kbResults.push(finalKbData);

        const filePath = path.join(outDir, `${group.id}.md`);
        let existingContent = '';
        if (fs.existsSync(filePath)) {
          existingContent = fs.readFileSync(filePath, 'utf-8');
        }

        const newAutoMarkdown = renderApplicationKb(finalKbData);
        const mergedMarkdown = preserveManualBlocks(existingContent, newAutoMarkdown);

        if (existingContent.trim() === mergedMarkdown.trim()) {
          unchangedCount++;
        } else {
          fs.writeFileSync(filePath, mergedMarkdown, 'utf-8');
          writtenCount++;
        }
      }

      progress.report({ message: 'Indexing suite...', increment: 30 });
      const { indexMarkdown, suiteJson } = generateKbIndex(kbResults, outDir);
      fs.writeFileSync(path.join(outDir, 'KB_INDEX.md'), indexMarkdown, 'utf-8');
      fs.writeFileSync(path.join(outDir, 'suite.json'), suiteJson, 'utf-8');

      const categoriesPath = path.join(outDir, 'CATEGORIES.md');
      if (!fs.existsSync(categoriesPath)) {
        const specs = generateSuggestedCategories(appGroups);
        const categoriesMd = renderCategoriesMarkdown(specs);
        fs.writeFileSync(categoriesPath, categoriesMd, 'utf-8');
      }

      const totalTokens = kbResults.reduce((acc, k) => acc + k.frontMatter.tokens, 0);

      vscode.window.showInformationMessage(
        `BuildContext: ${appGroups.length} apps scanned. ${writtenCount} written/updated, ${unchangedCount} unchanged (~${totalTokens} tokens). CATEGORIES.md generated.`
      );
    }
  );
}

function findAllMarkdownFiles(dirPath: string): string[] {
  let results: string[] = [];
  try {
    const entries = fs.readdirSync(dirPath, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(dirPath, entry.name);
      if (entry.isDirectory()) {
        if (!['node_modules', '_refined', '.buildcontext-backup', '.git', 'out', 'dist'].includes(entry.name)) {
          results = results.concat(findAllMarkdownFiles(fullPath));
        }
      } else if (entry.isFile() && entry.name.endsWith('.md') && entry.name !== 'KB_INDEX.md' && entry.name !== 'REFINE_REPORT.md' && entry.name !== 'CATEGORIES.md') {
        results.push(fullPath);
      }
    }
  } catch {}
  return results;
}

async function runRefinePath(useAi = false) {
  const uri = await vscode.window.showOpenDialog({
    canSelectFiles: false,
    canSelectFolders: true,
    canSelectMany: false,
    openLabel: 'Select Folder of Markdown Files to Refine'
  });
  if (!uri || !uri[0]) return;

  const folderPath = uri[0].fsPath;
  const files = findAllMarkdownFiles(folderPath);

  if (files.length === 0) {
    vscode.window.showWarningMessage('No Markdown files found to refine.');
    return;
  }

  const fileMap = new Map<string, string>();
  for (const fullPath of files) {
    fileMap.set(fullPath, fs.readFileSync(fullPath, 'utf-8'));
  }

  const plan = buildRefinementPlan(fileMap, 0.85, folderPath);

  if (useAi) {
    const config = vscode.workspace.getConfiguration('buildcontext');
    const aiProvider = new OllamaProvider(config.get<string>('ai.endpoint'), config.get<string>('ai.model') || 'llama3');
    for (const [filename, content] of plan.refinedFiles.entries()) {
      const parsed = parseMarkdownFile(filename, content);
      const aiRefined = await refineMarkdownWithAi(aiProvider, parsed);
      const renderedSections = aiRefined.sections.map((s) => `${'#'.repeat(s.level)} ${s.heading}\n${s.content}`).join('\n\n');
      const fullRender = [aiRefined.frontMatter, renderedSections, aiRefined.manualSection].filter(Boolean).join('\n\n');
      plan.refinedFiles.set(filename, fullRender);
    }
  }

  const result = applyRefinementPlan(plan, folderPath, false, false);

  if (fs.existsSync(result.reportPath)) {
    const doc = await vscode.workspace.openTextDocument(result.reportPath);
    await vscode.window.showTextDocument(doc);
  }

  const choice = await vscode.window.showInformationMessage(
    `BuildContext: Refine Path complete! Saved ${plan.totalTokensBefore - plan.totalTokensAfter} tokens across ${plan.recommendedAgents.length} domain agents. Would you like to replace raw files in your folder with these refined category files?`,
    'Replace Folder Files',
    'Keep in _refined/ Subfolder'
  );

  if (choice === 'Replace Folder Files') {
    applyRefinementPlan(plan, folderPath, true, true);
    // Delete raw individual files outside backup
    for (const f of files) {
      if (fs.existsSync(f) && !f.includes('_refined') && !f.includes('.buildcontext-backup')) {
        try { fs.unlinkSync(f); } catch {}
      }
    }
    vscode.window.showInformationMessage(`Folder contents replaced with ${plan.recommendedAgents.length} merged category files (backup saved to .buildcontext-backup/).`);
  }
}

async function runGeneratePointers() {
  const workspaceFolders = vscode.workspace.workspaceFolders;
  if (!workspaceFolders) {
    vscode.window.showErrorMessage('No workspace open.');
    return;
  }

  const root = workspaceFolders[0].uri.fsPath;
  const updated = generateAgentPointers(root, '.buildcontext/kb/KB_INDEX.md', {
    agentsMd: true,
    claudeMd: true,
    copilotInstructions: true,
    cursorMdc: true
  });

  vscode.window.showInformationMessage(`Updated agent pointer files: ${updated.map((f) => path.basename(f)).join(', ')}`);
}

async function openKbIndex() {
  const workspaceFolders = vscode.workspace.workspaceFolders;
  if (!workspaceFolders) return;
  const indexPath = path.join(workspaceFolders[0].uri.fsPath, '.buildcontext/kb/KB_INDEX.md');
  if (fs.existsSync(indexPath)) {
    const doc = await vscode.workspace.openTextDocument(indexPath);
    await vscode.window.showTextDocument(doc);
  } else {
    vscode.window.showWarningMessage('KB_INDEX.md does not exist yet. Run BuildContext: Workspace first.');
  }
}
