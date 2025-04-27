/**
 * Command handler for the frun command
 */
import { runCommandGroup } from '../utils/common-run.js';

/**
 * Command configuration
 */
const command = {
  command: '$0 <group> [options..]',
  describe: 'Run a command group from project file',
  builder: (yargs) => {
    return yargs
      .positional('group', {
        type: 'string',
        describe: 'Command group to run'
      })
      .option('ftag', {
        type: 'array',
        describe: 'Tags for conditional configuration'
      })
      .example('$0 build', 'Run the build command group')
      .example('$0 test --ftag dev', 'Run the test command group with dev tag');
  },
  handler: async (argv) => {
    try {
      // Run command group using the common utility
      await runCommandGroup({
        projectType: 'auto', // Auto-detect project type
        group: argv.group,
        tags: argv.ftag,
        args: argv,
        argv: process.argv
      });
    } catch (error) {
      console.error(`Error: ${error.message}`);
      process.exit(1);
    }
  }
};

export default command;
