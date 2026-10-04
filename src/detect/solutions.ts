import { ProjectCandidate } from './projects';

export function detectSolutionGroupings(candidates: ProjectCandidate[]): ProjectCandidate[] {
  // If there's a solution file (.sln, .groupproj, pnpm-workspace), check if projects form one system
  return candidates;
}
