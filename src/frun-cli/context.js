/**
 * Context utilities for frun CLI
 */

/**
 * Create a context object for CLI commands
 * 
 * @param {Object} argv - Command line arguments
 * @returns {Promise<Object>} Context object
 */
export async function createContext(argv) {
  return {
    projectDir: process.cwd(),
    tags: argv.ftag
  };
}
