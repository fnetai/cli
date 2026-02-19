/**
 * Run command for fnet CLI
 */
import { runCommandGroup } from '../utils/common-run.js';

/**
 * Command configuration
 */
const command = {
  command: 'run <group> [options..]',
  describe: 'Run a command group',
  builder: (yargs) => {
    return yargs
      .positional('group', { 
        type: 'string',
        describe: 'Command group to run' 
      })
      .option('ftag', { 
        type: 'array',
        describe: 'Tags for conditional configuration' 
      });
  },
  handler: async (argv) => {
    try {
      // Run command group using the common utility
      await runCommandGroup({
        projectType: 'fnet', // Only look for fnet.yaml
        group: argv.group,
        tags: argv.ftag,
        args: argv,
        argv: process.argv
      });
    } catch (error) {
      console.error(error.message);
      process.exit(1);
    }
  }
};

export default command;
