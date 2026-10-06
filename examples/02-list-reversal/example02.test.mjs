import assert from 'node:assert/strict';
import {test} from 'node:test';
import * as Example02 from './generated/Example02.res.js';
import {fromArray, toArray} from './Example02List.res.js';

test('the extracted sample reverses and restores its order', () => {
  assert.deepEqual(toArray(Example02.sample), [true, false, false]);
  assert.deepEqual(toArray(Example02.reverse(Example02.sample)), [false, false, true]);
  assert.deepEqual(toArray(Example02.reverse(Example02.reverse(Example02.sample))), [true, false, false]);
});

test('generated JavaScript preserves reversal and concatenation for all boolean lists up to length six', () => {
  const lists = [[]];
  for (let length = 1; length <= 6; length++) {
    for (let mask = 0; mask < 2 ** length; mask++) {
      lists.push(Array.from({length}, (_, index) => Boolean(mask & (1 << index))));
    }
  }
  for (const values of lists) {
    const items = fromArray(values);
    assert.deepEqual(toArray(Example02.reverse(items)), values.toReversed());
    assert.deepEqual(toArray(Example02.reverse(Example02.reverse(items))), values);
    const suffix = [false, true];
    assert.deepEqual(toArray(Example02.append(items, fromArray(suffix))), [...values, ...suffix]);
  }
});
