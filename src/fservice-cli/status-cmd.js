/**
 * Status command for fservice CLI
 * This module provides the status command for checking service status
 */
import chalk from 'chalk';
import { createContext } from './context.js';
import serviceSystem from '../utils/service-system.js';

/**
 * Command configuration
 */
const command = {
  command: 'status',
  describe: 'Check the status of a service',
  builder: (yargs) => {
    return yargs
      .option('name', {
        describe: 'Service name',
        type: 'string',
        demandOption: true,
        alias: 'n'
      })
      .option('format', {
        describe: 'Output format',
        type: 'string',
        choices: ['json', 'text', 'table'],
        default: 'table'
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

      console.log(chalk.blue(`Checking status of service '${argv.name}'...`));

      // Import manageService from @fnet/service
      const manageService = (await import('@fnet/service')).default;

      try {
        // Load service definition to get system parameter
        const definitionName = metadata.services[argv.name].definition;
        const definition = serviceSystem.loadServiceDefinition(definitionName);

        if (!definition) {
          throw new Error(`Service definition '${definitionName}' not found`);
        }

        const status = await manageService({
          action: 'status',
          name: argv.name,
          system: definition.system !== false
        });

        console.log(chalk.green(`Service '${argv.name}' status: ${status}`));

        // Update metadata
        metadata.services[argv.name].status = status || 'unknown';
        metadata.services[argv.name].lastChecked = new Date().toISOString();
        // Note: pid is not available from getServiceStatus
        serviceSystem.saveServiceMetadata(metadata);

        // Format output based on format option
        if (argv.format === 'json') {
          console.log(JSON.stringify({
            name: argv.name,
            status: status || 'unknown',
            definition: metadata.services[argv.name].definition,
            binary: metadata.services[argv.name].binary
          }, null, 2));
        } else if (argv.format === 'text') {
          console.log(`Name: ${argv.name}`);
          console.log(`Status: ${status || 'unknown'}`);
          console.log(`Definition: ${metadata.services[argv.name].definition}`);
          console.log(`Binary: ${metadata.services[argv.name].binary}`);
        } else {
          // Table format (default)
          console.log(chalk.bold('\nService Status:'));
          console.log(chalk.bold('─'.repeat(50)));
          console.log(`${chalk.bold('Name:')} ${argv.name}`);
          console.log(`${chalk.bold('Status:')} ${getStatusColor(status)(status || 'unknown')}`);
          console.log(`${chalk.bold('Definition:')} ${metadata.services[argv.name].definition}`);
          console.log(`${chalk.bold('Binary:')} ${metadata.services[argv.name].binary}`);

          console.log(chalk.bold('─'.repeat(50)));
        }
      } catch (error) {
        console.error(chalk.red(`Failed to check service status: ${error.message}`));
        process.exit(1);
      }
    } catch (error) {
      console.error(chalk.red(`Error: ${error.message}`));
      process.exit(1);
    }
  }
};

/**
 * Get color function for status
 * @param {string} status - Service status
 * @returns {Function} Chalk color function
 */
function getStatusColor(status) {
  switch (status) {
    case 'running':
      return chalk.green;
    case 'stopped':
      return chalk.yellow;
    case 'failed':
      return chalk.red;
    default:
      return chalk.gray;
  }
}

// Removed unused functions: formatUptime and formatMemory

export default command;
