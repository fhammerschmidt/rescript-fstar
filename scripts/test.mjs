import {readdirSync} from 'node:fs';
import {join} from 'node:path';
import {localPath, run} from './common.mjs';
import {selectExamples} from './examples.mjs';

try {
  const args = process.argv.slice(2);
  if (args.length > 1) throw new Error('Usage: npm test -- [example-number]');
  const examples = selectExamples(args[0]);
  const files = examples.flatMap(example => readdirSync(example.directory)
    .filter(filename => filename.endsWith('.test.mjs'))
    .sort()
    .map(filename => join(example.directory, filename)));
  if (!files.length) throw new Error('No .test.mjs files found for the selected examples.');
  run(process.execPath, [localPath('scripts', 'pipeline.mjs'), 'build', ...args]);
  run(process.execPath, ['--test', ...files]);
} catch (error) {
  console.error(error.message);
  process.exitCode = 1;
}
