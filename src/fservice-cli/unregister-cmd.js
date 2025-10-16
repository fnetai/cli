/**
 * Unregister command for fservice CLI
 * This module provides the unregister command for removing services from the system
 */
import chalk from 'chalk';
import fnetPrompt from '@fnet/prompt';
import { createContext } from './context.js';
import serviceSystem from '../utils/service-system.js';
import promptUtils from '../utils/prompt-utils.js';

/**
 * Command configuration
 */
const command = {
  command: 'unregister',
  describe: 'Unregister a service from the system',
  builder: (yargs) => {
    return yargs
      .option('name', {
        describe: 'Service name',
        type: 'string',
        demandOption: false,
        alias: 'n'
      })
      .option('keep-manifest', {
        describe: 'Keep the service manifest',
        type: 'boolean',
        default: true
      })
      .option('force', {
        describe: 'Force unregistration without confirmation',
        type: 'boolean',
        default: false,
        alias: 'f'
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
          message: 'Select a service to unregister:',
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

      // Confirm unregistration
      if (!argv.force) {
        const { confirmUnregister } = await fnetPrompt({
          type: 'confirm',
          name: 'confirmUnregister',
          message: `Are you sure you want to unregister service '${serviceName}'?`,
          initial: false
        });

        if (!confirmUnregister) {
          console.log(chalk.yellow('Operation cancelled.'));
          return;
        }
      }

      console.log(chalk.blue(`Unregistering service '${serviceName}'...`));

      // Import manageService from @fnet/service
      const manageService = (await import('@fnet/service')).default;

      try {
        // Load service manifest to get system parameter
        const manifestName = metadata.services[serviceName].manifest;
        const manifest = serviceSystem.loadServiceManifest(manifestName);

        if (!manifest) {
          throw new Error(`Service manifest '${manifestName}' not found`);
        }

        const isSystemService = manifest.system !== false;

        // Stop the service first
        try {
          await manageService({
            action: 'stop',
            name: serviceName,
            system: isSystemService
          });
          console.log(chalk.blue(`Service '${serviceName}' stopped.`));
        } catch (error) {
          console.warn(chalk.yellow(`Warning: Failed to stop service: ${error.message}`));
        }

        // Unregister the service
        await manageService({
          action: 'unregister',
          name: serviceName,
          system: isSystemService
        });

        console.log(chalk.green(`Service '${serviceName}' unregistered successfully.`));

        // Update metadata
        delete metadata.services[serviceName];
        serviceSystem.saveServiceMetadata(metadata);

        // Delete service manifest if requested
        if (!argv.keepDefinition && manifestName) {
          if (serviceSystem.servicManifestExists(manifestName)) {
            const success = serviceSystem.deleteServiceManifest(manifestName);
            if (success) {
              console.log(chalk.green(`Service manifest '${manifestName}' deleted.`));
            } else {
              console.warn(chalk.yellow(`Warning: Failed to delete service manifest '${manifestName}'.`));
            }
          }
        }
      } catch (error) {
        console.error(chalk.red(`Failed to unregister service: ${error.message}`));
        process.exit(1);
      }
    } catch (error) {
      console.error(chalk.red(`Error: ${error.message}`));
      process.exit(1);
    }
  }
};

export default command;
