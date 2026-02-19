/**
 * List command for the bin system
 * This module provides the list command for listing installed binaries
 */
import path from 'node:path';
import fs from 'node:fs';
import chalk from 'chalk';
import binSystem from '../utils/bin-system.js';
import tableUtils from '../utils/table-utils.js';
import { createContext } from './context.js';

export const command = 'list [options]';
export const describe = 'List installed binaries';

export const builder = {
  json: {
    describe: 'Output in JSON format',
    type: 'boolean',
    default: false,
    alias: 'j'
  },
  filter: {
    describe: 'Filter binaries by name',
    type: 'string',
    alias: 'f'
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

    // Filter binaries if filter is provided
    let binaries = metadata.binaries;
    if (argv.filter) {
      const filter = argv.filter.toLowerCase();
      binaries = Object.entries(binaries)
        .filter(([name]) => name.toLowerCase().includes(filter))
        .reduce((obj, [name, value]) => {
          obj[name] = value;
          return obj;
        }, {});
    }

    // Output in JSON format if requested
    if (argv.json) {
      console.log(JSON.stringify(binaries, null, 2));
      return;
    }

    // Output in human-readable format
    const binaryCount = Object.keys(binaries).length;
    if (binaryCount === 0) {
      console.log(chalk.yellow('No binaries installed.'));
      return;
    }

    console.log(chalk.blue(`Found ${binaryCount} installed binaries:`));
    console.log();

    // Create table with headers
    const headers = ['NAME', 'VERSION', 'PLATFORM', 'CREATED'];
    const table = tableUtils.createTable(headers, {
      // Remove row separators for more compact display
      chars: {
        'mid': '',
        'mid-mid': '',
        'left-mid': '',
        'right-mid': ''
      }
    });

    // Add rows to table
    Object.entries(binaries).forEach(([name, binary]) => {
      const created = new Date(binary.created).toLocaleString();
      table.push([
        chalk.white(name),  // Ana sütun renkli
        binary.version || 'N/A',  // Diğer sütunlar normal metin
        binary.platform || 'N/A',
        created
      ]);
    });

    // Print table
    console.log(table.toString());
    console.log();
    console.log(chalk.blue(`Bin directory: ${binDir}`));

    // Check if bin directory is in PATH
    const isInPath = binSystem.checkIfInPath(binDir);
    if (!isInPath) {
      console.log(chalk.yellow(`Bin directory is not in PATH. Run 'fbin path' to add it.`));
    }
  } catch (error) {
    console.error(chalk.red(`Failed to list binaries: ${error.message}`));
    process.exit(1);
  }
};

export default {
  command,
  describe,
  builder,
  handler
};
