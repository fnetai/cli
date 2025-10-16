/**
 * Stop command for fservice CLI
 * This module provides the stop command for stopping services
 */
import chalk from 'chalk';
import { createContext } from './context.js';
import serviceSystem from '../utils/service-system.js';
import promptUtils from '../utils/prompt-utils.js';

/**
 * Command configuration
 */
const command = {
  command: 'stop',
  describe: 'Stop a running service',
  builder: (yargs) => {
    return yargs
      .option('name', {
        describe: 'Service name',
        type: 'string',
        demandOption: false,
        alias: 'n'
      });
  },
  handler: async (argv) => {
    try {
      const context = await createContext(argv);

      // Load metadata
      const metadata = serviceSystem.loadServiceMetadata();

      // If name not provided, prompt user to select one
      let serviceName = argv.name;
      if (!serviceName) {
        const serviceNames = Object.keys(metadata.services);

        if (serviceNames.length === 0) {
          console.log(chalk.yellow('No registered services found.'));
          process.exit(1);
        }

        serviceName = await promptUtils.promptForSelection({
          items: serviceNames,
          message: 'Select a service to stop:',
          allowAbort: true
        });

        if (!serviceName) {
          console.log(chalk.yellow('Operation cancelled.'));
          return;
        }
      }

      // Check if service exists in metadata
      if (!metadata.services[serviceName]) {
        console.error(chalk.red(`Service '${serviceName}' not found in metadata.`));
        process.exit(1);
      }

      console.log(chalk.blue(`Stopping service '${serviceName}'...`));

      // Import manageService from @fnet/service
      const manageService = (await import('@fnet/service')).default;

      try {
        // Load service manifest to get system parameter
        const manifestName = metadata.services[serviceName].manifest;
        const manifest = serviceSystem.loadServiceManifest(manifestName);

        if (!manifest) {
          throw new Error(`Service manifest '${manifestName}' not found`);
        }

        await manageService({
          action: 'stop',
          name: serviceName,
          system: manifest.system !== false
        });

        console.log(chalk.green(`Service '${serviceName}' stopped successfully.`));

        // Update metadata
        metadata.services[serviceName].status = 'stopped';
        metadata.services[serviceName].lastStopped = new Date().toISOString();
        serviceSystem.saveServiceMetadata(metadata);
      } catch (error) {
        console.error(chalk.red(`Failed to stop service: ${error.message}`));
        process.exit(1);
      }
    } catch (error) {
      console.error(chalk.red(`Error: ${error.message}`));
      process.exit(1);
    }
  }
};

export default command;
