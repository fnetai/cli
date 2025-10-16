import { runPackageScript } from '../../../utils/run-package-script.js';

export default async function runNpmBuild({ setProgress, context }) {

  const projectDir = context.projectDir;

  await setProgress({ message: "Building main project." });

  // Determine which script to run based on dev mode
  const scriptName = context.dev ? 'build:dev' : 'build';

  // Run the package script directly (detached, no stdio to avoid blocking)
  await runPackageScript({
    projectDir,
    scriptName,
    shell: true,
    detached: true,
    env: { ...process.env }
  });
}