/**
 * Uninstall command for the bin system
 * This module provides the uninstall command for removing binaries from bin directory
 */
import path from 'node:path';
import fs from 'node:fs';
import chalk from 'chalk';
import fnetPrompt from '@fnet/prompt';
import binSystem from '../utils/bin-system.js';
import { createContext } from './context.js';

export const command = 'uninstall [name] [options]';
export const describe = 'Uninstall a binary from the bin directory';

export const builder = {
  name: {
    describe: 'Name of the binary to uninstall',
    type: 'string',
    demandOption: true
  },
  force: {
    describe: 'Skip confirmation prompt',
    type: 'boolean',
    default: false,
    alias: 'f'
  },
  yes: {
    describe: 'Automatically answer yes to all prompts',
    type: 'boolean',
    default: false,
    alias: 'y'
  }
};

export const handler = async (argv) => {
  try {
    const context = await createContext(argv);
    const binDir = binSystem.getBinDirectory();
    const metadataFile = binSystem.getMetadataFilePath();

    // Check if bin directory exists
    if (!fs.existsSync(binDir)) {
      console.error(chalk.red(`Bin directory not found: ${binDir}`));
      console.error(chalk.yellow('Run fbin setup first.'));
      process.exit(1);
    }

    // Check if metadata file exists
    if (!fs.existsSync(metadataFile)) {
      console.error(chalk.red(`Metadata file not found: ${metadataFile}`));
      console.error(chalk.yellow('Run fbin setup first.'));
      process.exit(1);
    }

    // Read metadata
    let metadata;
    try {
      metadata = JSON.parse(fs.readFileSync(metadataFile, 'utf8'));
    } catch (err) {
      console.error(chalk.red(`Failed to parse metadata file: ${err.message}`));
      process.exit(1);
    }

    // Check if binary exists in metadata
    const binaryName = argv.name;
    if (!metadata.binaries[binaryName]) {
      console.error(chalk.red(`Binary not found in metadata: ${binaryName}`));
      console.log(chalk.yellow('Use fbin list to see installed binaries.'));
      process.exit(1);
    }

    const binaryPath = metadata.binaries[binaryName].path;

    // Check if binary file exists
    if (!fs.existsSync(binaryPath)) {
      console.warn(chalk.yellow(`Binary file not found: ${binaryPath}`));
      console.warn(chalk.yellow('Metadata will be updated anyway.'));
    }

    // Confirm uninstallation
    if (!argv.force && !argv.yes) {
      const { confirmUninstall } = await fnetPrompt({
        type: 'confirm',
        name: 'confirmUninstall',
        message: `Are you sure you want to uninstall ${binaryName}?`,
        initial: false
      });

      if (!confirmUninstall) {
        console.log(chalk.yellow('Uninstallation cancelled.'));
        return;
      }
    }

    // Remove binary file
    if (fs.existsSync(binaryPath)) {
      try {
        fs.unlinkSync(binaryPath);
        console.log(chalk.green(`Binary file removed: ${binaryPath}`));
      } catch (err) {
        console.error(chalk.red(`Failed to remove binary file: ${err.message}`));
      }
    }

    // Update metadata
    delete metadata.binaries[binaryName];
    metadata.lastUpdated = new Date().toISOString();

    // Write metadata to file
    fs.writeFileSync(metadataFile, JSON.stringify(metadata, null, 2));

    console.log(chalk.green(`Binary uninstalled successfully: ${binaryName}`));
  } catch (error) {
    console.error(chalk.red(`Failed to uninstall binary: ${error.message}`));
    process.exit(1);
  }
};

export default {
  command,
  describe,
  builder,
  handler
};
