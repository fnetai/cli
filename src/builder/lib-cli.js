const cwd = process.cwd();
const { spawn } = require('child_process');
const prompt = require('@fnet/prompt');
const which = require('./which');
const pkg = require('../../package.json');

// fnet env (Assuming this sets up environment variables based on redis config)
require('@fnet/config')({
  name: ["redis"],
  dir: cwd,
  optional: true
});

const path = require('path');
const { Command, Option } = require('commander'); // Import Commander
const fs = require('fs');
const YAML = require('yaml');
const fnetShellJs = require('@fnet/shelljs');
const os = require('os');

const fnetYaml = require('@fnet/yaml');
const fnetConfig = require('@fnet/config');
const fnetObjectFromSchema = require('@fnet/object-from-schema');
const fnetShellFlow = require('@fnet/shell-flow');

const fnetRender = require('@flownet/lib-render-templates-dir');
const Builder = require('./lib-builder');
const nodeModulesDir = require('./find-node-modules')({ baseDir: __dirname });
const pathSeparator = process.platform === 'win32' ? ';' : ':';
process.env.PATH = `${path.join(nodeModulesDir, '/.bin')}${pathSeparator}${process.env.PATH}`;

// --- Commander Setup ---
const program = new Command();

program
  .name('fnode') // Optional: Set the name for help messages
  .version(pkg.version) // Set the version from package.json
  .description('CLI tool for FlowNet node projects');

// --- Create Command ---
program
  .command('create')
  .description('Create flow node project')
  .requiredOption('-n, --name <string>', 'Project name') // Required option
  .addOption(new Option('-r, --runtime <type>', 'Runtime environment').choices(['node', 'python']).default('node')) // Option with choices and default
  .option('--vscode', 'Open project in VSCode after creation', true) // Boolean option, default true
  .option('--no-vscode', 'Do not open project in VSCode') // Commander automatically creates the negation
  .action(async (options) => { // Handler receives options object
    try {
      const templateDir = path.resolve(nodeModulesDir, '@fnet/cli-project-node/dist/template/project');
      const outDir = path.resolve(cwd, options.name); // Access options via options object
      if (!fs.existsSync(outDir)) fs.mkdirSync(outDir);

      await fnetRender({
        dir: templateDir,
        outDir,
        context: {
          name: options.name,
          runtime: options.runtime,
          platform: os.platform(),
        },
        copyUnmatchedAlso: true
      });

      let shellResult = await fnetShellJs(`fnode build`, { cwd: outDir });
      if (shellResult.code !== 0) throw new Error('Failed to build project.');

      if (which('git')) {
        shellResult = await fnetShellJs(`git init --initial-branch=main`, { cwd: outDir });
        if (shellResult.code !== 0) throw new Error('Failed to initialize git.');
      }

      // Check the boolean flag correctly
      if (options.vscode && which('code')) {
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
  .description('Flow node project operations')
  .option('-u, --update', 'Update project files from template', false) // Boolean option, default false
  .action(async (options) => {
    try {
      const templateDir = path.resolve(nodeModulesDir, '@fnet/cli-project-node/dist/template/project');
      const outDir = process.cwd();

      // Pass options to createContext
      const context = await createContext(options);

      if (options.update) {
        await fnetRender({
          dir: templateDir,
          outDir,
          context: {
            name: context.project.projectFileParsed.name,
            runtime: context.project.runtime.type,
            platform: os.platform(),
          },
          copyUnmatchedAlso: true
        });

        let shellResult = await fnetShellJs(`fnode build`, { cwd: outDir });
        if (shellResult.code !== 0) throw new Error('Failed to build project.');

        console.log('Updating project succeeded!');
      } else {
        console.log("Use 'fnode project --update' to update project files."); // Inform user if no action taken
      }


      process.exit(0);
    } catch (error) {
      console.error('Project command failed.', error.message);
      process.exit(1);
    }
  });

// --- Build Command ---
program
  .command('build')
  .description('Build flow node project')
  .option('--id <string>', 'Build identifier')
  .option('--buildId <string>', 'Specific build ID (alias: bid)') // Alias needs manual handling if desired, or just use long form
  .addOption(new Option('--mode <mode>', 'Build mode').choices(['all', 'file', 'build', 'deploy', 'bpmn']).default('build'))
  .option('--ftag <tags...>', 'Filter tags (specify multiple times or space-separated)') // Array option
  .action(async (options) => {
    try {
      // Pass options to createContext
      const context = await createContext(options);
      const builder = new Builder(context);
      await builder.init();
      await builder.build();

      console.log('Building library succeeded!');
      process.exit(0);
    } catch (error) {
      console.error('Building library failed!', error.message);
      process.exit(1);
    }
  });


// --- Deploy Command ---
program
  .command('deploy')
  .description('Build and deploy flow node project')
  .option('--id <string>', 'Build identifier')
  .option('--buildId <string>', 'Specific build ID')
  .option('--ftag <tags...>', 'Filter tags')
  .action(async (options) => {
    try {
      // Pass options to createContext, overriding mode
      const context = await createContext({ ...options, mode: "all" });
      const builder = new Builder(context);
      await builder.init();
      await builder.build();

      console.log('Building and deploying library succeeded!'); // Message updated
      process.exit(0);
    } catch (error) {
      console.error('Building/deploying library failed!', error.message);
      process.exit(1);
    }
  });


// --- File Command ---
program
  .command('file')
  .description('Just create files (part of build process)')
  .option('--id <string>', 'Build identifier')
  .option('--buildId <string>', 'Specific build ID')
  .option('--ftag <tags...>', 'Filter tags')
  .action(async (options) => {
    try {
      // Pass options to createContext, overriding mode
      const context = await createContext({ ...options, mode: "file" });
      const builder = new Builder(context);
      await builder.init();
      await builder.build();

      console.log('Creating files succeeded!'); // Message updated
      process.exit(0);
    } catch (error) {
      console.error('Creating files failed!', error.message);
      process.exit(1);
    }
  });


// --- Input Command ---
program
  .command('input')
  .description('Create or modify an input config file')
  .argument('[name]', 'Optional input configuration name (e.g., dev, prod)') // Positional argument
  .action(async (name, options) => { // Handler receives positional args first, then options
    try {
      // Pass options and name to createContext
      const context = await createContext({ ...options, name }); // Include name if needed by createContext
      const { project } = context;
      const { projectDir, projectFileParsed } = project;
      const schema = projectFileParsed.input;
      if (!schema) throw new Error('Config schema not found in project file.');

      let configName = name; // Use the positional argument
      if (!configName) {
        const answers = await prompt({ type: 'input', name: 'inputName', message: 'Input name:', initial: 'dev' });
        configName = answers.inputName;
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


// --- Helper function to find command arguments ---
// Finds the arguments intended for the subcommand
function getSubCommandArgs(subCommandName) {
  const commandIndex = process.argv.findIndex(arg => arg === subCommandName);
  if (commandIndex === -1) {
    // Fallback if the subcommand name isn't directly in argv (e.g., aliased)
    // This might happen with complex commander setups, but less likely here.
    // For the simple cases, this fallback tries slicing after the main command name index (usually 2)
    const mainCommandIndex = process.argv.findIndex(arg => program.commands.some(cmd => cmd.name() === arg || cmd.aliases().includes(arg)));
    return process.argv.slice(mainCommandIndex + 1); // Slice after the fnode command name
  }
  return process.argv.slice(commandIndex + 1); // Slice after the subcommand name
}

// --- Helper function for simple pass-through commands ---
function bindSimpleContextCommand(prog, { name, bin, preArgs = [] }) {
  const cmdName = name || bin;
  prog
    .command(cmdName, { isDefault: false, hidden: false }) // Explicitly define command
    .description(`Run ${bin} ${preArgs.join(' ')} in project context. Pass arguments after '--'.`)
    .argument('[command_args...]', `Arguments for ${bin}`) // Capture arguments
    .allowUnknownOption() // Allow options meant for the sub-process
    .action(async (command_args, options) => {
      try {
        // Pass command's own options (if any were defined) to createContext
        const context = await createContext(options);
        const { projectDir } = context;

        // Use the captured arguments
        const rawArgs = command_args;

        // Ensure bin exists? (Optional, spawn will fail anyway)
        // const binPath = which(bin);
        // if (!binPath) throw new Error(`Command not found: ${bin}`);

        const subprocess = spawn(bin, [...preArgs, ...rawArgs], {
          cwd: projectDir,
          stdio: 'inherit',
          shell: true // Keep shell true for convenience, though direct execution is safer
        });

        subprocess.on('close', (code) => {
          process.exit(code);
        });
        subprocess.on('error', (err) => {
          console.error(`Failed to start ${bin}:`, err);
          process.exit(1);
        });

      } catch (error) {
        console.error(error.message);
        process.exit(1);
      }
    });
}


// --- Helper function for conda pass-through commands ---
function bindCondaContextCommand(prog, { name, bin, preArgs = [] }) {
  const cmdName = name || bin;
  prog
    .command(cmdName, { isDefault: false, hidden: false })
    .description(`Run ${bin} ${preArgs.join(' ')} using project's conda env. Pass arguments after '--'.`)
    .argument('[command_args...]', `Arguments for ${bin}`)
    .allowUnknownOption()
    .action(async (command_args, options) => {
      try {
        const context = await createContext(options);
        const { projectDir } = context;

        const binPath = path.join(projectDir, '.conda', 'bin', bin || name);
        // Basic check if conda env seems present
        if (!fs.existsSync(path.dirname(binPath))) {
          throw new Error(`Conda environment not found in ${path.join(projectDir, '.conda')}. Did you initialize it?`);
        }
        if (!fs.existsSync(binPath)) {
          throw new Error(`Command '${bin || name}' not found in conda environment: ${binPath}`);
        }


        const rawArgs = command_args; // Use captured args

        const subprocess = spawn(binPath, [...preArgs, ...rawArgs], {
          cwd: projectDir,
          stdio: 'inherit',
          shell: false, // Safer to run specific binary directly
          env: {
            ...process.env, // Inherit current env
            "PYTHONPATH": projectDir // Add projectDir to PYTHONPATH
          }
        });

        subprocess.on('close', (code) => {
          process.exit(code);
        });
        subprocess.on('error', (err) => {
          console.error(`Failed to start ${binPath}:`, err);
          process.exit(1);
        });

      } catch (error) {
        console.error(error.message);
        process.exit(1);
      }
    });
}


// --- Helper function for "with" command ---
function bindWithContextCommand(prog, { name, preArgs = [] }) { // Added prog parameter
  prog
    .command(name)
    .description('Run a command with environment variables from a .fnet config file.')
    .argument('<config>', 'Name of the .fnet config file (without extension)')
    .argument('<command>', 'The command to execute')
    .argument('[command_args...]', 'Arguments for the command')
    .option('--ftag <tags...>', 'Filter tags for loading config') // Added ftag option for context creation
    .allowUnknownOption() // Allow options intended for the sub-process
    .action(async (configName, commandName, command_args, options) => { // Arguments come first
      try {
        // Pass the 'with' command's own options to createContext
        const context = await createContext(options);
        const { projectDir } = context;

        // Load the specified .fnet config
        const config = await fnetConfig({
          name: configName,
          dir: projectDir,
          transferEnv: false, // Keep false as per original
          optional: true,     // Keep true as per original
          tags: context.tags  // Pass tags from context
        });
        const env = config?.data?.env || {}; // Default to empty object if not found

        const rawArgs = command_args; // Use captured args

        const subprocess = spawn(commandName, [...preArgs, ...rawArgs], {
          cwd: fs.existsSync(projectDir) ? projectDir : cwd, // Original logic for cwd
          stdio: 'inherit',
          shell: true, // Keep shell: true
          env: {
            ...process.env, // Inherit current env
            ...env          // Override with config env
          }
        });

        subprocess.on('close', (code) => {
          process.exit(code);
        });
        subprocess.on('error', (err) => {
          // Provide more context on error
          if (err.code === 'ENOENT') {
            console.error(`Error: Command not found: '${commandName}'. Is it installed or in your PATH?`);
          } else {
            console.error(`Failed to start command '${commandName}':`, err);
          }
          process.exit(1);
        });
      } catch (error) {
        console.error(error.message);
        process.exit(1);
      }
    });
}

// --- Helper function for "run" command ---
function bindRunContextCommand(prog, { name, preArgs = [] }) { // Added prog parameter
  prog
    .command(name)
    .description('Run a command group defined in node.yaml.')
    .argument('<group>', 'Name of the command group in node.yaml commands section')
    // .argument('[command_options...]', 'Options passed to the commands (not implemented in original)')
    .option('--ftag <tags...>', 'Filter tags for loading project config')
    // .allowUnknownOption() // Not needed unless passing through options
    .action(async (groupName, options) => { // Capture positional arg 'group' as groupName
      try {
        // Pass the 'run' command's own options to createContext
        const context = await createContext(options);
        const { project } = context;
        const { projectFileParsed } = project;
        const commands = projectFileParsed.commands;
        if (!commands) throw new Error('`commands` section not found in project file (node.yaml).');

        const group = commands[groupName]; // Use the captured groupName
        if (!group) throw new Error(`Command group '${groupName}' not found in project file.`);

        // Execute the command flow
        await fnetShellFlow({ commands: group });
        // Success is implicit if fnetShellFlow doesn't throw
        process.exit(0);

      } catch (error) {
        // fnetShellFlow might throw errors, catch them here
        console.error(`Error running command group '${groupName}':`, error.message);
        process.exit(1);
      }
    });
}

// --- Bind dynamic/pass-through commands ---
bindSimpleContextCommand(program, { bin: 'npm' });
bindSimpleContextCommand(program, { bin: 'node' });
bindSimpleContextCommand(program, { bin: 'bun' });
bindSimpleContextCommand(program, { name: "serve", bin: 'npm', preArgs: ['run', 'serve'] }); // simplified preArgs for commander handling
bindSimpleContextCommand(program, { name: "watch", bin: 'npm', preArgs: ['run', 'watch'] });
bindSimpleContextCommand(program, { name: "app", bin: 'npm', preArgs: ['run', 'app'] });
bindSimpleContextCommand(program, { name: "cli", bin: 'npm', preArgs: ['run', 'cli'] });
bindSimpleContextCommand(program, { bin: 'npx' });
bindSimpleContextCommand(program, { bin: 'cdk' });
bindSimpleContextCommand(program, { bin: 'aws' });
bindWithContextCommand(program, { name: 'with' }); // Pass program instance
bindRunContextCommand(program, { name: 'run' });   // Pass program instance
bindCondaContextCommand(program, { name: 'python' });
bindCondaContextCommand(program, { name: 'python3' });
bindCondaContextCommand(program, { name: 'pip' });
bindCondaContextCommand(program, { name: 'pip3' });


// --- createContext Function (modified to accept commander options) ---
async function createContext(options) { // Accepts commander's options object
  // Check for options specific to build/deploy/file commands
  if (options.id) {
    return {
      id: options.id,
      buildId: options.buildId, // Use options.buildId
      mode: options.mode,
      protocol: options.protocol || "ac:", // options.protocol might not be defined, handle default
      templateDir: path.resolve(nodeModulesDir, './@fnet/cli-project-node/dist/template/default'),
      templateCommonDir: path.resolve(nodeModulesDir, './@fnet/cli-project-common/dist/template/default'),
      projectDir: path.resolve(cwd, `./.output/${options.id}`),
      tags: options.ftag || [], // Default to empty array if undefined
    };
  } else {
    // Load project based on CWD, pass tags from options
    const project = await loadLocalProject({ tags: options.ftag || [] });
    return {
      buildId: options.buildId,
      mode: options.mode,
      protocol: options.protocol || "local:",
      templateDir: path.resolve(nodeModulesDir, `./@fnet/cli-project-node/dist/template/${project.runtime.template}`),
      templateCommonDir: path.resolve(nodeModulesDir, `./@fnet/cli-project-common/dist/template/${project.runtime.template}`),
      projectDir: path.resolve(project.projectDir, `./.workspace`),
      projectSrcDir: path.resolve(project.projectDir, `./src`),
      project,
      tags: options.ftag || [], // Ensure tags is always an array
    };
  }
}

// --- loadLocalProject Function (Unchanged, but ensure tags are handled) ---
async function loadLocalProject({ tags = [] }) { // Default tags to empty array
  const projectFilePath = path.resolve(cwd, 'node.yaml');
  if (!fs.existsSync(projectFilePath)) throw new Error('node.yaml file not found in current directory.');

  // Ensure tags is an array before passing to fnetYaml
  const effectiveTags = Array.isArray(tags) ? tags : (tags ? [tags] : []);

  const { raw, parsed: projectFileParsed } = await fnetYaml({ file: projectFilePath, tags: effectiveTags });
  const projectDir = path.dirname(projectFilePath);

  projectFileParsed.features = projectFileParsed.features || {};

  const features = projectFileParsed.features;
  features.runtime = features.runtime || {};
  features.runtime.type = features.runtime.type || "node";

  if (features.runtime.type === "python") features.runtime.template = features.runtime.template || "python";
  else features.runtime.template = features.runtime.template || "default";

  const libraryAtom = {
    doc: {
      ...projectFileParsed,
    },
    fileName: "index"
  };

  const result = {
    libraryAtom,
    projectDir,
    projectFilePath,
    projectFileContent: raw,
    projectFileParsed,
    runtime: features.runtime
  };

  // Load devops file (logic remains the same)
  let devopsFilePath = path.resolve(projectDir, 'fnet/targets.yaml');
  if (!fs.existsSync(devopsFilePath)) {
    // migrate legacy devops file
    devopsFilePath = path.resolve(projectDir, 'node.devops.yaml');
    if (fs.existsSync(devopsFilePath)) {
      const fnetDir = path.resolve(projectDir, 'fnet');
      if (!fs.existsSync(fnetDir)) fs.mkdirSync(fnetDir);
      const targetPath = path.resolve(projectDir, 'fnet/targets.yaml');
      fs.copyFileSync(devopsFilePath, targetPath);
      // delete legacy devops file
      try {
        fs.unlinkSync(devopsFilePath);
        console.log(`Migrated legacy devops file: ${devopsFilePath} to ${targetPath}`);
      } catch (err) {
        console.warn(`Could not delete legacy devops file ${devopsFilePath}: ${err.message}`)
      }

    }
  }

  if (fs.existsSync(devopsFilePath)) {
    const { raw: devopsFileContent, parsed: devopsFileParsed } = await fnetYaml({ file: devopsFilePath, tags: effectiveTags }); // Pass tags here too
    const yamlDocument = YAML.parseDocument(devopsFileContent);

    result.devops = {
      filePath: devopsFilePath,
      fileContent: devopsFileContent,
      yamlDocument,
      doc: {
        ...devopsFileParsed,
      },
      type: "library.deploy",
      save: async () => {
        // Ensure doc is up-to-date before saving
        // This assumes mutations happen on yamlDocument, which is good practice
        fs.writeFileSync(result.devops.filePath, yamlDocument.toString());
        // fs.writeFileSync(result.devops.filePath, YAML.stringify(result.devops.doc)); // Stringifying doc might lose comments/formatting
      }
    };
  }

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
// This replaces the final .argv call in yargs
program.parse(process.argv);

// Add a fallback for when no command is provided
if (!process.argv.slice(2).length) {
  program.outputHelp();
}