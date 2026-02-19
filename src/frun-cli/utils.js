/**
 * Utility functions for frun CLI
 */
import fs from 'node:fs';
import path from 'node:path';

/**
 * Detect project file based on project type
 *
 * @param {string} projectType - Type of project ('fnode', 'fnet', or 'auto')
 * @returns {Promise<Object>} Project file information
 */
export async function detectProjectFile(projectType) {
  const cwd = process.cwd();
  const fnodeYamlPath = path.resolve(cwd, 'fnode.yaml');
  const fnetYamlPath = path.resolve(cwd, 'fnet.yaml');

  // For auto detection, check both files
  if (projectType === 'auto' || projectType === 'fnode') {
    if (fs.existsSync(fnodeYamlPath)) {
      return {
        path: fnodeYamlPath,
        name: 'fnode.yaml',
        type: 'fnode'
      };
    }
  }

  if (projectType === 'auto' || projectType === 'fnet') {
    if (fs.existsSync(fnetYamlPath)) {
      return {
        path: fnetYamlPath,
        name: 'fnet.yaml',
        type: 'fnet'
      };
    }
  }

  throw new Error('No project file (fnode.yaml or fnet.yaml) found in current directory');
}
