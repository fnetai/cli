/**
 * Common CLI utilities for Flownet CLI tools
 */
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawn } from 'node:child_process';
import fs from 'node:fs';
import chalk from 'chalk';
import fnetConfig from '@fnet/config';
import { setupSignalHandlers } from './process-manager.js';

/**
 * Bind a simple context command to a yargs builder
 *
 * @param {Object} builder - Yargs builder
 * @param {Object} options - Command options
 * @param {string} [options.name] - Command name (defaults to bin)
 * @param {string} options.bin - Binary to execute
 * @param {Array} [options.preArgs=[]] - Arguments to prepend to the command
 * @param {Function} options.createContext - Function to create context
 * @returns {Object} Updated yargs builder
 */
export function bindSimpleContextCommand(builder, { name, bin, preArgs = [], createContext }) {
  if (typeof bin === 'function') bin = bin();

  return builder.command(
    `${name || bin} [commands..]`, `${bin} ${preArgs.join(' ')}`,
    (yargs) => {
      return yargs
        .help(false)
        .version(false);
    },
    async (argv) => {
      try {
        const context = await createContext(argv);
        const { projectDir } = context;

        const escapeArg = (arg) => {
          if (!arg.includes(' ')) return arg;

          if (process.platform === 'win32') {
            return `"${arg.replace(/(["^])/g, '^$1')}"`;
          } else {
            return `"${arg.replace(/(["\\$`])/g, '\\$1')}"`;
          }
        };

        const rawArgs = process.argv.slice(3).map(escapeArg);

        // Prepare environment variables to isolate node_modules to projectDir
        const env = { ...process.env };

        // Set NODE_PATH to projectDir's node_modules to prevent parent node_modules lookup
        const projectNodeModules = path.join(projectDir, 'node_modules');
        env.NODE_PATH = projectNodeModules;
        env.NODE_PRESERVE_SYMLINKS =1;
        // env.NODE_OPTIONS = `${env.NODE_OPTIONS || ''} --preserve-symlinks`.trim();
        


        const subprocess = spawn(bin, [...preArgs, ...rawArgs], {
          cwd: projectDir,
          stdio: 'inherit',
          shell: true,
          detached: true,
          env
        });

        // Set up signal handlers and error handlers for the subprocess
        setupSignalHandlers(subprocess);
      } catch (error) {
        console.error(error.message);
        process.exit(1);
      }
    }
  );
}

/**
 * Bind a conda context command to a yargs builder
 *
 * @param {Object} builder - Yargs builder
 * @param {Object} options - Command options
 * @param {string} options.name - Command name
 * @param {string} [options.bin] - Binary to execute (defaults to name)
 * @param {Array} [options.preArgs=[]] - Arguments to prepend to the command
 * @param {Function} options.createContext - Function to create context
 * @returns {Object} Updated yargs builder
 */
export function bindCondaContextCommand(builder, { name, bin, preArgs = [], createContext }) {
  return builder.command(
    `${name || bin} [commands..]`, `${bin} ${preArgs.join(' ')}`,
    (yargs) => {
      return yargs
        .help(false)
        .version(false);
    },
    async (argv) => {
      try {
        const context = await createContext(argv);
        const { projectDir } = context;

        const escapeArg = (arg) => {
          if (!arg.includes(' ')) return arg;

          if (process.platform === 'win32') {
            return `"${arg.replace(/(["^])/g, '^$1')}"`;
          } else {
            return `"${arg.replace(/(["\\$`])/g, '\\$1')}"`;
          }
        };

        const rawArgs = process.argv.slice(3).map(escapeArg);

        bin = path.join(projectDir, '.conda', 'bin', bin || name);

        const subprocess = spawn(bin, [...preArgs, ...rawArgs], {
          cwd: projectDir,
          stdio: 'inherit',
          shell: true,
          detached: true,
          env: {
            "PYTHONPATH": projectDir
          }
        });

        // Set up signal handlers and error handlers for the subprocess
        setupSignalHandlers(subprocess);

      } catch (error) {
        console.error(error.message);
        process.exit(1);
      }
    }
  );
}

/**
 * Bind a conda bin command to a yargs builder
 * This allows running any binary from the conda environment
 *
 * @param {Object} builder - Yargs builder
 * @param {Object} options - Command options
 * @param {string} options.name - Command name (e.g., 'bin')
 * @param {Function} options.createContext - Function to create context
 * @returns {Object} Updated yargs builder
 */
export function bindCondaBinCommand(builder, { name, createContext }) {
  return builder.command(
    `${name} <binary> [commands..]`,
    `Run a binary from conda environment`,
    (yargs) => {
      return yargs
        .positional('binary', {
          type: 'string',
          describe: 'Binary name to run from .conda/bin'
        })
        .help(false)
        .version(false);
    },
    async (argv) => {
      try {
        const context = await createContext(argv);
        const { projectDir } = context;

        const escapeArg = (arg) => {
          if (!arg.includes(' ')) return arg;

          if (process.platform === 'win32') {
            return `"${arg.replace(/(["^])/g, '^$1')}"`;
          } else {
            return `"${arg.replace(/(["\\$`])/g, '\\$1')}"`;
          }
        };

        const binaryName = argv.binary;
        const rawArgs = process.argv.slice(4).map(escapeArg); // Skip 'fnode', 'bin', and binary name

        const bin = path.join(projectDir, '.conda', 'bin', binaryName);

        const subprocess = spawn(bin, rawArgs, {
          cwd: projectDir,
          stdio: 'inherit',
          shell: true,
          detached: true,
          env: {
            "PYTHONPATH": projectDir
          }
        });

        // Set up signal handlers and error handlers for the subprocess
        setupSignalHandlers(subprocess);

      } catch (error) {
        console.error(error.message);
        process.exit(1);
      }
    }
  );
}

/**
 * Bind a with context command to a yargs builder
 *
 * @param {Object} builder - Yargs builder
 * @param {Object} options - Command options
 * @param {string} options.name - Command name
 * @param {Array} [options.preArgs=[]] - Arguments to prepend to the command
 * @param {Function} options.createContext - Function to create context
 * @returns {Object} Updated yargs builder
 */
export function bindWithContextCommand(builder, { name, preArgs = [], createContext }) {
  return builder.command(
    `${name} <config> <command> [options..]`, `Run a command with a config context`,
    (yargs) => {
      return yargs
        .positional('config', { type: 'string' })
        .positional('command', { type: 'string' })
        .help(false)
        .version(false);
    },
    async (argv) => {
      try {
        const context = await createContext(argv);
        const { projectDir } = context;

        // config name
        const configName = argv.config;
        const config = await fnetConfig({ name: configName, dir: projectDir, transferEnv: false, optional: true, tags: context.tags });
        const env = config?.data?.env || undefined;

        // command name
        const commandName = argv.command;

        const rawArgs = process.argv.slice(5);

        const subprocess = spawn(commandName, [...preArgs, ...rawArgs], {
          cwd: fs.existsSync(projectDir) ? projectDir : process.cwd(),
          stdio: 'inherit',
          shell: true,
          detached: true,
          env: {
            ...process.env,
            ...env
          }
        });

        // Set up signal handlers and error handlers for the subprocess
        setupSignalHandlers(subprocess);
      } catch (error) {
        console.error(error.message);
        process.exit(1);
      }
    }
  );
}

/**
 * Bind a run context command to a yargs builder
 *
 * @param {Object} builder - Yargs builder
 * @param {Object} options - Command options
 * @param {string} options.name - Command name
 * @param {string} [options.projectType='auto'] - Project type ('fnode', 'fnet', or 'auto')
 * @returns {Object} Updated yargs builder
 */
export function bindRunContextCommand(builder, { name, projectType = 'auto' }) {
  return builder.command(
    `${name} group [options..]`, `Run a command group.`,
    (yargs) => {
      return yargs
        .positional('group', { type: 'string' })
        .option('ftag', { type: 'array' })
        .help(false)
        .version(false);
    },
    async (argv) => {
      try {
        // Import the common run utility
        const { runCommandGroup } = await import('./common-run.js');

        // Run command group using the common utility
        await runCommandGroup({
          projectType: projectType, // Use the provided project type
          group: argv.group,
          tags: argv.ftag,
          args: argv,
          argv: process.argv
        });
      } catch (error) {
        console.error(error.message);
        process.exit(1);
      }
    }
  );
}

/**
 * Bind an install command to a yargs builder
 *
 * @param {Object} builder - Yargs builder
 * @param {Object} options - Command options
 * @param {string} options.name - Command name
 * @param {Function} options.createContext - Function to create context
 * @returns {Object} Updated yargs builder
 */
export function bindInstallCommand(builder, { name, createContext }) {
  return builder.command(
    `${name} [options]`, `Install the project as a binary`,
    (yargs) => {
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
        })
    },
    async (argv) => {
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
        const binName = context.project?.projectFileParsed?.features?.cli?.bin;

        // Use command line argument, or bin name from project file, or project name
        const binaryName = argv.name || binName || projectName;
        console.log(chalk.blue(`Using binary name: ${binaryName}`));

        const binaryPath = path.join(binDir, binaryName);

        // Compile the project
        const { spawn } = await import('child_process');
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
  );
}

/**
 * Bind an input command to a yargs builder
 *
 * @param {Object} builder - Yargs builder
 * @returns {Object} Updated yargs builder
 */
export function bindInputCommand(builder) {
  return builder.command(
    `input [name]`, `Create or modify an input config file`,
    (yargs) => {
      return yargs
        .positional('name', { type: 'string', demandOption: false })
        .help(false)
        .version(false);
    },
    async (argv) => {
      try {
        const context = await createContext(argv);
        const { project } = context;
        const { projectDir, projectFileParsed } = project;
        const schema = projectFileParsed.input;
        if (!schema) throw new Error('Config schema not found in project file.');

        if (!Reflect.has(argv, 'name')) {
          const fnetPrompt = await import('@fnet/prompt').then(m => m.default);
          const { inputName } = await fnetPrompt({ type: 'input', name: 'inputName', message: 'Input name:', initial: 'dev' });
          argv.name = inputName;
        }

        const dotFnetDir = path.resolve(projectDir, '.fnet');
        if (!fs.existsSync(dotFnetDir)) fs.mkdirSync(dotFnetDir);

        const configFilePath = path.resolve(dotFnetDir, `${argv.name}.fnet`);
        const exists = fs.existsSync(configFilePath);

        const fnetObjectFromSchema = (await import('@fnet/object-from-schema')).default;
        const result = await fnetObjectFromSchema({ schema, format: "yaml", ref: exists ? configFilePath : undefined });
        fs.writeFileSync(configFilePath, result);
      } catch (error) {
        console.error(error.message);
        process.exit(1);
      }
    }
  );
}
