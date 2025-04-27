/**
 * Compile command for the bin system
 * This module provides the compile command for compiling CLI projects
 */
import path from 'node:path';
import fs from 'node:fs';
import os from 'node:os';
import chalk from 'chalk';
import fnetPrompt from '@fnet/prompt';


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
  }
};

export const handler = async (argv) => {
  try {
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

    // Compile binary
    console.log(chalk.blue(`Compiling ${sourcePath} to ${outputPath}...`));

    // Use Bun's build command for compilation
    const { spawn } = await import('child_process');
    const bunProcess = spawn('bun', ['build', sourcePath, '--compile', `--outfile=${outputPath}`], {
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

    // Set executable permissions
    fs.chmodSync(outputPath, 0o755);
    console.log(chalk.green(`Binary compiled successfully: ${outputPath}`));


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
