import {spawnSync} from 'node:child_process';
import {existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync} from 'node:fs';
import {join} from 'node:path';
import {fileURLToPath} from 'node:url';

const root = fileURLToPath(new URL('../', import.meta.url));
const fstar = process.env.FSTAR_EXE || 'fstar.exe';
const converter = join(root, 'tools/ocaml-to-rescript/node_modules/rescript/bsc');
const compiler = join(root, 'node_modules/rescript/cli/rescript.js');
const stages = ['verify', 'extract', 'convert', 'build', 'start'];
const [stage, selector, ...extra] = process.argv.slice(2);

function run(command, args) {
  const result = spawnSync(command, args, {cwd: root, stdio: 'inherit'});
  if (result.error?.code === 'ENOENT' && command === fstar) {
    throw new Error('Install F* following https://github.com/FStarLang/FStar/blob/master/INSTALL.md, then put fstar.exe on PATH or set FSTAR_EXE.');
  }
  if (result.error) throw result.error;
  if (result.status !== 0) throw new Error(`${command} failed (${result.signal ?? result.status}).`);
}

try {
  const level = stages.indexOf(stage);
  if (level < 0 || extra.length) throw new Error(`Usage: node scripts/build.mjs ${stages.join('|')} [number]`);

  let examples = readdirSync(join(root, 'examples'), {withFileTypes: true})
    .filter(entry => entry.isDirectory())
    .map(({name: folder}) => {
      const number = /^(\d{2,})-[a-z][a-z0-9-]*$/.exec(folder)?.[1];
      if (!number) throw new Error(`Example folder must be named NN-topic: ${folder}.`);
      return {folder, number, module: `Example${number}`, directory: join(root, 'examples', folder)};
    })
    .sort((a, b) => Number(a.number) - Number(b.number));
  if (!examples.length) throw new Error('No examples found.');
  if (new Set(examples.map(example => example.number)).size !== examples.length) {
    throw new Error('Example numbers must be unique.');
  }
  if (selector !== undefined) {
    const number = selector.replace(/^0+(?=\d)/, '').padStart(2, '0');
    examples = examples.filter(example => example.number === number);
    if (!examples.length) throw new Error(`Unknown example: ${selector}.`);
  }
  for (const file of level >= 2 ? [converter, ...(level >= 3 ? [compiler] : [])] : []) {
    if (!existsSync(file)) throw new Error(`Missing ${file}. Run npm ci and npm run setup.`);
  }

  for (const example of examples) {
    console.log(`\nExample ${example.number}: ${example.folder}`);
    const proof = join(example.directory, `${example.module}.fst`);
    const output = join(root, '_build', example.folder);
    mkdirSync(output, {recursive: true});
    const args = ['--include', example.directory, '--cache_dir', output];
    run(fstar, [...args, '--force', '--cache_checked_modules', proof]);

    if (level >= 1) {
      run(fstar, [...args, '--odir', output, '--codegen', 'OCaml', '--extract', example.module, '--no_location_info', proof]);
    }
    if (level >= 2) {
      const converted = join(output, `${example.module}.res`);
      run(process.execPath, [converter, '-o', converted, '-format', join(output, `${example.module}.ml`)]);
      const code = readFileSync(converted, 'utf8')
        .replace(/^open Prims\r?\n/m, '')
        .replace(/\bPrims\.bool\b/g, 'bool');
      if (/\bPrims\b/.test(code)) throw new Error(`Example ${example.number} requires unsupported F* runtime features.`);
      const generated = join(example.directory, 'generated');
      mkdirSync(generated, {recursive: true});
      writeFileSync(join(generated, `${example.module}.res`),
        `// Generated from ../${example.module}.fst. Do not edit.\n` +
        '@@warning("-8-27-32")\n' + code);
    }
  }
  if (level >= 3) run(process.execPath, [compiler]);
  if (stage === 'start') {
    for (const example of examples) {
      console.log(`\nExample ${example.number}: ${example.folder}\n`);
      run(process.execPath, [join(example.directory, `${example.module}Main.res.js`)]);
    }
  }
} catch (error) {
  console.error(error.message);
  process.exitCode = 1;
}
