/**
 * Centralized project file (descriptor) resolution.
 *
 * This is the single source of truth for the names of the project descriptor
 * files and the order in which they are resolved. Change the candidates here
 * and every CLI (fnet, fnode, frun) and builder picks it up.
 *
 * Going forward `.yml` is the preferred extension. The legacy `.yaml` (and the
 * even older `node.yaml`) are still resolved for backward compatibility, and
 * are auto-migrated to the preferred name when found.
 */
import fs from 'node:fs';
import path from 'node:path';

/**
 * Candidate filenames per project type, in resolution priority order.
 * The FIRST entry is the preferred name used when creating new projects;
 * later entries are legacy names kept for backward compatibility.
 *
 * Object key order also defines the 'auto' detection order (fnode before fnet),
 * matching the historical behavior.
 */
const PROJECT_FILE_CANDIDATES = {
  fnode: ['fnode.yml', 'fnode.yaml', 'node.yaml'],
  fnet: ['fnet.yml', 'fnet.yaml']
};

/** All known project types, in 'auto' detection order. */
export const PROJECT_TYPES = Object.keys(PROJECT_FILE_CANDIDATES);

/**
 * The preferred (canonical) project file name for a type.
 * Used when creating new projects.
 *
 * @param {string} type - 'fnode' or 'fnet'
 * @returns {string}
 */
export function getProjectFileName(type) {
  const candidates = PROJECT_FILE_CANDIDATES[type];
  if (!candidates) {
    throw new Error(`Unknown project type: ${type}`);
  }
  return candidates[0];
}

/**
 * Rename a legacy project file to the preferred extension.
 *
 * @param {Object} options
 * @param {string} options.dir - Directory containing the file
 * @param {string} options.type - Project type
 * @param {string} options.foundPath - Absolute path of the legacy file
 * @param {string} options.foundName - Basename of the legacy file
 * @returns {string} The path actually in use after the (attempted) migration
 */
function migrateProjectFile({ dir, type, foundPath, foundName }) {
  const preferredName = getProjectFileName(type);
  if (foundName === preferredName) {
    return foundPath;
  }

  const preferredPath = path.resolve(dir, preferredName);
  // Never clobber an existing preferred file.
  if (fs.existsSync(preferredPath)) {
    return preferredPath;
  }

  try {
    fs.renameSync(foundPath, preferredPath);
    console.log(`Migrated ${foundName} to ${preferredName} in ${dir}`);
    return preferredPath;
  } catch (error) {
    console.error(`Error migrating ${foundName} to ${preferredName}: ${error.message}`);
    return foundPath;
  }
}

/**
 * Resolve the project file of a single type within a directory.
 *
 * @param {string} dir - Directory to search in
 * @param {string} type - 'fnode' or 'fnet'
 * @param {Object} [options]
 * @param {boolean} [options.migrate=true] - Auto-migrate legacy extensions to the preferred name
 * @returns {{path: string, name: string, type: string} | null}
 */
export function resolveProjectFile(dir, type, { migrate = true } = {}) {
  const candidates = PROJECT_FILE_CANDIDATES[type];
  if (!candidates) {
    throw new Error(`Unknown project type: ${type}`);
  }

  for (const name of candidates) {
    const candidatePath = path.resolve(dir, name);
    if (fs.existsSync(candidatePath)) {
      const resolvedPath = migrate
        ? migrateProjectFile({ dir, type, foundPath: candidatePath, foundName: name })
        : candidatePath;
      return { path: resolvedPath, name: path.basename(resolvedPath), type };
    }
  }

  return null;
}

/**
 * Detect the project file in a directory.
 *
 * @param {string} projectType - 'fnode', 'fnet', or 'auto'
 * @param {Object} [options]
 * @param {string} [options.cwd] - Directory to search in (defaults to process.cwd())
 * @param {boolean} [options.migrate=true] - Auto-migrate legacy extensions to the preferred name
 * @returns {{path: string, name: string, type: string}}
 */
export function detectProjectFile(projectType, { cwd = process.cwd(), migrate = true } = {}) {
  const order = projectType === 'auto' ? PROJECT_TYPES : [projectType];

  if (projectType !== 'auto' && !PROJECT_FILE_CANDIDATES[projectType]) {
    throw new Error(`Unknown project type: ${projectType}`);
  }

  for (const type of order) {
    const found = resolveProjectFile(cwd, type, { migrate });
    if (found) {
      return found;
    }
  }

  const expected = order.map(getProjectFileName).join(' or ');
  throw new Error(`No project file (${expected}) found in current directory`);
}

/**
 * Detect just the project type of a directory, without migrating anything.
 * Useful for scanning arbitrary/foreign projects (e.g. the express archive).
 *
 * @param {string} dir - Directory to inspect
 * @returns {'fnode'|'fnet'|null}
 */
export function detectProjectType(dir) {
  for (const type of PROJECT_TYPES) {
    if (resolveProjectFile(dir, type, { migrate: false })) {
      return type;
    }
  }
  return null;
}
