/**
 * Project command for fnode CLI
 */
import os from 'node:os';
import fnetRender from '@flownet/lib-render-templates-dir';
import fnetShellJs from '@fnet/shelljs';
import resolveTemplatePath from '../utils/resolve-template-path.js';
import { createContext } from './context.js';

/**
 * Command configuration
 */
const command = {
  command: 'project',
  describe: 'Manage fnode project',
  builder: (yargs) => {
    return yargs
      .option('update', {
        type: 'boolean',
        default: false,
        alias: '-u',
        describe: 'Update project files'
      });
  },
  handler: async (argv) => {
    try {
      const templateDir = resolveTemplatePath('./template/fnode/project');
      const outDir = process.cwd();

      const context = await createContext(argv);

      if (argv.update) {
        await fnetRender({
          dir: templateDir,
          outDir,
          context: {
            name: context.project.projectFileParsed.name,
            runtime: context.project.runtime.type,
            platform: os.platform(),
          },
          copyUnmatchedAlso: true
        });

        let shellResult = await fnetShellJs(`fnode build`, { cwd: outDir });
        if (shellResult.code !== 0) throw new Error('Failed to build project.');

        console.log('Updating project succeeded!');
      }

      process.exit(0);
    } catch (error) {
      console.error('Project failed.', error.message);
      process.exit(1);
    }
  }
};

export default command;
