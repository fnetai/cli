// #!/usr/bin/env node
const cwd = process.cwd();
const { spawn } = require('child_process');

// fnet env
require('@fnet/config')({
  name: ["redis"],
  dir: cwd,
  optional: true
});

const path = require('path');
const yargs = require('yargs/yargs');
const { hideBin } = require('yargs/helpers');
const fs = require('fs');
const YAML = require('yaml');
const shell = require('shelljs');

const fnetYaml = require('@fnet/yaml');
const fnetConfig = require('@fnet/config');
const fnetObjectFromSchema = require('@fnet/object-from-schema');

const flownetRenderTemplatesDir = require('@flownet/lib-render-templates-dir');
const Builder = require('./lib-builder');
const nodeModulesDir = require('./find-node-modules')({ baseDir: __dirname });
const pathSeparator = process.platform === 'win32' ? ';' : ':';
process.env.PATH = `${path.join(nodeModulesDir, '/.bin')}${pathSeparator}${process.env.PATH}`;

//console.log(`${path.join(nodeModulesDir,'/.bin')}`);

let cmdBuilder = yargs(hideBin(process.argv))
  .command('create', 'Create flow node project', (yargs) => {
    return yargs
      .option('name', { type: 'Project name', demandOption: true })
      .option('vscode', { type: 'boolean', default: true, alias: 'vs' });
  }, async (argv) => {
    try {
      const templateDir = path.resolve(nodeModulesDir, '@fnet/cli-project-node/dist/template/project');
      const outDir = path.resolve(cwd, argv.name);
      if (!fs.existsSync(outDir)) fs.mkdirSync(outDir);

      await flownetRenderTemplatesDir({
        dir: templateDir,
        outDir,
        context: argv,
        copyUnmatchedAlso: true
      });

      let shellResult = shell.exec(`fnode build`, { cwd: outDir });
      if (shellResult.code !== 0) throw new Error('Failed to build project.');


      if (shell.which('git')) {
        shellResult = shell.exec(`git init --initial-branch=main`, { cwd: outDir });
        if (shellResult.code !== 0) throw new Error('Failed to initialize git.');
      }

      if (shell.which('code') && argv.vscode) {
        shellResult = shell.exec(`cd ${outDir} && code .`);
        if (shellResult.code !== 0) throw new Error('Failed to open vscode.');
      }

      console.log('Creating project succeeded!');

      process.exit(0);
    } catch (error) {
      console.error('Initialization failed!', error.message);
      process.exit(1);
    }
  })
  .command('project', 'Flow node project', (yargs) => {
    return yargs
      .option('update', { type: 'boolean', default: false, alias: '-u' });
  }, async (argv) => {
    try {
      const templateDir = path.resolve(nodeModulesDir, '@fnet/cli-project-node/dist/template/project');
      const outDir = process.cwd();
      argv.name = path.basename(outDir);

      if (argv.update) {
        await flownetRenderTemplatesDir({
          dir: templateDir,
          outDir,
          context: argv,
          copyUnmatchedAlso: true
        });

        let shellResult = shell.exec(`fnode build`, { cwd: outDir });
        if (shellResult.code !== 0) throw new Error('Failed to build project.');

        console.log('Updating project succeeded!');
      }

      process.exit(0);
    } catch (error) {
      console.error('Project failed.', error.message);
      process.exit(1);
    }
  })
  .command('build', 'Build flow node project', (yargs) => {
    return yargs
      .option('id', { type: 'string' })
      .option('buildId', { type: 'string', alias: 'bid' })
      .option('mode', { type: 'string', alias: 'm', default: "build", choices: ['all', 'file', 'build', 'deploy', 'bpmn'] })
      .option('target', { type: 'string', alias: 't' })
      ;
  }, async (argv) => {
    try {
      const context = await createContext(argv);
      const builder = new Builder(context);
      await builder.init();
      await builder.build();

      console.log('Building library succeeded!');
      process.exit(0);
    } catch (error) {
      console.error('Building library failed!', error.message);
      process.exit(1);
    }
  })
  .command('deploy', 'Build and deploy flow node project', (yargs) => {
    return yargs
      .option('id', { type: 'string' })
      .option('buildId', { type: 'string', alias: 'bid' })
      .option('target', { type: 'string', alias: 't' })
      ;
  }, async (argv) => {
    try {
      const context = await createContext({ ...argv, mode: "all" });
      const builder = new Builder(context);
      await builder.init();
      await builder.build();

      console.log('Building library succeeded!');
      process.exit(0);
    } catch (error) {
      console.error('Building library failed!', error.message);
      process.exit(1);
    }
  })
  .command('file', 'Just create files', (yargs) => {
    return yargs
      .option('id', { type: 'string' })
      .option('buildId', { type: 'string', alias: 'bid' })
      .option('target', { type: 'string', alias: 't' })
      ;
  }, async (argv) => {
    try {
      const context = await createContext({ ...argv, mode: "file" });
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
cmdBuilder = bindConfigCreateCommand(cmdBuilder);

cmdBuilder = bindSimpleContextCommand(cmdBuilder, { bin: 'npm' });
cmdBuilder = bindSimpleContextCommand(cmdBuilder, { bin: 'node' });
cmdBuilder = bindSimpleContextCommand(cmdBuilder, { name: "serve", bin: 'npm', preArgs: ['run', 'serve', '--'] });
cmdBuilder = bindSimpleContextCommand(cmdBuilder, { name: "watch", bin: 'npm', preArgs: ['run', 'watch', '--'] });
cmdBuilder = bindSimpleContextCommand(cmdBuilder, { name: "app", bin: 'npm', preArgs: ['run', 'app', '--'] });
cmdBuilder = bindSimpleContextCommand(cmdBuilder, { name: "cli", bin: 'npm', preArgs: ['run', 'cli', '--'] });
cmdBuilder = bindSimpleContextCommand(cmdBuilder, { bin: 'npx' });
cmdBuilder = bindSimpleContextCommand(cmdBuilder, { bin: 'cdk' });
cmdBuilder = bindSimpleContextCommand(cmdBuilder, { bin: 'aws' });
cmdBuilder = bindWithContextCommand(cmdBuilder, { name: 'with' });

cmdBuilder
  .demandCommand(1, 'You need at least one command before moving on')
  .help()
  .argv;

function bindSimpleContextCommand(builder, { name, bin, preArgs = [] }) {
  return builder.command(
    `${name || bin} [commands..]`, `${bin} ${preArgs.join(' ')}`,
    (yargs) => {
      return yargs
        .help(false)
        .version(false);
    },
    async (argv) => {
      try {
        const context = await createContext(argv);
        const { projectDir } = context;

        const rawArgs = process.argv.slice(3);

        const subprocess = spawn(bin, [...preArgs, ...rawArgs], {
          cwd: projectDir,
          stdio: 'inherit',
          shell: true
        });

        subprocess.on('close', (code) => {
          process.exit(code);
        });

      } catch (error) {
        console.error(error.message);
        process.exit(1);
      }
    }
  );
}

function bindWithContextCommand(builder, { name, preArgs = [] }) {
  return builder.command(
    `${name} <config> <command> [options..]`, `Run a command with a config context`,
    (yargs) => {
      return yargs
        .positional('config', { type: 'string' })
        .positional('command', { type: 'string' })
        .help(false)
        .version(false);
    },
    async (argv) => {
      try {
        const context = await createContext(argv);
        const { projectDir } = context;

        // config name
        const configName = argv.config;
        const config = await fnetConfig({ name: configName, dir: projectDir, transferEnv: false, optional: true });
        const env = config?.data?.env || undefined;

        // command name
        const commandName = argv.command;

        const rawArgs = process.argv.slice(5);

        const subprocess = spawn(commandName, [...preArgs, ...rawArgs], {
          cwd: projectDir,
          stdio: 'inherit',
          shell: true,
          env: {
            ...process.env,
            ...env
          }
        });

        subprocess.on('close', (code) => {
          process.exit(code);
        });
      } catch (error) {
        console.error(error.message);
        process.exit(1);
      }
    }
  );
}

function bindConfigCreateCommand(builder) {
  return builder.command(
    `config create <name>`, `Create a config file`,
    (yargs) => {
      return yargs
        .positional('name', { type: 'string' })
        .help(false)
        .version(false);
    },
    async (argv) => {
      try {
        const context = await createContext(argv);
        const { project } = context;
        const { projectDir, projectFileParsed } = project;
        const schema = projectFileParsed.config;
        if (!schema) throw new Error('Config schema not found in project file.');

        const result = await fnetObjectFromSchema({ schema });
        const dotFnetDir = path.resolve(projectDir, '.fnet');
        if (!fs.existsSync(dotFnetDir)) fs.mkdirSync(dotFnetDir);
        const configFilePath = path.resolve(dotFnetDir, `${argv.name}.fnet`);
        fs.writeFileSync(configFilePath, YAML.stringify(result));
      } catch (error) {
        console.error(error.message);
        process.exit(1);
      }
    }
  );
}

async function createContext(argv) {
  if (argv.id) {
    return {
      id: argv.id,
      buildId: argv.buildId,
      mode: argv.mode,
      protocol: argv.protocol || "ac:",
      templateDir: path.resolve(nodeModulesDir, './@fnet/cli-project-node/dist/template/default'),
      templateCommonDir: path.resolve(nodeModulesDir, './@fnet/cli-project-common/dist/template/default'),
      projectDir: path.resolve(cwd, `./.output/${argv.id}`),
      target: argv.target,
    };
  } else {
    const project = await loadLocalProject();
    return {
      buildId: argv.buildId,
      mode: argv.mode,
      protocol: argv.protocol || "local:",
      templateDir: path.resolve(nodeModulesDir, './@fnet/cli-project-node/dist/template/default'),
      templateCommonDir: path.resolve(nodeModulesDir, './@fnet/cli-project-common/dist/template/default'),
      projectDir: path.resolve(project.projectDir, `./.workspace`),
      projectSrcDir: path.resolve(project.projectDir, `./src`),
      project,
      target: argv.target,
    };
  }
}

async function loadLocalProject() {
  const projectFilePath = path.resolve(cwd, 'node.yaml');
  if (!fs.existsSync(projectFilePath)) throw new Error('node.yaml file not found in current directory.');

  const projectFileContent = fs.readFileSync(projectFilePath, 'utf8');
  // const projectFileParsed = YAML.parse(projectFileContent);
  const { parsed: projectFileParsed } = await fnetYaml({ content: projectFileContent });
  const projectDir = path.dirname(projectFilePath);

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
    projectFileContent,
    projectFileParsed
  };

  // Load devops file
  const devopsFilePath = path.resolve(projectDir, 'node.devops.yaml');
  if (fs.existsSync(devopsFilePath)) {
    const devopsFileContent = fs.readFileSync(devopsFilePath, 'utf8');
    const devopsFileParsed = YAML.parse(devopsFileContent);
    result.devops = {
      filePath: devopsFilePath,
      fileContent: devopsFileContent,
      doc: {
        ...devopsFileParsed,
      },
      type: "library.deploy",
      save: async () => {
        fs.writeFileSync(result.devops.filePath, YAML.stringify(result.devops.doc));
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