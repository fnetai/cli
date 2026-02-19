import fs from 'fs';
import path from 'path';
import fnetYaml from '@fnet/yaml';
import fnetShellFlow from '@fnet/shell-flow';

/**
 * Run a command group from a project file
 *
 * @param {Object} options - Options for running the command
 * @param {string} options.projectType - Type of project ('fnode', 'fnet', or 'auto')
 * @param {string} options.group - Command group to run
 * @param {Array} options.tags - Tags for conditional configuration
 * @param {Object} options.args - Command line arguments
 * @param {Array} options.argv - Raw command line arguments
 * @returns {Promise<void>}
 */
export async function runCommandGroup({ projectType, group, tags, args, argv }) {
  try {
    // Detect project file based on project type
    const projectFile = await detectProjectFile(projectType);

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

    // Run command group
    // console.log(`Running command group '${group}' from ${projectFile.name}...`);
    // console.log(args);
    await fnetShellFlow({
      commands: commandGroup,
      context: {
        args,
        argv,
        projectType: projectFile.type
      }
    });
  } catch (error) {
    console.error(`Error: ${error.message}`);
    process.exit(1);
  }
}

/**
 * Detect project file based on project type
 *
 * @param {string} projectType - Type of project ('fnode', 'fnet', or 'auto')
 * @returns {Promise<Object>} Project file information
 */
export async function detectProjectFile(projectType) {
  const cwd = process.cwd();
  const fnodeYamlPath = path.resolve(cwd, 'fnode.yaml');
  const fnetYamlPath = path.resolve(cwd, 'fnet.yaml');

  // For fnode projects, only check fnode.yaml
  if (projectType === 'fnode') {
    if (fs.existsSync(fnodeYamlPath)) {
      return {
        path: fnodeYamlPath,
        name: 'fnode.yaml',
        type: 'fnode'
      };
    }
    throw new Error('fnode.yaml file not found in current directory');
  }

  // For fnet projects, only check fnet.yaml
  if (projectType === 'fnet') {
    if (fs.existsSync(fnetYamlPath)) {
      return {
        path: fnetYamlPath,
        name: 'fnet.yaml',
        type: 'fnet'
      };
    }
    throw new Error('fnet.yaml file not found in current directory');
  }

  // For auto detection, check both files
  if (fs.existsSync(fnodeYamlPath)) {
    return {
      path: fnodeYamlPath,
      name: 'fnode.yaml',
      type: 'fnode'
    };
  }

  if (fs.existsSync(fnetYamlPath)) {
    return {
      path: fnetYamlPath,
      name: 'fnet.yaml',
      type: 'fnet'
    };
  }

  throw new Error('No project file (fnode.yaml or fnet.yaml) found in current directory');
}
