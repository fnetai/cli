/**
 * Utility functions for fnet CLI
 */
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import fs from 'node:fs';
import findNodeModules from '../builder/find-node-modules.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/**
 * Set up environment for fnet CLI
 */
export function setupEnvironment() {

  // Add node_modules/.bin to PATH
  const nodeModulesDir = findNodeModules({ baseDir: __dirname });
  const pathSeparator = process.platform === 'win32' ? ';' : ':';

  if (nodeModulesDir)
    process.env.PATH = `${path.join(nodeModulesDir, '/.bin')}${pathSeparator}${process.env.PATH}`;
}

/**
 * Check if a command exists in PATH
 * 
 * @param {string} command - Command to check
 * @returns {string|null} Path to command or null if not found
 */
export function which(command) {
  const path = process.env.PATH || '';
  const exts = process.platform === 'win32' 
    ? (process.env.PATHEXT || '.EXE;.CMD;.BAT;.COM').split(';') 
    : [''];
  const paths = path.split(pathSeparator);

  for (const dir of paths) {
    for (const ext of exts) {
      const fullPath = path.join(dir, process.platform === 'win32' ? command + ext : command);
      if (fs.existsSync(fullPath)) {
        return fullPath;
      }
    }
  }

  return null;
}
