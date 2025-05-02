import fs from 'node:fs';
import path from 'node:path';
import { randomUUID } from 'node:crypto';

import yaml from "yaml";
import nunjucks from "nunjucks";
import chalk from 'chalk';

import { Atom } from "@flownet/lib-atom-api-js";
import fnetConfig from '@fnet/config';
import fnetListFiles from '@fnet/list-files';

import createRedisClient from '../redisClient.js';
import Auth from './auth.js';
import deployTo from './deploy/deploy-to/index.js';

/**
 * Base Builder class with common functionality for all runtimes
 * This class should be extended by runtime-specific builder classes
 */
class BuilderBase {
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

  /**
   * Get the API context that can be passed to API modules
   * @returns {Object} API context
   */
  get apiContext() {
    return this.#apiContext;
  }

  /**
   * Get the project context
   * @returns {Object} Project context
   */
  get context() {
    return this.#context;
  }

  /**
   * Get the atom object
   * @returns {Object} Atom object
   */
  get atom() {
    return this.#atom;
  }

  /**
   * Get the libs array
   * @returns {Array} Libs array
   */
  get libs() {
    return this.#libs;
  }

  /**
   * Set the libs array
   * @param {Array} value - Libs array
   */
  set libs(value) {
    this.#libs = value;
  }

  /**
   * Get the file mode flag
   * @returns {boolean} File mode flag
   */
  get fileMode() {
    return this.#fileMode;
  }

  /**
   * Get the build mode flag
   * @returns {boolean} Build mode flag
   */
  get buildMode() {
    return this.#buildMode;
  }

  /**
   * Get the deploy mode flag
   * @returns {boolean} Deploy mode flag
   */
  get deployMode() {
    return this.#deployMode;
  }

  /**
   * Set a value in the Redis cache
   * @param {string} key - Cache key
   * @param {*} value - Value to cache
   * @param {number} expire_ttl - TTL in seconds
   * @returns {Promise<void>}
   * @private
   */
  async _cache_set(key, value, expire_ttl) {
    if (!this._redis_client) return;

    await this._redis_client.SETEX(
      key,
      expire_ttl || this._expire_ttl,
      JSON.stringify(value),
    ).catch(console.error);
  }

  /**
   * Initialize authentication
   * @returns {Promise<void>}
   */
  async initAuth() {
    if (!this.#context.id) return;
    this.#atomAccessToken = await this.#auth.init({ config: this.#atomConfig });
    this.#apiContext.atomAccessToken = this.#atomAccessToken;
  }

  /**
   * Initialize the library
   * @returns {Promise<void>}
   */
  async initLibrary() {
    const libraryId = this.#context.id;
    this.#atom = this.#context.project?.libraryAtom || await Atom.get({ id: libraryId });
    let bundleName = this.#atom.doc.bundleName;
    bundleName = bundleName || (this.#atom.doc.name || "").toUpperCase().replace(/[^A-Z0-9]/g, "_");
    this.#atom.doc.bundleName = bundleName;
    this.#atom.type = this.#atom.type || "workflow.lib";
    this.#apiContext.atom = this.#atom;
  }

  /**
   * Initialize the library directory
   * @returns {Promise<void>}
   */
  async initLibraryDir() {
    this.setProgress({ message: "Initializing library directory." });

    const projectDir = this.#context.projectDir;

    this.setProgress({ message: "Cleaning project directory." });

    const assets = fnetListFiles({ dir: projectDir, ignore: ['.cache', 'node_modules', '.conda', '.bin'], absolute: true });
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
    if (!fs.existsSync(target)) {
      fs.mkdirSync(target, { recursive: true });
    }
  }

  /**
   * Initialize Nunjucks
   * @returns {Promise<void>}
   */
  async initNunjucks() {
    this.setProgress({ message: "Initializing nunjucks." });

    const templateDir = this.#context.templateDir;
    this.#njEnv = nunjucks.configure(templateDir, { watch: false, dev: true });
    this.#apiContext.njEnv = this.#njEnv;
  }

  /**
   * Create the project YAML file
   * @returns {Promise<void>}
   */
  async createProjectYaml() {
    const fileBase = `fnode.yaml`;
    const message = `Creating ${fileBase}`;

    await this.setProgress({ message: message });

    const { content: main, ...content } = this.#atom.doc;

    const projectDir = this.#context.projectDir;
    const filePath = path.resolve(projectDir, `${fileBase}`);
    fs.writeFileSync(filePath, yaml.stringify(content), 'utf8');
  }

  /**
   * Deploy the project
   * @returns {Promise<void>}
   */
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

  /**
   * Deploy a project
   * @param {Object} context - Deployment context
   * @returns {Promise<void>}
   */
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

  /**
   * Register to package manager
   * @param {Object} context - Registration context
   * @returns {Promise<void>}
   */
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

  /**
   * Set progress
   * @param {Object|string} args - Progress arguments
   * @returns {Promise<void>}
   */
  async setProgress(args) {
    const message = typeof args === 'string' ? args : args?.message;

    console.log(chalk.blue(message));

    await this._cache_set(this.#buildKey, { status: "IN_PROGRESS", message });
  }

  /**
   * Initialize the builder
   * This method should be called before build
   * @returns {Promise<void>}
   */
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

      // Call the runtime-specific initialization method
      await this.initRuntime();
    }
    catch (error) {
      await this._cache_set(this.#buildKey, { status: "FAILED", message: error?.message || error });
      throw error;
    }
  }

  /**
   * Initialize the runtime
   * This method should be implemented by runtime-specific builders
   * @returns {Promise<void>}
   */
  async initRuntime() {
    throw new Error('initRuntime method must be implemented by runtime-specific builder');
  }

  /**
   * Build the project
   * This method should be implemented by runtime-specific builders
   * @returns {Promise<void>}
   */
  async build() {
    throw new Error('build method must be implemented by runtime-specific builder');
  }
}

export default BuilderBase;
