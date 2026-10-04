import { describe, it, expect } from 'vitest';
import * as path from 'path';
import * as fs from 'fs';
import { removeNoise } from '../../src/refine/noise-rules';
import { buildRefinementPlan } from '../../src/refine/plan';
import { applyRefinementPlan } from '../../src/refine/apply';

describe('Refine Path Engine', () => {
  it('should remove badges and placeholder text', () => {
    const raw = `# Title
![badge](https://img.shields.io/badge/status-active-green)
<!-- some comment -->

TBD

## Details
Content here.`;

    const { cleanedText, removedItems } = removeNoise(raw);
    expect(cleanedText).not.toContain('shields.io');
    expect(cleanedText).not.toContain('TBD');
    expect(removedItems.length).toBeGreaterThan(0);
  });

  it('should cluster and merge related files into single refined files inside _refined subfolder', () => {
    const fixtureDir = path.resolve(__dirname, '../fixtures/messy-kb-folder');
    const files = fs.readdirSync(fixtureDir).filter((f) => f.endsWith('.md'));

    const fileMap = new Map<string, string>();
    for (const f of files) {
      const fullPath = path.join(fixtureDir, f);
      fileMap.set(fullPath, fs.readFileSync(fullPath, 'utf-8'));
    }

    const plan = buildRefinementPlan(fileMap);
    expect(plan.actions.some((a) => a.action === 'Merge')).toBe(true);

    const result = applyRefinementPlan(plan, fixtureDir, false, false);
    const refinedDir = path.dirname(result.reportPath);

    expect(fs.existsSync(refinedDir)).toBe(true);
    expect(fs.existsSync(path.join(refinedDir, 'orders-api.md'))).toBe(true);
    expect(fs.existsSync(path.join(refinedDir, 'user-service.md'))).toBe(true);
    expect(fs.existsSync(path.join(refinedDir, 'REFINE_REPORT.md'))).toBe(true);

    const mergedOrdersContent = fs.readFileSync(path.join(refinedDir, 'orders-api.md'), 'utf-8');
    // Verify GET and POST endpoints were merged into one file
    expect(mergedOrdersContent).toContain('GET');
    expect(mergedOrdersContent).toContain('POST');
  });

  it('should be idempotent on second run', () => {
    const fileMap = new Map<string, string>([
      ['file1.md', '# Header\n\nContent paragraph with useful facts.']
    ]);

    const plan1 = buildRefinementPlan(fileMap);
    const plan2 = buildRefinementPlan(plan1.refinedFiles);

    expect(plan2.totalTokensBefore).toBe(plan2.totalTokensAfter);
  });
});
