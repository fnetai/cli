/**
 * Compile command for the bin system
 * This module provides the compile command for compiling CLI projects
 */
import path from 'node:path';
import fs from 'node:fs';
import os from 'node:os';
import chalk from 'chalk';
import fnetPrompt from '@fnet/prompt';
import { createContext } from './context.js';


export const command = 'compile [source] [options]';
export const describe = 'Compile a CLI project to a binary';

export const builder = {
  source: {
    describe: 'Source file to compile',
    type: 'string',
    default: './dist/cli/esm/index.js'
  },
  output: {
    describe: 'Output file name',
    type: 'string',
    alias: 'o'
  },
  name: {
    describe: 'Binary name',
    type: 'string',
    alias: 'n'
  },
  force: {
    describe: 'Force overwrite if binary already exists',
    type: 'boolean',
    default: false,
    alias: 'f'
  },
  target: {
    describe: 'Target platform (auto, linux, macos, windows)',
    type: 'string',
    choices: ['auto', 'linux', 'macos', 'windows'],
    default: 'auto'
  },
  minify: {
    describe: 'Minify the output binary',
    type: 'boolean',
    default: true
  },
  external: {
    describe: 'External packages to exclude from the bundle (comma-separated)',
    type: 'string'
  }
};

export const handler = async (argv) => {
  try {
    const context = await createContext(argv);
    // Get current directory name as default binary name
    const currentDir = process.cwd();
    const defaultName = path.basename(currentDir);

    // Determine binary name
    const binaryName = argv.name || defaultName;

    // Determine output path
    let outputPath;
    if (argv.output) {
      outputPath = argv.output;
    } else {
      // Create .bin directory if it doesn't exist
      const binDir = path.join(currentDir, '.bin');
      if (!fs.existsSync(binDir)) {
        fs.mkdirSync(binDir, { recursive: true });
      }
      outputPath = path.join(binDir, binaryName);
    }

    // Check if source file exists
    const sourcePath = path.resolve(process.cwd(), argv.source);
    if (!fs.existsSync(sourcePath)) {
      console.error(chalk.red(`Source file not found: ${sourcePath}`));
      console.error(chalk.yellow('Make sure to build your project first.'));
      process.exit(1);
    }

    // Check if output file already exists
    if (fs.existsSync(outputPath) && !argv.force) {
      const { confirmOverwrite } = await fnetPrompt({
        type: 'confirm',
        name: 'confirmOverwrite',
        message: `Binary already exists at ${outputPath}. Overwrite?`,
        initial: false
      });

      if (!confirmOverwrite) {
        console.log(chalk.yellow('Compilation cancelled.'));
        return;
      }
    }

    // Detect platform
    const platform = process.platform;
    console.log(chalk.blue(`Detected platform: ${platform}`));

    // Add extension for Windows
    if (platform === 'win32' && !outputPath.endsWith('.exe')) {
      outputPath = `${outputPath}.exe`;
      console.log(chalk.blue(`Adjusted output path for Windows: ${outputPath}`));
    }

    // Compile binary
    console.log(chalk.blue(`Compiling ${sourcePath} to ${outputPath}...`));

    // Use Bun's build command for compilation
    const { spawn } = await import('child_process');

    // Check if bun is available
    try {
      const bunVersionProcess = spawn('bun', ['--version'], {
        stdio: 'pipe'
      });

      await new Promise((resolve, reject) => {
        bunVersionProcess.on('close', (code) => {
          if (code === 0) {
            resolve();
          } else {
            reject(new Error(`Bun is not available. Please install Bun first.`));
          }
        });

        bunVersionProcess.on('error', (err) => {
          reject(new Error(`Bun is not available: ${err.message}`));
        });
      });
    } catch (error) {
      console.error(chalk.red(`Bun is not available: ${error.message}`));
      console.error(chalk.yellow('Please install Bun first: https://bun.sh/'));
      process.exit(1);
    }

    // Prepare build arguments
    const buildArgs = ['build', sourcePath, '--compile', `--outfile=${outputPath}`];

    // Add target platform if specified
    if (argv.target && argv.target !== 'auto') {
      buildArgs.push(`--target=${argv.target}`);
    }

    // Add minify option
    if (argv.minify === false) {
      buildArgs.push('--no-minify');
    }

    // Add external packages
    if (argv.external) {
      const externals = argv.external.split(',').map(pkg => pkg.trim());
      externals.forEach(pkg => {
        buildArgs.push(`--external:${pkg}`);
      });
    }

    console.log(chalk.blue(`Running: bun ${buildArgs.join(' ')}`));

    const bunProcess = spawn('bun', buildArgs, {
      stdio: 'inherit'
    });

    // Wait for compilation to complete
    await new Promise((resolve, reject) => {
      bunProcess.on('close', (code) => {
        if (code === 0) {
          resolve();
        } else {
          reject(new Error(`Compilation failed with code ${code}`));
        }
      });

      bunProcess.on('error', (err) => {
        reject(err);
      });
    });

    // Set executable permissions (not needed on Windows)
    if (platform !== 'win32') {
      fs.chmodSync(outputPath, 0o755);
    }
    console.log(chalk.green(`Binary compiled successfully: ${outputPath}`));

    // Platform-specific notes
    if (platform === 'win32') {
      console.log(chalk.yellow('Note: On Windows, you may need to run the binary from a command prompt or PowerShell.'));
    } else if (platform === 'darwin') {
      console.log(chalk.yellow('Note: On macOS, you may need to allow the binary to run in System Preferences > Security & Privacy.'));
    }


  } catch (error) {
    console.error(chalk.red(`Failed to compile binary: ${error.message}`));
    process.exit(1);
  }
};

export default {
  command,
  describe,
  builder,
  handler
};
