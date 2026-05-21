/**
 * Yml command for fnet CLI
 */
import { renderYml } from '../utils/yml-render.js';

const command = {
  command: 'yml',
  describe: 'Render a YAML file (resolving includes and tags) and save it',
  builder: (yargs) => {
    return yargs
      .option('input', {
        type: 'string',
        alias: 'i',
        demandOption: true,
        describe: 'Input YAML file path (resolved against cwd)'
      })
      .option('output', {
        type: 'string',
        alias: 'o',
        describe: 'Output file path (resolved against cwd). Defaults to stdout.'
      })
      .option('tag', {
        type: 'array',
        alias: 't',
        describe: 'Tags for conditional configuration (repeatable)'
      });
  },
  handler: async (argv) => {
    try {
      const rendered = await renderYml({
        input: argv.input,
        output: argv.output,
        tags: argv.tag
      });
      if (!argv.output) {
        process.stdout.write(rendered);
      }
    } catch (error) {
      console.error(error.message);
      process.exit(1);
    }
  }
};

export default command;
