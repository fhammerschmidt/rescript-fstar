import {spawnSync} from 'node:child_process';
import {existsSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import {join} from 'node:path';

export const root = fileURLToPath(new URL('../', import.meta.url));
export const localPath = (...parts) => join(root, ...parts);
export const fstar = localPath('.tools', 'fstar', 'bin', 'fstar.exe');
export const converter = localPath('tools', 'ocaml-to-rescript', 'node_modules', 'rescript', 'bsc');
export const compiler = localPath('node_modules', 'rescript', 'cli', 'rescript.js');

export function requireFile(filename) {
  if (!existsSync(filename)) {
    throw new Error(`Missing ${filename}. Run npm install, then npm run setup.`);
  }
}

export function run(command, args, options = {}) {
  const result = spawnSync(command, args, {cwd: root, stdio: 'inherit', ...options});
  if (result.error) throw result.error;
  if (result.status !== 0) {
    throw new Error(`${command} failed (${result.signal ?? result.status}).`);
  }
}
