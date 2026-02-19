/**
 * Restore command for the bin system
 * This module provides the restore command for restoring configs and binaries from backups
 */
import path from 'node:path';
import fs from 'node:fs';
import chalk from 'chalk';
import fnetPrompt from '@fnet/prompt';
import binSystem from '../utils/bin-system.js';
import promptUtils from '../utils/prompt-utils.js';
import tableUtils from '../utils/table-utils.js';
import { createContext } from './context.js';

export const command = 'restore [options]';
export const describe = 'Restore from backup';

export const builder = {
  config: {
    describe: 'Restore shell configuration files',
    type: 'boolean',
    default: false,
    alias: 'c'
  },
  binaries: {
    describe: 'Restore installed binaries',
    type: 'boolean',
    default: false,
    alias: 'b'
  },
  all: {
    describe: 'Restore everything (configs + binaries)',
    type: 'boolean',
    default: false,
    alias: 'a'
  },
  list: {
    describe: 'List available backups',
    type: 'boolean',
    default: false,
    alias: 'l'
  },
  timestamp: {
    describe: 'Backup timestamp to restore (defaults to latest)',
    type: 'string',
    alias: 't'
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
    
    // List backups if requested
    if (argv.list) {
      const backups = binSystem.listBackups();
      
      if (backups.length === 0) {
        console.log(chalk.yellow('No backups found.'));
        return;
      }
      
      console.log(chalk.blue(`Found ${backups.length} backup(s):\n`));
      
      // Create table
      const headers = ['TIMESTAMP', 'TYPE', 'MESSAGE', 'FILES'];
      const table = tableUtils.createTable(headers, {
        chars: {
          'mid': '',
          'mid-mid': '',
          'left-mid': '',
          'right-mid': ''
        }
      });
      
      for (const backup of backups) {
        const timestamp = backup.timestamp || 'unknown';
        const type = backup.type || 'manual';
        const message = backup.message || '';
        const fileCount = backup.files ? backup.files.length : 0;
        
        table.push([
          chalk.white(timestamp),
          type,
          message.substring(0, 40) + (message.length > 40 ? '...' : ''),
          fileCount.toString()
        ]);
      }
      
      console.log(table.toString());
      console.log();
      console.log(chalk.blue(`Backup directory: ${binSystem.getBackupDirectory()}`));
      return;
    }
    
    // Get all backups
    const backups = binSystem.listBackups();
    
    if (backups.length === 0) {
      console.log(chalk.yellow('No backups found.'));
      console.log(chalk.blue('Create a backup first with: fbin backup'));
      return;
    }
    
    // Select backup to restore
    let selectedBackup;
    
    if (argv.timestamp) {
      // Find backup by timestamp
      selectedBackup = backups.find(b => b.timestamp === argv.timestamp);
      
      if (!selectedBackup) {
        console.error(chalk.red(`Backup not found: ${argv.timestamp}`));
        console.log(chalk.yellow('Use --list to see available backups'));
        process.exit(1);
      }
    } else if (argv.yes) {
      // Auto-select latest backup
      selectedBackup = backups[0];
      console.log(chalk.yellow(`Auto-selecting latest backup: ${selectedBackup.timestamp}`));
    } else {
      // Prompt user to select backup
      const choices = backups.map(b => ({
        name: b.timestamp,
        message: `${b.timestamp} - ${b.message || 'No message'} (${b.files?.length || 0} files)`
      }));
      
      const selected = await promptUtils.promptForSelection({
        items: choices.map(c => c.name),
        message: 'Select a backup to restore:',
        allowAbort: true
      });
      
      if (selected === null) {
        console.log(chalk.yellow('Restore cancelled.'));
        return;
      }
      
      selectedBackup = backups.find(b => b.timestamp === selected);
    }
    
    console.log(chalk.blue(`Restoring from backup: ${selectedBackup.timestamp}`));
    
    // Determine what to restore
    const restoreAll = argv.all || (!argv.config && !argv.binaries);
    const restoreConfig = argv.config || restoreAll;
    const restoreBinaries = argv.binaries || restoreAll;
    
    // Confirm restore
    if (!argv.yes) {
      const { confirmRestore } = await fnetPrompt({
        type: 'confirm',
        name: 'confirmRestore',
        message: `This will overwrite current files. Continue?`,
        initial: false
      });
      
      if (!confirmRestore) {
        console.log(chalk.yellow('Restore cancelled.'));
        return;
      }
    }
    
    let restoredCount = 0;
    
    // Restore configurations
    if (restoreConfig) {
      const configsDir = path.join(selectedBackup.path, 'configs');
      
      if (fs.existsSync(configsDir)) {
        console.log(chalk.blue('Restoring shell configurations...'));
        const configs = fs.readdirSync(configsDir);
        
        for (const configFile of configs) {
          const backupPath = path.join(configsDir, configFile);
          const shell = binSystem.detectUserShell();
          const configPaths = binSystem.getAllShellConfigPaths(shell);
          
          // Find matching config path
          const matchingConfig = configPaths.find(c => c.name === configFile);
          
          if (matchingConfig) {
            const targetPath = matchingConfig.path;
            const targetDir = path.dirname(targetPath);
            
            // Create directory if needed
            if (!fs.existsSync(targetDir)) {
              fs.mkdirSync(targetDir, { recursive: true });
            }
            
            fs.copyFileSync(backupPath, targetPath);
            console.log(chalk.green(`  ✓ ${configFile}`));
            restoredCount++;
          }
        }
      }
    }
    
    // Restore binaries
    if (restoreBinaries) {
      const binariesDir = path.join(selectedBackup.path, 'binaries');
      
      if (fs.existsSync(binariesDir)) {
        console.log(chalk.blue('Restoring binaries...'));
        const binDir = binSystem.getBinDirectory();
        
        // Create bin directory if needed
        if (!fs.existsSync(binDir)) {
          fs.mkdirSync(binDir, { recursive: true });
        }
        
        const binaries = fs.readdirSync(binariesDir);
        
        for (const binary of binaries) {
          const backupPath = path.join(binariesDir, binary);
          const targetPath = path.join(binDir, binary);
          
          // Skip metadata.json in binaries folder
          if (binary === 'metadata.json') {
            const metadataFile = binSystem.getMetadataFilePath();
            const metadataDir = path.dirname(metadataFile);
            
            if (!fs.existsSync(metadataDir)) {
              fs.mkdirSync(metadataDir, { recursive: true });
            }
            
            fs.copyFileSync(backupPath, metadataFile);
            console.log(chalk.green(`  ✓ metadata.json`));
            restoredCount++;
            continue;
          }
          
          fs.copyFileSync(backupPath, targetPath);
          
          // Set executable permissions (not needed on Windows)
          if (process.platform !== 'win32') {
            fs.chmodSync(targetPath, 0o755);
          }
          
          console.log(chalk.green(`  ✓ ${binary}`));
          restoredCount++;
        }
      }
    }
    
    console.log();
    console.log(chalk.green(`✓ Restore completed successfully!`));
    console.log(chalk.blue(`  Files restored: ${restoredCount}`));
    
  } catch (error) {
    console.error(chalk.red(`Failed to restore backup: ${error.message}`));
    process.exit(1);
  }
};

export default {
  command,
  describe,
  builder,
  handler
};

