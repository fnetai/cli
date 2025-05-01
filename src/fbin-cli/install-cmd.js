/**
 * Install command for the bin system
 * This module provides the install command for installing binaries to bin directory
 */
import path from 'node:path';
import fs from 'node:fs';
import os from 'node:os';
import chalk from 'chalk';
import fnetPrompt from '@fnet/prompt';
import binSystem from '../utils/bin-system.js';
import { createContext } from './context.js';

export const command = 'install [source] [options]';
export const describe = 'Install a binary to the bin directory';

export const builder = {
  source: {
    describe: 'Source binary to install',
    type: 'string',
    demandOption: true
  },
  name: {
    describe: 'Name to use for the installed binary',
    type: 'string',
    alias: 'n'
  },
  ver: {
    describe: 'Version of the binary',
    type: 'string',
    alias: 'v'
  },
  force: {
    describe: 'Force overwrite if binary already exists',
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
    // Check if source file exists
    const sourcePath = path.resolve(process.cwd(), argv.source);
    if (!fs.existsSync(sourcePath)) {
      console.error(chalk.red(`Source file not found: ${sourcePath}`));
      process.exit(1);
    }

    // Ensure bin directory exists
    await binSystem.createBinDirectoryStructure();
    const binDir = binSystem.getBinDirectory();

    // Determine binary name
    let binaryName;
    if (argv.name) {
      binaryName = argv.name;
    } else {
      binaryName = path.basename(sourcePath);
    }

    // Add .exe extension for Windows if not already present
    if (process.platform === 'win32' && !binaryName.endsWith('.exe')) {
      binaryName = `${binaryName}.exe`;
    }

    const binPath = path.join(binDir, binaryName);

    // Check if binary already exists
    if (fs.existsSync(binPath) && !argv.force && !argv.yes) {
      const { confirmOverwrite } = await fnetPrompt({
        type: 'confirm',
        name: 'confirmOverwrite',
        message: `Binary already exists at ${binPath}. Overwrite?`,
        initial: false
      });

      if (!confirmOverwrite) {
        console.log(chalk.yellow('Installation cancelled.'));
        return;
      }
    }

    // Copy binary to bin directory
    console.log(chalk.blue(`Installing ${sourcePath} to ${binPath}...`));
    fs.copyFileSync(sourcePath, binPath);

    // Set executable permissions (not needed on Windows)
    if (process.platform !== 'win32') {
      fs.chmodSync(binPath, 0o755);
    }

    // Update metadata
    const metadataFile = binSystem.getMetadataFilePath();
    let metadata = { binaries: {}, lastUpdated: new Date().toISOString() };

    if (fs.existsSync(metadataFile)) {
      try {
        metadata = JSON.parse(fs.readFileSync(metadataFile, 'utf8'));
      } catch (err) {
        console.warn(chalk.yellow(`Failed to parse metadata file: ${err.message}`));
        console.warn(chalk.yellow('Creating new metadata file.'));
      }
    }

    // Add binary to metadata
    metadata.binaries[binaryName] = {
      path: binPath,
      source: sourcePath,
      created: new Date().toISOString(),
      platform: process.platform,
      version: argv.ver || '0.0.0',
      project: path.basename(process.cwd())
    };

    metadata.lastUpdated = new Date().toISOString();

    // Write metadata to file
    fs.writeFileSync(metadataFile, JSON.stringify(metadata, null, 2));

    console.log(chalk.green(`Binary installed successfully: ${binPath}`));

    // Check if bin directory is in PATH
    const isInPath = binSystem.checkIfInPath(binDir);
    if (!isInPath) {
      console.log(chalk.yellow(`Bin directory is not in PATH. Run 'fbin path' to add it.`));
    } else {
      console.log(chalk.green(`You can now run '${binaryName}' from anywhere.`));
    }
  } catch (error) {
    console.error(chalk.red(`Failed to install binary: ${error.message}`));
    process.exit(1);
  }
};

export default {
  command,
  describe,
  builder,
  handler
};
