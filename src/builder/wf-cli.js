import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawn } from 'node:child_process';
import os from 'node:os';
import fs from 'node:fs';

import YAML from 'yaml';
import yargs from 'yargs';

import fnetPrompt from '@fnet/prompt';
import fnetShellJs from '@fnet/shelljs';
import fnetYaml from '@fnet/yaml';
import fnetConfig from '@fnet/config';
import fnetShellFlow from '@fnet/shell-flow';
import fnetRender from '@flownet/lib-render-templates-dir';

import findNodeModules from './find-node-modules.js';
import which from './which.js';

import Builder from './wf-builder.js';

// import pkg from '../../package.json' with { type: 'json' };

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const cwd = process.cwd();

// fnet env (Assuming this sets up environment variables based on redis config)
fnetConfig({
  name: ["redis"],
  dir: cwd,
  optional: true
});

const nodeModulesDir = findNodeModules({ baseDir: __dirname });
const pathSeparator = process.platform === 'win32' ? ';' : ':';

if (nodeModulesDir)
  process.env.PATH = `${path.join(nodeModulesDir, '/.bin')}${pathSeparator}${process.env.PATH}`;

let cmdBuilder = yargs(process.argv.slice(2))
  .command('create', 'Initialize flow node project', (yargs) => {
    return yargs
      .option('name', { type: 'string' })
      .option('vscode', { type: 'boolean', default: true, alias: 'vs' })
      .option('runtime', { type: 'string', default: 'node', choices: ['node'] });
    ;
  }, async (argv) => {
    try {
      const templateDir = path.resolve(nodeModulesDir, './@fnet/cli-project-flow/dist/template/project');
      const outDir = path.resolve(cwd, argv.name);
      if (!fs.existsSync(outDir)) fs.mkdirSync(outDir);

      await fnetRender({
        dir: templateDir,
        outDir,
        context: argv,
        copyUnmatchedAlso: true,
        platform: os.platform()
      });

      let shellResult = await fnetShellJs(`fnet build`, { cwd: outDir });
      if (shellResult.code !== 0) throw new Error('Failed to build project.');

      if (which('git')) {
        shellResult = await fnetShellJs(`git init --initial-branch=main`, { cwd: outDir });
        if (shellResult.code !== 0) throw new Error('Failed to initialize git.');
      }

      if (which('code') && argv.vscode) {
        shellResult = await fnetShellJs(`cd ${outDir} && code .`);
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
      const templateDir = path.resolve(nodeModulesDir, '@fnet/cli-project-flow/dist/template/project');
      const outDir = process.cwd();

      const context = await createContext(argv);

      if (argv.update) {
        await fnetRender({
          dir: templateDir,
          outDir,
          context: {
            name: context.project.projectFileParsed.name,
            runtime: 'node'
          },
          copyUnmatchedAlso: true,
          platform: os.platform()
        });

        let shellResult = await fnetShellJs(`fnet build`, { cwd: outDir });
        if (shellResult.code !== 0) throw new Error('Failed to build project.');

        console.log('Updating project succeeded!');
      }
      process.exit(0);
    } catch (error) {
      console.error('Project failed.', error.message);
      process.exit(1);
    }
  })
  .command('build', 'Build flownet project', (yargs) => {
    return yargs
      .option('id', { type: 'string' })
      .option('buildId', { type: 'string', alias: 'bid' })
      .option('mode', { type: 'string', default: "build", choices: ['all', 'file', 'build', 'deploy', 'bpmn'] })
      .option('ftag', { type: 'array' })
      ;
  }, async (argv) => {
    try {
      const context = await createContext(argv);
      const builder = new Builder(context);
      await builder.init();
      await builder.build();

      console.log('Building workflow succeeded!');

      process.exit(0);
    } catch (error) {
      console.error('Building workflow failed!', error.message);
      process.exit(1);
    }
  })
  .command('deploy', 'Build and deploy flownet project', (yargs) => {
    return yargs
      .option('id', { type: 'string' })
      .option('buildId', { type: 'string', alias: 'bid' })
      .option('ftag', { type: 'array' })
      ;
  }, async (argv) => {
    try {
      const context = await createContext({ ...argv, mode: "all" });
      const builder = new Builder(context);
      await builder.init();
      await builder.build();
      console.log('Building workflow succeeded!');
      process.exit(0);
    } catch (error) {
      console.error('Building workflow failed!', error.message);
      process.exit(1);
    }
  })
  .command('file', 'Just create files', (yargs) => {
    return yargs
      .option('id', { type: 'string' })
      .option('buildId', { type: 'string', alias: 'bid' })
      .option('ftag', { type: 'array' })
      ;
  }, async (argv) => {
    try {
      const context = await createContext({ ...argv, mode: "file" });
      const builder = new Builder(context);
      await builder.init();
      await builder.build();
      console.log('Building workflow succeeded!');
      process.exit(0);
    } catch (error) {
      console.error('Building workflow failed!', error.message);
      process.exit(1);
    }
  });

cmdBuilder = bindInputCommand(cmdBuilder);

cmdBuilder = bindSimpleContextCommand(cmdBuilder, { bin: 'npm' });
cmdBuilder = bindSimpleContextCommand(cmdBuilder, { bin: 'node' });
cmdBuilder = bindSimpleContextCommand(cmdBuilder, { bin: 'bun' });
cmdBuilder = bindSimpleContextCommand(cmdBuilder, { name: "serve", bin: 'npm', preArgs: ['run', 'serve', '--'] });
cmdBuilder = bindSimpleContextCommand(cmdBuilder, { name: "watch", bin: 'npm', preArgs: ['run', 'watch', '--'] });
cmdBuilder = bindSimpleContextCommand(cmdBuilder, { name: "app", bin: 'npm', preArgs: ['run', 'app', '--'] });
cmdBuilder = bindSimpleContextCommand(cmdBuilder, { name: "cli", bin: 'npm', preArgs: ['run', 'cli', '--'] });
cmdBuilder = bindSimpleContextCommand(cmdBuilder, { bin: 'npx' });
cmdBuilder = bindSimpleContextCommand(cmdBuilder, { bin: 'cdk' });
cmdBuilder = bindSimpleContextCommand(cmdBuilder, { bin: 'aws' });
cmdBuilder = bindWithContextCommand(cmdBuilder, { name: 'with' });
cmdBuilder = bindRunContextCommand(cmdBuilder, { name: 'run' });

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

        const escapeArg = (arg) => {
          if (!arg.includes(' ')) return arg;

          if (process.platform === 'win32') {
            return `"${arg.replace(/(["^])/g, '^$1')}"`;
          } else {
            return `"${arg.replace(/(["\\$`])/g, '\\$1')}"`;
          }
        };

        const rawArgs = process.argv.slice(3).map(escapeArg);

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
        const config = await fnetConfig({ name: configName, dir: projectDir, transferEnv: false, optional: true, tags: context.tags });
        const env = config?.data?.env || undefined;

        // command name
        const commandName = argv.command;

        const rawArgs = process.argv.slice(5);

        const subprocess = spawn(commandName, [...preArgs, ...rawArgs], {
          cwd: fs.existsSync(projectDir) ? projectDir : cwd,
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

function bindRunContextCommand(builder, { name, preArgs = [] }) {
  return builder.command(
    `${name} group [options..]`, `Run a command group.`,
    (yargs) => {
      return yargs
        .positional('group', { type: 'string' })
        .option('ftag', { type: 'array' })
        .help(false)
        .version(false);
    },
    async (argv) => {
      try {
        const context = await createContext(argv);
        const { project } = context;
        const { projectFileParsed } = project;
        const commands = projectFileParsed.commands;
        if (!commands) throw new Error('Commands not found in project file.');

        const group = commands[argv.group];
        if (!group) throw new Error(`Command group '${argv.group}' not found in project file.`);

        await fnetShellFlow({ commands: group });
      } catch (error) {
        console.error(error.message);
        process.exit(1);
      }
    }
  );
}

function bindInputCommand(builder) {
  return builder.command(
    `input [name]`, `Create or modify an input config file`,
    (yargs) => {
      return yargs
        .positional('name', { type: 'string', demandOption: false })
        .help(false)
        .version(false);
    },
    async (argv) => {
      try {
        const context = await createContext(argv);
        const { project } = context;
        const { projectDir, projectFileParsed } = project;
        const schema = projectFileParsed.input;
        if (!schema) throw new Error('Config schema not found in project file.');

        if (!Reflect.has(argv, 'name')) {
          const { inputName } = await fnetPrompt({ type: 'input', name: 'inputName', message: 'Input name:', initial: 'dev' });
          argv.name = inputName;
        }

        const dotFnetDir = path.resolve(projectDir, '.fnet');
        if (!fs.existsSync(dotFnetDir)) fs.mkdirSync(dotFnetDir);

        const configFilePath = path.resolve(dotFnetDir, `${argv.name}.fnet`);
        const exists = fs.existsSync(configFilePath);

        const fnetObjectFromSchema = (await import('@fnet/object-from-schema')).default;
        const result = await fnetObjectFromSchema({ schema, format: "yaml", ref: exists ? configFilePath : undefined });
        fs.writeFileSync(configFilePath, result);
      } catch (error) {
        console.error(error.message);
        process.exit(1);
      }
    }
  );
}

async function createContext(argv) {
  if (argv.id) {
    const context = {
      id: argv.id,
      buildId: argv.buildId,
      mode: argv.mode,
      protocol: argv.protocol || "ac:",
      projectDir: path.resolve(cwd, `./.output/${argv.id}`),
      templateDir: path.resolve(nodeModulesDir, './@fnet/cli-project-flow/dist/template/default'),
      templateCommonDir: path.resolve(nodeModulesDir, './@fnet/cli-project-common/dist/template/default'),
      coreDir: path.resolve(nodeModulesDir, './@fnet/cli-project-flow/dist/template/core'),
      tags: argv.ftag,
    }

    return context;
  } else {
    const project = await loadLocalProject({ tags: argv.ftag });

    const context = {
      buildId: argv.buildId,
      mode: argv.mode,
      protocol: argv.protocol || "local:",
      templateDir: path.resolve(nodeModulesDir, './@fnet/cli-project-flow/dist/template/default'),
      templateCommonDir: path.resolve(nodeModulesDir, './@fnet/cli-project-common/dist/template/default'),
      coreDir: path.resolve(nodeModulesDir, './@fnet/cli-project-flow/dist/template/core'),
      projectDir: path.resolve(project.projectDir, `./.workspace`),
      projectSrcDir: path.resolve(project.projectDir, `./src`),
      project,
      tags: argv.ftag,
    }

    return context;
  }
}

async function loadLocalProject({ tags }) {

  // Project file
  const projectFilePath = path.resolve(cwd, 'fnet.yaml');
  if (!fs.existsSync(projectFilePath)) throw new Error('fnet.yaml file not found in current directory.');

  const { raw: projectFileContent, parsed: projectFileParsed } = await fnetYaml({ file: projectFilePath, tags });
  const projectDir = path.dirname(projectFilePath);

  let flowsContent;

  if (typeof projectFileParsed.flows === 'object') {
    flowsContent = projectFileParsed.flows;
  }
  else {

    let defaultFlowsFile = 'flow.main.yaml';

    if (fs.existsSync(path.join(projectDir, 'fnet', 'flows.yaml'))) {
      defaultFlowsFile = path.join('fnet', 'flows.yaml');
    }

    const mainFileName = projectFileParsed.main || defaultFlowsFile;

    let projectMainFilePath = path.resolve(projectDir, mainFileName);

    if (!fs.existsSync(projectMainFilePath)) {
      flowsContent = { main: { steps: [] } }
    }
    else {
      const { parsed: projectMainFileParsed } = await fnetYaml({ file: projectMainFilePath, tags });
      flowsContent = projectMainFileParsed;
    }
  }

  const workflowAtom = {
    doc: {
      ...projectFileParsed,
      content: flowsContent
    }
  }

  const result = {
    workflowAtom,
    projectDir,
    projectFilePath,
    projectFileContent,
    projectFileParsed,
  }

  // Project devops file
  // Load devops file
  let devopsFilePath = path.resolve(projectDir, 'fnet/targets.yaml');
  if (!fs.existsSync(devopsFilePath)) {
    // migrate legacy devops file
    devopsFilePath = path.resolve(projectDir, 'flow.devops.yaml');
    if (fs.existsSync(devopsFilePath)) {
      const fnetDir = path.resolve(projectDir, 'fnet');
      if (!fs.existsSync(fnetDir)) fs.mkdirSync(fnetDir);
      fs.copyFileSync(devopsFilePath, path.resolve(projectDir, 'fnet/targets.yaml'));
      // delete legacy devops file
      fs.unlinkSync(devopsFilePath);
    }
  }

  if (fs.existsSync(devopsFilePath)) {
    const { raw: devopsFileContent, parsed: devopsFileParsed } = await fnetYaml({ file: devopsFilePath, tags });
    const yamlDocument = YAML.parseDocument(devopsFileContent);
    result.devops = {
      filePath: devopsFilePath,
      fileContent: devopsFileContent,
      yamlDocument,
      doc: {
        ...devopsFileParsed,
      },
      type: "workflow.deploy",
      save: async () => {
        fs.writeFileSync(result.devops.filePath, yamlDocument.toString());
        // fs.writeFileSync(result.devops.filePath, YAML.stringify(result.devops.doc));
      }
    }
  }

  // Project readme file
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