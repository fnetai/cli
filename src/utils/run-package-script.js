/**
 * Run package.json scripts directly without npm/bun run
 * Shell handles everything: &&, |, env vars, etc.
 */
import fs from 'node:fs';
import path from 'node:path';
import { spawn } from 'node:child_process';

/**
 * Run a package.json script directly
 * @param {Object} options
 * @param {string} options.projectDir - Project directory
 * @param {string} options.scriptName - Script name (e.g., 'build')
 * @param {string[]} [options.args] - Additional arguments
 * @param {Object} [options.env] - Environment variables
 * @param {boolean} [options.shell] - Use shell (default: true)
 * @param {boolean} [options.detached] - Detached process (default: true)
 * @param {Function} [options.onSpawn] - Callback when process spawns
 */
export async function runPackageScript(options) {
  const {
    projectDir,
    scriptName,
    args = [],
    env = process.env,
    shell = true,
    detached = true,
    onSpawn
  } = options;

  if (!projectDir || !scriptName) {
    throw new Error('projectDir and scriptName are required');
  }

  const packageJsonPath = path.resolve(projectDir, 'package.json');
  if (!fs.existsSync(packageJsonPath)) {
    throw new Error(`package.json not found at ${packageJsonPath}`);
  }

  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
  const scriptCommand = packageJson.scripts?.[scriptName];

  if (!scriptCommand) {
    const available = Object.keys(packageJson.scripts || {}).join(', ');
    throw new Error(`Script '${scriptName}' not found. Available: ${available}`);
  }

  // Build full command - shell handles &&, |, env vars, etc.
  const fullCommand = args.length > 0
    ? `${scriptCommand} ${args.join(' ')}`
    : scriptCommand;

  const subprocess = spawn(fullCommand, [], {
    cwd: projectDir,
    shell,
    detached,
    env: { ...env }
  });

  if (onSpawn) onSpawn(subprocess);

  return new Promise((resolve, reject) => {
    subprocess.on('error', (error) => {
      reject(new Error(`Failed to start '${scriptName}': ${error.message}`));
    });
    subprocess.on('close', (code) => {
      resolve({ subprocess, exitCode: code });
    });
  });
}

/**
 * Get available scripts from package.json
 */
export function getPackageScripts(projectDir) {
  const packageJsonPath = path.resolve(projectDir, 'package.json');
  if (!fs.existsSync(packageJsonPath)) {
    throw new Error(`package.json not found at ${packageJsonPath}`);
  }
  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
  return packageJson.scripts || {};
}

/**
 * Check if a script exists
 */
export function hasPackageScript(projectDir, scriptName) {
  try {
    const scripts = getPackageScripts(projectDir);
    return scriptName in scripts;
  } catch {
    return false;
  }
}

export default runPackageScript;

