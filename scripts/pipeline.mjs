import {mkdirSync, readFileSync, writeFileSync} from 'node:fs';
import {compiler, converter, fstar, localPath, requireFile, run} from './common.mjs';

const stages = ['verify', 'extract', 'convert', 'build'];
const stage = process.argv[2];

try {
  if (!stages.includes(stage)) {
    throw new Error(`Usage: node scripts/pipeline.mjs ${stages.join('|')}`);
  }

  requireFile(fstar);
  if (stages.indexOf(stage) >= 2) requireFile(converter);
  if (stage === 'build') requireFile(compiler);
  mkdirSync(localPath('_build', 'fstar'), {recursive: true});

  console.log('\nChecking the F* proof…');
  // Force verification so every build checks the source, even with a warm cache.
  run(fstar, ['--force', '--cache_checked_modules', '--cache_dir', '_build/fstar', 'fstar/Toy.fst']);

  if (stages.indexOf(stage) >= 1) {
    console.log('\nExtracting OCaml…');
    run(fstar, [
      '--cache_dir', '_build/fstar', '--odir', '_build/fstar',
      '--codegen', 'OCaml', '--extract', 'Toy', '--no_location_info', 'fstar/Toy.fst',
    ]);
  }

  if (stages.indexOf(stage) >= 2) {
    console.log('\nConverting OCaml with ReScript 11.1.4…');
    mkdirSync(localPath('_build', 'converted'), {recursive: true});
    // Use bsc's formatter directly: the `rescript convert` CLI deletes its .ml input.
    run(process.execPath, [converter, '-o', '_build/converted/Toy.res', '-format', '_build/fstar/Toy.ml']);
    const converted = readFileSync(localPath('_build', 'converted', 'Toy.res'), 'utf8');
    // The OCaml extractor opens Prims and qualifies its native bool alias.
    // ReScript 12 has bool built in and forbids redefining it in a Prims shim.
    const adapted = converted.replace(/^open Prims\r?\n/m, '').replace(/\bPrims\.bool\b/g, 'bool');
    if (/\bPrims\b/.test(adapted)) {
      throw new Error('The extracted code needs more of the F* runtime than this toy bridge supports.');
    }
    mkdirSync(localPath('src', 'generated'), {recursive: true});
    writeFileSync(localPath('src', 'generated', 'Toy.res'),
      '// Generated from fstar/Toy.fst by npm run convert. Do not edit.\n' +
      '// F* emits unused pattern variables and a refined constructor projector.\n' +
      '// The public .resi hides these helpers; the projector requires Succ.\n' +
      '@@warning("-8-27-32")\n' + adapted);
  }

  if (stage === 'build') {
    console.log('\nCompiling ReScript with 12.3.1…');
    run(process.execPath, [compiler]);
  }
} catch (error) {
  console.error(error.message);
  process.exitCode = 1;
}
