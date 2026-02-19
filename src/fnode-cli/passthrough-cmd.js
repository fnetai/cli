/**
 * Passthrough commands for fnode CLI
 * This file provides a common handler for pass-through commands like npm, node, bun, etc.
 */
import { spawn } from 'node:child_process';
import { setupSignalHandlers } from '../utils/process-manager.js';
import { createContext } from './context.js';

/**
 * Create a passthrough command
 *
 * @param {string} name - Command name
 * @param {string} bin - Binary to execute
 * @param {Array} preArgs - Arguments to prepend to the command
 * @returns {Object} Command configuration
 */
export function createPassthroughCommand(name, bin, preArgs = []) {
  return {
    command: `${name} [commands..]`,
    describe: `Run ${bin} ${preArgs.join(' ')}`,
    builder: (yargs) => {
      return yargs
        .help(false)
        .version(false);
    },
    handler: async (argv) => {
      try {
        const context = await createContext(argv);
        const { projectDir } = context;

        const escapeArg = (arg) => {
          if (!arg.includes(' ')) return arg;

          if (process.platform === 'win32') {
            return `"${arg.replace(/(["^])/g, '^$1')}"`;
          } else {
            return `"${arg.replace(/(["\\$`])/g, '\\$1')}"`;
          }
        };

        const rawArgs = process.argv.slice(3).map(escapeArg);

        const subprocess = spawn(bin, [...preArgs, ...rawArgs], {
          cwd: projectDir,
          stdio: 'inherit',
          shell: true,
          detached: true
        });

        // Set up signal handlers and error handlers for the subprocess
        setupSignalHandlers(subprocess);
      } catch (error) {
        console.error(error.message);
        process.exit(1);
      }
    }
  };
}

// Export a default command for consistency
export default {
  command: 'passthrough',
  describe: 'Pass through to another command',
  builder: (yargs) => yargs,
  handler: () => {
    console.error('This is a placeholder command. Use specific pass-through commands instead.');
    process.exit(1);
  }
};
