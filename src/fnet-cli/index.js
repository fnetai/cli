/**
 * Main entry point for the fnet command
 * This file provides a CLI for managing fnet projects
 */
import yargs from 'yargs';
import chalk from 'chalk';
import { ProcessManager } from '@fnet/shell-flow';
import {
  bindSimpleContextCommand,
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
import ymlCmd from './yml-cmd.js';
import { expressCmd } from './express-cmd.js';
import { setupEnvironment } from './utils.js';

// Create a single ProcessManager for the entire fnet lifecycle
const processManager = new ProcessManager();

// Set up environment
setupEnvironment();

/**
 * Main function
 */
async function main() {
  try {
    // Create the yargs instance
    let cmdBuilder = yargs(process.argv.slice(2))
      .scriptName('fnet')
      .usage('Usage: fnet <command> [options]')
      .command(createCmd)
      .command(projectCmd)
      .command(buildCmd)
      .command(buildDevCmd)
      .command(deployCmd)
      .command(fileCmd)
      .command(inputCmd)
      .command(ymlCmd)
      .command('express', 'Create and manage express projects', expressCmd);

    // Add pass-through commands (all use centralized processManager)
    cmdBuilder = bindSimpleContextCommand(cmdBuilder, { bin: 'npm', createContext, processManager });
    cmdBuilder = bindSimpleContextCommand(cmdBuilder, { bin: 'node', createContext, processManager });
    cmdBuilder = bindSimpleContextCommand(cmdBuilder, { bin: 'bun', createContext, processManager });

    cmdBuilder = bindSimpleContextCommand(cmdBuilder, { name: "serve", bin: 'bun', preArgs: ['run', 'serve', '--'], createContext, processManager });
    cmdBuilder = bindSimpleContextCommand(cmdBuilder, { name: "watch", bin: 'bun', preArgs: ['run', 'watch', '--'], createContext, processManager });

    cmdBuilder = bindSimpleContextCommand(cmdBuilder, { name: "app", bin: 'bun', preArgs: ['run', 'app', '--'], createContext, processManager });

    cmdBuilder = bindSimpleContextCommand(cmdBuilder, { name: "cli", bin: 'bun', preArgs: ['run', 'cli', '--'], createContext, processManager });
    cmdBuilder = bindSimpleContextCommand(cmdBuilder, { name: "cli:dev", bin: 'bun', preArgs: ['run', 'cli:dev', '--'], createContext, processManager });
    cmdBuilder = bindSimpleContextCommand(cmdBuilder, { name: "cli:compile", bin: 'bun', preArgs: ['run', 'cli:compile', '--'], createContext, processManager });
    cmdBuilder = bindSimpleContextCommand(cmdBuilder, { name: "cli:compile:dev", bin: 'bun', preArgs: ['run', 'cli:compile:dev', '--'], createContext, processManager });
    cmdBuilder = bindSimpleContextCommand(cmdBuilder, { name: "cli:install", bin: 'bun', preArgs: ['run', 'cli:install', '--'], createContext, processManager });

    cmdBuilder = bindSimpleContextCommand(cmdBuilder, { name: "compile", bin: 'bun', preArgs: ['run', 'compile', '--'], createContext, processManager });
    cmdBuilder = bindInstallCommand(cmdBuilder, { name: "install", createContext, processManager });

    cmdBuilder = bindSimpleContextCommand(cmdBuilder, { bin: 'npx', createContext, processManager });
    cmdBuilder = bindSimpleContextCommand(cmdBuilder, { bin: 'cdk', createContext, processManager });
    cmdBuilder = bindSimpleContextCommand(cmdBuilder, { bin: 'aws', createContext, processManager });
    cmdBuilder = bindWithContextCommand(cmdBuilder, { name: 'with', createContext, processManager });
    cmdBuilder = bindRunContextCommand(cmdBuilder, { name: 'run', projectType: 'fnet', processManager });

    cmdBuilder
      .demandCommand(1, 'You need at least one command before moving on')
      .help()
      .version(process.env.FNET_CLI_VERSION || 'unknown')
      .parse();
  } catch (error) {
    console.error(chalk.red(`Fatal error: ${error.message}`));
    await processManager.dispose();
    process.exit(1);
  }
}

// Run main function
main().catch(async error => {
  console.error(chalk.red(`Fatal error: ${error.message}`));
  await processManager.dispose();
  process.exit(1);
});
