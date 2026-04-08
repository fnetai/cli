/**
 * Main entry point for the frun command
 * This file provides a CLI for running command groups from project files
 */
import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';
import { ProcessManager } from '@fnet/shell-flow';
import createCommandCmd from './command-cmd.js';

// Create a single ProcessManager for the entire frun lifecycle
// This ensures all child processes are tracked and cleaned up centrally
const processManager = new ProcessManager();

/**
 * Main function
 */
async function main() {
  try {
    // Create the yargs instance with centralized process manager
    const argv = yargs(hideBin(process.argv))
      .usage('Usage: $0 <command> [options]')
      .command(createCommandCmd({ processManager }))
      .help()
      .version()
      .argv;
  } catch (error) {
    console.error(`Fatal error: ${error.message}`);
    await processManager.dispose();
    process.exit(1);
  }
}

// Run main function
main().catch(async error => {
  console.error(`Fatal error: ${error.message}`);
  await processManager.dispose();
  process.exit(1);
});
