/**
 * File command for fnet CLI
 */
import Builder from '../builder/wf-builder.js';
import { createContext } from './context.js';

/**
 * Command configuration
 */
const command = {
  command: 'file',
  describe: 'Just create files',
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
      .option('ftag', {
        type: 'array',
        describe: 'Tags for conditional configuration'
      });
  },
  handler: async (argv) => {
    try {
      const context = await createContext({ ...argv, mode: "file" });

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
