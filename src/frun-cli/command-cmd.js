/**
 * Command handler for the frun command
 */
import { runCommandGroup, listCommandGroups } from '../utils/common-run.js';

/**
 * Create command configuration with centralized ProcessManager
 * @param {Object} options
 * @param {import('@fnet/shell-flow').ProcessManager} options.processManager - Centralized process manager
 * @returns {Object} yargs command configuration
 */
export default function createCommandCmd({ processManager }) {
  return {
    command: '$0 [group] [options..]',
    describe: 'Run a command group from project file',
    builder: (yargs) => {
      return yargs
        .parserConfiguration({
          // 'camel-case-expansion': false
        })
        .middleware((argv) => {
          // Convert kebab-case to snake_case while preserving original keys
          const kebabCasePattern = /^[a-zA-Z0-9]+(-[a-zA-Z0-9]+)+$/;

          Object.keys(argv).forEach(key => {
            if (kebabCasePattern.test(key)) {
              const snakeKey = key.replace(/-/g, '_');
              argv[snakeKey] = argv[key];
              // Keep original kebab-case key as well
            }
          });
        })
        .positional('group', {
          type: 'string',
          describe: 'Command group to run'
        })
        .option('list', {
          type: 'boolean',
          describe: 'List all available command groups',
          alias: 'l'
        })
        .option('ftag', {
          type: 'array',
          describe: 'Tags for conditional configuration'
        })
        .example('$0 build', 'Run the build command group')
        .example('$0 --list', 'List all available command groups')
        .example('$0 test --ftag dev', 'Run the test command group with dev tag');
    },
    handler: async (argv) => {
      try {
        // Handle --list flag
        if (argv.list) {
          await listCommandGroups({
            projectType: 'auto',
            tags: argv.ftag
          });
          return;
        }

        // Require group when not listing
        if (!argv.group) {
          console.error('Error: Please specify a command group or use --list to see available commands.');
          process.exit(1);
        }

        // Run command group with centralized process management
        await runCommandGroup({
          projectType: 'auto',
          group: argv.group,
          tags: argv.ftag,
          args: argv,
          argv: process.argv,
          processManager
        });
      } catch (error) {
        console.error(`Error: ${error.message}`);
        await processManager.dispose();
        process.exit(1);
      }
    }
  };
}
