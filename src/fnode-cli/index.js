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
  bindWithContextCommand,
  bindRunContextCommand,
  bindInstallCommand
} from '../utils/cli-utils.js';

// Import commands
import createCmd from './create-cmd.js';
import projectCmd from './project-cmd.js';
import buildCmd from './build-cmd.js';
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
      .command(buildCmd())
      .command(buildCmd({ dev: true }))
      .command(deployCmd)
      .command(fileCmd)
      .command(inputCmd)
      .command('express', 'Create and manage express projects', expressCmd);

    // Add pass-through commands
    cmdBuilder = bindSimpleContextCommand(cmdBuilder, { bin: 'npm' });
    cmdBuilder = bindSimpleContextCommand(cmdBuilder, { bin: 'node' });
    cmdBuilder = bindSimpleContextCommand(cmdBuilder, { bin: 'bun' });
    cmdBuilder = bindSimpleContextCommand(cmdBuilder, { name: "serve", bin: 'bun', preArgs: ['run', 'serve', '--'] });
    cmdBuilder = bindSimpleContextCommand(cmdBuilder, { name: "watch", bin: 'bun', preArgs: ['run', 'watch', '--'] });
    cmdBuilder = bindSimpleContextCommand(cmdBuilder, { name: "app", bin: 'bun', preArgs: ['run', 'app', '--'] });
    cmdBuilder = bindSimpleContextCommand(cmdBuilder, { name: "cli", bin: 'bun', preArgs: ['run', 'cli', '--'] });
    cmdBuilder = bindSimpleContextCommand(cmdBuilder, { name: "compile", bin: 'bun', preArgs: ['run', 'compile', '--'] });
    cmdBuilder = bindInstallCommand(cmdBuilder, { name: "install" });
    cmdBuilder = bindSimpleContextCommand(cmdBuilder, { bin: 'npx' });
    cmdBuilder = bindSimpleContextCommand(cmdBuilder, { bin: 'cdk' });
    cmdBuilder = bindSimpleContextCommand(cmdBuilder, { bin: 'aws' });
    cmdBuilder = bindWithContextCommand(cmdBuilder, { name: 'with' });
    cmdBuilder = bindRunContextCommand(cmdBuilder, { name: 'run', projectType: 'fnode' });
    cmdBuilder = bindCondaContextCommand(cmdBuilder, { name: 'python' });
    cmdBuilder = bindCondaContextCommand(cmdBuilder, { name: 'python3' });
    cmdBuilder = bindCondaContextCommand(cmdBuilder, { name: 'pip' });
    cmdBuilder = bindCondaContextCommand(cmdBuilder, { name: 'pip3' });

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
