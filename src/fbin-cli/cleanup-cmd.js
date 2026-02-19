/**
 * Cleanup command for the bin system
 * This module provides the cleanup command for managing old backups
 */
import path from 'node:path';
import fs from 'node:fs';
import chalk from 'chalk';
import fnetPrompt from '@fnet/prompt';
import binSystem from '../utils/bin-system.js';
import tableUtils from '../utils/table-utils.js';
import { createContext } from './context.js';

export const command = 'cleanup [options]';
export const describe = 'Clean up old backups';

export const builder = {
  keep: {
    describe: 'Number of recent backups to keep',
    type: 'number',
    default: 10,
    alias: 'k'
  },
  older: {
    describe: 'Remove backups older than N days',
    type: 'number',
    alias: 'o'
  },
  all: {
    describe: 'Remove all backups',
    type: 'boolean',
    default: false,
    alias: 'a'
  },
  yes: {
    describe: 'Automatically answer yes to all prompts',
    type: 'boolean',
    default: false,
    alias: 'y'
  },
  'dry-run': {
    describe: 'Show what would be deleted without actually deleting',
    type: 'boolean',
    default: false,
    alias: 'd'
  }
};

export const handler = async (argv) => {
  try {
    const context = await createContext(argv);
    
    const backups = binSystem.listBackups();
    
    if (backups.length === 0) {
      console.log(chalk.yellow('No backups found.'));
      return;
    }
    
    console.log(chalk.blue(`Found ${backups.length} backup(s)`));
    
    let backupsToDelete = [];
    
    // Determine which backups to delete
    if (argv.all) {
      backupsToDelete = backups;
    } else if (argv.older) {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - argv.older);
      
      backupsToDelete = backups.filter(b => {
        const backupDate = new Date(b.created);
        return backupDate < cutoffDate;
      });
      
      console.log(chalk.blue(`Removing backups older than ${argv.older} days (before ${cutoffDate.toLocaleDateString()})`));
    } else {
      // Keep N most recent backups
      if (backups.length > argv.keep) {
        backupsToDelete = backups.slice(argv.keep);
        console.log(chalk.blue(`Keeping ${argv.keep} most recent backup(s), removing ${backupsToDelete.length} old backup(s)`));
      } else {
        console.log(chalk.green(`Only ${backups.length} backup(s) found, keeping all (limit: ${argv.keep})`));
        return;
      }
    }
    
    if (backupsToDelete.length === 0) {
      console.log(chalk.green('No backups to delete.'));
      return;
    }
    
    // Show what will be deleted
    console.log();
    console.log(chalk.yellow(`Backups to be deleted (${backupsToDelete.length}):`));
    console.log();
    
    const headers = ['TIMESTAMP', 'TYPE', 'MESSAGE', 'FILES', 'SIZE'];
    const table = tableUtils.createTable(headers, {
      chars: {
        'mid': '',
        'mid-mid': '',
        'left-mid': '',
        'right-mid': ''
      }
    });
    
    let totalSize = 0;
    
    for (const backup of backupsToDelete) {
      const timestamp = backup.timestamp || 'unknown';
      const type = backup.type || 'manual';
      const message = backup.message || '';
      const fileCount = backup.files ? backup.files.length : 0;
      
      // Calculate backup size
      let backupSize = 0;
      try {
        const getDirectorySize = (dirPath) => {
          let size = 0;
          const files = fs.readdirSync(dirPath);
          
          for (const file of files) {
            const filePath = path.join(dirPath, file);
            const stat = fs.statSync(filePath);
            
            if (stat.isDirectory()) {
              size += getDirectorySize(filePath);
            } else {
              size += stat.size;
            }
          }
          
          return size;
        };
        
        backupSize = getDirectorySize(backup.path);
        totalSize += backupSize;
      } catch (err) {
        // Ignore size calculation errors
      }
      
      const sizeStr = backupSize > 0 ? `${(backupSize / 1024 / 1024).toFixed(2)} MB` : 'N/A';
      
      table.push([
        chalk.white(timestamp),
        type,
        message.substring(0, 30) + (message.length > 30 ? '...' : ''),
        fileCount.toString(),
        sizeStr
      ]);
    }
    
    console.log(table.toString());
    console.log();
    console.log(chalk.blue(`Total size to free: ${(totalSize / 1024 / 1024).toFixed(2)} MB`));
    
    // Dry run mode
    if (argv['dry-run']) {
      console.log();
      console.log(chalk.yellow('DRY RUN: No backups were deleted.'));
      console.log(chalk.blue('Run without --dry-run to actually delete these backups.'));
      return;
    }
    
    // Confirm deletion
    if (!argv.yes) {
      console.log();
      const { confirmDelete } = await fnetPrompt({
        type: 'confirm',
        name: 'confirmDelete',
        message: `Delete ${backupsToDelete.length} backup(s)?`,
        initial: false
      });
      
      if (!confirmDelete) {
        console.log(chalk.yellow('Cleanup cancelled.'));
        return;
      }
    }
    
    // Delete backups
    console.log();
    console.log(chalk.blue('Deleting backups...'));
    
    let deletedCount = 0;
    let failedCount = 0;
    
    for (const backup of backupsToDelete) {
      try {
        // Remove directory recursively
        fs.rmSync(backup.path, { recursive: true, force: true });
        console.log(chalk.green(`  ✓ ${backup.timestamp}`));
        deletedCount++;
      } catch (err) {
        console.log(chalk.red(`  ✗ ${backup.timestamp}: ${err.message}`));
        failedCount++;
      }
    }
    
    console.log();
    console.log(chalk.green(`✓ Cleanup completed!`));
    console.log(chalk.blue(`  Deleted: ${deletedCount}`));
    
    if (failedCount > 0) {
      console.log(chalk.yellow(`  Failed: ${failedCount}`));
    }
    
    console.log(chalk.blue(`  Space freed: ${(totalSize / 1024 / 1024).toFixed(2)} MB`));
    
    // Show remaining backups
    const remainingBackups = binSystem.listBackups();
    console.log(chalk.blue(`  Remaining backups: ${remainingBackups.length}`));
    
  } catch (error) {
    console.error(chalk.red(`Failed to cleanup backups: ${error.message}`));
    process.exit(1);
  }
};

export default {
  command,
  describe,
  builder,
  handler
};

