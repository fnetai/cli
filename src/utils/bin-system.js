/**
 * Core bin system functionality
 * This module provides utilities for managing the bin system
 */
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import chalk from 'chalk';

/**
 * Get the bin directory path
 * @returns {string} Bin directory path
 */
export function getBinDirectory() {
  return path.join(os.homedir(), '.fnet', 'bin');
}

/**
 * Get the metadata directory path
 * @returns {string} Metadata directory path
 */
export function getMetadataDirectory() {
  return path.join(os.homedir(), '.fnet', 'metadata');
}

/**
 * Get the metadata file path
 * @returns {string} Metadata file path
 */
export function getMetadataFilePath() {
  return path.join(getMetadataDirectory(), 'binaries.json');
}

/**
 * Check if a directory is in the PATH
 * @param {string} dir - Directory to check
 * @returns {boolean} True if directory is in PATH
 */
export function checkIfInPath(dir) {
  const PATH = process.env.PATH || '';
  const pathDirs = PATH.split(path.delimiter);
  return pathDirs.includes(dir);
}

/**
 * Detect the user's shell
 * @returns {string} Shell name (bash, zsh, fish, powershell, cmd, etc.)
 */
export function detectUserShell() {
  try {
    // For Windows
    if (process.platform === 'win32') {
      // Check for PowerShell Core (pwsh)
      if (process.env.PSModulePath && process.env.PSModulePath.includes('PowerShell')) {
        return 'powershell-core';
      }
      // Check for PowerShell
      if (process.env.PSModulePath) {
        return 'powershell';
      }
      // Default to cmd
      return 'cmd';
    }

    // For Unix-like systems
    const shell = process.env.SHELL || '';
    if (shell.includes('bash')) return 'bash';
    if (shell.includes('zsh')) return 'zsh';
    if (shell.includes('fish')) return 'fish';
    if (shell.includes('ksh')) return 'ksh';
    if (shell.includes('csh') || shell.includes('tcsh')) return 'csh';

    // Try to detect by checking common shell files
    if (fs.existsSync(path.join(os.homedir(), '.bashrc'))) return 'bash';
    if (fs.existsSync(path.join(os.homedir(), '.zshrc'))) return 'zsh';
    if (fs.existsSync(path.join(os.homedir(), '.config', 'fish', 'config.fish'))) return 'fish';

    return 'unknown';
  } catch (error) {
    return 'unknown';
  }
}

/**
 * Get all possible shell configuration file paths for a shell
 * @param {string} shell - Shell name
 * @returns {Array<{name: string, path: string}>} Array of config file objects with name and path
 */
export function getAllShellConfigPaths(shell) {
  const home = os.homedir();
  const configs = [];

  switch(shell) {
    case 'bash':
      configs.push({ name: '.bashrc', path: path.join(home, '.bashrc') });
      configs.push({ name: '.bash_profile', path: path.join(home, '.bash_profile') });
      configs.push({ name: '.profile', path: path.join(home, '.profile') });
      break;
    case 'zsh':
      configs.push({ name: '.zshrc', path: path.join(home, '.zshrc') });
      configs.push({ name: '.zprofile', path: path.join(home, '.zprofile') });
      break;
    case 'fish':
      configs.push({
        name: 'config.fish',
        path: path.join(home, '.config', 'fish', 'config.fish')
      });
      break;
    case 'ksh':
      configs.push({ name: '.kshrc', path: path.join(home, '.kshrc') });
      configs.push({ name: '.profile', path: path.join(home, '.profile') });
      break;
    case 'csh':
      configs.push({ name: '.cshrc', path: path.join(home, '.cshrc') });
      configs.push({ name: '.tcshrc', path: path.join(home, '.tcshrc') });
      break;
    case 'powershell':
      configs.push({
        name: 'Microsoft.PowerShell_profile.ps1',
        path: path.join(home, 'Documents', 'WindowsPowerShell', 'Microsoft.PowerShell_profile.ps1')
      });
      // Add more possible PowerShell profile locations
      configs.push({
        name: 'profile.ps1',
        path: path.join(home, 'Documents', 'WindowsPowerShell', 'profile.ps1')
      });
      break;
    case 'powershell-core':
      configs.push({
        name: 'Microsoft.PowerShell_profile.ps1',
        path: path.join(home, 'Documents', 'PowerShell', 'Microsoft.PowerShell_profile.ps1')
      });
      configs.push({
        name: 'profile.ps1',
        path: path.join(home, 'Documents', 'PowerShell', 'profile.ps1')
      });
      break;
    case 'cmd':
      // CMD doesn't have a profile file, but we can create a batch file
      configs.push({
        name: 'fnet-path.bat',
        path: path.join(home, 'fnet-path.bat')
      });
      break;
    default:
      break;
  }

  return configs;
}

/**
 * Get the best shell configuration file path
 * @returns {string|null} Path to shell configuration file
 */
export function getShellConfigPath() {
  const shell = detectUserShell();
  const configs = getAllShellConfigPaths(shell);

  // Find the first config file that exists
  for (const config of configs) {
    if (fs.existsSync(config.path)) {
      return config.path;
    }
  }

  // If no config file exists, return the first one (we'll create it)
  return configs.length > 0 ? configs[0].path : null;
}

/**
 * Create the bin directory structure
 * @returns {Promise<void>}
 */
export async function createBinDirectoryStructure() {
  const binDir = getBinDirectory();
  const metadataDir = getMetadataDirectory();
  const metadataFile = getMetadataFilePath();

  // Create bin directory
  if (!fs.existsSync(binDir)) {
    fs.mkdirSync(binDir, { recursive: true });
  }

  // Create metadata directory
  if (!fs.existsSync(metadataDir)) {
    fs.mkdirSync(metadataDir, { recursive: true });
  }

  // Initialize metadata file if it doesn't exist
  if (!fs.existsSync(metadataFile)) {
    fs.writeFileSync(metadataFile, JSON.stringify({
      binaries: {},
      lastUpdated: new Date().toISOString()
    }, null, 2));
  }
}

/**
 * Get the export PATH command for the specified shell
 * @param {string} shell - Shell name
 * @param {string} binDir - Bin directory path
 * @returns {string} Export PATH command
 */
export function getExportPathCommand(shell, binDir) {
  switch(shell) {
    case 'bash':
    case 'zsh':
    case 'ksh':
      return `export PATH="${binDir}:$PATH"`;
    case 'fish':
      return `set -gx PATH ${binDir} $PATH`;
    case 'csh':
      return `setenv PATH ${binDir}:$PATH`;
    case 'powershell':
    case 'powershell-core':
      return `$env:PATH = "${binDir};" + $env:PATH`;
    case 'cmd':
      // For CMD, we need to use the Windows SET command
      // This is for a batch file
      return `@echo off\nSETX PATH "%PATH%;${binDir}"\necho Path updated successfully`;
    default:
      return `export PATH="${binDir}:$PATH"`;
  }
}

/**
 * Add bin directory to PATH in shell config file
 * @param {string} shell - Shell name
 * @param {string} configPath - Shell config file path
 * @param {string} binDir - Bin directory path
 * @returns {Promise<boolean>} True if successful
 */
export async function addBinToPath(shell, configPath, binDir) {
  try {
    const exportCommand = getExportPathCommand(shell, binDir);

    // Special handling for Windows CMD
    if (shell === 'cmd') {
      // For CMD, we create a batch file that the user can run
      fs.writeFileSync(configPath, exportCommand);
      console.log(chalk.yellow(`Created batch file at ${configPath}`));
      console.log(chalk.yellow('Run this file to add the bin directory to your PATH'));
      return true;
    }

    // For Windows PowerShell, we might need to create the profile directory
    if ((shell === 'powershell' || shell === 'powershell-core') && !fs.existsSync(path.dirname(configPath))) {
      fs.mkdirSync(path.dirname(configPath), { recursive: true });
    }

    // Create the config file if it doesn't exist
    if (!fs.existsSync(configPath)) {
      const defaultContent = shell === 'fish' ? '# Fish shell configuration\n\n' :
                            (shell === 'powershell' || shell === 'powershell-core') ? '# PowerShell profile\n\n' :
                            '# Shell configuration\n\n';
      fs.writeFileSync(configPath, defaultContent);
      console.log(chalk.green(`Created config file at ${configPath}`));
    }

    const configContent = fs.readFileSync(configPath, 'utf8');

    // Check if bin directory is already in config file
    if (configContent.includes(binDir)) {
      return true;
    }

    // Add bin directory to config file
    const newContent = `${configContent.trim()}\n\n# Added by @fnet/cli\n${exportCommand}\n`;
    fs.writeFileSync(configPath, newContent);

    // For Windows PowerShell, we need to set the execution policy
    if (shell === 'powershell' || shell === 'powershell-core') {
      console.log(chalk.yellow('You may need to set the PowerShell execution policy to run scripts:'));
      console.log(chalk.green('Set-ExecutionPolicy -Scope CurrentUser -ExecutionPolicy RemoteSigned'));
    }

    return true;
  } catch (error) {
    console.error(chalk.red(`Failed to add bin directory to PATH: ${error.message}`));
    return false;
  }
}

export default {
  getBinDirectory,
  getMetadataDirectory,
  getMetadataFilePath,
  checkIfInPath,
  detectUserShell,
  getShellConfigPath,
  getAllShellConfigPaths,
  createBinDirectoryStructure,
  getExportPathCommand,
  addBinToPath
};
