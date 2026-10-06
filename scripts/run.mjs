import {existsSync} from 'node:fs';
import {localPath, run} from './common.mjs';
import {selectExamples} from './examples.mjs';

try {
  const args = process.argv.slice(2);
  const build = args[0] !== '--no-build';
  if (!build) args.shift();
  if (args.length > 1) throw new Error('Usage: npm start -- [example-number]');
  const examples = selectExamples(args[0]);
  if (build) run(process.execPath, [localPath('scripts', 'pipeline.mjs'), 'build', ...args]);
  for (const example of examples) {
    console.log(`\nExample ${example.number}: ${example.title}\n`);
    const main = `${example.main}.js`;
    if (!existsSync(main)) throw new Error(`Missing compiled example ${example.number}. Run npm run build -- ${example.number} first.`);
    run(process.execPath, [main]);
  }
} catch (error) {
  console.error(error.message);
  process.exitCode = 1;
}
