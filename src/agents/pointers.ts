import * as fs from 'fs';
import * as path from 'path';
import { ensureDirSync } from '../util/fs';

export interface AgentPointerOptions {
  agentsMd: boolean;
  claudeMd: boolean;
  copilotInstructions: boolean;
  cursorMdc: boolean;
}

export function generateAgentPointers(
  workspaceRoot: string,
  kbIndexRelativePath = '.buildcontext/kb/KB_INDEX.md',
  options: AgentPointerOptions
): string[] {
  const updatedFiles: string[] = [];

  const managedBlock = `
<!-- buildcontext:managed:start -->
## Knowledge Base Instructions
This workspace uses BuildContext to maintain compact, up-to-date knowledge-base Markdown files for AI coding agents.
Before scanning the entire repository, check \`${kbIndexRelativePath}\` first.
Read only the relevant \`<app-id>.md\` context file for the application you are working on.
<!-- buildcontext:managed:end -->
`.trim();

  if (options.agentsMd) {
    const file = path.join(workspaceRoot, 'AGENTS.md');
    appendManagedBlock(file, managedBlock);
    updatedFiles.push(file);
  }

  if (options.claudeMd) {
    const file = path.join(workspaceRoot, 'CLAUDE.md');
    appendManagedBlock(file, managedBlock);
    updatedFiles.push(file);
  }

  if (options.copilotInstructions) {
    const file = path.join(workspaceRoot, '.github', 'copilot-instructions.md');
    ensureDirSync(path.dirname(file));
    appendManagedBlock(file, managedBlock);
    updatedFiles.push(file);
  }

  if (options.cursorMdc) {
    const file = path.join(workspaceRoot, '.cursor', 'rules', 'buildcontext.mdc');
    ensureDirSync(path.dirname(file));
    appendManagedBlock(file, managedBlock);
    updatedFiles.push(file);
  }

  return updatedFiles;
}

function appendManagedBlock(filePath: string, managedBlock: string): void {
  let content = '';
  if (fs.existsSync(filePath)) {
    content = fs.readFileSync(filePath, 'utf-8');
  }

  const startMarker = '<!-- buildcontext:managed:start -->';
  const endMarker = '<!-- buildcontext:managed:end -->';

  const startIdx = content.indexOf(startMarker);
  const endIdx = content.indexOf(endMarker);

  if (startIdx !== -1 && endIdx !== -1) {
    // Replace existing managed block
    const before = content.substring(0, startIdx);
    const after = content.substring(endIdx + endMarker.length);
    content = `${before.trim()}\n\n${managedBlock}\n\n${after.trim()}`.trim() + '\n';
  } else {
    // Append managed block
    content = content ? `${content.trim()}\n\n${managedBlock}\n` : `${managedBlock}\n`;
  }

  fs.writeFileSync(filePath, content, 'utf-8');
}
