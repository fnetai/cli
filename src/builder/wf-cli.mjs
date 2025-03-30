import { spawn } from 'child_process';
import prompt from '@fnet/prompt';
import which from './which';
import pkg from '../../package.json';

import fnetConfig from '@fnet/config';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const cwd = process.cwd();

// fnet env
fnetConfig({
  name: ["redis"],
  dir: cwd,
  optional: true
});


import { Command, Option } from 'commander'; // Import Commander
import fs from 'fs';
import YAML from 'yaml';
import fnetShellJs from '@fnet/shelljs';

import fnetYaml from '@fnet/yaml';
import fnetObjectFromSchema from '@fnet/object-from-schema';
import fnetShellFlow from '@fnet/shell-flow';

import fnetRender from '@flownet/lib-render-templates-dir';
import Builder from './wf-builder'; // Specific builder for workflows

import findNodeModules from './find-node-modules';
const nodeModulesDir = findNodeModules({ baseDir: __dirname });
const pathSeparator = process.platform === 'win32' ? ';' : ':';
process.env.PATH = `${path.join(nodeModulesDir, '/.bin')}${pathSeparator}${process.env.PATH}`;

// --- Commander Setup ---
const program = new Command();

program
  .name('fnet') // Set the name for help messages (assuming executable is fnet)
  .version(pkg.version) // Use version from package.json
  .description('CLI tool for FlowNet workflow projects');

// --- Create Command ---
program
  .command('create')
  .description('Initialize flow workflow project') // Description updated
  // Make name required as it's used to create the directory
  .requiredOption('-n, --name <string>', 'Project name')
  .addOption(new Option('-r, --runtime <type>', 'Runtime environment (currently only node)').choices(['node']).default('node'))
  .option('--vscode', 'Open project in VSCode after creation', true)
  .option('--no-vscode', 'Do not open project in VSCode')
  .action(async (options) => { // Handler receives options object
    try {
      // Use the correct template path
      const templateDir = path.resolve(nodeModulesDir, '@fnet/cli-project-flow/dist/template/project');
      const outDir = path.resolve(cwd, options.name); // Use options.name
      if (!fs.existsSync(outDir)) fs.mkdirSync(outDir);

      await fnetRender({
        dir: templateDir,
        outDir,
        // Pass commander options object as context
        context: options,
        copyUnmatchedAlso: true
      });

      // Use fnet build (assuming fnet is the command)
      let shellResult = await fnetShellJs(`fnet build`, { cwd: outDir });
      if (shellResult.code !== 0) throw new Error('Failed to build project.');

      if (which('git')) {
        shellResult = await fnetShellJs(`git init --initial-branch=main`, { cwd: outDir });
        if (shellResult.code !== 0) throw new Error('Failed to initialize git.');
      }

      if (options.vscode && which('code')) { // Check options.vscode
        shellResult = await fnetShellJs(`cd ${outDir} && code .`);
        if (shellResult.code !== 0) throw new Error('Failed to open vscode.');
      }

      console.log('Creating project succeeded!');
      process.exit(0);
    } catch (error) {
      console.error('Initialization failed!', error.message);
      process.exit(1);
    }
  });

// --- Project Command ---
program
  .command('project')
  .description('Flow workflow project operations') // Description updated
  .option('-u, --update', 'Update project files from template', false)
  .action(async (options) => {
    try {
      // Use the correct template path
      const templateDir = path.resolve(nodeModulesDir, '@fnet/cli-project-flow/dist/template/project');
      const outDir = process.cwd();

      // Pass commander options to createContext
      const context = await createContext(options);

      if (options.update) { // Check options.update
        await fnetRender({
          dir: templateDir,
          outDir,
          // Use context derived from project file, keep runtime hardcoded as node
          context: {
            name: context.project.projectFileParsed.name,
            runtime: 'node' // Kept hardcoded as per original logic
          },
          copyUnmatchedAlso: true
        });

        let shellResult = await fnetShellJs(`fnet build`, { cwd: outDir });
        if (shellResult.code !== 0) throw new Error('Failed to build project.');

        console.log('Updating project succeeded!');
      } else {
        console.log("Use 'fnet project --update' to update project files.");
      }
      process.exit(0);
    } catch (error) {
      console.error('Project command failed.', error.message); // Message updated
      process.exit(1);
    }
  });

// --- Build Command ---
program
  .command('build')
  .description('Build flownet workflow project') // Description updated
  .option('--id <string>', 'Build identifier')
  .option('--buildId <string>', 'Specific build ID') // Removed alias for simplicity
  .addOption(new Option('--mode <mode>', 'Build mode').choices(['all', 'file', 'build', 'deploy', 'bpmn']).default('build'))
  .option('--ftag <tags...>', 'Filter tags (specify multiple times or space-separated)')
  .action(async (options) => {
    try {
      // Pass commander options to createContext
      const context = await createContext(options);
      const builder = new Builder(context); // Uses ./wf-builder
      await builder.init();
      await builder.build();

      console.log('Building workflow succeeded!'); // Message updated

      process.exit(0);
    } catch (error) {
      console.error('Building workflow failed!', error.message); // Message updated
      process.exit(1);
    }
  });

// --- Deploy Command ---
program
  .command('deploy')
  .description('Build and deploy flownet workflow project') // Description updated
  .option('--id <string>', 'Build identifier')
  .option('--buildId <string>', 'Specific build ID')
  .option('--ftag <tags...>', 'Filter tags')
  .action(async (options) => {
    try {
      // Pass commander options to createContext, overriding mode
      const context = await createContext({ ...options, mode: "all" });
      const builder = new Builder(context); // Uses ./wf-builder
      await builder.init();
      await builder.build();
      console.log('Building and deploying workflow succeeded!'); // Message updated
      process.exit(0);
    } catch (error) {
      console.error('Building/deploying workflow failed!', error.message); // Message updated
      process.exit(1);
    }
  });

// --- File Command ---
program
  .command('file')
  .description('Just create files (part of workflow build)') // Description updated
  .option('--id <string>', 'Build identifier')
  .option('--buildId <string>', 'Specific build ID')
  .option('--ftag <tags...>', 'Filter tags')
  .action(async (options) => {
    try {
      // Pass commander options to createContext, overriding mode
      const context = await createContext({ ...options, mode: "file" });
      const builder = new Builder(context); // Uses ./wf-builder
      await builder.init();
      await builder.build();
      console.log('Creating workflow files succeeded!'); // Message updated
      process.exit(0);
    } catch (error) {
      console.error('Creating workflow files failed!', error.message); // Message updated
      process.exit(1);
    }
  });

// --- Input Command ---
// (Identical structure to the previous script)
program
  .command('input')
  .description('Create or modify an input config file')
  .argument('[name]', 'Optional input configuration name (e.g., dev, prod)')
  .action(async (name, options) => { // Handler receives positional args first, then options
    try {
      // Pass options and name to createContext
      const context = await createContext({ ...options, name }); // Include name if needed by createContext
      const { project } = context;
      const { projectDir, projectFileParsed } = project;
      const schema = projectFileParsed.input;
      if (!schema) throw new Error('Config schema `input` not found in project file (fnet.yaml).'); // Updated filename in error

      let configName = name; // Use the positional argument
      if (!configName) {
        const answers = await prompt({ type: 'input', name: 'inputName', message: 'Input name:', initial: 'dev' });
        configName = answers.inputName;
        if (!configName) { // Exit if user provides no name
          console.error("Input name cannot be empty.");
          process.exit(1);
        }
      }

      const dotFnetDir = path.resolve(projectDir, '.fnet');
      if (!fs.existsSync(dotFnetDir)) fs.mkdirSync(dotFnetDir);

      const configFilePath = path.resolve(dotFnetDir, `${configName}.fnet`);
      const exists = fs.existsSync(configFilePath);

      const result = await fnetObjectFromSchema({ schema, format: "yaml", ref: exists ? configFilePath : undefined });
      fs.writeFileSync(configFilePath, result);
      console.log(`Input config '${configName}.fnet' ${exists ? 'updated' : 'created'}.`);
    } catch (error) {
      console.error(error.message);
      process.exit(1);
    }
  });


// --- Helper Functions (Copied from previous conversion, no Conda needed) ---

// Helper function for simple pass-through commands
function bindSimpleContextCommand(prog, { name, bin, preArgs = [] }) {
  const cmdName = name || bin;
  prog
    .command(cmdName, { isDefault: false, hidden: false })
    .description(`Run ${bin} ${preArgs.join(' ')} in project context. Pass arguments directly after command name.`)
    .argument('[command_args...]', `Arguments for ${bin}`)
    .allowUnknownOption()
    .action(async (command_args, options) => {
      try {
        const context = await createContext(options);
        // Use projectDir from context if available, otherwise CWD
        const effectiveCwd = context?.projectDir && fs.existsSync(context.projectDir)
          ? context.projectDir
          : (context?.project?.projectDir && fs.existsSync(context.project.projectDir)
            ? context.project.projectDir
            : cwd);

        const rawArgs = command_args;

        const subprocess = spawn(bin, [...preArgs, ...rawArgs], {
          cwd: effectiveCwd,
          stdio: 'inherit',
          shell: true // Keep shell true for convenience like handling 'npm run' etc.
        });

        subprocess.on('close', (code) => {
          // Avoid exiting if the process is already closing (e.g., via SIGINT)
          if (process.exitCode === undefined) {
            process.exit(code);
          }
        });
        subprocess.on('error', (err) => {
          console.error(`Failed to start ${bin}:`, err);
          if (process.exitCode === undefined) {
            process.exit(1);
          }
        });

      } catch (error) {
        console.error(`Error setting up context for ${cmdName}:`, error.message);
        if (process.exitCode === undefined) {
          process.exit(1);
        }
      }
    });
}


// Helper function for "with" command
function bindWithContextCommand(prog, { name, preArgs = [] }) {
  prog
    .command(name)
    .description('Run a command with environment variables from a .fnet config file.')
    .argument('<config>', 'Name of the .fnet config file (without extension)')
    .argument('<command>', 'The command to execute')
    .argument('[command_args...]', 'Arguments for the command')
    .option('--ftag <tags...>', 'Filter tags for loading config')
    .allowUnknownOption()
    .action(async (configName, commandName, command_args, options) => {
      try {
        const context = await createContext(options);
        // Determine projectDir robustly for config loading
        const configProjectDir = context?.project?.projectDir && fs.existsSync(context.project.projectDir)
          ? context.project.projectDir
          : cwd;

        const config = await fnetConfig({
          name: configName,
          dir: configProjectDir,
          transferEnv: false,
          optional: true,
          tags: context?.tags || options.ftag || [] // Get tags from context or options
        });
        const env = config?.data?.env || {};

        // Determine effective CWD for the spawned process
        const effectiveCwd = context?.projectDir && fs.existsSync(context.projectDir)
          ? context.projectDir
          : configProjectDir; // Fallback to where config was loaded

        const rawArgs = command_args;

        const subprocess = spawn(commandName, [...preArgs, ...rawArgs], {
          cwd: effectiveCwd,
          stdio: 'inherit',
          shell: true,
          env: {
            ...process.env,
            ...env
          }
        });

        subprocess.on('close', (code) => {
          if (process.exitCode === undefined) process.exit(code);
        });
        subprocess.on('error', (err) => {
          if (err.code === 'ENOENT') {
            console.error(`Error: Command not found: '${commandName}'. Is it installed or in your PATH?`);
          } else {
            console.error(`Failed to start command '${commandName}':`, err);
          }
          if (process.exitCode === undefined) process.exit(1);
        });
      } catch (error) {
        console.error(`Error setting up context or running command for '${name}': ${error.message}`);
        if (process.exitCode === undefined) process.exit(1);
      }
    });
}

// Helper function for "run" command
function bindRunContextCommand(prog, { name, preArgs = [] }) {
  prog
    .command(name)
    .description('Run a command group defined in fnet.yaml.') // Updated filename
    .argument('<group>', 'Name of the command group in fnet.yaml commands section')
    .option('--ftag <tags...>', 'Filter tags for loading project config')
    .action(async (groupName, options) => {
      try {
        const context = await createContext(options);
        // Ensure project was loaded (might not be if running from outside a project dir without --id)
        if (!context || !context.project || !context.project.projectFileParsed) {
          throw new Error("Could not load project context. Are you in a fnet project directory?");
        }
        const { projectFileParsed } = context.project;
        const commands = projectFileParsed.commands;
        if (!commands) throw new Error('`commands` section not found in project file (fnet.yaml).');

        const group = commands[groupName];
        if (!group) throw new Error(`Command group '${groupName}' not found in project file.`);

        await fnetShellFlow({ commands: group });
        if (process.exitCode === undefined) process.exit(0);

      } catch (error) {
        console.error(`Error running command group '${groupName}':`, error.message);
        if (process.exitCode === undefined) process.exit(1);
      }
    });
}


// --- Bind dynamic/pass-through commands ---
// Note: Adjusted preArgs for simplicity with commander's argument handling
bindSimpleContextCommand(program, { bin: 'npm' });
bindSimpleContextCommand(program, { bin: 'node' });
bindSimpleContextCommand(program, { bin: 'bun' });
bindSimpleContextCommand(program, { name: "serve", bin: 'npm', preArgs: ['run', 'serve'] }); // Pass '--' manually if needed
bindSimpleContextCommand(program, { name: "watch", bin: 'npm', preArgs: ['run', 'watch'] });
bindSimpleContextCommand(program, { name: "app", bin: 'npm', preArgs: ['run', 'app'] });
bindSimpleContextCommand(program, { name: "cli", bin: 'npm', preArgs: ['run', 'cli'] });
bindSimpleContextCommand(program, { bin: 'npx' });
bindSimpleContextCommand(program, { bin: 'cdk' });
bindSimpleContextCommand(program, { bin: 'aws' });
bindWithContextCommand(program, { name: 'with' });
bindRunContextCommand(program, { name: 'run' });


// --- createContext Function (modified for workflow context) ---
async function createContext(options) { // Accepts commander's options object
  const tags = options.ftag || []; // Ensure tags is always an array

  if (options.id) {
    // Context for building based on an ID (likely remote/CI)
    return {
      id: options.id,
      buildId: options.buildId,
      mode: options.mode,
      protocol: options.protocol || "ac:", // options.protocol might not be defined
      projectDir: path.resolve(cwd, `./.output/${options.id}`),
      templateDir: path.resolve(nodeModulesDir, '@fnet/cli-project-flow/dist/template/default'),
      templateCommonDir: path.resolve(nodeModulesDir, '@fnet/cli-project-common/dist/template/default'),
      coreDir: path.resolve(nodeModulesDir, '@fnet/cli-project-flow/dist/template/core'), // Added coreDir
      tags: tags,
    };
  } else {
    // Context for running commands within a local project directory
    const project = await loadLocalProject({ tags: tags }); // Pass tags down

    return {
      buildId: options.buildId,
      mode: options.mode,
      protocol: options.protocol || "local:",
      templateDir: path.resolve(nodeModulesDir, '@fnet/cli-project-flow/dist/template/default'),
      templateCommonDir: path.resolve(nodeModulesDir, '@fnet/cli-project-common/dist/template/default'),
      coreDir: path.resolve(nodeModulesDir, '@fnet/cli-project-flow/dist/template/core'), // Added coreDir
      projectDir: path.resolve(project.projectDir, `./.workspace`), // Output/build dir within project
      projectSrcDir: path.resolve(project.projectDir, `./src`), // Source dir within project
      project, // Include the loaded project details (paths, parsed content, etc.)
      tags: tags,
    };
  }
}

// --- loadLocalProject Function (modified for workflow projects) ---
async function loadLocalProject({ tags = [] }) { // Default tags to empty array
  const projectFilePath = path.resolve(cwd, 'fnet.yaml'); // Workflow project file
  if (!fs.existsSync(projectFilePath)) throw new Error('fnet.yaml file not found in current directory.');

  const effectiveTags = Array.isArray(tags) ? tags : (tags ? [tags] : []);

  const { raw: projectFileContent, parsed: projectFileParsed } = await fnetYaml({ file: projectFilePath, tags: effectiveTags });
  const projectDir = path.dirname(projectFilePath);

  let flowsContent = {}; // Initialize as object

  // Check if flows are embedded or in a separate file
  if (typeof projectFileParsed.flows === 'object' && projectFileParsed.flows !== null) {
    // Flows are directly embedded in fnet.yaml
    flowsContent = projectFileParsed.flows;
  } else {
    // Flows are likely in a separate file (or missing)
    let defaultFlowsFile = 'flow.main.yaml'; // Original default

    // Check for newer standard location first
    const standardFlowsPath = path.join(projectDir, 'fnet', 'flows.yaml');
    if (fs.existsSync(standardFlowsPath)) {
      defaultFlowsFile = path.join('fnet', 'flows.yaml');
    }

    // Determine the main flow file name from project file or default
    const mainFileName = projectFileParsed.main || defaultFlowsFile;
    let projectMainFilePath = path.resolve(projectDir, mainFileName);

    if (!fs.existsSync(projectMainFilePath)) {
      // Only provide minimal structure if file specified in fnet.yaml doesn't exist
      if (projectFileParsed.main) {
        console.warn(`Warning: Main flow file specified in fnet.yaml (${mainFileName}) not found.`);
      }
      // Fallback to empty content if default doesn't exist either
      flowsContent = { main: { steps: [] } }; // Default empty structure
    }
    else {
      // Load from the determined flow file
      try {
        const { parsed: projectMainFileParsed } = await fnetYaml({ file: projectMainFilePath, tags: effectiveTags });
        flowsContent = projectMainFileParsed;
      } catch (yamlError) {
        console.error(`Error parsing flow file: ${projectMainFilePath}`);
        throw yamlError; // Re-throw error after logging context
      }

    }
  }


  // Construct the main result object
  const result = {
    // workflowAtom combines project config and flow content
    workflowAtom: {
      doc: {
        ...projectFileParsed, // Include all keys from fnet.yaml
        content: flowsContent   // Add the resolved flow content under 'content'
      }
    },
    projectDir,
    projectFilePath,
    projectFileContent, // Raw content of fnet.yaml
    projectFileParsed,  // Parsed content of fnet.yaml (without flows if external)
  };

  // Load devops file (targets.yaml, with migration from flow.devops.yaml)
  let devopsFilePath = path.resolve(projectDir, 'fnet/targets.yaml');
  const legacyDevopsPath = path.resolve(projectDir, 'flow.devops.yaml'); // Legacy path

  if (!fs.existsSync(devopsFilePath) && fs.existsSync(legacyDevopsPath)) {
    // Migrate legacy devops file
    console.log(`Migrating legacy devops file: ${legacyDevopsPath}`);
    try {
      const fnetDir = path.resolve(projectDir, 'fnet');
      if (!fs.existsSync(fnetDir)) fs.mkdirSync(fnetDir);
      fs.copyFileSync(legacyDevopsPath, devopsFilePath);
      fs.unlinkSync(legacyDevopsPath); // Delete legacy file after copy
      console.log(`Successfully migrated to ${devopsFilePath}`);
    } catch (migrationError) {
      console.error(`Error migrating devops file: ${migrationError.message}`);
      // Continue without devops info if migration fails
    }
  }

  // Load the devops file if it exists now
  if (fs.existsSync(devopsFilePath)) {
    try {
      const { raw: devopsFileContent, parsed: devopsFileParsed } = await fnetYaml({ file: devopsFilePath, tags: effectiveTags }); // Pass tags
      const yamlDocument = YAML.parseDocument(devopsFileContent); // For preserving comments/structure on save
      result.devops = {
        filePath: devopsFilePath,
        fileContent: devopsFileContent,
        yamlDocument,
        doc: { ...devopsFileParsed },
        type: "workflow.deploy", // Specific type for workflows
        save: async () => {
          // Save using the parsed document to preserve structure
          fs.writeFileSync(result.devops.filePath, yamlDocument.toString());
        }
      };
    } catch (devopsError) {
      console.error(`Error loading or parsing devops file: ${devopsFilePath}`);
      // Potentially throw error or just warn and continue without devops
      // throw devopsError; // Uncomment to make devops file parsing critical
    }

  }

  // Load readme file (same logic as before)
  const readmeFilePath = path.resolve(projectDir, 'readme.md');
  if (fs.existsSync(readmeFilePath)) {
    const readmeFileContent = fs.readFileSync(readmeFilePath, 'utf8');
    result.readme = {
      filePath: readmeFilePath,
      fileContent: readmeFileContent,
      doc: {
        content: readmeFileContent,
        "content-type": "markdown",
      },
      type: "wiki"
    };
  }

  return result;
}


// --- Parse Arguments ---
program.parse(process.argv);

// Add a fallback for when no command is provided
if (!process.argv.slice(2).length) {
  program.outputHelp();
}