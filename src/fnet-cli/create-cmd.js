/**
 * Create command for fnet CLI
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
  describe: 'Initialize a new fnet project',
  builder: (yargs) => {
    return yargs
      .option('name', {
        type: 'string',
        describe: 'Project name'
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
        choices: ['node', 'bun'],
        describe: 'Runtime environment'
      })
      .option('build', {
        type: 'boolean', 
        default: true,
        describe: 'Build the project after creation'
      })
      .option('git', {
        type: 'boolean',
        default: true,
        describe: 'Initialize a git repository'
      })
      .option('build', {
        type: 'boolean',
        default: true,
        describe: 'Build the project after creation'
      })
      .demandOption('name', 'Please provide a project name using --name')
      ;
  },
  handler: async (argv) => {
    try {
      const cwd = process.cwd();
      const templateDir = resolveTemplatePath('./template/fnet/project');
      const outDir = path.resolve(cwd, argv.name);

      if (!fs.existsSync(outDir)) fs.mkdirSync(outDir);

      await fnetRender({
        dir: templateDir,
        outDir,
        context: argv,
        copyUnmatchedAlso: true,
        platform: os.platform()
      });

      if (argv.build) {
        let shellResult = await fnetShellJs(`fnet build`, { cwd: outDir });
        if (shellResult.code !== 0) throw new Error('Failed to build project.');
      }

      if (argv.git && which('git')) {
        let shellResult = await fnetShellJs(`git init --initial-branch=main`, { cwd: outDir });
        if (shellResult.code !== 0) throw new Error('Failed to initialize git.');
      }

      if (argv.vscode && which('code')) {
        let shellResult = await fnetShellJs(`cd ${outDir} && code .`);
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
