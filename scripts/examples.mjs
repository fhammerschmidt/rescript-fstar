import {existsSync, readdirSync, readFileSync} from 'node:fs';
import {join} from 'node:path';
import {localPath} from './common.mjs';

// Folder numbers determine every module name; there is no separate registry.
export function selectExamples(selector) {
  const examples = [];
  const numbers = new Set();
  for (const entry of readdirSync(localPath('examples'), {withFileTypes: true})) {
    if (!entry.isDirectory()) continue;
    const match = /^(\d{2,})-([a-z][a-z0-9-]*)$/.exec(entry.name);
    if (!match) throw new Error(`Example directory ${entry.name} must be named NN-description, such as 03-sorting.`);
    const [, number, title] = match;
    if (number !== number.replace(/^0+(?=\d)/, '').padStart(2, '0')) {
      throw new Error(`Use two-digit example numbers below 100: ${entry.name}.`);
    }
    if (numbers.has(number)) throw new Error(`Duplicate example number: ${number}.`);
    numbers.add(number);
    const module = `Example${number}`;
    const directory = localPath('examples', entry.name);
    const proof = join(directory, `${module}.fst`);
    const main = join(directory, `${module}Main.res`);
    for (const filename of [proof, main]) {
      if (!existsSync(filename)) throw new Error(`Missing example file: ${filename}.`);
    }
    if (readFileSync(proof, 'utf8').match(/^\s*module\s+(\w+)\b/m)?.[1] !== module) {
      throw new Error(`${proof} must declare module ${module}.`);
    }
    examples.push({number, title, module, directory, folder: entry.name, proof, main});
  }
  examples.sort((a, b) => a.number.localeCompare(b.number, 'en', {numeric: true}));
  if (!examples.length) throw new Error('No numbered examples found in examples/.');
  if (selector === undefined) return examples;
  const number = /^\d+$/.test(selector) ? selector.replace(/^0+(?=\d)/, '').padStart(2, '0') : undefined;
  const selected = examples.find(example => example.number === number);
  if (!selected) {
    throw new Error(`Unknown example ${selector}. Available: ${examples.map(example => `${example.number} (${example.title})`).join(', ')}.`);
  }
  return [selected];
}
