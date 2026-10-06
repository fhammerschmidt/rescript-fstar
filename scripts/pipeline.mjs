import {mkdirSync, readFileSync, writeFileSync} from 'node:fs';
import {join} from 'node:path';
import {compiler, converter, localPath, requireFile, run, runFstar} from './common.mjs';
import {selectExamples} from './examples.mjs';

const stages = ['verify', 'extract', 'convert', 'build'];
const [stage, selector, ...extra] = process.argv.slice(2);

try {
  if (!stages.includes(stage) || extra.length) {
    throw new Error(`Usage: node scripts/pipeline.mjs ${stages.join('|')} [example-number]`);
  }
  const examples = selectExamples(selector);
  if (stages.indexOf(stage) >= 2) requireFile(converter);
  if (stage === 'build') requireFile(compiler);

  for (const example of examples) {
    const extracted = localPath('_build', 'examples', example.folder, 'fstar');
    const convertedDirectory = localPath('_build', 'examples', example.folder, 'converted');
    mkdirSync(extracted, {recursive: true});
    const commonArgs = ['--include', example.directory, '--cache_dir', extracted];

    console.log(`\nExample ${example.number}: checking the F* proof…`);
    // Force verification even with a warm cache.
    runFstar([...commonArgs, '--force', '--cache_checked_modules', example.proof]);

    if (stages.indexOf(stage) >= 1) {
      console.log(`Example ${example.number}: extracting OCaml…`);
      runFstar([
        ...commonArgs, '--odir', extracted, '--codegen', 'OCaml',
        '--extract', example.module, '--no_location_info', example.proof,
      ]);
    }

    if (stages.indexOf(stage) >= 2) {
      console.log(`Example ${example.number}: converting OCaml with ReScript 11.1.4…`);
      mkdirSync(convertedDirectory, {recursive: true});
      const convertedFile = join(convertedDirectory, `${example.module}.res`);
      // The higher-level `rescript convert` CLI deletes its .ml input.
      run(process.execPath, [converter, '-o', convertedFile, '-format', join(extracted, `${example.module}.ml`)]);
      const converted = readFileSync(convertedFile, 'utf8');
      // ReScript 12 has bool built in and forbids redefining it in a Prims shim.
      const adapted = converted.replace(/^open Prims\r?\n/m, '').replace(/\bPrims\.bool\b/g, 'bool');
      if (/\bPrims\b/.test(adapted)) {
        throw new Error(`Example ${example.number} needs more of the F* runtime than this bridge supports.`);
      }
      const generated = join(example.directory, 'generated');
      mkdirSync(generated, {recursive: true});
      writeFileSync(join(generated, `${example.module}.res`),
        `// Generated from examples/${example.folder}/${example.module}.fst by npm run convert. Do not edit.\n` +
        '// F* emits unused bindings and constructor projectors with erased refinements.\n' +
        '// A handwritten .resi can expose the public API and hide those helpers.\n' +
        '@@warning("-8-27-32")\n' + adapted);
    }
  }

  if (stage === 'build') {
    console.log('\nCompiling ReScript with 12.3.1…');
    run(process.execPath, [compiler]);
  }
} catch (error) {
  console.error(error.message);
  process.exitCode = 1;
}
