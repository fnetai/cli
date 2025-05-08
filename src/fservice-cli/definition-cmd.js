/**
 * Definition command for fservice CLI
 * This module provides commands for managing service definitions
 */
import fs from 'node:fs';
import path from 'node:path';
import chalk from 'chalk';
import fnetObjectFromSchema from '@fnet/object-from-schema';
import fnetPrompt from '@fnet/prompt';
import { createContext } from './context.js';
import serviceSystem from '../utils/service-system.js';
import serviceSchema from '../utils/service-schema.js';

/**
 * Command configuration
 */
const command = {
  command: 'definition <subcommand>',
  describe: 'Manage service definitions',
  builder: (yargs) => {
    return yargs
      .command({
        command: 'create',
        describe: 'Create a new service definition',
        builder: (yargs) => {
          return yargs
            .option('name', {
              describe: 'Service definition name',
              type: 'string'
            })
            .option('output', {
              describe: 'Output file path',
              type: 'string',
              alias: 'o'
            });
        },
        handler: createDefinitionHandler
      })
      .command({
        command: 'list',
        describe: 'List service definitions',
        builder: (yargs) => {
          return yargs
            .option('format', {
              describe: 'Output format',
              type: 'string',
              choices: ['json', 'text', 'table'],
              default: 'table'
            });
        },
        handler: listDefinitionsHandler
      })
      .command({
        command: 'show <name>',
        describe: 'Show service definition details',
        builder: (yargs) => {
          return yargs
            .positional('name', {
              describe: 'Service definition name',
              type: 'string'
            })
            .option('format', {
              describe: 'Output format',
              type: 'string',
              choices: ['json', 'yaml'],
              default: 'yaml'
            });
        },
        handler: showDefinitionHandler
      })
      .command({
        command: 'edit <name>',
        describe: 'Edit a service definition',
        builder: (yargs) => {
          return yargs
            .positional('name', {
              describe: 'Service definition name',
              type: 'string'
            });
        },
        handler: editDefinitionHandler
      })
      .command({
        command: 'delete <name>',
        describe: 'Delete a service definition',
        builder: (yargs) => {
          return yargs
            .positional('name', {
              describe: 'Service definition name',
              type: 'string'
            })
            .option('force', {
              describe: 'Force deletion without confirmation',
              type: 'boolean',
              default: false,
              alias: 'f'
            });
        },
        handler: deleteDefinitionHandler
      })
      .command({
        command: 'validate <name>',
        describe: 'Validate a service definition',
        builder: (yargs) => {
          return yargs
            .positional('name', {
              describe: 'Service definition name',
              type: 'string'
            });
        },
        handler: validateDefinitionHandler
      })
      .demandCommand(1, 'You need to specify a subcommand');
  },
  handler: () => {}
};

/**
 * Create a new service definition
 */
async function createDefinitionHandler(argv) {
  try {
    const context = await createContext(argv);

    // Get service definition schema
    const schema = serviceSchema.getServiceDefinitionSchema();

    // Generate service definition using @fnet/object-from-schema
    const result = await fnetObjectFromSchema({
      schema,
      format: 'yaml'
    });

    console.log('Result from fnetObjectFromSchema:', result);

    // Parse the generated YAML
    let definition;

    if (typeof result === 'string') {
      // If result is a YAML string, parse it
      try {
        const yaml = (await import('yaml')).default;
        definition = yaml.parse(result);
      } catch (error) {
        console.warn(chalk.yellow(`Failed to parse YAML: ${error.message}`));
        definition = { name: 'service-' + Date.now() };
      }
    } else if (result && typeof result === 'object') {
      // If result is an object, use it directly
      definition = result.data || result;
    } else {
      // Fallback
      definition = { name: 'service-' + Date.now() };
    }

    console.log('Generated definition:', definition);

    // Determine the definition name
    const definitionName = argv.name || (definition && definition.name ? definition.name : 'service-' + Date.now());

    // Check if definition already exists
    if (serviceSystem.serviceDefinitionExists(definitionName) && !argv.force) {
      const { confirmOverwrite } = await fnetPrompt({
        type: 'confirm',
        name: 'confirmOverwrite',
        message: `Service definition '${definitionName}' already exists. Overwrite?`,
        initial: false
      });

      if (!confirmOverwrite) {
        console.log(chalk.yellow('Operation cancelled.'));
        return;
      }
    }

    // Save the service definition
    const success = serviceSystem.saveServiceDefinition(definitionName, definition);

    if (success) {
      console.log(chalk.green(`Service definition '${definitionName}' created successfully.`));
      console.log(chalk.blue(`Location: ${serviceSystem.getServiceDefinitionPath(definitionName)}`));
    } else {
      console.error(chalk.red(`Failed to create service definition '${definitionName}'.`));
    }
  } catch (error) {
    console.error(chalk.red(`Error: ${error.message}`));
    process.exit(1);
  }
}

/**
 * List service definitions
 */
async function listDefinitionsHandler(argv) {
  try {
    const context = await createContext(argv);

    // Get list of service definitions
    const definitions = serviceSystem.listServiceDefinitions();

    if (definitions.length === 0) {
      console.log(chalk.yellow('No service definitions found.'));
      return;
    }

    // Format output based on format option
    if (argv.format === 'json') {
      console.log(JSON.stringify(definitions, null, 2));
    } else if (argv.format === 'text') {
      definitions.forEach(name => console.log(name));
    } else {
      // Table format (default)
      console.log(chalk.bold('\nService Definitions:'));
      console.log(chalk.bold('─'.repeat(50)));

      for (const name of definitions) {
        const definition = serviceSystem.loadServiceDefinition(name);
        if (definition) {
          console.log(chalk.green(`${name}`));
          console.log(`  Binary: ${definition.binary}`);
          if (definition.description) {
            console.log(`  Description: ${definition.description}`);
          }
          console.log(chalk.bold('─'.repeat(50)));
        }
      }
    }
  } catch (error) {
    console.error(chalk.red(`Error: ${error.message}`));
    process.exit(1);
  }
}

/**
 * Show service definition details
 */
async function showDefinitionHandler(argv) {
  try {
    const context = await createContext(argv);

    // Load service definition
    const definition = serviceSystem.loadServiceDefinition(argv.name);

    if (!definition) {
      console.error(chalk.red(`Service definition '${argv.name}' not found.`));
      process.exit(1);
    }

    // Format output based on format option
    if (argv.format === 'json') {
      console.log(JSON.stringify(definition, null, 2));
    } else {
      // YAML format (default)
      const yaml = (await import('yaml')).default;
      console.log(yaml.stringify(definition));
    }
  } catch (error) {
    console.error(chalk.red(`Error: ${error.message}`));
    process.exit(1);
  }
}

/**
 * Edit a service definition
 */
async function editDefinitionHandler(argv) {
  try {
    const context = await createContext(argv);

    // Load service definition
    const definition = serviceSystem.loadServiceDefinition(argv.name);

    if (!definition) {
      console.error(chalk.red(`Service definition '${argv.name}' not found.`));
      process.exit(1);
    }

    // Get service definition schema
    const schema = serviceSchema.getServiceDefinitionSchema();

    // Generate service definition using @fnet/object-from-schema
    const result = await fnetObjectFromSchema({
      schema,
      ref: definition,
      format: 'yaml'
    });

    // Parse the generated YAML
    const updatedDefinition = result.data;

    // Save the service definition
    const success = serviceSystem.saveServiceDefinition(argv.name, updatedDefinition);

    if (success) {
      console.log(chalk.green(`Service definition '${argv.name}' updated successfully.`));
    } else {
      console.error(chalk.red(`Failed to update service definition '${argv.name}'.`));
    }
  } catch (error) {
    console.error(chalk.red(`Error: ${error.message}`));
    process.exit(1);
  }
}

/**
 * Delete a service definition
 */
async function deleteDefinitionHandler(argv) {
  try {
    const context = await createContext(argv);

    // Check if definition exists
    if (!serviceSystem.serviceDefinitionExists(argv.name)) {
      console.error(chalk.red(`Service definition '${argv.name}' not found.`));
      process.exit(1);
    }

    // Confirm deletion
    if (!argv.force) {
      const { confirmDelete } = await fnetPrompt({
        type: 'confirm',
        name: 'confirmDelete',
        message: `Are you sure you want to delete service definition '${argv.name}'?`,
        initial: false
      });

      if (!confirmDelete) {
        console.log(chalk.yellow('Operation cancelled.'));
        return;
      }
    }

    // Delete the service definition
    const success = serviceSystem.deleteServiceDefinition(argv.name);

    if (success) {
      console.log(chalk.green(`Service definition '${argv.name}' deleted successfully.`));
    } else {
      console.error(chalk.red(`Failed to delete service definition '${argv.name}'.`));
    }
  } catch (error) {
    console.error(chalk.red(`Error: ${error.message}`));
    process.exit(1);
  }
}

/**
 * Validate a service definition
 */
async function validateDefinitionHandler(argv) {
  try {
    const context = await createContext(argv);

    // Load service definition
    const definition = serviceSystem.loadServiceDefinition(argv.name);

    if (!definition) {
      console.error(chalk.red(`Service definition '${argv.name}' not found.`));
      process.exit(1);
    }

    // Validate service definition
    const validation = serviceSystem.validateServiceDefinition(definition);

    if (validation.valid) {
      console.log(chalk.green(`Service definition '${argv.name}' is valid.`));
    } else {
      console.error(chalk.red(`Service definition '${argv.name}' is invalid:`));
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
