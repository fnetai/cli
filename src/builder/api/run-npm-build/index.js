import { runPackageScript } from '../../../utils/run-package-script.js';
import path from 'node:path';

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
  env.PATH = `${path.join(projectNodeModules, '/.bin')}${path.delimiter}${env.PATH}`;

  // Also set NODE_OPTIONS to disable parent node_modules lookup
  const existingNodeOptions = env.NODE_OPTIONS || '';
  env.NODE_OPTIONS = `${existingNodeOptions} --preserve-symlinks`.trim();

  // Run the package script directly (detached, no stdio to avoid blocking)
  await runPackageScript({
    projectDir,
    scriptName,
    shell: true,
    detached: true,
    env
  });
}