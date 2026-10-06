import assert from 'node:assert/strict';
import {spawnSync} from 'node:child_process';
import {mkdtempSync, readFileSync, rmSync, writeFileSync} from 'node:fs';
import {test} from 'node:test';
import {fstar, localPath, root} from '../scripts/common.mjs';
import * as Toy from '../src/generated/Toy.res.js';
import {fromInt, toInt} from '../src/Nat.res.js';

// Construct/deconstruct values through ReScript functions so the test does not
// depend on ReScript's JavaScript representation of variants.

test('the extracted example computes 2 + 3 = 5', () => {
  assert.equal(toInt(Toy.five), 5);
  assert.equal(toInt(Toy.add(Toy.three, Toy.two)), 5);
});

test('generated JavaScript preserves addition, identity, and commutativity for small inputs', () => {
  for (let a = 0; a <= 20; a++) {
    for (let b = 0; b <= 20; b++) {
      const left = Toy.add(fromInt(a), fromInt(b));
      const right = Toy.add(fromInt(b), fromInt(a));
      assert.equal(toInt(left), a + b, `${a} + ${b}`);
      assert.deepEqual(left, right, `commutativity at ${a}, ${b}`);
    }
    assert.equal(toInt(Toy.add(fromInt(a), fromInt(0))), a);
  }
});

test('F* rejects the proof when addition is deliberately broken', () => {
  const directory = mkdtempSync(localPath('_build', 'broken-proof-'));
  try {
    const original = readFileSync(localPath('fstar', 'Toy.fst'), 'utf8');
    const broken = original.replace('module Toy', 'module ToyBroken').replace('| Zero -> b', '| Zero -> Succ b');
    const filename = `${directory}/ToyBroken.fst`;
    writeFileSync(filename, broken);
    const result = spawnSync(fstar, ['--force', '--cache_dir', directory, filename], {cwd: root, encoding: 'utf8'});
    assert.ifError(result.error);
    assert.equal(result.status, 1, result.stdout + result.stderr);
    assert.match(result.stdout + result.stderr, /Failed to prove|could not be proved|assertion failed/i);
  } finally {
    rmSync(directory, {recursive: true, force: true});
  }
});
