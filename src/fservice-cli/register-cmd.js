/**
 * Register command for fservice CLI
 * This module provides the register command for registering service manifests as system services
 */
import chalk from 'chalk';
import { createContext } from './context.js';
import serviceSystem from '../utils/service-system.js';

/**
 * Command configuration
 */
const command = {
  command: 'register',
  describe: 'Register a service manifest as a system service',
  builder: (yargs) => {
    return yargs
      .option('manifest', {
        describe: 'Service manifest name',
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
      
      // Check if manifest exists
      if (!serviceSystem.servicManifestExists(argv.manifest)) {
        console.error(chalk.red(`Service manifest '${argv.manifest}' not found.`));
        process.exit(1);
      }
      
      console.log(chalk.blue(`Registering service from manifest '${argv.manifest}'...`));
      
      // Register the service
      const result = await serviceSystem.registerService(argv.manifest);
      
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
