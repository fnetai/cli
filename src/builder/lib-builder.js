const fs = require('node:fs');
const path = require('node:path');

const yaml = require("js-yaml");
const shell = require('shelljs');
const nunjucks = require("nunjucks");
const createRedisClient = require('../redisClient');

const { nanoid } = require('nanoid');

const Auth = require('./auth');

const initFeatures = require("./api/init-features");
const initDependencies = require("./api/init-dependencies");
const createApp = require("./api/create-app");
const createPackageJson = require("./api/create-package-json");
const createCli = require("./api/create-cli");
const createRollup = require("./api/create-rollup");
const createToYargs = require("./api/create-to-yargs");
const createGitIgnore = require("./api/create-git-ignore");
const createTsConfig = require("./api/create-ts-config");
const createProjectReadme = require("./api/create-project-readme");
const formatFiles = require('./api/format-files');
const createDts = require('./api/create-dts');
const installNpmPackages = require('./api/install-npm-packages');
const runNpmBuild = require('./api/run-npm-build');

const deployTo = require('./deploy/deploy-to');

const { Atom } = require("@flownet/lib-atom-api-js");
const fnetParseNodeUrl = require('@flownet/lib-parse-node-url');
const fnetConfig = require('@fnet/config');
const fnetParseImports = require('@flownet/lib-parse-imports-js');
const fnetPickNpmVersions = require('@flownet/lib-pick-npm-versions');

const chalk = require('chalk');

class Builder {

  #auth;
  #context;
  #atom;
  #njEnv;
  #libs;
  #packageDependencies;
  #packageDevDependencies;
  #atomAccessToken;
  #buildId;
  #buildKey;
  #protocol;
  #atomConfig;

  #mode;
  #fileMode;
  #buildMode;
  #deployMode;
  #apiContext;

  constructor(context) {
    this.#auth = new Auth();
    this.#context = context;
    this.#packageDependencies = [];
    this.#packageDevDependencies = [];

    this._expire_ttl = 3600; // 1-hour
    this._expire_ttl_short = 300; // 5-minutes

    this.#apiContext = {
      packageDependencies: this.#packageDependencies,
      packageDevDependencies: this.#packageDevDependencies,
      setInProgress: this.setInProgress.bind(this),
      context: this.#context,
      Atom,
      registerToPackageManager: this.registerToPackageManager.bind(this)
    }
  }

  async _cache_set(key, value, expire_ttl) {
    if (!this._redis_client) return;

    await this._redis_client.SETEX(
      key,
      expire_ttl || this._expire_ttl,
      JSON.stringify(value),
    ).catch(console.error);
  }

  async init() {

    this._redis_client = await createRedisClient();

    this.#buildId = this.#context.buildId || nanoid(24);
    this.#apiContext.buildId = this.#buildId;

    this.#mode = this.#context.mode;
    this.#fileMode = ['all', 'deploy', 'build', 'file'].includes(this.#mode);
    this.#buildMode = ['all', 'deploy', 'build'].includes(this.#mode);
    this.#deployMode = ['all', 'deploy'].includes(this.#mode);

    this.#protocol = this.#context.protocol;
    this.#buildKey = "BUILD:" + this.#buildId;

    this.#atomConfig = (await fnetConfig({ optional: true, name: this.#context.atomConfig || "atom", dir: this.#context.projectDir }))?.data;

    try {
      await this.setInProgress({ message: "Initialization started." });

      await this.initAuth();
      await this.initLibrary();
      await initFeatures(this.#apiContext);
      await initDependencies(this.#apiContext);
      await this.initLibraryDir();
      await this.initNunjucks();
      await this.initLibs();
    }
    catch (error) {
      await this._cache_set(this.#buildKey, { status: "FAILED", message: error?.message || error });
      throw error;
    }
  }

  async initAuth() {
    if (!this.#context.id) return;
    this.#atomAccessToken = await this.#auth.init({ config: this.#atomConfig });
    this.#apiContext.atomAccessToken = this.#atomAccessToken;
  }

  async initLibrary() {
    const libraryId = this.#context.id;
    this.#atom = this.#context.project?.libraryAtom || await Atom.get({ id: libraryId });
    let bundleName = this.#atom.doc.bundleName;
    bundleName = bundleName || (this.#atom.doc.name || "").toUpperCase().replace(/[^A-Z0-9]/g, "_");
    this.#atom.doc.bundleName = bundleName;
    this.#atom.type = this.#atom.type || "workflow.lib";
    this.#apiContext.atom = this.#atom;
  }

  async initLibraryDir() {
    const projectDir = this.#context.projectDir;

    let result;

    const exclude = ['node_modules'];  // List of directories to exclude from deletion.

    // Delete all files and directories in projectDir except those in the exclude list.
    fs.existsSync(projectDir) && fs.readdirSync(projectDir).forEach(file => {
      if (!exclude.includes(file)) {
        result = shell.rm('-rf', path.join(projectDir, file));
      }
    });

    // .
    let target = projectDir;
    if (!fs.existsSync(target)) {
      result = shell.exec(`mkdir "${projectDir}"`);
      if (result.code !== 0) throw new Error('Couldnt create workflow dir.');
    }

    // src
    target = path.join(projectDir, "src");

    if (!fs.existsSync(target)) {
      result = shell.exec(`mkdir "${target}"`);
      if (result.code !== 0) throw new Error('Couldnt create library/src dir.');
    }

    // default
    target = path.join(projectDir, "src", "default");
    if (!fs.existsSync()) {
      result = shell.exec(`mkdir "${target}"`);
      if (result.code !== 0) throw new Error('Couldnt create library/src/default dir.');
    }
  }

  async initNunjucks() {
    const templateDir = this.#context.templateDir;
    this.#njEnv = nunjucks.configure(templateDir, { watch: false, dev: true });
    this.#apiContext.njEnv = this.#njEnv;
  }

  async initLibs() {
    const libs = [{
      name: this.#atom.doc.name,
      type: "atom",
      parent_id: this.#atom.parent_id
    }];

    this.#libs = libs;

    await this.initAtomLibsAndDeps({ libs, packageDependencies: this.#packageDependencies });
  }

  async initAtomLibsAndDeps({ libs, packageDependencies }) {
    const atomLibRefs = libs.filter(w => w.type === 'atom');
    for (let i = 0; i < atomLibRefs.length; i++) {
      const atomLibRef = atomLibRefs[i];

      const atomLib = await this.findAtomLibrary({ url: atomLibRef.name });
      atomLibRef.atom = atomLib;

      const packageDeps = atomLib.doc.dependencies?.filter(w => typeof w.repo === 'undefined' || w.repo === 'npm');
      packageDeps?.forEach(npmDep => {
        const found = packageDependencies.find(w => w.package === npmDep.package);
        if (found) {
          if (typeof npmDep.path === 'string') {
            if (!(found.path || []).some(w => w === npmDep.path)) {
              found.path = found.path || [];
              found.path.push(npmDep.path);
            }
          }
          else if (Array.isArray(npmDep.path)) {
            npmDep.path.forEach(item => {
              if (!(found.path || []).some(w => w === item)) {
                found.path = found.path || [];
                found.path.push(item);
              }
            });
          }
        }
        else packageDependencies.push(npmDep);
      });
    }
    packageDependencies.sort((a, b) => a.package?.localeCompare(b.package));
  }

  async findAtomLibrary({ url }) {
    const parsedUrl = fnetParseNodeUrl({ url: url });
    if (!parsedUrl) throw new Error(`Invalid package name: ${url}`);

    if (!parsedUrl.protocol) parsedUrl.protocol = this.#protocol;

    if (parsedUrl.protocol === 'ac:') {
      const parts = parsedUrl.pathname.split('/');
      if (parts.length === 1) {
        return await Atom.first({ where: { name: url, parent_id: this.#atomConfig.env.ATOM_LIBRARIES_ID, type: "workflow.lib" } });
      }

      if (parts.length === 2) {
        const folder = await Atom.first({ where: { name: parts[0], parent_id: this.#atomConfig.env.ATOM_LIBRARIES_ID, type: "folder" } });
        return await Atom.first({ where: { name: parts[1], parent_id: folder.id, type: "workflow.lib" } });
      }
    }
    else if (parsedUrl.protocol === 'local:') {

      const atom = this.#atom;
      atom.protocol = "local:";
      atom.doc.dependencies = atom.doc.dependencies || [];
      atom.name = atom.doc.name;

      const srcFilePath = path.resolve(this.#context.projectSrcDir, `${'index'}.js`);
      const parsedImports = await fnetParseImports({ file: srcFilePath, recursive: true });
      const dependencies = atom.doc.dependencies;
      const targetImports = this.#atom.doc.features.all_parsed_imports === true ? parsedImports.all : parsedImports.required;
      for await (const parsedImport of targetImports) {
        if (parsedImport.type !== 'npm') continue;

        if (dependencies.find(w => w.package === parsedImport.package)) continue;

        const npmVersions = await fnetPickNpmVersions({ name: parsedImport.package, count: 1 });

        dependencies.push({
          package: parsedImport.package,
          subpath: parsedImport.subpath,
          version: npmVersions.minorRange,
          type: "npm"
        })
      }

      return atom;
    }
  }

  async createAtomLibFiles({ libs }) {
    await this.setInProgress({ message: "Creating external lib files." });

    this.#atom.typesDir = './types';

    const atomLibRefs = libs.filter(w => w.type === 'atom');
    for (let i = 0; i < atomLibRefs.length; i++) {
      const atomLibRef = atomLibRefs[i];

      const atomLib = atomLibRef.atom;
      const projectDir = this.#context.projectDir;
      if (atomLib.protocol === 'local:') {
        const srcFilePath = path.resolve(this.#context.projectSrcDir, `${atomLib.fileName || atomLib.name}.js`);
        const relativePath = path.relative(path.join(this.#context.projectDir, 'src', 'default'), srcFilePath);

        if (!fs.existsSync(srcFilePath)) {
          fs.mkdirSync(path.dirname(srcFilePath), { recursive: true });
          let template = 'export default async (args)=>{\n';
          template += '}';
          fs.writeFileSync(srcFilePath, template, 'utf8');
        }

        atomLib.relativePath = relativePath.split(path.sep).join('/');

        this.#atom.typesDir = `./types/${path.basename(projectDir)}/src`;
      }
      else {
        const atomLibPath = path.join(projectDir, 'src', 'libs', `${atomLib.id}.js`);
        const content = atomLib.doc.contents?.find(w => w.format === 'esm') || atomLib.doc;
        fs.writeFileSync(atomLibPath, content.content, 'utf8');
      }
    }
  }

  async createEngine() {

    await this.setInProgress({ message: "Creating engine file." });

    const libs = this.#libs.filter(w => w.type === 'atom');

    const templateContext = { libs, libraryAtom: this.#atom, atom: this.#atom }

    const templateDir = this.#context.templateDir;
    const template = nunjucks.compile(
      fs.readFileSync(path.resolve(templateDir, path.join('src', 'default', 'engine.js.njk')), "utf8"),
      this.#njEnv
    );

    const templateRender = template.render(templateContext);

    const projectDir = this.#context.projectDir;
    const filePath = path.resolve(projectDir, path.join('src', 'default', 'index.js'));
    fs.writeFileSync(filePath, templateRender, 'utf8');
  }

  async createProjectYaml() {

    const fileBase = `node.yaml`;
    const message = `Creating ${fileBase}`;

    await this.setInProgress({ message: message });

    const { content: main, ...content } = this.#atom.doc;

    const templateContext = { content: yaml.dump(content) }

    const templateDir = this.#context.templateDir;
    const template = nunjucks.compile(
      fs.readFileSync(path.resolve(templateDir, `${fileBase}.njk`), "utf8"),
      this.#njEnv
    );

    const templateRender = template.render(templateContext);

    const projectDir = this.#context.projectDir;
    const filePath = path.resolve(projectDir, `${fileBase}`);
    fs.writeFileSync(filePath, templateRender, 'utf8');
  }

  async deploy() {

    await this.setInProgress({ message: "Deploying." });

    if (this.#context.project?.devops) {
      const devopsProjects = [this.#context.project?.devops];
      for (let i = 0; i < devopsProjects.length; i++) {
        let deploymentProject = devopsProjects[i];
        await this.deployProject({ deploymentProject });

        if (deploymentProject.isDirty === true) {
          await deploymentProject.save();
        }
      }

    }
    else if (this.#atom.id) {
      const devopsProjects = await Atom.list({ type: "library.deploy", parent_id: this.#atom.id });
      for (let i = 0; i < devopsProjects.length; i++) {
        let deploymentProject = devopsProjects[i];
        await this.deployProject({ deploymentProject });

        if (deploymentProject.isDirty === true) {
          deploymentProject = await Atom.update(deploymentProject, { id: deploymentProject.id });
        }
      }
    }
  }

  async deployProject(context) {
    const { deploymentProject } = context;
    const targets = deploymentProject.doc.targets || [];
    for (let i = 0; i < targets.length; i++) {
      const deploymentProjectTarget = targets[i];
      await deployTo({ ...this.#apiContext, deploymentProject, deploymentProjectTarget });
    }
  }

  async registerToPackageManager(context) {
    const { target, packageJSON } = context;

    if (!this.#context.id) return;

    // update
    let packageAtom = await Atom.first({ name: target.params.name, parent_id: this.#atomConfig.env.ATOM_PACKAGES_ID });

    if (!packageAtom) {
      // create new
      packageAtom = await Atom.create({
        parent_id: this.#atomConfig.env.ATOM_PACKAGES_ID,
        doc: {
          name: target.params.name,
          type: "pm",
          versions: [{ v: packageJSON.version }]
        }
      });
    }
    else {
      // update existing
      packageAtom.doc.versions.splice(0, 0, { v: packageJSON.version });

      await Atom.update(packageAtom, { id: packageAtom.id });
    }
  }

  async setInProgress({ message }) {
    console.log(chalk.blue(message));

    await this._cache_set(this.#buildKey, { status: "IN_PROGRESS", message });
  }

  async build() {
    try {
      if (this.#fileMode) {

        await this.createAtomLibFiles({ libs: this.#libs });
        await this.createEngine();
        await this.createProjectYaml();

        await createProjectReadme(this.#apiContext);
        await createTsConfig(this.#apiContext);
        await createGitIgnore(this.#apiContext);
        await createToYargs(this.#apiContext);
        await createCli(this.#apiContext);
        await createApp(this.#apiContext);
        await createRollup(this.#apiContext);
        await createPackageJson(this.#apiContext);

        await formatFiles(this.#apiContext);
        await createDts(this.#apiContext);

        if (this.#buildMode) {

          await installNpmPackages(this.#apiContext);
          await runNpmBuild(this.#apiContext);

          if (this.#deployMode)
            await this.deploy();
        }
      }

      await this._cache_set(this.#buildKey, { status: "COMPLETED" });
    }
    catch (error) {
      await this._cache_set(this.#buildKey, { status: "FAILED", message: error.message || error });
      console.log(error);
      throw error;
    }
  }
}

module.exports = Builder;