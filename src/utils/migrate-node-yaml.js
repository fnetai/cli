import path from 'node:path';
import { resolveProjectFile, getProjectFileName } from './project-file.js';

/**
 * Resolves the fnode project file for a directory, migrating legacy
 * descriptors (node.yaml / fnode.yaml) to the preferred extension.
 *
 * Kept for backward compatibility; the actual resolution and migration logic
 * now lives in the shared src/utils/project-file.js module.
 *
 * @param {string} projectDir - The project directory
 * @returns {string} - The path to the config file that is in use
 */
export default function migrateNodeYaml(projectDir) {
  const found = resolveProjectFile(projectDir, 'fnode', { migrate: true });
  return found ? found.path : path.resolve(projectDir, getProjectFileName('fnode'));
}
