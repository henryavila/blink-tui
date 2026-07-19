/**
 * resolveLiveListing — pure path-draft → list target (FilePicker live path).
 */
import { describe, test, expect } from 'vitest';
import {
  formatLiveCwdLabel,
  resolveLiveListing,
  type PathProbes,
} from '../src/filePicker/resolveLiveListing.js';

/** In-memory tree probe: only listed paths exist (dirs unless marked file). */
function makeProbes(
  dirs: string[],
  files: string[] = [],
): PathProbes {
  const dirSet = new Set(dirs.map((d) => d.replace(/\/$/, '') || '/'));
  const fileSet = new Set(files);
  return {
    resolve(draft, base) {
      const t = draft.trim();
      if (!t) return base;
      if (t.startsWith('/')) return t.replace(/\/+/g, '/').replace(/\/$/, '') || '/';
      const joined = `${base.replace(/\/$/, '')}/${t}`.replace(/\/+/g, '/');
      return joined.replace(/\/$/, '') || '/';
    },
    isDirectory(abs) {
      return dirSet.has(abs.replace(/\/$/, '') || '/');
    },
    isFile(abs) {
      return fileSet.has(abs);
    },
    dirname(abs) {
      const n = abs.replace(/\/$/, '') || '/';
      if (n === '/') return '/';
      const i = n.lastIndexOf('/');
      return i <= 0 ? '/' : n.slice(0, i);
    },
    basename(abs) {
      const n = abs.replace(/\/$/, '') || '/';
      if (n === '/') return '';
      return n.slice(n.lastIndexOf('/') + 1);
    },
  };
}

describe('resolveLiveListing', () => {
  const probes = makeProbes(['/tmp', '/tmp/alpha', '/tmp/beta'], ['/tmp/readme']);

  test('exact existing directory → list it, no prefix', () => {
    expect(resolveLiveListing('/tmp/alpha', '/tmp', probes)).toEqual({
      cwd: '/tmp/alpha',
      namePrefix: '',
    });
  });

  test('partial last segment → parent + prefix', () => {
    expect(resolveLiveListing('/tmp/alp', '/tmp', probes)).toEqual({
      cwd: '/tmp',
      namePrefix: 'alp',
    });
  });

  test('trailing slash on missing dir → parent, no prefix', () => {
    expect(resolveLiveListing('/tmp/nope/', '/tmp', probes)).toEqual({
      cwd: '/tmp',
      namePrefix: '',
    });
  });

  test('existing file → parent + basename prefix', () => {
    expect(resolveLiveListing('/tmp/readme', '/tmp', probes)).toEqual({
      cwd: '/tmp',
      namePrefix: 'readme',
    });
  });

  test('empty draft → fallback', () => {
    expect(resolveLiveListing('', '/tmp', probes)).toEqual({
      cwd: '/tmp',
      namePrefix: '',
    });
  });
});

describe('formatLiveCwdLabel', () => {
  test('plain cwd', () => {
    expect(formatLiveCwdLabel('/tmp', '')).toBe('now  /tmp');
  });

  test('with typing prefix', () => {
    expect(formatLiveCwdLabel('/tmp', 'cur')).toBe('now  /tmp  ·  cur…');
  });
});
