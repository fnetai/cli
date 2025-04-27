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
import setupCommand from './bin-setup.js';
import pathCommand from './bin-path.js';
import compileCommand from './bin-compile.js';
import installCommand from './bin-install.js';
import uninstallCommand from './bin-uninstall.js';
import listCommand from './bin-list.js';
import { setupGlobalErrorHandlers } from '../utils/process-manager.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const cwd = process.cwd();

// Set up global error handlers
setupGlobalErrorHandlers();

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
