import path from 'node:path';
import which from '../../which.js';
import { spawn } from 'node:child_process';

export default async function runNpmBuild({ setProgress, context }) {

  const projectDir = context.projectDir;

  await setProgress({ message: "Building main project." });

  // Determine which script to run based on dev mode
  const scriptName = context.dev ? 'build:dev' : 'build';

  // Prepare environment variables to isolate node_modules to projectDir
  const env = { ...process.env };

  // Set NODE_PATH to projectDir's node_modules to prevent parent node_modules lookup
  const projectNodeModules = path.join(projectDir, 'node_modules');
  env.NODE_PATH = projectNodeModules;
  // Add node_modules/.bin to PATH so local binaries (rollup, tsc, etc.) are found
  env.PATH = `${path.join(projectNodeModules, '.bin')}:${env.PATH || ''}`;

  await new Promise((resolve, reject) => {
    const createProcess = spawn(which('bun')? 'bun':'npm', ['run', 'build'], {
      stdio: 'inherit',
      shell: false,
      cwd: projectDir,
      env
    });

    createProcess.on('error', reject);
    createProcess.on('close', (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`bun run build exited with code ${code}`));
      }
    });
  });
}