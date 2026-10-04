import { ProjectCandidate } from './projects';
import { AppType } from '../kb/schema';
import { classifyApplication } from './classify';

export interface ApplicationGroup {
  id: string;
  name: string;
  type: AppType;
  rootPath: string;
  files: ProjectCandidate['files'];
}

export function groupApplications(candidates: ProjectCandidate[]): ApplicationGroup[] {
  return candidates.map((c) => ({
    id: c.id,
    name: c.name,
    type: classifyApplication(c),
    rootPath: c.rootPath,
    files: c.files
  }));
}
