/**
 * Main entry point for the fnode command
 * This file provides a CLI for managing fnode projects
 */
import yargs from 'yargs';
import chalk from 'chalk';
import { setupGlobalErrorHandlers } from '../utils/process-manager.js';
import {
  bindSimpleContextCommand,
  bindCondaContextCommand,
  bindCondaBinCommand,
  bindWithContextCommand,
  bindRunContextCommand,
  bindInstallCommand
} from '../utils/cli-utils.js';
import { createContext } from './context.js';

// Import commands
import createCmd from './create-cmd.js';
import projectCmd from './project-cmd.js';
import buildCmd from './build-cmd.js';
import buildDevCmd from './build-dev-cmd.js';
import deployCmd from './deploy-cmd.js';
import fileCmd from './file-cmd.js';
import inputCmd from './input-cmd.js';
import { expressCmd } from './express-cmd.js';
import { setupEnvironment } from './utils.js';

// Set up global error handlers
setupGlobalErrorHandlers();

// Set up environment
setupEnvironment();

/**
 * Main function
 */
async function main() {
  try {
    // Create the yargs instance
    let cmdBuilder = yargs(process.argv.slice(2))
      .usage('Usage: $0 <command> [options]')
      .command(createCmd)
      .command(projectCmd)
      .command(buildCmd)
      .command(buildDevCmd)
      .command(deployCmd)
      .command(fileCmd)
      .command(inputCmd)
      .command('express', 'Create and manage express projects', expressCmd);

    // Add pass-through commands
    cmdBuilder = bindSimpleContextCommand(cmdBuilder, { bin: 'npm', createContext });
    cmdBuilder = bindSimpleContextCommand(cmdBuilder, { bin: 'node', createContext });
    cmdBuilder = bindSimpleContextCommand(cmdBuilder, { bin: 'bun', createContext });
    cmdBuilder = bindSimpleContextCommand(cmdBuilder, { name: "serve", bin: 'bun', preArgs: ['run', 'serve', '--'], createContext });
    cmdBuilder = bindSimpleContextCommand(cmdBuilder, { name: "watch", bin: 'bun', preArgs: ['run', 'watch', '--'], createContext });
    cmdBuilder = bindSimpleContextCommand(cmdBuilder, { name: "app", bin: 'bun', preArgs: ['run', 'app', '--'], createContext });
    cmdBuilder = bindSimpleContextCommand(cmdBuilder, { name: "cli", bin: 'bun', preArgs: ['run', 'cli', '--'], createContext });
    cmdBuilder = bindSimpleContextCommand(cmdBuilder, { name: "cli:dev", bin: 'bun', preArgs: ['run', 'cli:dev', '--'], createContext });
    cmdBuilder = bindSimpleContextCommand(cmdBuilder, { name: "cli:compile", bin: 'bun', preArgs: ['run', 'cli:compile', '--'], createContext });
    cmdBuilder = bindSimpleContextCommand(cmdBuilder, { name: "cli:compile:dev", bin: 'bun', preArgs: ['run', 'cli:compile:dev', '--'], createContext });
    cmdBuilder = bindSimpleContextCommand(cmdBuilder, { name: "cli:install", bin: 'bun', preArgs: ['run', 'cli:install', '--'], createContext });
    cmdBuilder = bindSimpleContextCommand(cmdBuilder, { name: "compile", bin: 'bun', preArgs: ['run', 'compile', '--'], createContext });
    cmdBuilder = bindInstallCommand(cmdBuilder, { name: "install", createContext });
    cmdBuilder = bindSimpleContextCommand(cmdBuilder, { bin: 'npx', createContext });
    cmdBuilder = bindSimpleContextCommand(cmdBuilder, { bin: 'cdk', createContext });
    cmdBuilder = bindSimpleContextCommand(cmdBuilder, { bin: 'aws', createContext });
    cmdBuilder = bindWithContextCommand(cmdBuilder, { name: 'with', createContext });
    cmdBuilder = bindRunContextCommand(cmdBuilder, { name: 'run', projectType: 'fnode' });
    cmdBuilder = bindCondaContextCommand(cmdBuilder, { name: 'python', createContext });
    cmdBuilder = bindCondaContextCommand(cmdBuilder, { name: 'python3', createContext });
    cmdBuilder = bindCondaContextCommand(cmdBuilder, { name: 'pip', createContext });
    cmdBuilder = bindCondaContextCommand(cmdBuilder, { name: 'pip3', createContext });
    cmdBuilder = bindCondaBinCommand(cmdBuilder, { name: 'bin', createContext });

    cmdBuilder
      .demandCommand(1, 'You need at least one command before moving on')
      .help()
      .version()
      .argv;
  } catch (error) {
    console.error(chalk.red(`Fatal error: ${error.message}`));
    process.exit(1);
  }
}

// Run main function
main().catch(error => {
  console.error(chalk.red(`Fatal error: ${error.message}`));
  process.exit(1);
});
