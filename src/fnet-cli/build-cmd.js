/**
 * Build command for fnet CLI
 */

import Builder from '../builder/wf-builder.js';
import { createContext } from './context.js';

/**
 * Command configuration
 */
const command = {
  command: 'build',
  describe: 'Build flownet project',
  builder: (yargs) => {
    return yargs
      .option('id', {
        type: 'string',
        describe: 'Project ID'
      })
      .option('buildId', {
        type: 'string',
        alias: 'bid',
        describe: 'Build ID'
      })
      .option('mode', {
        type: 'string',
        default: "build",
        choices: ['all', 'file', 'build', 'deploy', 'bpmn'],
        describe: 'Build mode'
      })
      .option('ftag', {
        type: 'array',
        describe: 'Tags for conditional configuration'
      })
      .option('dev', {
        type: 'boolean',
        default: false,
        describe: 'Development mode'
      })
      .option('flows', {
        type: 'string',
        alias: 'flow',
        describe: 'Path to flows file'
      });
  },
  handler: async (argv) => {
    try {

      const context = await createContext(argv);

      const builder = new Builder(context);
      await builder.init();
      await builder.build();

      console.log('Building workflow succeeded!');
      process.exit(0);
    } catch (error) {
      console.error('Building workflow failed!', error.message);
      process.exit(1);
    }
  }
};

export default command;
