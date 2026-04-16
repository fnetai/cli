import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const cwd = process.cwd();
const execDir = path.dirname(process.execPath);

/**
 * Resolves a template path across all installation methods.
 *
 * Resolution order:
 * 1. Current working directory (local development)
 * 2. Package directory via __dirname (JS mode - npm/bun install, reads src/utils/)
 * 3. Package directory via execDir (compiled binary in npm/bun - node_modules/@fnet/cli/bin/)
 * 4. Homebrew share directory (compiled binary in /opt/homebrew/bin/)
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

  // 2. Package directory via __dirname (JS mode)
  // __dirname is src/utils, go up two levels to package root
  const packagePath = path.resolve(__dirname, '../..', templatePath);
  if (fs.existsSync(packagePath)) {
    return packagePath;
  }

  // 3. Package directory via execDir (compiled binary in npm/bun install)
  // Binary is at node_modules/@fnet/cli/bin/, package root is one up
  const binPackagePath = path.resolve(execDir, '..', templatePath);
  if (fs.existsSync(binPackagePath)) {
    return binPackagePath;
  }

  // 4. Homebrew share directory (compiled binary in /opt/homebrew/bin/)
  const brewPath = path.resolve(execDir, '../share/fnet', templatePath);
  if (fs.existsSync(brewPath)) {
    return brewPath;
  }

  throw new Error(`Template path not found: ${templatePath}`);
}
