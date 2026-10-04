import { describe, it, expect } from 'vitest';
import * as path from 'path';
import { scanWorkspaceFiles } from '../../src/util/fs';
import { IgnoreFilter } from '../../src/util/ignore';
import { findProjectCandidates } from '../../src/detect/projects';
import { groupApplications } from '../../src/detect/grouping';

describe('Project Detection & Grouping', () => {
  it('should detect multi-app suite applications correctly', () => {
    const fixtureDir = path.resolve(__dirname, '../fixtures');
    const ignoreFilter = new IgnoreFilter(fixtureDir);
    const files = scanWorkspaceFiles(fixtureDir, ignoreFilter);

    const candidates = findProjectCandidates(fixtureDir, files);
    const groups = groupApplications(candidates);

    expect(groups.length).toBeGreaterThanOrEqual(3);
    const flutterApp = groups.find((g) => g.name === 'flutter-app');
    const expressApp = groups.find((g) => g.name === 'node-express-api');
    const fastapiApp = groups.find((g) => g.name === 'python-fastapi');

    expect(flutterApp?.type).toBe('mobile');
    expect(expressApp?.type).toBe('backend');
    expect(fastapiApp?.type).toBe('backend');
  });
});
