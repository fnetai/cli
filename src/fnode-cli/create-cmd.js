/**
 * Create command for fnode CLI
 */
import path from 'node:path';
import fs from 'node:fs';
import os from 'node:os';
import fnetRender from '@flownet/lib-render-templates-dir';
import fnetShellJs from '@fnet/shelljs';
import which from '../builder/which.js';
import resolveTemplatePath from '../utils/resolve-template-path.js';

/**
 * Command configuration
 */
const command = {
  command: 'create',
  describe: 'Create a new fnode project',
  builder: (yargs) => {
    return yargs
      .option('name', { 
        type: 'string', 
        describe: 'Project name',
        demandOption: true 
      })
      .option('vscode', { 
        type: 'boolean', 
        default: true, 
        alias: 'vs',
        describe: 'Open in VS Code after creation' 
      })
      .option('runtime', { 
        type: 'string', 
        default: 'node', 
        choices: ['node', 'python', 'bun'],
        describe: 'Runtime environment' 
      });
  },
  handler: async (argv) => {
    try {
      const cwd = process.cwd();
      const templateDir = resolveTemplatePath('./template/fnode/project');
      const outDir = path.resolve(cwd, argv.name);
      
      if (!fs.existsSync(outDir)) fs.mkdirSync(outDir);

      await fnetRender({
        dir: templateDir,
        outDir,
        context: {
          name: argv.name,
          runtime: argv.runtime,
          platform: os.platform(),
        },
        copyUnmatchedAlso: true
      });

      let shellResult = await fnetShellJs(`fnode build`, { cwd: outDir });
      if (shellResult.code !== 0) throw new Error('Failed to build project.');

      if (which('git')) {
        shellResult = await fnetShellJs(`git init --initial-branch=main`, { cwd: outDir });
        if (shellResult.code !== 0) throw new Error('Failed to initialize git.');
      }

      if (which('code') && argv.vscode) {
        shellResult = await fnetShellJs(`cd ${outDir} && code .`);
        if (shellResult.code !== 0) throw new Error('Failed to open vscode.');
      }

      console.log('Creating project succeeded!');
      process.exit(0);
    } catch (error) {
      console.error('Initialization failed!', error.message);
      process.exit(1);
    }
  }
};

export default command;
