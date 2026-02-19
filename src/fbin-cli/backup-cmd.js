/**
 * Backup command for the bin system
 * This module provides the backup command for backing up configs and binaries
 */
import path from 'node:path';
import fs from 'node:fs';
import chalk from 'chalk';
import binSystem from '../utils/bin-system.js';
import { createContext } from './context.js';

export const command = 'backup [options]';
export const describe = 'Backup shell configs and binaries';

export const builder = {
  config: {
    describe: 'Backup shell configuration files',
    type: 'boolean',
    default: false,
    alias: 'c'
  },
  binaries: {
    describe: 'Backup installed binaries',
    type: 'boolean',
    default: false,
    alias: 'b'
  },
  all: {
    describe: 'Backup everything (configs + binaries)',
    type: 'boolean',
    default: false,
    alias: 'a'
  },
  message: {
    describe: 'Backup description message',
    type: 'string',
    alias: 'm'
  }
};

export const handler = async (argv) => {
  try {
    const context = await createContext(argv);
    
    // If no specific option is set, default to --all
    const backupAll = argv.all || (!argv.config && !argv.binaries);
    const backupConfig = argv.config || backupAll;
    const backupBinaries = argv.binaries || backupAll;
    
    console.log(chalk.blue('Creating backup...'));
    
    // Create backup directory
    const backupDir = binSystem.createBackupDirectory();
    const backedFiles = [];
    
    // Backup shell configurations
    if (backupConfig) {
      console.log(chalk.blue('Backing up shell configurations...'));
      const configsDir = path.join(backupDir, 'configs');
      fs.mkdirSync(configsDir, { recursive: true });
      
      const shell = binSystem.detectUserShell();
      const configPaths = binSystem.getAllShellConfigPaths(shell);
      
      let configCount = 0;
      for (const config of configPaths) {
        if (fs.existsSync(config.path)) {
          const backed = binSystem.backupFile(config.path, configsDir, config.name);
          if (backed) {
            backedFiles.push(config.path);
            configCount++;
            console.log(chalk.green(`  ✓ ${config.name}`));
          }
        }
      }
      
      if (configCount === 0) {
        console.log(chalk.yellow('  No configuration files found to backup'));
      } else {
        console.log(chalk.green(`  Backed up ${configCount} configuration file(s)`));
      }
    }
    
    // Backup binaries
    if (backupBinaries) {
      console.log(chalk.blue('Backing up binaries...'));
      const binariesDir = path.join(backupDir, 'binaries');
      fs.mkdirSync(binariesDir, { recursive: true });
      
      const binDir = binSystem.getBinDirectory();
      const metadataFile = binSystem.getMetadataFilePath();
      
      // Backup metadata file
      if (fs.existsSync(metadataFile)) {
        binSystem.backupFile(metadataFile, binariesDir, 'metadata.json');
        backedFiles.push(metadataFile);
      }
      
      // Backup all binaries
      if (fs.existsSync(binDir)) {
        const binaries = fs.readdirSync(binDir);
        let binaryCount = 0;
        
        for (const binary of binaries) {
          const binaryPath = path.join(binDir, binary);
          const stat = fs.statSync(binaryPath);
          
          if (stat.isFile()) {
            const backed = binSystem.backupFile(binaryPath, binariesDir, binary);
            if (backed) {
              backedFiles.push(binaryPath);
              binaryCount++;
              console.log(chalk.green(`  ✓ ${binary}`));
            }
          }
        }
        
        if (binaryCount === 0) {
          console.log(chalk.yellow('  No binaries found to backup'));
        } else {
          console.log(chalk.green(`  Backed up ${binaryCount} binary(ies)`));
        }
      } else {
        console.log(chalk.yellow('  Bin directory not found'));
      }
    }
    
    // Create backup metadata
    binSystem.createBackupMetadata(backupDir, {
      type: 'manual',
      command: 'fbin backup',
      message: argv.message || 'Manual backup',
      files: backedFiles,
      config: backupConfig,
      binaries: backupBinaries
    });
    
    // Update latest symlink
    binSystem.updateLatestSymlink(backupDir);
    
    console.log();
    console.log(chalk.green(`✓ Backup created successfully!`));
    console.log(chalk.blue(`  Location: ${backupDir}`));
    console.log(chalk.blue(`  Files backed up: ${backedFiles.length}`));
    
    if (argv.message) {
      console.log(chalk.blue(`  Message: ${argv.message}`));
    }
    
  } catch (error) {
    console.error(chalk.red(`Failed to create backup: ${error.message}`));
    process.exit(1);
  }
};

export default {
  command,
  describe,
  builder,
  handler
};

