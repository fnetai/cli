import chalk from 'chalk';
import fnetYaml from '@fnet/yaml';
import fnetShellFlow, { ProcessManager } from '@fnet/shell-flow';
import { withSystemTags } from './auto-tags.js';
import { detectProjectFile } from './project-file.js';

/**
 * Run a command group from a project file
 *
 * @param {Object} options - Options for running the command
 * @param {string} options.projectType - Type of project ('fnode', 'fnet', or 'auto')
 * @param {string} options.group - Command group to run
 * @param {Array} options.tags - Tags for conditional configuration
 * @param {Object} options.args - Command line arguments
 * @param {Array} options.argv - Raw command line arguments
 * @param {ProcessManager} [options.processManager] - External ProcessManager for centralized process lifecycle management
 * @returns {Promise<void>}
 */
export async function runCommandGroup({ projectType, group, tags, args, argv, processManager }) {
  try {
    // Detect project file based on project type
    const projectFile = await detectProjectFile(projectType);
    tags = withSystemTags(tags);

    // Load project file
    const { parsed: projectFileParsed } = await fnetYaml({
      file: projectFile.path,
      tags
    });

    // Check if commands section exists
    const commands = projectFileParsed.commands;
    if (!commands) {
      throw new Error(`Commands section not found in ${projectFile.name}`);
    }

    // Check if command group exists
    const commandGroup = commands[group];
    if (!commandGroup) {
      throw new Error(`Command group '${group}' not found in ${projectFile.name}`);
    }

    // Run command group with centralized process management
    await fnetShellFlow({
      commands: commandGroup,
      context: {
        args,
        argv,
        projectType: projectFile.type
      },
      processManager
    });
  } catch (error) {
    console.error(`Error: ${error.message}`);
    process.exit(1);
  }
}

/**
 * List all available command groups from the project file
 *
 * @param {Object} options - Options
 * @param {string} options.projectType - Type of project ('fnode', 'fnet', or 'auto')
 * @param {Array} [options.tags] - Tags for conditional configuration
 * @returns {Promise<void>}
 */
export async function listCommandGroups({ projectType, tags }) {
  try {
    const projectFile = await detectProjectFile(projectType);

    const { parsed: projectFileParsed } = await fnetYaml({
      file: projectFile.path,
      tags
    });

    const commands = projectFileParsed.commands;
    if (!commands) {
      console.log(chalk.yellow(`No commands found in ${projectFile.name}`));
      return;
    }

    console.log(`\n${chalk.bold('Available commands')} ${chalk.dim(`(${projectFile.name})`)}:\n`);

    const entries = Object.entries(commands);
    const maxNameLen = Math.max(...entries.map(([name]) => name.length));
    let prevHadMeta = false;

    for (const [name, value] of entries) {
      const isObject = value && typeof value === 'object' && !Array.isArray(value);
      const description = isObject ? value.description || '' : '';
      const usage = isObject ? value.usage || '' : '';
      const hasMeta = !!(description || usage);

      // Add blank line before entries with metadata for visual grouping
      if (hasMeta && prevHadMeta) {
        console.log('');
      }

      const paddedName = name.padEnd(maxNameLen);

      if (hasMeta) {
        console.log(`  ${chalk.bold.cyan(paddedName)}  ${description}`);
        if (usage) {
          console.log(`  ${''.padEnd(maxNameLen)}  ${chalk.dim('$ ' + usage)}`);
        }
        // console.log('');
      } else {
        console.log(`  ${chalk.cyan(paddedName)}`);
      }

      prevHadMeta = hasMeta;
    }
  } catch (error) {
    console.error(`Error: ${error.message}`);
    process.exit(1);
  }
}

export { detectProjectFile };
