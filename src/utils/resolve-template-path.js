import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const cwd = process.cwd();

/**
 * Resolves a template path that works both in local development and in the published package
 * 
 * @param {string} templatePath - The relative path to the template (e.g., './template/fnode/project')
 * @returns {string} The resolved absolute path to the template
 * @throws {Error} If the template path cannot be resolved
 */
export default function resolveTemplatePath(templatePath) {
  // First, try to resolve from the current working directory (local development)
  const localPath = path.resolve(cwd, templatePath);
  if (fs.existsSync(localPath)) {
    return localPath;
  }
  
  // If not found locally, try to resolve from the package directory (published package)
  // Note: __dirname is src/utils, so we need to go up two levels to reach the package root
  const packagePath = path.resolve(__dirname, '../..', templatePath);
  if (fs.existsSync(packagePath)) {
    return packagePath;
  }
  
  // If still not found, throw an error
  throw new Error(`Template path not found: ${templatePath}`);
}
