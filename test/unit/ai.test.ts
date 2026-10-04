import { describe, it, expect } from 'vitest';
import { validateAiOutput } from '../../src/ai/validate';
import { EvidencePack } from '../../src/ai/evidence';

describe('AI Grounding Validation', () => {
  const evidence: EvidencePack = {
    appId: 'test-app',
    appName: 'Test App',
    appType: 'backend',
    structureTree: 'src/',
    purpose: 'Test app',
    buildRunTest: { Run: 'npm start' },
    knownFiles: ['src/server.js', 'package.json'],
    configKeys: [],
    symbolOutlines: []
  };

  it('should validate valid cited paths', () => {
    const markdown = 'Main entry point is [`src/server.js`](file:///src/server.js).';
    const result = validateAiOutput(markdown, evidence);
    expect(result.isValid).toBe(true);
    expect(result.unverifiedClaims.length).toBe(0);
  });

  it('should flag hallucinated file paths', () => {
    const markdown = [
      '[`fake/path1.js`](file:///fake/path1.js)',
      '[`fake/path2.js`](file:///fake/path2.js)',
      '[`fake/path3.js`](file:///fake/path3.js)',
      '[`fake/path4.js`](file:///fake/path4.js)',
      '[`fake/path5.js`](file:///fake/path5.js)',
      '[`fake/path6.js`](file:///fake/path6.js)'
    ].join('\n');

    const result = validateAiOutput(markdown, evidence);
    expect(result.isValid).toBe(false);
    expect(result.unverifiedClaims.length).toBeGreaterThan(5);
  });
});
