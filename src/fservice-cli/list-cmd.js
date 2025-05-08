/**
 * List command for fservice CLI
 * This module provides the list command for listing registered services
 */
import chalk from 'chalk';
import { createContext } from './context.js';
import serviceSystem from '../utils/service-system.js';

/**
 * Command configuration
 */
const command = {
  command: 'list',
  describe: 'List all registered services',
  builder: (yargs) => {
    return yargs
      .option('binary', {
        describe: 'Filter by binary name',
        type: 'string',
        alias: 'b'
      })
      .option('status', {
        describe: 'Filter by status',
        type: 'string',
        choices: ['running', 'stopped', 'failed', 'unknown'],
        alias: 's'
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
      
      // Load service metadata
      const metadata = serviceSystem.loadServiceMetadata();
      
      // Filter services
      let services = Object.entries(metadata.services).map(([name, service]) => ({
        name,
        ...service
      }));
      
      if (argv.binary) {
        services = services.filter(service => service.binary === argv.binary);
      }
      
      if (argv.status) {
        services = services.filter(service => service.status === argv.status);
      }
      
      if (services.length === 0) {
        console.log(chalk.yellow('No services found.'));
        return;
      }
      
      // Format output based on format option
      if (argv.format === 'json') {
        console.log(JSON.stringify(services, null, 2));
      } else if (argv.format === 'text') {
        services.forEach(service => {
          console.log(`${service.name} (${service.status || 'unknown'})`);
        });
      } else {
        // Table format (default)
        console.log(chalk.bold('\nRegistered Services:'));
        console.log(chalk.bold('─'.repeat(80)));
        console.log(chalk.bold('NAME').padEnd(20) + chalk.bold('STATUS').padEnd(15) + chalk.bold('BINARY').padEnd(20) + chalk.bold('DEFINITION'));
        console.log(chalk.bold('─'.repeat(80)));
        
        services.forEach(service => {
          const statusColor = getStatusColor(service.status);
          console.log(
            service.name.padEnd(20) +
            statusColor(service.status || 'unknown').padEnd(15) +
            service.binary.padEnd(20) +
            service.definition
          );
        });
        
        console.log(chalk.bold('─'.repeat(80)));
        console.log(`Total: ${services.length} service(s)`);
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

export default command;
