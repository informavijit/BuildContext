import { describe, it, expect } from 'vitest';
import { ApplicationKbData } from '../../src/kb/schema';
import { renderApplicationKb } from '../../src/kb/render';
import { preserveManualBlocks } from '../../src/kb/merge-manual';

describe('Knowledge Base Generator & Manual Preservation', () => {
  const sampleData: ApplicationKbData = {
    frontMatter: {
      schema: 'buildcontext/1',
      id: 'test-app',
      name: 'Test App',
      type: 'backend',
      languages: ['typescript'],
      frameworks: ['express'],
      root: 'src',
      entry_points: ['src/server.ts'],
      depends_on: [],
      related_apps: [],
      source_hash: 'abc123hash',
      tokens: 100,
      mode: 'rule-based'
    },
    tldr: 'Test application for unit testing.',
    quickFacts: { Type: 'backend' },
    buildRunTest: { Run: 'npm start' },
    structureMap: 'src/\n  server.ts',
    components: [{ name: 'Server', role: 'Main server instance', file: 'src/server.ts' }],
    flows: [],
    interfaces: [],
    dataEntities: [],
    configKeys: [],
    dependencies: [],
    conventions: ['Follow standard style'],
    hotspots: [],
    relatedApps: [],
    evidenceIndex: []
  };

  it('should render valid schema markdown', () => {
    const rendered = renderApplicationKb(sampleData);
    expect(rendered).toContain('schema: buildcontext/1');
    expect(rendered).toContain('<!-- buildcontext:auto:start -->');
    expect(rendered).toContain('<!-- buildcontext:auto:end -->');
    expect(rendered).toContain('<!-- buildcontext:manual -->');
  });

  it('should preserve manual section content across regeneration', () => {
    const rendered = renderApplicationKb(sampleData);
    const withManual = `${rendered}\nCustom note added by developer.\n`;

    const newRender = renderApplicationKb({ ...sampleData, tldr: 'Updated TLDR' });
    const preserved = preserveManualBlocks(withManual, newRender);

    expect(preserved).toContain('Custom note added by developer.');
    expect(preserved).toContain('Updated TLDR');
  });
});
