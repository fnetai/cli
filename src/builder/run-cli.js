import fs from 'fs';
import path from 'path';
import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';
import fnetYaml from '@fnet/yaml';
import fnetShellFlow from '@fnet/shell-flow';

const cwd = process.cwd();

// Main function
async function main() {
  const argv = yargs(hideBin(process.argv))
    .usage('Usage: $0 <command> [options]')
    .command('$0 <group> [options..]', 'Run a command group from project file', (yargs) => {
      return yargs
        .positional('group', {
          type: 'string',
          describe: 'Command group to run'
        })
        .option('ftag', {
          type: 'array',
          describe: 'Tags for conditional configuration'
        })
        .example('$0 build', 'Run the build command group')
        .example('$0 test --ftag dev', 'Run the test command group with dev tag')
    })
    .help()
    .version()
    .argv;

  try {
    // Detect project file (fnode.yaml or fnet.yaml)
    const projectFile = await detectProjectFile();

    // Load project file
    const { parsed: projectFileParsed } = await fnetYaml({
      file: projectFile.path,
      tags: argv.ftag
    });

    // Check if commands section exists
    const commands = projectFileParsed.commands;
    if (!commands) {
      throw new Error(`Commands section not found in ${projectFile.name}`);
    }

    // Check if command group exists
    const group = commands[argv.group];
    if (!group) {
      throw new Error(`Command group '${argv.group}' not found in ${projectFile.name}`);
    }

    // Run command group
    console.log(`Running command group '${argv.group}' from ${projectFile.name}...`);
    await fnetShellFlow({
      commands: group,
      context: {
        args: argv,
        argv: process.argv,
        projectType: projectFile.type
      }
    });

  } catch (error) {
    console.error(`Error: ${error.message}`);
    process.exit(1);
  }
}

// Detect project file (fnode.yaml or fnet.yaml)
async function detectProjectFile() {
  const fnodeYamlPath = path.resolve(cwd, 'fnode.yaml');
  const fnetYamlPath = path.resolve(cwd, 'fnet.yaml');

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

// Run main function
main().catch(error => {
  console.error(`Fatal error: ${error.message}`);
  process.exit(1);
});
