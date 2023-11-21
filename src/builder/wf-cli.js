// #!/usr/bin/env node
const cwd = process.cwd();

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

const flownetRenderTemplatesDir = require('@flownet/lib-render-templates-dir');
const Builder = require('./wf-builder');

const nodeModulesDir = require('./find-node-modules')({ baseDir: __dirname });
process.env.PATH = `${nodeModulesDir}/.bin:${process.env.PATH}`;

yargs(hideBin(process.argv))
    .command('create', 'Initialize flow node project', (yargs) => {
        return yargs
            .option('name', { type: 'string' });
    }, async (argv) => {
        try {
            const templateDir = path.resolve(nodeModulesDir, './@flownet/template-node-workflow/project');
            const outDir = path.resolve(cwd, argv.name);
            if (!fs.existsSync(outDir)) fs.mkdirSync(outDir);

            await flownetRenderTemplatesDir({
                dir: templateDir,
                outDir,
                context: argv
            });

            let shellResult = shell.exec(`fnet build`, { cwd: outDir });
            if (shellResult.code !== 0) throw new Error('Failed to build project.');

            if (shell.which('git')) {
                shellResult = shell.exec(`git init`, { cwd: outDir });
                if (shellResult.code !== 0) throw new Error('Failed to initialize git.');
            }

            console.log('Creating project succeeded!');

            process.exit(0);
        } catch (error) {
            console.error('Initialization failed!', error.message);
            process.exit(1);
        }
    })
    .command('build', 'Build flow net project', (yargs) => {
        return yargs
            .option('id', { type: 'string' })
            .option('buildId', { type: 'string', alias: 'bid' })
            .option('mode', { type: 'string', alias: 'm', default: "build", choices: ['all', 'file', 'build', 'deploy', 'bpmn'] })
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
    .command('deploy', 'Build and deploy flow net project', (yargs) => {
        return yargs
            .option('id', { type: 'string' })
            .option('buildId', { type: 'string', alias: 'bid' })
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
    })
    .command('npm [commands..]', 'npm - bridge', (yargs) => {
        return yargs
            .help(false)
            .version(false);
    }, async (argv) => {
        try {
            const context = await createContext(argv);
            const { projectDir } = context;

            const rawArgs = process.argv.slice(2).join(' ');

            const command = `npm ${rawArgs}`;

            shell.exec(command, { cwd: projectDir });
            process.exit(0);
        } catch (error) {
            console.error(error.message);
            process.exit(1);
        }
    })
    .command('node [commands..]', 'node - bridge', (yargs) => {
        return yargs
            .help(false)
            .version(false);
    }, async (argv) => {
        try {
            const context = await createContext(argv);
            const { projectDir } = context;

            const rawArgs = process.argv.slice(2).join(' ');

            const command = `node ${rawArgs}`;

            shell.exec(command, { cwd: projectDir });
            process.exit(0);
        } catch (error) {
            console.error(error.message);
            process.exit(1);
        }
    })
    .command('serve [commands..]', 'npm run serve - bridge', (yargs) => {
        return yargs
            .help(false)
            .version(false);
    }, async (argv) => {
        try {
            const context = await createContext(argv);
            const { projectDir } = context;

            const rawArgs = process.argv.slice(2).join(' ');

            const command = `npm run serve -- ${rawArgs}`;

            shell.exec(command, { cwd: projectDir });
            process.exit(0);
        } catch (error) {
            console.error(error.message);
            process.exit(1);
        }
    })

    .command('watch [commands..]', 'npm run watch - bridge', (yargs) => {
        return yargs
            .help(false)
            .version(false);
    }, async (argv) => {
        try {
            const context = await createContext(argv);
            const { projectDir } = context;

            const rawArgs = process.argv.slice(2).join(' ');

            const command = `npm run watch -- ${rawArgs}`;

            shell.exec(command, { cwd: projectDir });
            process.exit(0);
        } catch (error) {
            console.error(error.message);
            process.exit(1);
        }
    })
    .command('app [commands..]', 'npm run app - bridge', (yargs) => {
        return yargs
            .help(false)
            .version(false);
    }, async (argv) => {
        try {
            const context = await createContext(argv);
            const { projectDir } = context;

            const rawArgs = process.argv.slice(2).join(' ');

            const command = `npm run app -- ${rawArgs}`;

            shell.exec(command, { cwd: projectDir });
            process.exit(0);
        } catch (error) {
            console.error(error.message);
            process.exit(1);
        }
    })

    .command('cli [commands..]', 'npm run cli - bridge', (yargs) => {
        return yargs
            .help(false)
            .version(false);
    }, async (argv) => {
        try {
            const context = await createContext(argv);
            const { projectDir } = context;

            const rawArgs = process.argv.slice(2).join(' ');

            const command = `npm run cli -- ${rawArgs}`;

            shell.exec(command, { cwd: projectDir });
            process.exit(0);
        } catch (error) {
            console.error(error.message);
            process.exit(1);
        }
    })
    .demandCommand(1, 'You need at least one command before moving on')
    .help()
    .argv;

async function createContext(argv) {
    if (argv.id) {
        const context = {
            id: argv.id,
            buildId: argv.buildId,
            mode: argv.mode,
            protocol: argv.protocol || "ac:",
            projectDir: path.resolve(cwd, `./.output/${argv.id}`),
            templateDir: path.resolve(nodeModulesDir, './@flownet/template-node-workflow/default'),
            templateCommonDir: path.resolve(nodeModulesDir, './@flownet/template-node-common/default'),
            coreDir: path.resolve(nodeModulesDir, './@flownet/template-node-workflow/core'),
        }

        return context;
    } else {
        const project = await loadLocalProject();

        const context = {
            buildId: argv.buildId,
            mode: argv.mode,
            protocol: argv.protocol || "local:",
            templateDir: path.resolve(nodeModulesDir, './@flownet/template-node-workflow/default'),
            templateCommonDir: path.resolve(nodeModulesDir, './@flownet/template-node-common/default'),
            coreDir: path.resolve(nodeModulesDir, './@flownet/template-node-workflow/core'),
            projectDir: path.resolve(project.projectDir, `./.workspace`),
            projectSrcDir: path.resolve(project.projectDir, `./src`),
            project
        }

        return context;
    }
}

async function loadLocalProject(context) {

    // Project file
    const projectFilePath = path.resolve(cwd, 'flow.yaml');
    if (!fs.existsSync(projectFilePath)) throw new Error('flow.yaml file not found in current directory.');

    const projectFileContent = fs.readFileSync(projectFilePath, 'utf8');
    // const projectFileParsed = YAML.parse(projectFileContent);
    const { parsed: projectFileParsed } = await fnetYaml({ content: projectFileContent });
    const projectDir = path.dirname(projectFilePath);

    // Project main file
    const mainFileName = projectFileParsed.main || 'flow.main.yaml';

    let projectMainFilePath = path.resolve(projectDir, mainFileName);

    if (!fs.existsSync(projectMainFilePath)) {
        projectMainFilePath = path.resolve(projectDir, mainFileName + ".yaml");
        if (!fs.existsSync(projectMainFilePath))
            throw new Error(`${mainFileName} file not found in ${projectMainFilePath}.`);
    }

    const projectMainFileContent = fs.readFileSync(projectMainFilePath, 'utf8');
    // const projectMainFileParsed = YAML.parse(projectMainFileContent);
    const { parsed: projectMainFileParsed } = await fnetYaml({ content: projectMainFileContent });

    const workflowAtom = {
        doc: {
            ...projectFileParsed,
            "content-type": "yaml",
            content: projectMainFileContent
        }
    }

    const result = {
        workflowAtom,
        projectDir,
        projectFilePath,
        projectFileContent,
        projectFileParsed,
        projectMainFilePath,
        projectMainFileContent,
        projectMainFileParsed
    }

    // Project devops file
    const devopsFilePath = path.resolve(projectDir, 'flow.devops.yaml');
    if (fs.existsSync(devopsFilePath)) {
        const devopsFileContent = fs.readFileSync(devopsFilePath, 'utf8');
        const devopsFileParsed = YAML.parse(devopsFileContent);
        result.devops = {
            filePath: devopsFilePath,
            fileContent: devopsFileContent,
            doc: {
                ...devopsFileParsed,
            },
            type: "workflow.deploy",
            save: async () => {
                fs.writeFileSync(result.devops.filePath, YAML.stringify(result.devops.doc));
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