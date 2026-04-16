import path from 'node:path';
import fs from 'node:fs';
import os from 'node:os';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const cwd = process.cwd();
const globalTemplateDir = path.resolve(os.homedir(), '.fnet');
const execDir = path.dirname(process.execPath);

/**
 * Resolves a template path that works in local development, published package,
 * compiled binary, and Homebrew installation.
 *
 * Resolution order:
 * 1. Current working directory (local development)
 * 2. Package directory via __dirname (npm install)
 * 3. Relative to binary location ../share/fnet/ (Homebrew)
 * 4. ~/.fnet/ (standalone compiled binary)
 *
 * @param {string} templatePath - The relative path to the template (e.g., './template/fnode/project')
 * @returns {string} The resolved absolute path to the template
 * @throws {Error} If the template path cannot be resolved
 */
export default function resolveTemplatePath(templatePath) {
  // 1. Current working directory (local development)
  const localPath = path.resolve(cwd, templatePath);
  if (fs.existsSync(localPath)) {
    return localPath;
  }

  // 2. Package directory (npm install)
  // Note: __dirname is src/utils, so we need to go up two levels to reach the package root
  const packagePath = path.resolve(__dirname, '../..', templatePath);
  if (fs.existsSync(packagePath)) {
    return packagePath;
  }

  // 3. Relative to binary location (Homebrew: binary is in bin/, templates in ../share/fnet/)
  const brewPath = path.resolve(execDir, '../share/fnet', templatePath);
  if (fs.existsSync(brewPath)) {
    return brewPath;
  }

  // 4. ~/.fnet/ (standalone compiled binary)
  const globalPath = path.resolve(globalTemplateDir, templatePath);
  if (fs.existsSync(globalPath)) {
    return globalPath;
  }

  throw new Error(`Template path not found: ${templatePath}`);
}
