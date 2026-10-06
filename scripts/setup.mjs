import {createHash} from 'node:crypto';
import {createReadStream, createWriteStream, existsSync, mkdirSync, readFileSync, renameSync, writeFileSync} from 'node:fs';
import {Readable} from 'node:stream';
import {pipeline} from 'node:stream/promises';
import {fstar, localPath, run} from './common.mjs';

const config = JSON.parse(readFileSync(new URL('./toolchain.json', import.meta.url), 'utf8'));
const target = `${process.platform}-${process.arch}`;
const release = config.platforms[target];
const marker = localPath('.tools', 'fstar', '.project-version');

async function sha256(filename) {
  const hash = createHash('sha256');
  for await (const chunk of createReadStream(filename)) hash.update(chunk);
  return hash.digest('hex');
}

async function installFstar() {
  if (existsSync(fstar) && existsSync(marker) && readFileSync(marker, 'utf8') === `${config.fstar} ${target}\n`) {
    console.log(`F* ${config.fstar} is already installed locally.`);
    return;
  }

  const archive = localPath('.tools', 'downloads', release.asset);
  mkdirSync(localPath('.tools', 'downloads'), {recursive: true});
  if (!existsSync(archive)) {
    const url = `https://github.com/FStarLang/FStar/releases/download/${config.fstar}/${release.asset}`;
    console.log(`Downloading ${release.asset} (about 200 MB)…`);
    const response = await fetch(url, {signal: AbortSignal.timeout(180_000)});
    if (!response.ok) throw new Error(`F* download failed: HTTP ${response.status}`);
    // Write a separate file so an interrupted download cannot look complete.
    const partial = `${archive}.partial`;
    await pipeline(Readable.fromWeb(response.body), createWriteStream(partial));
    renameSync(partial, archive);
  }

  console.log('Checking the F* archive SHA-256…');
  if (await sha256(archive) !== release.sha256) {
    throw new Error(`Checksum mismatch. Delete ${archive} and run npm run setup again.`);
  }

  console.log('Installing F* and its bundled Z3 into .tools/fstar…');
  run('tar', ['-xzf', archive, '-C', localPath('.tools')]);
  run(fstar, ['--version']);
  writeFileSync(marker, `${config.fstar} ${target}\n`);
}

try {
  if (!release) throw new Error(`Unsupported platform: ${target}. Use macOS, Linux, or Linux under WSL.`);
  console.log('Installing the isolated ReScript v11 converter…');
  run('npm', ['ci', '--prefix', 'tools/ocaml-to-rescript', '--no-audit', '--no-fund']);
  await installFstar();
  console.log('\nSetup complete. Run npm start or npm test.');
} catch (error) {
  console.error(error.message);
  process.exitCode = 1;
}
