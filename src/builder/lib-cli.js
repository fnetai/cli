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
const Builder = require('./lib-builder');
const nodeModulesDir = require('./find-node-modules')({ baseDir: __dirname });
process.env.PATH = `${nodeModulesDir}/.bin:${process.env.PATH}`;

yargs(hideBin(process.argv))
    .command('create', 'Create flow node project', (yargs) => {
        return yargs
            .option('name', { type: 'Project name', demandOption: true });
    }, async (argv) => {
        try {
            const templateDir = path.resolve(nodeModulesDir, '@flownet/template-node-library/project');
            const outDir = path.resolve(cwd, argv.name);
            if (!fs.existsSync(outDir)) fs.mkdirSync(outDir);

            await flownetRenderTemplatesDir({
                dir: templateDir,
                outDir,
                context: argv
            });

            let shellResult = shell.exec(`fnode build`, { cwd: outDir });
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
    .command('build', 'Build flow node project', (yargs) => {
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
    })
    .command('npm [commands..]', 'npm - bridge', (yargs) => {
        return yargs
            .help(false)
            .version(false);
    }, async (argv) => {
        try {
            const context = await createContext(argv);
            const { projectDir } = context;

            const rawArgs = process.argv.slice(3).join(' ');

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

            const rawArgs = process.argv.slice(3).join(' ');

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

            const rawArgs = process.argv.slice(3).join(' ');

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

            const rawArgs = process.argv.slice(3).join(' ');

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

            const rawArgs = process.argv.slice(3).join(' ');

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

            const rawArgs = process.argv.slice(3).join(' ');

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
        return {
            id: argv.id,
            buildId: argv.buildId,
            mode: argv.mode,
            protocol: argv.protocol || "ac:",
            templateDir: path.resolve(nodeModulesDir, './@flownet/template-node-library/default'),
            templateCommonDir: path.resolve(nodeModulesDir, './@flownet/template-node-common/default'),
            projectDir: path.resolve(cwd, `./.output/${argv.id}`),
            coreDir: path.resolve(nodeModulesDir, './@flownet/template-node-library/core'),
        };
    } else {
        const project = await loadLocalProject();
        return {
            buildId: argv.buildId,
            mode: argv.mode,
            protocol: argv.protocol || "local:",
            templateDir: path.resolve(nodeModulesDir, './@flownet/template-node-library/default'),
            templateCommonDir: path.resolve(nodeModulesDir, './@flownet/template-node-common/default'),
            coreDir: path.resolve(nodeModulesDir, './@flownet/template-node-library/core'),
            projectDir: path.resolve(project.projectDir, `./.workspace`),
            projectSrcDir: path.resolve(project.projectDir, `./src`),
            project
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
            "content-type": "javascript",
            "language": "js"
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