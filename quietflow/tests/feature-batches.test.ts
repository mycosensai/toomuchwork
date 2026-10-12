import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..', 'src', 'components', 'social');

const batches = [
  ['anxiety-features-300.tsx', 'FeatureBatch3'],
  ['anxiety-features-400.tsx', 'FeatureBatch4'],
  ['anxiety-features-500.tsx', 'FeatureBatch5'],
];

for (const [file, batchFn] of batches) {
  describe(`${file}`, () => {
    const src = readFileSync(join(root, file), 'utf8');
    const fns = [...src.matchAll(/export function (\w+)\(\)/g)].map((m) => m[1]);

    it('exports 100 named components', () => {
      assert.equal(fns.length, 100);
    });

    it(`exports default ${batchFn} rendering all 100`, () => {
      assert.ok(src.includes(`export default function ${batchFn}()`));
      for (const name of fns) {
        assert.ok(src.includes(`<${name} />`), `grid missing <${name} />`);
      }
    });

    it('has no node: imports and no Off-variant icons', () => {
      assert.ok(!/from\s+['"]node:/.test(src) && !/require\(\s*['"]node:/.test(src), 'must not import node: built-ins (client build break)');
      assert.ok(!/import\s*\{[^}]*\b\w+Off\b[^}]*\}\s*from/.test(src), 'no Off-variant icon imports');
    });

    it('component names are unique', () => {
      assert.equal(new Set(fns).size, fns.length);
    });
  });
}

describe('batch cross-uniqueness', () => {
  it('no duplicate component names across 300/400/500', () => {
    const all = [];
    for (const [file] of batches) {
      const src = readFileSync(join(root, file), 'utf8');
      all.push(...[...src.matchAll(/export function (\w+)\(\)/g)].map((m) => m[1]));
    }
    assert.equal(new Set(all).size, 300);
  });
});
