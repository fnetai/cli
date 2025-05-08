/**
 * Register command for fservice CLI
 * This module provides the register command for registering service definitions as system services
 */
import chalk from 'chalk';
import { createContext } from './context.js';
import serviceSystem from '../utils/service-system.js';

/**
 * Command configuration
 */
const command = {
  command: 'register',
  describe: 'Register a service definition as a system service',
  builder: (yargs) => {
    return yargs
      .option('definition', {
        describe: 'Service definition name',
        type: 'string',
        demandOption: true,
        alias: 'd'
      })
      .option('start', {
        describe: 'Start the service after registration',
        type: 'boolean',
        default: false
      });
  },
  handler: async (argv) => {
    try {
      const context = await createContext(argv);
      
      // Check if definition exists
      if (!serviceSystem.serviceDefinitionExists(argv.definition)) {
        console.error(chalk.red(`Service definition '${argv.definition}' not found.`));
        process.exit(1);
      }
      
      console.log(chalk.blue(`Registering service from definition '${argv.definition}'...`));
      
      // Register the service
      const result = await serviceSystem.registerService(argv.definition);
      
      console.log(chalk.green(`Service '${result.name}' registered successfully.`));
      
      // Start the service if requested
      if (argv.start) {
        console.log(chalk.blue(`Starting service '${result.name}'...`));
        
        // Import manageService from @fnet/service
        const manageService = (await import('@fnet/service')).default;
        
        try {
          await manageService({
            action: 'start',
            name: result.name
          });
          
          console.log(chalk.green(`Service '${result.name}' started successfully.`));
          
          // Update metadata
          const metadata = serviceSystem.loadServiceMetadata();
          if (metadata.services[result.name]) {
            metadata.services[result.name].status = 'running';
            metadata.services[result.name].lastStarted = new Date().toISOString();
            serviceSystem.saveServiceMetadata(metadata);
          }
        } catch (error) {
          console.error(chalk.red(`Failed to start service: ${error.message}`));
        }
      }
    } catch (error) {
      console.error(chalk.red(`Error: ${error.message}`));
      process.exit(1);
    }
  }
};

export default command;
