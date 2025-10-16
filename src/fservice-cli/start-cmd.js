/**
 * Start command for fservice CLI
 * This module provides the start command for starting services
 */
import chalk from 'chalk';
import { createContext } from './context.js';
import serviceSystem from '../utils/service-system.js';

/**
 * Command configuration
 */
const command = {
  command: 'start',
  describe: 'Start a registered service',
  builder: (yargs) => {
    return yargs
      .option('name', {
        describe: 'Service name',
        type: 'string',
        demandOption: true,
        alias: 'n'
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

      console.log(chalk.blue(`Starting service '${argv.name}'...`));

      // Import manageService from @fnet/service
      const manageService = (await import('@fnet/service')).default;

      try {
        // Load service manifest to get system parameter
        const manifestName = metadata.services[argv.name].manifest;
        const manifest = serviceSystem.loadServiceManifest(manifestName);

        if (!manifest) {
          throw new Error(`Service manifest '${manifestName}' not found`);
        }

        await manageService({
          action: 'start',
          name: argv.name,
          system: manifest.system !== false
        });

        console.log(chalk.green(`Service '${argv.name}' started successfully.`));

        // Update metadata
        metadata.services[argv.name].status = 'running';
        metadata.services[argv.name].lastStarted = new Date().toISOString();
        serviceSystem.saveServiceMetadata(metadata);
      } catch (error) {
        console.error(chalk.red(`Failed to start service: ${error.message}`));
        process.exit(1);
      }
    } catch (error) {
      console.error(chalk.red(`Error: ${error.message}`));
      process.exit(1);
    }
  }
};

export default command;
