import * as path from 'path';
import { FileEntry } from '../util/fs';

export interface ProjectCandidate {
  id: string;
  name: string;
  rootPath: string;
  manifestFile?: string;
  manifestType: string;
  files: FileEntry[];
}

export function findProjectCandidates(rootDir: string, files: FileEntry[]): ProjectCandidate[] {
  const manifestMap = new Map<string, { manifestFile: string; type: string }>();

  for (const file of files) {
    const filename = path.basename(file.relativePath).toLowerCase();
    const dir = path.dirname(file.relativePath);

    if (filename === 'package.json') {
      manifestMap.set(dir, { manifestFile: file.relativePath, type: 'node' });
    } else if (filename === 'pubspec.yaml') {
      manifestMap.set(dir, { manifestFile: file.relativePath, type: 'flutter' });
    } else if (filename === 'pom.xml' || filename.endsWith('.gradle') || filename.endsWith('.gradle.kts')) {
      manifestMap.set(dir, { manifestFile: file.relativePath, type: 'java' });
    } else if (filename.endsWith('.csproj') || filename.endsWith('.sln') || filename.endsWith('.vbproj')) {
      manifestMap.set(dir, { manifestFile: file.relativePath, type: 'dotnet' });
    } else if (filename === 'pyproject.toml' || filename === 'setup.py' || filename.startsWith('requirements')) {
      manifestMap.set(dir, { manifestFile: file.relativePath, type: 'python' });
    } else if (filename === 'go.mod') {
      manifestMap.set(dir, { manifestFile: file.relativePath, type: 'go' });
    } else if (filename === 'cargo.toml') {
      manifestMap.set(dir, { manifestFile: file.relativePath, type: 'rust' });
    } else if (filename === 'composer.json') {
      manifestMap.set(dir, { manifestFile: file.relativePath, type: 'php' });
    } else if (filename === 'gemfile') {
      manifestMap.set(dir, { manifestFile: file.relativePath, type: 'ruby' });
    } else if (filename === 'cmakelists.txt' || filename.endsWith('.vcxproj')) {
      manifestMap.set(dir, { manifestFile: file.relativePath, type: 'cpp' });
    } else if (filename.endsWith('.dpr') || filename.endsWith('.dpk') || filename.endsWith('.dproj') || filename.endsWith('.groupproj')) {
      manifestMap.set(dir, { manifestFile: file.relativePath, type: 'delphi' });
    } else if (filename === 'cpanfile' || filename === 'makefile.pl') {
      manifestMap.set(dir, { manifestFile: file.relativePath, type: 'perl' });
    } else if (filename.endsWith('.psd1')) {
      manifestMap.set(dir, { manifestFile: file.relativePath, type: 'powershell' });
    }
  }

  // If no manifests found, create a fallback candidate for root or top folders
  if (manifestMap.size === 0) {
    const rootCandidate: ProjectCandidate = {
      id: 'workspace-app',
      name: path.basename(rootDir) || 'Workspace App',
      rootPath: '.',
      manifestType: 'generic',
      files
    };
    return [rootCandidate];
  }

  const candidates: ProjectCandidate[] = [];
  for (const [dir, info] of manifestMap.entries()) {
    const projectFiles = files.filter((f) => {
      if (dir === '.') return true;
      return f.relativePath === dir || f.relativePath.startsWith(dir + '/');
    });

    const slug = dir === '.' ? 'root-app' : dir.replace(/[\/\\]/g, '-').toLowerCase();
    const name = dir === '.' ? path.basename(rootDir) : path.basename(dir);

    candidates.push({
      id: slug,
      name,
      rootPath: dir,
      manifestFile: info.manifestFile,
      manifestType: info.type,
      files: projectFiles
    });
  }

  return candidates;
}
