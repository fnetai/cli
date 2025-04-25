import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';

import yaml from "yaml";
import nunjucks from "nunjucks";

import { randomUUID } from 'node:crypto';

import { Atom } from "@flownet/lib-atom-api-js";
import fnetParseNodeUrl from '@flownet/lib-parse-node-url';
import fnetConfig from '@fnet/config';
import fnetParseImports from '@flownet/lib-parse-imports-js';
import fnetListFiles from '@fnet/list-files';
import chalk from 'chalk';


import createRedisClient from '../redisClient.js';
import Auth from './auth.js';

import initFeatures from "./api/init-features/index.js";
import initFeaturesPython from "./api/init-features/python.js";

import initDependencies from "./api/init-dependencies/index.js";
import initDependenciesPython from "./api/init-dependencies/python.js";

import createApp from "./api/create-app/index.js";
import createPackageJson from "./api/create-package-json/index.js";

import createCli from "./api/create-cli/index.js";
import createCliPython from "./api/create-cli/python.js";

import createRollup from "./api/create-rollup/index.js";
import createToYargs from "./api/create-to-yargs/index.js";
import createGitIgnore from "./api/create-git-ignore/index.js";
import createTsConfig from "./api/create-ts-config/index.js";
import createProjectReadme from "./api/create-project-readme/index.js";
import formatFiles from './api/format-files/index.js';
import createDts from './api/create-dts/index.js';

import installNpmPackages from './api/install-npm-packages/index.js';
import installPythonPackages from './api/install-python-packages/index.js';

import runNpmBuild from './api/run-npm-build/index.js';
import pickNpmVersions from './api/common/pick-npm-versions.js';

import deployTo from './deploy/deploy-to/index.js';


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
      setProgress: this.setProgress.bind(this),
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

    this.setProgress({ message: "Initializing library directory." });

    const projectDir = this.#context.projectDir;

    let result;

    this.setProgress({ message: "Cleaning project directory." });

    const assets = fnetListFiles({ dir: projectDir, ignore: ['.cache', 'node_modules', '.conda'], absolute: true });
    for (const asset of assets) {
      fs.rmSync(asset, { recursive: true, force: true });
    }

    this.setProgress({ message: "Creating project directory." });

    // .
    let target = projectDir;
    if (!fs.existsSync(target)) {
      fs.mkdirSync(target, { recursive: true });
    }

    // src
    target = path.join(projectDir, "src");

    if (!fs.existsSync(target)) {
      fs.mkdirSync(target, { recursive: true });
    }

    // default
    target = path.join(projectDir, "src", "default");
    if (!fs.existsSync()) {
      fs.mkdirSync(target, { recursive: true });
    }
  }


  async initLibraryDirPython() {
    this.setProgress({ message: "Initializing library directory." });

    const projectDir = this.#context.projectDir;

    this.setProgress({ message: "Cleaning project directory." });

    const assets = fnetListFiles({ dir: projectDir, ignore: ['.cache', 'node_modules', '.conda'], absolute: true });
    for (const asset of assets) {
      fs.rmSync(asset, { recursive: true, force: true });
    }

    this.setProgress({ message: "Creating project directory." });

    let target = projectDir;
    if (!fs.existsSync(target)) {
      fs.mkdirSync(target, { recursive: true });
    }

    target = path.join(projectDir, 'src');
    if (!fs.existsSync(target)) {
      fs.mkdirSync(target, { recursive: true });
    }

    target = path.join(projectDir, 'src', 'default');
    const source = this.#context.projectSrcDir;

    if (!fs.existsSync(target)) {
      try {
        if (os.platform() === 'win32') {
          // Windows requires special handling
          fs.symlinkSync(source, target, 'junction');
        } else {
          // For Unix-like systems
          fs.symlinkSync(source, target, 'dir');
        }
      } catch (err) {
        throw new Error(`Couldn't create symlink. Error: ${err.message}`);
      }
    }
  }

  async initNunjucks() {
    this.setProgress({ message: "Initializing nunjucks." });

    const templateDir = this.#context.templateDir;
    this.#njEnv = nunjucks.configure(templateDir, { watch: false, dev: true });
    this.#apiContext.njEnv = this.#njEnv;
  }

  async initLibs() {

    this.setProgress({ message: "Initializing external libs." });

    const libs = [{
      name: this.#atom.doc.name,
      type: "atom",
      parent_id: this.#atom.parent_id
    }];

    this.#libs = libs;

    await this.initAtomLibsAndDeps({ libs, packageDependencies: this.#packageDependencies });
  }

  async initLibsPython() {

    this.setProgress({ message: "Initializing external libs." });

    const atom = this.#atom;
    atom.protocol = "local:";
    atom.doc.dependencies = atom.doc.dependencies || [];
    atom.name = atom.doc.name;

    const libs = [{
      name: this.#atom.doc.name,
      type: "atom",
      parent_id: this.#atom.parent_id,
      atom
    }];

    this.#libs = libs;
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
      const targetImports = parsedImports.all;

      for await (const parsedImport of targetImports) {
        if (parsedImport.type !== 'npm') continue;

        if (dependencies.find(w => w.package === parsedImport.package)) continue;

        const npmVersions = await pickNpmVersions({
          name: parsedImport.package,
          projectDir: this.#context.projectDir,
          setProgress: this.#apiContext.setProgress
        });

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
    await this.setProgress({ message: "Creating external lib files." });

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

  async createAtomLibFilesPython({ libs }) {
    await this.setProgress({ message: "Creating external lib files." });

    const atomLibRefs = libs.filter(w => w.type === 'atom');
    for (let i = 0; i < atomLibRefs.length; i++) {
      const atomLibRef = atomLibRefs[i];

      const atomLib = atomLibRef.atom;
      if (atomLib.protocol === 'local:') {
        const srcFilePath = path.resolve(this.#context.projectSrcDir, `${atomLib.fileName || atomLib.name}.py`);
        if (!fs.existsSync(srcFilePath)) {
          fs.mkdirSync(path.dirname(srcFilePath), { recursive: true });
          let template = 'def default():\n';
          template += '  print("Hello world!")\n';
          fs.writeFileSync(srcFilePath, template, 'utf8');
        }
      }
    }
  }

  async createEngine() {

    await this.setProgress({ message: "Creating engine file." });

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

    await this.setProgress({ message: message });

    const { content: main, ...content } = this.#atom.doc;

    const templateContext = { content: yaml.stringify(content) }

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

    await this.setProgress({ message: "Deploying." });

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
    const { yamlDocument } = deploymentProject;

    if (deploymentProject.doc.targets && Array.isArray(deploymentProject.doc.targets))
      throw new Error("Deployment project targets are deprecated. Please update targets in the yaml file.");

    const targetKeys = Object.keys(deploymentProject.doc || {});
    const yamlTargets = yamlDocument || {};
    for (let i = 0; i < targetKeys.length; i++) {
      const deploymentProjectTarget = deploymentProject.doc[targetKeys[i]];
      deploymentProjectTarget.name = targetKeys[i];
      const yamlTarget = yamlTargets.get(targetKeys[i]);
      await deployTo({ ...this.#apiContext, deploymentProject, deploymentProjectTarget, yamlTarget });
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

  async setProgress(args) {

    const message = typeof args === 'string' ? args : args?.message;

    console.log(chalk.blue(message));

    await this._cache_set(this.#buildKey, { status: "IN_PROGRESS", message });
  }

  async initNode() {
    await initFeatures(this.#apiContext);
    await initDependencies(this.#apiContext);
    await this.initLibraryDir();
    await this.initNunjucks();
    await this.initLibs();
  }

  async initBun() {
    await initFeatures(this.#apiContext);
    await initDependencies(this.#apiContext);
    await this.initLibraryDir();
    await this.initNunjucks();
    await this.initLibs();
  }

  async initPython() {
    await initFeaturesPython(this.#apiContext);
    await initDependenciesPython(this.#apiContext);
    await this.initLibraryDirPython();
    await this.initNunjucks();
    await this.initLibsPython();
  }

  async nodeBuild() {
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
  }
  async bunBuild() {
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
      // await createRollup(this.#apiContext);
      await createPackageJson(this.#apiContext);

      await formatFiles(this.#apiContext);

      // await createDts(this.#apiContext);

      if (this.#buildMode) {

        await installNpmPackages(this.#apiContext);
        await runNpmBuild(this.#apiContext);

        if (this.#deployMode)
          await this.deploy();
      }
    }
  }

  async pythonBuild() {
    if (this.#fileMode) {
      await this.createAtomLibFilesPython({ libs: this.#libs });
      // await this.createEngine();
      await this.createProjectYaml();

      await createProjectReadme(this.#apiContext);
      // await createTsConfig(this.#apiContext);
      await createGitIgnore(this.#apiContext);
      // await createToYargs(this.#apiContext);
      await createCliPython(this.#apiContext);
      // await createApp(this.#apiContext);
      // await createRollup(this.#apiContext);
      // await createPackageJson(this.#apiContext);

      // await formatFiles(this.#apiContext);

      // await createDts(this.#apiContext);

      if (this.#buildMode) {
        await installPythonPackages(this.#apiContext);
        // await runNpmBuild(this.#apiContext);

        if (this.#deployMode)
          await this.deploy();
      }
    }
  }

  async init() {

    this._redis_client = await createRedisClient();

    this.#buildId = this.#context.buildId || randomUUID();
    this.#apiContext.buildId = this.#buildId;

    this.#mode = this.#context.mode;
    this.#fileMode = ['all', 'deploy', 'build', 'file'].includes(this.#mode);
    this.#buildMode = ['all', 'deploy', 'build'].includes(this.#mode);
    this.#deployMode = ['all', 'deploy'].includes(this.#mode);

    this.#protocol = this.#context.protocol;
    this.#buildKey = "BUILD:" + this.#buildId;

    this.#atomConfig = (await fnetConfig({ optional: true, name: this.#context.atomConfig || "atom", dir: this.#context.projectDir, tags: this.#context.tags }))?.data;

    try {
      await this.setProgress({ message: "Initialization started." });

      await this.initAuth();
      await this.initLibrary();
      if (this.#atom.doc.features.runtime.type === 'node')
        await this.initNode();
      else if (this.#atom.doc.features.runtime.type === 'bun')
        await this.initBun();
      else if (this.#atom.doc.features.runtime.type === 'python')
        await this.initPython();
    }
    catch (error) {
      await this._cache_set(this.#buildKey, { status: "FAILED", message: error?.message || error });
      throw error;
    }
  }

  async build() {
    try {
      if (this.#atom.doc.features.runtime.type === 'node')
        await this.nodeBuild();
      else if (this.#atom.doc.features.runtime.type === 'bun')
        await this.bunBuild();
      else if (this.#atom.doc.features.runtime.type === 'python')
        await this.pythonBuild();

      await this._cache_set(this.#buildKey, { status: "COMPLETED" });
    }
    catch (error) {
      await this._cache_set(this.#buildKey, { status: "FAILED", message: error.message || error });
      console.log(error);
      throw error;
    }
  }
}

export default Builder;