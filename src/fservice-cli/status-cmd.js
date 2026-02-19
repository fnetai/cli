/**
 * Status command for fservice CLI
 * This module provides the status command for checking service status
 */
import chalk from 'chalk';
import { createContext } from './context.js';
import serviceSystem from '../utils/service-system.js';
import promptUtils from '../utils/prompt-utils.js';

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
        demandOption: false,
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
          message: 'Select a service to check status:',
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

      console.log(chalk.blue(`Checking status of service '${serviceName}'...`));

      // Import manageService from @fnet/service
      const manageService = (await import('@fnet/service')).default;

      try {
        // Load service manifest to get system parameter
        const manifestName = metadata.services[serviceName].manifest;
        const manifest = serviceSystem.loadServiceManifest(manifestName);

        if (!manifest) {
          throw new Error(`Service manifest '${manifestName}' not found`);
        }

        const status = await manageService({
          action: 'status',
          name: serviceName,
          system: manifest.system !== false
        });

        console.log(chalk.green(`Service '${serviceName}' status: ${status}`));

        // Update metadata
        metadata.services[serviceName].status = status || 'unknown';
        metadata.services[serviceName].lastChecked = new Date().toISOString();
        // Note: pid is not available from getServiceStatus
        serviceSystem.saveServiceMetadata(metadata);

        // Format output based on format option
        if (argv.format === 'json') {
          console.log(JSON.stringify({
            name: serviceName,
            status: status || 'unknown',
            manifest: manifestName,
            binary: metadata.services[serviceName].binary
          }, null, 2));
        } else if (argv.format === 'text') {
          console.log(`Name: ${serviceName}`);
          console.log(`Status: ${status || 'unknown'}`);
          console.log(`Definition: ${manifestName}`);
          console.log(`Binary: ${metadata.services[serviceName].binary}`);
        } else {
          // Table format (default)
          console.log(chalk.bold('\nService Status:'));
          console.log(chalk.bold('─'.repeat(50)));
          console.log(`${chalk.bold('Name:')} ${serviceName}`);
          console.log(`${chalk.bold('Status:')} ${getStatusColor(status)(status || 'unknown')}`);
          console.log(`${chalk.bold('Definition:')} ${manifestName}`);
          console.log(`${chalk.bold('Binary:')} ${metadata.services[serviceName].binary}`);

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
