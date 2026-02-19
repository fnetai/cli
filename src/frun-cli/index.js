/**
 * Main entry point for the frun command
 * This file provides a CLI for running command groups from project files
 */
import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';
import { setupGlobalErrorHandlers } from '../utils/process-manager.js';
import commandCmd from './command-cmd.js';

// Set up global error handlers
setupGlobalErrorHandlers();

/**
 * Main function
 */
async function main() {
  try {
    // Create the yargs instance
    const argv = yargs(hideBin(process.argv))
      .usage('Usage: $0 <command> [options]')
      .command(commandCmd)
      .help()
      .version()
      .argv;
  } catch (error) {
    console.error(`Fatal error: ${error.message}`);
    process.exit(1);
  }
}

// Run main function
main().catch(error => {
  console.error(`Fatal error: ${error.message}`);
  process.exit(1);
});
