/**
 * Unregister command for fservice CLI
 * This module provides the unregister command for removing services from the system
 */
import chalk from 'chalk';
import fnetPrompt from '@fnet/prompt';
import { createContext } from './context.js';
import serviceSystem from '../utils/service-system.js';

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
        demandOption: true,
        alias: 'n'
      })
      .option('keep-definition', {
        describe: 'Keep the service definition',
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

      // Check if service exists in metadata
      const metadata = serviceSystem.loadServiceMetadata();
      if (!metadata.services[argv.name]) {
        console.error(chalk.red(`Service '${argv.name}' not found in metadata.`));
        process.exit(1);
      }

      // Confirm unregistration
      if (!argv.force) {
        const { confirmUnregister } = await fnetPrompt({
          type: 'confirm',
          name: 'confirmUnregister',
          message: `Are you sure you want to unregister service '${argv.name}'?`,
          initial: false
        });

        if (!confirmUnregister) {
          console.log(chalk.yellow('Operation cancelled.'));
          return;
        }
      }

      console.log(chalk.blue(`Unregistering service '${argv.name}'...`));

      // Import manageService from @fnet/service
      const manageService = (await import('@fnet/service')).default;

      try {
        // Load service definition to get system parameter
        const definitionName = metadata.services[argv.name].definition;
        const definition = serviceSystem.loadServiceDefinition(definitionName);

        if (!definition) {
          throw new Error(`Service definition '${definitionName}' not found`);
        }

        const isSystemService = definition.system !== false;

        // Stop the service first
        try {
          await manageService({
            action: 'stop',
            name: argv.name,
            system: isSystemService
          });
          console.log(chalk.blue(`Service '${argv.name}' stopped.`));
        } catch (error) {
          console.warn(chalk.yellow(`Warning: Failed to stop service: ${error.message}`));
        }

        // Unregister the service
        await manageService({
          action: 'unregister',
          name: argv.name,
          system: isSystemService
        });

        console.log(chalk.green(`Service '${argv.name}' unregistered successfully.`));

        // Update metadata
        delete metadata.services[argv.name];
        serviceSystem.saveServiceMetadata(metadata);

        // Delete service definition if requested
        if (!argv.keepDefinition && definitionName) {
          if (serviceSystem.serviceDefinitionExists(definitionName)) {
            const success = serviceSystem.deleteServiceDefinition(definitionName);
            if (success) {
              console.log(chalk.green(`Service definition '${definitionName}' deleted.`));
            } else {
              console.warn(chalk.yellow(`Warning: Failed to delete service definition '${definitionName}'.`));
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
