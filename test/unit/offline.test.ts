import { describe, it, expect, vi } from 'vitest';
import * as path from 'path';
import { scanWorkspaceFiles } from '../../src/util/fs';
import { IgnoreFilter } from '../../src/util/ignore';
import { findProjectCandidates } from '../../src/detect/projects';

describe('Offline Safety Guarantee', () => {
  it('should process projects without making network calls', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch');

    const fixtureDir = path.resolve(__dirname, '../fixtures');
    const ignoreFilter = new IgnoreFilter(fixtureDir);
    const files = scanWorkspaceFiles(fixtureDir, ignoreFilter);
    const candidates = findProjectCandidates(fixtureDir, files);

    expect(candidates.length).toBeGreaterThan(0);
    expect(fetchSpy).not.toHaveBeenCalled();

    fetchSpy.mockRestore();
  });
});
