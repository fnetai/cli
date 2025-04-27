/**
 * Setup command for the bin system
 * This module provides the setup command for the bin system
 */
import path from 'node:path';
import fs from 'node:fs';
import os from 'node:os';
import chalk from 'chalk';
import fnetPrompt from '@fnet/prompt';
import binSystem from '../utils/bin-system.js';

export const command = 'setup';
export const describe = 'Initialize the bin system';
export const builder = {};

export const handler = async (argv) => {
  try {
    console.log(chalk.blue('Setting up the bin system...'));

    // Create bin directory structure
    await binSystem.createBinDirectoryStructure();

    const binDir = binSystem.getBinDirectory();
    console.log(chalk.green(`Bin directory: ${binDir}`));

    // Check if bin directory is in PATH
    const isInPath = binSystem.checkIfInPath(binDir);

    if (!isInPath) {
      console.log(chalk.yellow(`Bin directory is not in PATH.`));

      // Prompt user to add bin directory to PATH
      const { confirmAddToPath } = await fnetPrompt({
        type: 'confirm',
        name: 'confirmAddToPath',
        message: `Would you like to add ${binDir} to your PATH?`,
        initial: true
      });

      if (confirmAddToPath) {
        // Detect shell
        let shell = binSystem.detectUserShell();

        // If shell is unknown or user wants to select a different shell
        if (shell === 'unknown') {
          const { selectedShell } = await fnetPrompt({
            type: 'select',
            name: 'selectedShell',
            message: 'Select your shell:',
            choices: [
              { name: 'bash', message: 'Bash' },
              { name: 'zsh', message: 'Zsh' },
              { name: 'fish', message: 'Fish' },
              { name: 'powershell', message: 'PowerShell' },
              { name: 'powershell-core', message: 'PowerShell Core' },
              { name: 'cmd', message: 'Windows Command Prompt' },
              { name: 'ksh', message: 'Korn Shell (ksh)' },
              { name: 'csh', message: 'C Shell (csh/tcsh)' }
            ]
          });

          shell = selectedShell;
        } else {
          // Confirm the detected shell
          const { confirmShell } = await fnetPrompt({
            type: 'confirm',
            name: 'confirmShell',
            message: `Detected shell: ${shell}. Is this correct?`,
            initial: true
          });

          if (!confirmShell) {
            const { selectedShell } = await fnetPrompt({
              type: 'select',
              name: 'selectedShell',
              message: 'Select your shell:',
              choices: [
                { name: 'bash', message: 'Bash' },
                { name: 'zsh', message: 'Zsh' },
                { name: 'fish', message: 'Fish' },
                { name: 'powershell', message: 'PowerShell' },
                { name: 'powershell-core', message: 'PowerShell Core' },
                { name: 'cmd', message: 'Windows Command Prompt' },
                { name: 'ksh', message: 'Korn Shell (ksh)' },
                { name: 'csh', message: 'C Shell (csh/tcsh)' }
              ]
            });

            shell = selectedShell;
          }
        }

        // Get all possible config paths for the selected shell
        const configPaths = binSystem.getAllShellConfigPaths(shell);

        // If there are multiple config paths, let the user choose
        let configPath;
        if (configPaths.length > 1) {
          // Filter to only existing config files
          const existingConfigPaths = configPaths.filter(config => fs.existsSync(config.path));

          if (existingConfigPaths.length > 0) {
            // If there are existing config files, let the user choose from them
            const { selectedConfigPath } = await fnetPrompt({
              type: 'select',
              name: 'selectedConfigPath',
              message: 'Select the configuration file to modify:',
              choices: existingConfigPaths.map(config => ({
                name: config.path,
                message: `${config.name} (${config.path})`
              }))
            });

            configPath = selectedConfigPath;
          } else {
            // If there are no existing config files, let the user choose which one to create
            const { selectedConfigPath } = await fnetPrompt({
              type: 'select',
              name: 'selectedConfigPath',
              message: 'Select the configuration file to create:',
              choices: configPaths.map(config => ({
                name: config.path,
                message: `${config.name} (${config.path})`
              }))
            });

            configPath = selectedConfigPath;
          }
        } else if (configPaths.length === 1) {
          // If there's only one config path, use it
          configPath = configPaths[0].path;
        } else {
          // If there are no config paths, prompt user to enter one
          const { enteredConfigPath } = await fnetPrompt({
            type: 'input',
            name: 'enteredConfigPath',
            message: 'Enter the path to your shell configuration file:',
            initial: path.join(os.homedir(), '.bashrc')
          });

          configPath = enteredConfigPath;
        }

        // Add bin directory to PATH
        const success = await binSystem.addBinToPath(shell, configPath, binDir);

        if (success) {
          console.log(chalk.green(`Added bin directory to PATH in ${configPath}`));
          console.log(chalk.yellow('Please restart your terminal or run the following command:'));
          console.log(chalk.green(`source ${configPath}`));
        } else {
          console.log(chalk.red(`Failed to add bin directory to PATH in ${configPath}`));
          console.log(chalk.yellow('You can add it manually by adding the following line to your shell configuration:'));
          console.log(chalk.green(binSystem.getExportPathCommand(shell, binDir)));
        }
      } else {
        console.log(chalk.yellow('You can add it manually by adding the following line to your shell configuration:'));
        console.log(chalk.green(`export PATH="${binDir}:$PATH"`));
        console.log(chalk.yellow('Or run:'));
        console.log(chalk.green('fbin path'));
      }
    } else {
      console.log(chalk.green(`Bin directory is already in PATH.`));
    }

    console.log(chalk.green('Bin system setup completed successfully.'));
  } catch (error) {
    console.error(chalk.red(`Failed to set up bin system: ${error.message}`));
    process.exit(1);
  }
};

export default {
  command,
  describe,
  builder,
  handler
};
