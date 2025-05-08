/**
 * List command for fservice CLI
 * This module provides the list command for listing registered services
 */
import chalk from 'chalk';
import { createContext } from './context.js';
import serviceSystem from '../utils/service-system.js';
import tableUtils from '../utils/table-utils.js';

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
        const headers = ['NAME', 'STATUS', 'BINARY', 'DEFINITION'];
        const table = tableUtils.createTable(headers);

        services.forEach(service => {
          const statusColor = tableUtils.getStatusColor(service.status);
          table.push([
            service.name,
            statusColor(service.status || 'unknown'),
            service.binary,
            service.definition
          ]);
        });

        console.log(chalk.bold('\nRegistered Services:'));
        console.log(table.toString());
        console.log(`Total: ${services.length} service(s)`);
      }
    } catch (error) {
      console.error(chalk.red(`Error: ${error.message}`));
      process.exit(1);
    }
  }
};

export default command;
