/**
 * Main entry point for the frun command
 * This file provides a CLI for running command groups from project files
 */
import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';
import { ProcessManager } from '@fnet/shell-flow';
import createCommandCmd from './command-cmd.js';

// Create a single ProcessManager for the entire frun lifecycle
const processManager = new ProcessManager();

yargs(hideBin(process.argv))
  .scriptName('frun')
  .usage('Usage: $0 <command> [options]')
  .command(createCommandCmd({ processManager }))
  .help()
  .version(process.env.FNET_CLI_VERSION || 'unknown')
  .fail(async (msg, err) => {
    if (err) console.error(`Error: ${err.message}`);
    else if (msg) console.error(`Error: ${msg}`);
    await processManager.dispose();
    process.exit(1);
  })
  .parse();
