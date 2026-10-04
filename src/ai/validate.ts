import { EvidencePack } from './evidence';

export interface GroundingValidationResult {
  isValid: boolean;
  groundedContent: string;
  unverifiedClaims: string[];
}

export function validateAiOutput(
  aiMarkdown: string,
  evidence: EvidencePack
): GroundingValidationResult {
  const unverifiedClaims: string[] = [];
  let groundedContent = aiMarkdown;

  // Check file links in markdown: [`src/foo.ts`](file:///...)
  const linkMatches = aiMarkdown.match(/\[`([^`]+)`\]\(file:\/\/\/[^)]+\)/g);
  if (linkMatches) {
    for (const match of linkMatches) {
      const pathMatch = match.match(/\[`([^`]+)`\]/);
      if (pathMatch) {
        const citedPath = pathMatch[1];
        const exists = evidence.knownFiles.some((f) => f === citedPath || f.endsWith(citedPath));
        if (!exists) {
          unverifiedClaims.push(`Cited path does not exist: ${citedPath}`);
          groundedContent = groundedContent.replace(match, `\`${citedPath}\` <!-- unverified -->`);
        }
      }
    }
  }

  const isValid = unverifiedClaims.length <= 5; // Fail if more than 5 hallucinated claims

  return { isValid, groundedContent, unverifiedClaims };
}
