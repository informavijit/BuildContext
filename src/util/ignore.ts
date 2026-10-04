import * as path from 'path';
import * as fs from 'fs';

export const DEFAULT_ALWAYS_IGNORE_DIRS = new Set([
  'node_modules',
  'build',
  'dist',
  'out',
  '.dart_tool',
  '.git',
  'bin',
  'obj',
  'target',
  'venv',
  '.venv',
  'env',
  '.idea',
  '.vscode',
  '.vscode-test',
  '.buildcontext',
  'coverage',
  'vendor',
  '__pycache__',
  '.next',
  '.nuxt',
  '.svelte-kit',
  '.gradle'
]);

export const DEFAULT_ALWAYS_IGNORE_FILES = new Set([
  'package-lock.json',
  'yarn.lock',
  'pnpm-lock.yaml',
  'Cargo.lock',
  'Gemfile.lock',
  'composer.lock',
  'pubspec.lock',
  'poetry.lock'
]);

export const BINARY_EXTENSIONS = new Set([
  '.exe', '.dll', '.so', '.dylib', '.a', '.lib', '.o', '.obj',
  '.zip', '.tar', '.gz', '.7z', '.rar', '.jar', '.war', '.ear',
  '.png', '.jpg', '.jpeg', '.gif', '.ico', '.svg', '.webp', '.pdf',
  '.mp3', '.mp4', '.mov', '.avi', '.pyc', '.pyo', '.class', '.dcu'
]);

export class IgnoreFilter {
  private patterns: Array<{ regex: RegExp; negated: boolean }> = [];

  constructor(workspaceRoot?: string, customRules: string[] = []) {
    this.addDefaultRules();

    if (workspaceRoot) {
      this.loadIgnoreFile(path.join(workspaceRoot, '.gitignore'));
      this.loadIgnoreFile(path.join(workspaceRoot, '.buildcontextignore'));
    }

    for (const rule of customRules) {
      this.addRule(rule);
    }
  }

  private addDefaultRules(): void {
    for (const dir of DEFAULT_ALWAYS_IGNORE_DIRS) {
      this.addRule(`**/${dir}/**`);
    }
    for (const file of DEFAULT_ALWAYS_IGNORE_FILES) {
      this.addRule(`**/${file}`);
    }
  }

  public loadIgnoreFile(filePath: string): void {
    if (fs.existsSync(filePath)) {
      try {
        const content = fs.readFileSync(filePath, 'utf-8');
        const lines = content.split(/\r?\n/);
        for (const line of lines) {
          const trimmed = line.trim();
          if (trimmed && !trimmed.startsWith('#')) {
            this.addRule(trimmed);
          }
        }
      } catch {
        // Ignore read errors gracefully
      }
    }
  }

  public addRule(globPattern: string): void {
    let negated = false;
    let pat = globPattern.trim();
    if (pat.startsWith('!')) {
      negated = true;
      pat = pat.substring(1);
    }

    const regexStr = globToRegex(pat);
    this.patterns.push({ regex: new RegExp(regexStr), negated });
  }

  public isIgnored(relativePath: string, isDir: boolean = false): boolean {
    const normalized = relativePath.replace(/\\/g, '/');
    const filename = path.basename(normalized);
    const ext = path.extname(filename).toLowerCase();

    if (isDir) {
      if (DEFAULT_ALWAYS_IGNORE_DIRS.has(filename)) {
        return true;
      }
    } else {
      if (DEFAULT_ALWAYS_IGNORE_FILES.has(filename) || BINARY_EXTENSIONS.has(ext)) {
        return true;
      }
    }

    let ignored = false;
    for (const { regex, negated } of this.patterns) {
      if (regex.test(normalized) || (isDir && regex.test(normalized + '/'))) {
        ignored = !negated;
      }
    }

    return ignored;
  }
}

function globToRegex(glob: string): string {
  let g = glob;
  if (g.startsWith('/')) {
    g = g.substring(1);
  }
  let re = g
    .replace(/\./g, '\\.')
    .replace(/\*\*/g, '___DOUBLESTAR___')
    .replace(/\*/g, '[^/]*')
    .replace(/\?/g, '[^/]')
    .replace(/___DOUBLESTAR___/g, '.*');

  return `^${re}(?:/.*)?$`;
}
