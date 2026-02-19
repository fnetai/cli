/**
 * fservice CLI entry point
 *
 * This is the main entry point for the fservice CLI tool.
 * It provides a unified interface for managing system services across different platforms.
 */
import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';
import chalk from 'chalk';

// Import commands
import manifestCmd from './manifest-cmd.js';
import registerCmd from './register-cmd.js';
import unregisterCmd from './unregister-cmd.js';
import startCmd from './start-cmd.js';
import stopCmd from './stop-cmd.js';
import restartCmd from './restart-cmd.js';
import statusCmd from './status-cmd.js';
import listCmd from './list-cmd.js';

// Import version from package.json
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const { version } = require('../../package.json');

// Configure yargs
const argv = yargs(hideBin(process.argv))
  .scriptName('fservice')
  .usage('Usage: $0 <command> [options]')
  .version(version)
  .command(manifestCmd)
  .command(registerCmd)
  .command(unregisterCmd)
  .command(startCmd)
  .command(stopCmd)
  .command(restartCmd)
  .command(statusCmd)
  .command(listCmd)
  .demandCommand(1, 'You need to specify a command')
  .strict()
  .help()
  .alias('h', 'help')
  .alias('v', 'version')
  .fail((msg, err, yargs) => {
    if (err) {
      console.error(chalk.red(`Error: ${err.message}`));
      console.error(err);
    } else {
      console.error(chalk.red(`Error: ${msg}`));
    }
    console.error(chalk.yellow('\nUsage:'), yargs.help());
    process.exit(1);
  })
  .parse();
