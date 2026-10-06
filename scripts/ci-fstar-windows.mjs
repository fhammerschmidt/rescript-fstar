// Explicit CI provisioning only; npm install/setup never invokes this script.
import {createHash} from 'node:crypto';
import {appendFileSync, createWriteStream, mkdirSync, readdirSync} from 'node:fs';
import {basename, join} from 'node:path';
import {Readable, Transform} from 'node:stream';
import {pipeline} from 'node:stream/promises';
import {run} from './common.mjs';

try {
  if (process.platform !== 'win32' || !process.env.GITHUB_ENV || !process.env.RUNNER_TEMP) {
    throw new Error('This script is for the native Windows GitHub Actions job. Install F* using the official instructions locally.');
  }

  const asset = 'fstar-v2026.09.27-Windows_NT-x86_64.zip';
  const checksum = 'afb1ad9017d9ac1b35e618c6900c7feb5e96492846c13403e77524f51c207eb4';
  const directory = join(process.env.RUNNER_TEMP, 'fstar');
  const archive = join(process.env.RUNNER_TEMP, asset);
  mkdirSync(directory, {recursive: true});

  console.log(`Downloading the official ${asset} for CI…`);
  const response = await fetch(`https://github.com/FStarLang/FStar/releases/download/v2026.09.27/${asset}`, {
    signal: AbortSignal.timeout(180_000),
  });
  if (!response.ok) throw new Error(`F* download failed: HTTP ${response.status}`);
  const hash = createHash('sha256');
  const hashing = new Transform({
    transform(chunk, _encoding, done) {
      hash.update(chunk);
      done(null, chunk);
    },
  });
  await pipeline(Readable.fromWeb(response.body), hashing, createWriteStream(archive));
  if (hash.digest('hex') !== checksum) throw new Error('F* archive checksum mismatch.');

  console.log('Extracting F* and its bundled Z3 on the CI runner…');
  run('powershell.exe', [
    '-NoProfile', '-NonInteractive', '-Command',
    '$ErrorActionPreference = "Stop"; Expand-Archive -LiteralPath $env:FSTAR_CI_ARCHIVE -DestinationPath $env:FSTAR_CI_DIRECTORY -Force',
  ], {env: {...process.env, FSTAR_CI_ARCHIVE: archive, FSTAR_CI_DIRECTORY: directory}});
  const binary = readdirSync(directory, {recursive: true}).find(filename => basename(filename) === 'fstar.exe');
  if (!binary) throw new Error('F* executable missing from release.');
  appendFileSync(process.env.GITHUB_ENV, `FSTAR_EXE=${join(directory, binary)}\n`);
} catch (error) {
  console.error(error.message);
  process.exitCode = 1;
}
