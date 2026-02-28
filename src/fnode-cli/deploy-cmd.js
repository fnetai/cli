/**
 * Deploy command for fnode CLI
 */
import RuntimeFactory from '../builder/runtime-factory.js';
import { createContext } from './context.js';

/**
 * Command configuration
 */
const command = {
  command: 'deploy',
  describe: 'Build and deploy fnode project',
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
      const context = await createContext({ ...argv, mode: "all" });
      const builder = await RuntimeFactory.createBuilder(context);
      await builder.init();
      await builder.build();

      console.log('Building library succeeded!');
      process.exit(0);
    } catch (error) {
      console.error('Building library failed!', error.message);
      process.exit(1);
    }
  }
};

export default command;
