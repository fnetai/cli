/**
 * Restart command for fservice CLI
 * This module provides the restart command for restarting services
 */
import chalk from 'chalk';
import { createContext } from './context.js';
import serviceSystem from '../utils/service-system.js';

/**
 * Command configuration
 */
const command = {
  command: 'restart',
  describe: 'Restart a service',
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
      
      console.log(chalk.blue(`Restarting service '${argv.name}'...`));
      
      // Import manageService from @fnet/service
      const manageService = (await import('@fnet/service')).default;
      
      try {
        // Stop the service
        await manageService({
          action: 'stop',
          name: argv.name
        });
        
        console.log(chalk.blue(`Service '${argv.name}' stopped.`));
        
        // Start the service
        await manageService({
          action: 'start',
          name: argv.name
        });
        
        console.log(chalk.green(`Service '${argv.name}' restarted successfully.`));
        
        // Update metadata
        metadata.services[argv.name].status = 'running';
        metadata.services[argv.name].lastRestarted = new Date().toISOString();
        serviceSystem.saveServiceMetadata(metadata);
      } catch (error) {
        console.error(chalk.red(`Failed to restart service: ${error.message}`));
        process.exit(1);
      }
    } catch (error) {
      console.error(chalk.red(`Error: ${error.message}`));
      process.exit(1);
    }
  }
};

export default command;
