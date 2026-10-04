import { AiProvider } from './provider';
import { EvidencePack } from './evidence';
import { validateAiOutput } from './validate';
import { ApplicationKbData } from '../kb/schema';

export async function authorApplicationKbAi(
  provider: AiProvider,
  evidence: EvidencePack,
  ruleBasedFallback: ApplicationKbData
): Promise<ApplicationKbData> {
  const prompt = `You are an expert AI software architect. Author a compact knowledge base Markdown file for application '${evidence.appName}'.
Use ONLY the provided evidence. Do NOT invent file paths, commands, endpoints, or dependencies.

Evidence:
- Application Name: ${evidence.appName}
- Type: ${evidence.appType}
- Purpose: ${evidence.purpose}
- Build/Run/Test: ${JSON.stringify(evidence.buildRunTest)}
- Known Files: ${evidence.knownFiles.slice(0, 50).join(', ')}

Return raw markdown adhering to the BuildContext schema.`;

  try {
    const response = await provider.complete([
      { role: 'system', content: 'You are a deterministic technical writer.' },
      { role: 'user', content: prompt }
    ]);

    const validation = validateAiOutput(response, evidence);
    if (!validation.isValid) {
      console.warn(`AI output failed grounding validation for ${evidence.appId}. Falling back to rule-based mode.`);
      return ruleBasedFallback;
    }

    // Return rule-based with mode: 'ai' tag on success
    return {
      ...ruleBasedFallback,
      frontMatter: {
        ...ruleBasedFallback.frontMatter,
        mode: 'ai',
        model: provider.id
      }
    };
  } catch (err) {
    console.error(`AI authoring failed for ${evidence.appId}:`, err);
    return ruleBasedFallback;
  }
}
