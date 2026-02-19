/**
 * Input command for fnet CLI
 */
import path from 'node:path';
import fs from 'node:fs';
import fnetPrompt from '@fnet/prompt';
import { createContext } from './context.js';

/**
 * Command configuration
 */
const command = {
  command: 'input [name]',
  describe: 'Create or modify an input config file',
  builder: (yargs) => {
    return yargs
      .positional('name', {
        type: 'string',
        demandOption: false,
        describe: 'Input name'
      });
  },
  handler: async (argv) => {
    try {
      const context = await createContext(argv);
      const { project } = context;
      const { projectDir, projectFileParsed } = project;
      const schema = projectFileParsed.input;
      if (!schema) throw new Error('Config schema not found in project file.');

      if (!Reflect.has(argv, 'name')) {
        const { inputName } = await fnetPrompt({
          type: 'input',
          name: 'inputName',
          message: 'Input name:',
          initial: 'dev'
        });
        argv.name = inputName;
      }

      const dotFnetDir = path.resolve(projectDir, '.fnet');
      if (!fs.existsSync(dotFnetDir)) fs.mkdirSync(dotFnetDir);

      const configFilePath = path.resolve(dotFnetDir, `${argv.name}.fnet`);
      const exists = fs.existsSync(configFilePath);

      const fnetObjectFromSchema = (await import('@fnet/object-from-schema')).default;
      const result = await fnetObjectFromSchema({
        schema,
        format: "yaml",
        ref: exists ? configFilePath : undefined
      });
      fs.writeFileSync(configFilePath, result);
    } catch (error) {
      console.error(error.message);
      process.exit(1);
    }
  }
};

export default command;
