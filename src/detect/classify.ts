import { AppType } from '../kb/schema';
import { ProjectCandidate } from './projects';

export function classifyApplication(candidate: ProjectCandidate): AppType {
  const typeStr = candidate.manifestType.toLowerCase();
  const nameStr = candidate.name.toLowerCase();

  if (typeStr === 'flutter') return 'mobile';
  if (typeStr === 'java') return 'backend';
  if (typeStr === 'dotnet') {
    if (candidate.files.some(f => f.extension === '.razor' || f.extension === '.xaml')) return 'desktop';
    return 'backend';
  }
  if (typeStr === 'python') return 'backend';
  if (typeStr === 'cpp' || typeStr === 'delphi') {
    if (candidate.files.some(f => f.extension === '.dfm' || f.extension === '.fmx')) return 'desktop';
    return 'desktop';
  }
  if (typeStr === 'node') {
    if (nameStr.includes('api') || nameStr.includes('backend') || nameStr.includes('server')) return 'backend';
    if (nameStr.includes('web') || nameStr.includes('ui') || nameStr.includes('front')) return 'web';
    return 'backend';
  }
  if (typeStr === 'powershell' || typeStr === 'perl' || typeStr === 'shell') return 'scripts';

  return 'backend';
}
