/**
 * Definition command for fservice CLI
 * This module provides commands for managing service manifests
 */
import chalk from 'chalk';
import fnetObjectFromSchema from '@fnet/object-from-schema';
import fnetPrompt from '@fnet/prompt';
import { createContext } from './context.js';
import serviceSystem from '../utils/service-system.js';
import serviceSchema from '../utils/service-schema.js';
import promptUtils from '../utils/prompt-utils.js';

/**
 * Command configuration
 */
const command = {
  command: 'manifest <subcommand>',
  describe: 'Manage service manifests',
  builder: (yargs) => {
    return yargs
      .command({
        command: 'create',
        describe: 'Create a new service manifest',
        builder: (yargs) => {
          return yargs
            .option('name', {
              describe: 'Service manifest name',
              type: 'string'
            })
            .option('output', {
              describe: 'Output file path',
              type: 'string',
              alias: 'o'
            });
        },
        handler: createManifestHandler
      })
      .command({
        command: 'list',
        describe: 'List service manifests',
        builder: (yargs) => {
          return yargs
            .option('format', {
              describe: 'Output format',
              type: 'string',
              choices: ['json', 'text', 'table'],
              default: 'table'
            });
        },
        handler: listManifestsHandler
      })
      .command({
        command: 'show [n]',
        describe: 'Show service manifest details',
        builder: (yargs) => {
          return yargs
            .positional('name', {
              describe: 'Service manifest name',
              type: 'string',
              demandOption: false
            })
            .option('format', {
              describe: 'Output format',
              type: 'string',
              choices: ['json', 'yaml'],
              default: 'yaml'
            });
        },
        handler: showManifestHandler
      })
      .command({
        command: 'edit [n]',
        describe: 'Edit a service manifest',
        builder: (yargs) => {
          return yargs
            .positional('name', {
              describe: 'Service manifest name',
              type: 'string',
              demandOption: false
            });
        },
        handler: editManifestHandler
      })
      .command({
        command: 'delete [n]',
        describe: 'Delete a service manifest',
        builder: (yargs) => {
          return yargs
            .positional('name', {
              describe: 'Service manifest name',
              type: 'string',
              demandOption: false
            })
            .option('force', {
              describe: 'Force deletion without confirmation',
              type: 'boolean',
              default: false,
              alias: 'f'
            });
        },
        handler: deleteManifestHandler
      })
      .command({
        command: 'validate [n]',
        describe: 'Validate a service manifest',
        builder: (yargs) => {
          return yargs
            .positional('name', {
              describe: 'Service manifest name',
              type: 'string',
              demandOption: false
            });
        },
        handler: validateManifesrHandler
      })
      .demandCommand(1, 'You need to specify a subcommand');
  },
  handler: () => {}
};

/**
 * Create a new service manifest
 */
async function createManifestHandler(argv) {
  try {
    const context = await createContext(argv);

    // Get service manifest schema
    const schema = serviceSchema.getServiceManifestSchema();

    // Generate service manifest using @fnet/object-from-schema
    const result = await fnetObjectFromSchema({
      schema,
      format: 'yaml'
    });

    console.log('Result from fnetObjectFromSchema:', result);

    // Parse the generated YAML
    let manifest;

    if (typeof result === 'string') {
      // If result is a YAML string, parse it
      try {
        const yaml = (await import('yaml')).default;
        manifest = yaml.parse(result);
      } catch (error) {
        console.warn(chalk.yellow(`Failed to parse YAML: ${error.message}`));
        manifest = { name: 'service-' + Date.now() };
      }
    } else if (result && typeof result === 'object') {
      // If result is an object, use it directly
      manifest = result.data || result;
    } else {
      // Fallback
      manifest = { name: 'service-' + Date.now() };
    }

    console.log('Generated manifest:', manifest);

    // Determine the manifest name
    const manifestName = argv.name || (manifest && manifest.name ? manifest.name : 'service-' + Date.now());

    // Check if manifest already exists
    if (serviceSystem.servicManifestExists(manifestName) && !argv.force) {
      const { confirmOverwrite } = await fnetPrompt({
        type: 'confirm',
        name: 'confirmOverwrite',
        message: `Service manifest '${manifestName}' already exists. Overwrite?`,
        initial: false
      });

      if (!confirmOverwrite) {
        console.log(chalk.yellow('Operation cancelled.'));
        return;
      }
    }

    // Save the service manifest
    const success = serviceSystem.saveServiceManifest(manifestName, manifest);

    if (success) {
      console.log(chalk.green(`Service manifest '${manifestName}' created successfully.`));
      console.log(chalk.blue(`Location: ${serviceSystem.getServiceManfifestPath(manifestName)}`));
    } else {
      console.error(chalk.red(`Failed to create service manifest '${manifestName}'.`));
    }
  } catch (error) {
    console.error(chalk.red(`Error: ${error.message}`));
    process.exit(1);
  }
}

/**
 * List service manifests
 */
async function listManifestsHandler(argv) {
  try {
    const context = await createContext(argv);

    // Get list of service manifests
    const manifests = serviceSystem.listServiceManifests();

    if (manifests.length === 0) {
      console.log(chalk.yellow('No service manifests found.'));
      return;
    }

    // Format output based on format option
    if (argv.format === 'json') {
      console.log(JSON.stringify(manifests, null, 2));
    } else if (argv.format === 'text') {
      manifests.forEach(name => console.log(name));
    } else {
      // Table format (default)
      console.log(chalk.bold('\nService Definitions:'));

      // Import table utils
      const tableUtils = (await import('../utils/table-utils.js')).default;

      // Create table with headers
      const headers = ['NAME', 'BINARY', 'DESCRIPTION'];
      const table = tableUtils.createTable(headers, {
        // Remove row separators for more compact display
        chars: {
          'mid': '',
          'mid-mid': '',
          'left-mid': '',
          'right-mid': ''
        }
      });

      // Add rows to table
      for (const name of manifests) {
        const manifest = serviceSystem.loadServiceManifest(name);
        if (manifest) {
          table.push([
            chalk.white(name),  // Ana sütun renkli
            chalk.cyan(manifest.binary || 'undefined'),  // Binary sütunu da önemli
            manifest.description || ''
          ]);
        }
      }

      console.log(table.toString());
      console.log(`Total: ${manifests.length} manifest(s)`);
    }
  } catch (error) {
    console.error(chalk.red(`Error: ${error.message}`));
    process.exit(1);
  }
}

/**
 * Show service manifest details
 */
async function showManifestHandler(argv) {
  try {
    const context = await createContext(argv);

    // If name is not provided, prompt for selection
    if (!argv.name) {
      // Get list of service manifests
      const manifests = serviceSystem.listServiceManifests();

      if (manifests.length === 0) {
        console.log(chalk.yellow('No service manifests found.'));
        return;
      }

      // Prompt user to select a manifest
      const selectedDefinition = await promptUtils.promptForSelection({
        items: manifests,
        message: 'Select a service manifest to show:',
        allowAbort: true
      });

      if (selectedDefinition === null) {
        console.log(chalk.yellow('Operation cancelled.'));
        return;
      }

      argv.name = selectedDefinition;
    }

    // Load service manifest
    const manifest = serviceSystem.loadServiceManifest(argv.name);

    if (!manifest) {
      console.error(chalk.red(`Service manifest '${argv.name}' not found.`));
      process.exit(1);
    }

    // Format output based on format option
    if (argv.format === 'json') {
      console.log(JSON.stringify(manifest, null, 2));
    } else {
      // YAML format (default)
      const yaml = (await import('yaml')).default;
      console.log(yaml.stringify(manifest));
    }
  } catch (error) {
    console.error(chalk.red(`Error: ${error.message}`));
    process.exit(1);
  }
}

/**
 * Edit a service manifest
 */
async function editManifestHandler(argv) {
  try {
    const context = await createContext(argv);

    // If name is not provided, prompt for selection
    if (!argv.name) {
      // Get list of service manifests
      const manifests = serviceSystem.listServiceManifests();

      if (manifests.length === 0) {
        console.log(chalk.yellow('No service manifests found.'));
        return;
      }

      // Prompt user to select a manifest
      const selectedDefinition = await promptUtils.promptForSelection({
        items: manifests,
        message: 'Select a service manifest to edit:',
        allowAbort: true
      });

      if (selectedDefinition === null) {
        console.log(chalk.yellow('Operation cancelled.'));
        return;
      }

      argv.name = selectedDefinition;
    }

    // Load service manifest
    const manifest = serviceSystem.loadServiceManifest(argv.name);

    if (!manifest) {
      console.error(chalk.red(`Service manifest '${argv.name}' not found.`));
      process.exit(1);
    }

    // Get service manifest schema
    const schema = serviceSchema.getServiceManifestSchema();

    // Generate service manifest using @fnet/object-from-schema
    const result = await fnetObjectFromSchema({
      schema,
      ref: manifest,
      format: 'yaml'
    });

    // Parse the generated YAML
    const updatedDefinition = result.data;

    // Save the service manifest
    const success = serviceSystem.saveServiceManifest(argv.name, updatedDefinition);

    if (success) {
      console.log(chalk.green(`Service manifest '${argv.name}' updated successfully.`));
    } else {
      console.error(chalk.red(`Failed to update service manifest '${argv.name}'.`));
    }
  } catch (error) {
    console.error(chalk.red(`Error: ${error.message}`));
    process.exit(1);
  }
}

/**
 * Delete a service manifest
 */
async function deleteManifestHandler(argv) {
  try {
    const context = await createContext(argv);

    // If name is not provided, prompt for selection
    if (!argv.name) {
      // Get list of service manifests
      const manifests = serviceSystem.listServiceManifests();

      if (manifests.length === 0) {
        console.log(chalk.yellow('No service manifests found.'));
        return;
      }

      // Prompt user to select a manifest
      const selectedDefinition = await promptUtils.promptForSelection({
        items: manifests,
        message: 'Select a service manifest to delete:',
        allowAbort: true
      });

      if (selectedDefinition === null) {
        console.log(chalk.yellow('Operation cancelled.'));
        return;
      }

      argv.name = selectedDefinition;
    }

    // Check if manifest exists
    if (!serviceSystem.servicManifestExists(argv.name)) {
      console.error(chalk.red(`Service manifest '${argv.name}' not found.`));
      process.exit(1);
    }

    // Confirm deletion
    if (!argv.force) {
      const { confirmDelete } = await fnetPrompt({
        type: 'confirm',
        name: 'confirmDelete',
        message: `Are you sure you want to delete service manifest '${argv.name}'?`,
        initial: false
      });

      if (!confirmDelete) {
        console.log(chalk.yellow('Operation cancelled.'));
        return;
      }
    }

    // Delete the service manifest
    const success = serviceSystem.deleteServiceManifest(argv.name);

    if (success) {
      console.log(chalk.green(`Service manifest '${argv.name}' deleted successfully.`));
    } else {
      console.error(chalk.red(`Failed to delete service manifest '${argv.name}'.`));
    }
  } catch (error) {
    console.error(chalk.red(`Error: ${error.message}`));
    process.exit(1);
  }
}

/**
 * Validate a service manifest
 */
async function validateManifesrHandler(argv) {
  try {
    const context = await createContext(argv);

    // If name is not provided, prompt for selection
    if (!argv.name) {
      // Get list of service manifests
      const manifests = serviceSystem.listServiceManifests();

      if (manifests.length === 0) {
        console.log(chalk.yellow('No service manifests found.'));
        return;
      }

      // Prompt user to select a manifest
      const selectedDefinition = await promptUtils.promptForSelection({
        items: manifests,
        message: 'Select a service manifest to validate:',
        allowAbort: true
      });

      if (selectedDefinition === null) {
        console.log(chalk.yellow('Operation cancelled.'));
        return;
      }

      argv.name = selectedDefinition;
    }

    // Load service manifest
    const manifest = serviceSystem.loadServiceManifest(argv.name);

    if (!manifest) {
      console.error(chalk.red(`Service manifest '${argv.name}' not found.`));
      process.exit(1);
    }

    // Validate service manifest
    const validation = serviceSystem.validateServiceManifest(manifest);

    if (validation.valid) {
      console.log(chalk.green(`Service manifest '${argv.name}' is valid.`));
    } else {
      console.error(chalk.red(`Service manifest '${argv.name}' is invalid:`));
      validation.errors.forEach(error => {
        console.error(chalk.red(`- ${error}`));
      });
      process.exit(1);
    }
  } catch (error) {
    console.error(chalk.red(`Error: ${error.message}`));
    process.exit(1);
  }
}

export default command;