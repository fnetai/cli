/**
 * Utility to run package.json scripts directly without npm/bun run
 * Parses the script command and executes it directly
 */
import fs from 'node:fs';
import path from 'node:path';
import { spawn } from 'node:child_process';

/**
 * Parse and execute a package.json script directly
 * 
 * @param {Object} options - Configuration options
 * @param {string} options.projectDir - Project directory containing package.json
 * @param {string} options.scriptName - Name of the script to run (e.g., 'build', 'build:dev')
 * @param {string[]} [options.args=[]] - Additional arguments to pass to the script
 * @param {Object} [options.env=process.env] - Environment variables
 * @param {boolean} [options.shell=true] - Whether to run in shell
 * @param {boolean} [options.detached=false] - Whether to run detached
 * @param {string|Array} [options.stdio='inherit'] - stdio configuration
 * @param {Function} [options.onSpawn] - Callback when process spawns (receives subprocess)
 * @returns {Promise<{subprocess: ChildProcess, exitCode: number}>}
 * 
 * @example
 * // Run build script
 * await runPackageScript({
 *   projectDir: '/path/to/project',
 *   scriptName: 'build'
 * });
 * 
 * @example
 * // Run with custom args and env
 * await runPackageScript({
 *   projectDir: '/path/to/project',
 *   scriptName: 'build:dev',
 *   args: ['--watch'],
 *   env: { NODE_ENV: 'development' }
 * });
 */
export async function runPackageScript(options) {
  const {
    projectDir,
    scriptName,
    args = [],
    env = process.env,
    shell = true,
    detached = true,
    // stdio = 'inherit',
    onSpawn
  } = options;

  // Validate inputs
  if (!projectDir) {
    throw new Error('projectDir is required');
  }
  if (!scriptName) {
    throw new Error('scriptName is required');
  }

  // Read package.json
  const packageJsonPath = path.resolve(projectDir, 'package.json');
  if (!fs.existsSync(packageJsonPath)) {
    throw new Error(`package.json not found at ${packageJsonPath}`);
  }

  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
  const scripts = packageJson.scripts || {};

  // Get the script
  const scriptCommand = scripts[scriptName];
  if (!scriptCommand) {
    throw new Error(`Script '${scriptName}' not found in package.json. Available scripts: ${Object.keys(scripts).join(', ')}`);
  }

  // Parse the script command
  const parsedCommand = parseScriptCommand(scriptCommand);

  // Spawn the process
  const subprocess = spawn(
    parsedCommand.bin,
    [...parsedCommand.args, ...args],
    {
      cwd: projectDir,
      shell,
      detached,
      // stdio,
      env: { ...env }
    }
  );

  // Call onSpawn callback if provided
  if (onSpawn) {
    onSpawn(subprocess);
  }

  // Return promise that resolves when process exits
  return new Promise((resolve, reject) => {
    subprocess.on('error', (error) => {
      reject(new Error(`Failed to start script '${scriptName}': ${error.message}`));
    });

    subprocess.on('close', (code) => {
      resolve({
        subprocess,
        exitCode: code
      });
    });
  });
}

/**
 * Parse a package.json script command into bin and args
 * 
 * @param {string} scriptCommand - The script command to parse
 * @returns {{bin: string, args: string[]}}
 * 
 * @example
 * parseScriptCommand('rollup --config')
 * // Returns: { bin: 'rollup', args: ['--config'] }
 */
export function parseScriptCommand(scriptCommand) {
  if (!scriptCommand || typeof scriptCommand !== 'string') {
    throw new Error('scriptCommand must be a non-empty string');
  }

  const parts = scriptCommand.trim().split(/\s+/);
  const bin = parts[0];
  const args = parts.slice(1);

  return { bin, args };
}

/**
 * Get available scripts from package.json
 * 
 * @param {string} projectDir - Project directory containing package.json
 * @returns {Object} - Object with script names as keys and commands as values
 * 
 * @example
 * const scripts = getPackageScripts('/path/to/project');
 * // Returns: { build: 'rollup --config', test: 'jest', ... }
 */
export function getPackageScripts(projectDir) {
  if (!projectDir) {
    throw new Error('projectDir is required');
  }

  const packageJsonPath = path.resolve(projectDir, 'package.json');
  if (!fs.existsSync(packageJsonPath)) {
    throw new Error(`package.json not found at ${packageJsonPath}`);
  }

  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
  return packageJson.scripts || {};
}

/**
 * Check if a script exists in package.json
 * 
 * @param {string} projectDir - Project directory containing package.json
 * @param {string} scriptName - Name of the script to check
 * @returns {boolean}
 * 
 * @example
 * if (hasPackageScript('/path/to/project', 'build')) {
 *   // Script exists
 * }
 */
export function hasPackageScript(projectDir, scriptName) {
  try {
    const scripts = getPackageScripts(projectDir);
    return scriptName in scripts;
  } catch {
    return false;
  }
}

/**
 * Run a package.json script synchronously (blocking)
 *
 * @param {Object} options - Same options as runPackageScript
 * @returns {{exitCode: number}}
 */
export function runPackageScriptSync(options) {
  const {
    projectDir,
    scriptName,
    args = [],
    env = process.env,
    shell = true,
    stdio = 'inherit'
  } = options;

  // Validate inputs
  if (!projectDir) {
    throw new Error('projectDir is required');
  }
  if (!scriptName) {
    throw new Error('scriptName is required');
  }

  // Read package.json
  const packageJsonPath = path.resolve(projectDir, 'package.json');
  if (!fs.existsSync(packageJsonPath)) {
    throw new Error(`package.json not found at ${packageJsonPath}`);
  }

  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
  const scripts = packageJson.scripts || {};

  // Get the script
  const scriptCommand = scripts[scriptName];
  if (!scriptCommand) {
    throw new Error(`Script '${scriptName}' not found in package.json`);
  }

  // Parse the script command
  const parsedCommand = parseScriptCommand(scriptCommand);

  // Import spawnSync (sync import, no await needed)
  const { spawnSync } = require('node:child_process');

  // Spawn the process synchronously
  const result = spawnSync(
    parsedCommand.bin,
    [...parsedCommand.args, ...args],
    {
      cwd: projectDir,
      shell,
      stdio,
      env: { ...env }
    }
  );

  return {
    exitCode: result.status
  };
}

export default runPackageScript;

