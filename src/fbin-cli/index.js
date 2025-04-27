/**
 * Main entry point for the fbin command
 * This file provides a standalone CLI for managing the bin system
 */
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import chalk from 'chalk';
import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';

// Import commands
import setupCommand from './setup-cmd.js';
import pathCommand from './path-cmd.js';
import compileCommand from './compile-cmd.js';
import installCommand from './install-cmd.js';
import uninstallCommand from './uninstall-cmd.js';
import listCommand from './list-cmd.js';
import { setupGlobalErrorHandlers } from '../utils/process-manager.js';
import { setupEnvironment } from './utils.js';

// Set up global error handlers
setupGlobalErrorHandlers();

// Set up environment
setupEnvironment();

// Main function
async function main() {
  try {
    // Create the yargs instance
    const argv = yargs(hideBin(process.argv))
      .usage('Usage: $0 <command> [options]')
      .command(setupCommand)
      .command(pathCommand)
      .command(compileCommand)
      .command(installCommand)
      .command(uninstallCommand)
      .command(listCommand)
      .demandCommand(1, 'You need to specify a command')
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
