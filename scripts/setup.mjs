import {run, runFstar} from './common.mjs';

try {
  console.log('Checking your F* installation…');
  runFstar(['--version']);

  console.log('\nInstalling the project-local ReScript 11.1.4 converter…');
  const args = ['ci', '--prefix', 'tools/ocaml-to-rescript', '--no-audit', '--no-fund'];
  if (process.env.npm_execpath) run(process.execPath, [process.env.npm_execpath, ...args]);
  else run('npm', args);

  console.log('\nSetup complete. Run npm start or npm test.');
} catch (error) {
  console.error(error.message);
  process.exitCode = 1;
}
