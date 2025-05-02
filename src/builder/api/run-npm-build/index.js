import fnetShellJs from '@fnet/shelljs';
import which from '../../which.js';

export default async function runNpmBuild({ setProgress, context }) {

  const projectDir = context.projectDir;

  await setProgress({ message: "Building main project." });

  if (which('bun')) {
    const result = await fnetShellJs(context.dev ? 'bun run build:dev' : `bun run build`, { cwd: projectDir });
    if (result.code !== 0) throw new Error('Couldnt build project.');
  }
  else {
    const result = await fnetShellJs(context.dev ? 'npm run build:dev' : `npm run build`, { cwd: projectDir });
    if (result.code !== 0) throw new Error('Couldnt build project.');
  }
}