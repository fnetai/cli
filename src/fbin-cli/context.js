/**
 * Context utilities for fbin CLI
 */
import { getBinDir, getBinRegistryPath } from './utils.js';
import fs from 'node:fs';

/**
 * Create a context object for CLI commands
 * 
 * @param {Object} argv - Command line arguments
 * @returns {Promise<Object>} Context object
 */
export async function createContext(argv) {
  const binDir = getBinDir();
  const registryPath = getBinRegistryPath();
  
  // Load registry if it exists
  let registry = {};
  if (fs.existsSync(registryPath)) {
    try {
      const registryContent = fs.readFileSync(registryPath, 'utf8');
      registry = JSON.parse(registryContent);
    } catch (error) {
      console.warn(`Warning: Could not parse bin registry: ${error.message}`);
    }
  }
  
  return {
    binDir,
    registryPath,
    registry,
    args: argv
  };
}
