/**
 * Install command for fnet CLI
 */
import path from 'node:path';
import fs from 'node:fs';
import { spawn } from 'node:child_process';
import chalk from 'chalk';
import { createContext } from './context.js';

/**
 * Command configuration
 */
const command = {
  command: 'install [options]',
  describe: 'Install the project as a binary',
  builder: (yargs) => {
    return yargs
      .option('name', {
        alias: 'n',
        describe: 'Name to use for the installed binary',
        type: 'string'
      })
      .option('force', {
        alias: 'f',
        describe: 'Force overwrite if binary already exists',
        type: 'boolean',
        default: false
      })

      .option('yes', {
        alias: 'y',
        describe: 'Automatically answer yes to all prompts',
        type: 'boolean',
        default: false
      });
  },
  handler: async (argv) => {
    try {
      const context = await createContext(argv);
      const { projectDir } = context;

      // First, compile the project
      console.log(chalk.blue('Compiling project...'));

      // Create .bin directory if it doesn't exist
      const binDir = path.join(projectDir, '.bin');
      if (!fs.existsSync(binDir)) {
        fs.mkdirSync(binDir, { recursive: true });
      }

      // Determine binary name
      const projectName = path.basename(path.dirname(projectDir));

      // Get binary name from project file if available
      let binName;
      if (context.project && context.project.projectFileParsed &&
          context.project.projectFileParsed.features &&
          context.project.projectFileParsed.features.cli) {
        binName = context.project.projectFileParsed.features.cli.bin;
      }

      // Use command line argument, or bin name from project file, or project name
      const binaryName = argv.name || binName || projectName;
      console.log(chalk.blue(`Using binary name: ${binaryName}`));

      const binaryPath = path.join(binDir, binaryName);

      // Compile the project
      // Check if the dist/cli/esm/index.js file exists
      const cliIndexPath = path.join(projectDir, 'dist/cli/esm/index.js');
      if (!fs.existsSync(cliIndexPath)) {
        throw new Error(`CLI entry point not found: ${cliIndexPath}`);
      }

      const compileProcess = spawn('bun', ['build', './dist/cli/esm/index.js', '--compile', `--outfile=${binaryPath}`], {
        cwd: projectDir,
        stdio: 'inherit',
        shell: true
      });

      // Wait for compilation to complete
      await new Promise((resolve, reject) => {
        compileProcess.on('close', (code) => {
          if (code === 0) {
            resolve();
          } else {
            reject(new Error(`Compilation failed with code ${code}`));
          }
        });

        compileProcess.on('error', (err) => {
          reject(err);
        });
      });

      // Set executable permissions (not needed on Windows)
      if (process.platform !== 'win32') {
        fs.chmodSync(binaryPath, 0o755);
      }

      console.log(chalk.green(`Binary compiled successfully: ${binaryPath}`));

      // Now, install the binary
      console.log(chalk.blue('Installing binary...'));

      // Use fbin install to install the binary
      const installArgs = ['install', binaryPath];
      if (argv.name) installArgs.push('--name', argv.name);

      if (argv.force) installArgs.push('--force');
      if (argv.yes) installArgs.push('--yes');

      const installProcess = spawn('fbin', installArgs, {
        stdio: 'inherit',
        shell: true
      });

      // Wait for installation to complete
      await new Promise((resolve, reject) => {
        installProcess.on('close', (code) => {
          if (code === 0) {
            resolve();
          } else {
            reject(new Error(`Installation failed with code ${code}`));
          }
        });

        installProcess.on('error', (err) => {
          reject(err);
        });
      });

    } catch (error) {
      console.error(chalk.red(`Failed to install binary: ${error.message}`));
      process.exit(1);
    }
  }
};

export default command;
